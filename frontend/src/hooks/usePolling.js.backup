// src/hooks/usePolling.js
import { useRef, useCallback, useEffect } from "react";

/**
 * Enhanced generic polling hook.
 * Two usage patterns:
 *  1) Provide a fetchFn + stopCondition → fetchFn result passed to stopCondition; when true polling stops.
 *  2) Provide a callback (backwards compatible) that returns true to continue, false to stop.
 *
 * Options:
 *  - interval (ms) polling interval
 *  - autoStart boolean
 *  - maxAttempts: stop after N attempts (treat as failure)
 *  - immediate: run first tick immediately (default true)
 *  - onAttempt({ attempt, data, shouldContinue })
 *  - onFinish(success, finalData, attempts)
 */
export default function usePolling(
  callbackOrOptions,
  maybeInterval,
  maybeOptions = {}
) {
  // Backward compatibility: (callback, interval, { autoStart })
  let legacyCallback = null;
  let options = {};
  let interval = 1000;

  if (typeof callbackOrOptions === 'function') {
    legacyCallback = callbackOrOptions;
    interval = maybeInterval || 1000;
    options = maybeOptions || {};
  } else if (typeof callbackOrOptions === 'object') {
    options = callbackOrOptions;
    interval = options.interval || 1000;
  }

  const {
    autoStart = false,
    fetchFn,                 // async () => any
    stopCondition,           // (data, attempt) => boolean
    maxAttempts = 50,
    immediate = true,
    onAttempt,               // ({attempt, data, shouldContinue})
    onFinish                 // (success, finalData, attempts)
  } = options;

  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const stoppedRef = useRef(false);
  const runningRef = useRef(false);
  const lastDataRef = useRef(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback((success) => {
    stoppedRef.current = true;
    clearTimer();
    onFinish && onFinish(success, lastDataRef.current, attemptsRef.current);
  }, [clearTimer, onFinish]);

  const stop = useCallback(() => finish(true), [finish]);

  const scheduleNext = useCallback(() => {
    if (stoppedRef.current) return;
    timerRef.current = setTimeout(() => tick(), interval);
  }, [interval, tick]);

  const tick = useCallback(async () => {
    if (runningRef.current || stoppedRef.current) return;
    runningRef.current = true;
    attemptsRef.current += 1;
    let shouldContinue = true;
    try {
      if (fetchFn || stopCondition) {
        const data = fetchFn ? await fetchFn() : undefined;
        lastDataRef.current = data;
        if (stopCondition) {
          const done = stopCondition(data, attemptsRef.current);
          if (done) shouldContinue = false;
        }
      } else if (legacyCallback) {
        // Legacy mode
        const cont = await legacyCallback();
        if (cont === false) shouldContinue = false;
      } else {
        // Nothing to do
        shouldContinue = false;
      }
      onAttempt && onAttempt({ attempt: attemptsRef.current, data: lastDataRef.current, shouldContinue });
      if (!shouldContinue) {
        finish(true);
        runningRef.current = false;
        return;
      }
      if (attemptsRef.current >= maxAttempts) {
        finish(false);
        runningRef.current = false;
        return;
      }
    } catch (_e) { // swallow and continue
      void _e; // explicitly ignore
      if (attemptsRef.current >= maxAttempts) {
        finish(false);
        runningRef.current = false;
        return;
      }
      // swallow error and continue
    }
    runningRef.current = false;
    scheduleNext();
  }, [fetchFn, stopCondition, legacyCallback, onAttempt, finish, maxAttempts, scheduleNext]);

  const start = useCallback(() => {
    stoppedRef.current = false;
    attemptsRef.current = 0;
    clearTimer();
    if (immediate) tick(); else timerRef.current = setTimeout(() => tick(), interval);
  }, [immediate, interval, tick, clearTimer]);

  useEffect(() => {
    if (autoStart) start();
    return () => clearTimer();
  }, [autoStart, start, clearTimer]);

  return {
    start,
    stop,
    isActive: () => !stoppedRef.current,
    attempts: () => attemptsRef.current,
    lastData: () => lastDataRef.current
  };
}

