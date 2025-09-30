import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePolling(fn, options)
 *  fn: (signal) => Promise<any>
 *  options:
 *    - interval (ms) = 2000
 *    - leading = true (ejecuta inmediatamente al iniciar)
 *    - enabled = true
 *    - maxRetries (errores consecutivos antes de parar)
 *    - backoffFactor = 1 (exponencial sobre errores)
 *    - jitter = false (aleatoriza delay ±20%)
 *    - stopOnError = false (si true, detiene al primer error)
 *    - pauseOnHidden = true (pausa mientras pestaña oculta)
 *    - stopCondition = (data, attempts) => boolean  (si true -> éxito)
 *    - onSuccess = (data) => void (se llama UNA vez cuando stopCondition true)
 *    - onError = (error, attempts) => void (cada error; attempts = consecutivos)
 *    - debug = false (logs internos)
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
    attempts: 0, // errores consecutivos
  });

  const timerIdRef = useRef(null);
  const abortRef = useRef(null);
  const runningRef = useRef(Boolean(enabled));
  const successRef = useRef(false); // evita doble onSuccess

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
      
      // ✅ FIX: Evaluar stopCondition ANTES de setState
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

        // Continuar polling
        const delay = calculateDelay(interval, 0);
        clearTimer();
        timerIdRef.current = window.setTimeout(() => {
          tick();
        }, delay);
        return newState;
      });

      // ✅ FIX: Llamar onSuccess después de setState, pero basado en la evaluación previa
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

        // Llamar callback de error siempre que ocurra
        if (onError) {
            try { onError(err, newAttempts); } catch (cbErr) {
              console.error("[usePolling] onError error:", cbErr);
            }
        }

        // cortar por stopOnError o maxRetries
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

        // reintentar con backoff
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
    state.attempts, // ✅ FIX: Añadido para acceder al valor actual
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
    tick, // fuerza un ciclo inmediato
  };
}
