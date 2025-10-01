import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePolling(fn, options)
 * Generic resilient polling hook.
 *
 * fn: (signal: AbortSignal) => Promise<any>
 *    Async function invoked every cycle. Receives an AbortSignal you SHOULD pass to fetch/axios when possible.
 *
 * options:
 *    - interval (ms) = 2000
 *        Base delay between successful iterations (before backoff/jitter adjustments).
 *    - leading = true
 *        When true, executes immediately upon start; otherwise schedules first run after `interval`.
 *    - enabled = true
 *        Controls automatic start/stop via effect. Setting to false aborts & clears timers.
 *    - maxRetries (number | undefined)
 *        Maximum consecutive errors before stopping. Undefined => unlimited retries.
 *    - backoffFactor = 1
 *        Exponential backoff multiplier applied to the base interval for consecutive errors (>1 enables backoff).
 *    - jitter = false
 *        Adds ±20% randomization to the computed delay to avoid thundering herds.
 *    - stopOnError = false
 *        If true, stops immediately after the first error instead of retrying.
 *    - pauseOnHidden = true
 *        When true, pauses scheduling while the document/tab is hidden (visibility API) to save resources.
 *    - stopCondition = (data, attempts) => boolean
 *        Evaluated after each successful fn() resolution (after the first real fetch). If returns true -> stop & success.
 *        `attempts` here represents the next attempt count (consecutive error counter + 1) for convenience.
 *    - onSuccess = (data) => void
 *        Invoked exactly once when stopCondition returns true.
 *    - onError = (error, attempts) => void
 *        Called on EVERY error. `attempts` is the consecutive error count after this failure.
 *    - debug = false
 *        Enables internal console logging (prefixed with [usePolling]).
 *
 * State returned:
 *    data          Last successful result.
 *    error         Last error (cleared on a successful cycle).
 *    isRunning     Whether the polling loop is active (not yet stopped by success/error/disabled).
 *    isFetching    Whether a request is currently in flight.
 *    attempts      Consecutive error count.
 *
 * Returned controls:
 *    start()       Manually (re)starts if not already running.
 *    stop()        Stops future cycles and aborts in-flight request.
 *    reset()       Resets error & consecutive attempt counter (does NOT auto-start if disabled).
 *    tick()        Forces an immediate cycle (respecting current running state).
 *
 * Design notes / best practices:
 *  - Stop condition is evaluated BEFORE state update to avoid race conditions with stale closures.
 *  - onSuccess fires only once; further calls are suppressed.
 *  - Consecutive errors apply exponential backoff if backoffFactor > 1, otherwise constant interval.
 *  - Visibility pause avoids wasted calls when tab is hidden (especially helpful for mobile / battery).
 */
