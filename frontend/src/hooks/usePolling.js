// src/hooks/usePolling.js
import { useRef, useCallback, useEffect } from "react";

/**
 * Generic polling hook
 * @param {Function} callback - async function that returns true to continue polling, false to stop
 * @param {number} interval - polling interval in ms
 * @param {Object} options
 * @param {boolean} [options.autoStart=false] - whether to start polling immediately
 * @returns {{ start: Function, stop: Function }} start and stop functions
 */
export default function usePolling(callback, interval, { autoStart = false } = {}) {
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(async () => {
    const shouldContinue = await callback();
    if (!shouldContinue) {
      stop();
    }
  }, [callback, stop]);

  const start = useCallback(() => {
    stop();
    tick();
    intervalRef.current = setInterval(tick, interval);
  }, [interval, stop, tick]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return stop;
  }, [autoStart, start, stop]);

  return { start, stop };
}