export function usePolling(
  fn,
  {
    interval = 2000,
    leading = true,
    enabled = true,
    maxRetries,
    backoffFactor = 1,
    jitter = false,
    stopOnError = false,
    pauseOnHidden = true,
    stopCondition,
    onSuccess,          // NUEVO
    onError,            // NUEVO
    debug = false,      // NUEVO
  } = {}
) {
  const [state, setState] = useState({
    data: undefined,
    error: undefined,
    isRunning: Boolean(enabled),
    isFetching: false,
  attempts: 0, // consecutive error counter
  });

  const timerIdRef = useRef(null);
  const abortRef = useRef(null);
  const runningRef = useRef(Boolean(enabled));
  const successRef = useRef(false); // prevents double onSuccess firing

  const log = useCallback((...args) => {
    if (debug) console.log("[usePolling]", ...args);
  }, [debug]);

  const clearTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      window.clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    clearTimer();
    if (abortRef.current) abortRef.current.abort();
    setState((s) => ({ ...s, isRunning: false }));
  }, [clearTimer]);

  const calculateDelay = useCallback(
    (baseDelay, attemptCount) => {
      let delay = baseDelay;
      if (attemptCount > 0 && backoffFactor > 1) {
        delay = baseDelay * Math.pow(backoffFactor, attemptCount);
      }
      if (jitter) {
        const factor = 1 + (Math.random() - 0.5) * 0.4; // ±20%
        delay = Math.max(0, Math.floor(delay * factor));
      }
      return delay;
    },
    [backoffFactor, jitter]
  );

  const tick = useCallback(async () => {
    if (!runningRef.current) return;

    const scheduleNext = (baseDelay, attemptCount = 0) => {
      const delay = calculateDelay(baseDelay, attemptCount);
      clearTimer();
      timerIdRef.current = window.setTimeout(() => {
        tick();
      }, delay);
    };

    if (pauseOnHidden && document.visibilityState === "hidden") {
      scheduleNext(interval);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, isFetching: true, error: undefined }));

    try {
      const result = await fn(controller.signal);
      
  // Evaluate stopCondition BEFORE setState (race-condition safe)
      let shouldStop = false;
      if (!successRef.current && stopCondition && stopCondition(result, state.attempts + 1)) {
        shouldStop = true;
        successRef.current = true;
        runningRef.current = false;
        log("stopCondition met -> success");
      }

      setState((s) => {
        const newState = {
          ...s,
          data: result,
          isFetching: false,
          attempts: 0,
        };

        if (shouldStop) {
          return { ...newState, isRunning: false };
        }

  // Schedule next polling cycle
        const delay = calculateDelay(interval, 0);
        clearTimer();
        timerIdRef.current = window.setTimeout(() => {
          tick();
        }, delay);
        return newState;
      });

  // Fire onSuccess AFTER state update, based on pre-computed decision
      if (shouldStop && onSuccess) {
        try {
          log("Calling onSuccess callback");
          onSuccess(result);
        } catch (cbErr) {
          console.error("[usePolling] onSuccess error:", cbErr);
        }
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        setState((s) => ({ ...s, isFetching: false }));
        return;
      }

      setState((s) => {
        const newAttempts = s.attempts + 1;

  // Invoke onError callback for every error occurrence
        if (onError) {
            try { onError(err, newAttempts); } catch (cbErr) {
              console.error("[usePolling] onError error:", cbErr);
            }
        }

  // Stop due to policy: either explicit stopOnError or reached maxRetries
        if (
          stopOnError ||
          (typeof maxRetries === "number" && newAttempts >= maxRetries)
        ) {
          log("Stopping due to error policy", { stopOnError, maxRetries, newAttempts });
          runningRef.current = false;
          clearTimer();
          return {
            ...s,
            error: err,
            isFetching: false,
            attempts: newAttempts,
            isRunning: false,
          };
        }

  // Retry with (optional) exponential backoff
        const delay = calculateDelay(interval, newAttempts);
        clearTimer();
        timerIdRef.current = window.setTimeout(() => {
          tick();
        }, delay);

        return {
          ...s,
          error: err,
          isFetching: false,
          attempts: newAttempts,
        };
      });
    }
  }, [
    fn,
    interval,
    pauseOnHidden,
    calculateDelay,
    clearTimer,
    stopCondition,
    stopOnError,
    maxRetries,
    onSuccess,
    onError,
    log,
  state.attempts, // included so closure sees latest attempts for stopCondition evaluation
  ]);

  const scheduleNext = useCallback(
    (baseDelay, attemptCount = 0) => {
      const delay = calculateDelay(baseDelay, attemptCount);
      clearTimer();
      timerIdRef.current = window.setTimeout(() => {
        tick();
      }, delay);
    },
    [calculateDelay, clearTimer, tick]
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    successRef.current = false;
    runningRef.current = true;
    setState((s) => ({ ...s, isRunning: true }));
    if (leading) {
      tick();
    } else {
      scheduleNext(interval);
    }
  }, [interval, leading, scheduleNext, tick]);

  const reset = useCallback(() => {
    successRef.current = false;
    setState((s) => ({ ...s, attempts: 0, error: undefined }));
  }, []);

  useEffect(() => {
    successRef.current = false;
    if (enabled) {
      runningRef.current = true;
      setState((s) => ({ ...s, isRunning: true }));
      if (leading) {
        tick();
      } else {
        scheduleNext(interval);
      }
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, leading]);

  useEffect(() => {
    if (!pauseOnHidden) return;
    const onVis = () => {
      if (!runningRef.current) return;
      clearTimer();
      if (document.visibilityState === "visible") {
        scheduleNext(0);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pauseOnHidden, scheduleNext, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [clearTimer]);

  return {
    ...state,
    start,
    stop,
    reset,
    tick, // force an immediate cycle
  };
}
