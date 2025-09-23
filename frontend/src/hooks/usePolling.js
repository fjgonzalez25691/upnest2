import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePolling(fn, options)
 *  fn: (signal) => Promise<any>
 *  options:
 *    - interval (ms)
 *    - leading = true
 *    - enabled = true
 *    - maxRetries
 *    - backoffFactor = 1
 *    - jitter = false
 *    - stopOnError = false
 *    - pauseOnHidden = true
 *    - stopCondition = (data, attempts) => boolean
 */
export function usePolling(
  fn,
  {
    interval,
    leading = true,
    enabled = true,
    maxRetries,
    backoffFactor = 1,
    jitter = false,
    stopOnError = false,
    pauseOnHidden = true,
    stopCondition,
  }
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

  // Función para calcular delay con backoff y jitter
  const calculateDelay = useCallback((baseDelay, attemptCount) => {
    let delay = baseDelay;

    // backoff por errores consecutivos
    if (attemptCount > 0 && backoffFactor > 1) {
      delay = baseDelay * Math.pow(backoffFactor, attemptCount);
    }
    if (jitter) {
      const factor = 1 + (Math.random() - 0.5) * 0.4; // ±20%
      delay = Math.max(0, Math.floor(delay * factor));
    }

    return delay;
  }, [backoffFactor, jitter]);

  const tick = useCallback(async () => {
    if (!runningRef.current) return;

    // Función interna para programar siguiente ejecución (evita dependencia circular)
    const scheduleNext = (baseDelay, attemptCount = 0) => {
      setState((currentState) => {
        const delay = calculateDelay(baseDelay, attemptCount);
        clearTimer();
        timerIdRef.current = window.setTimeout(() => {
          tick();
        }, delay);
        return currentState; // No modificamos el estado, solo programamos
      });
    };

    // Pausar si la pestaña está oculta
    if (pauseOnHidden && document.visibilityState === "hidden") {
      scheduleNext(interval);
      return;
    }

    // cancelar petición previa si existía
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, isFetching: true, error: undefined }));

    try {
      const result = await fn(controller.signal);
      setState((s) => {
        const newState = {
          ...s,
          data: result,
          isFetching: false,
          attempts: 0,
        };
        
        // Check stop condition if provided
        if (stopCondition && stopCondition(result, s.attempts + 1)) {
          stop();
          return newState;
        }
        
        // Schedule next execution after success
        const delay = calculateDelay(interval, 0);
        clearTimer();
        timerIdRef.current = window.setTimeout(() => {
          tick();
        }, delay);
        
        return newState;
      });
    } catch (err) {
      if (err && err.name === "AbortError") {
        // parada manual o re-render
        setState((s) => ({ ...s, isFetching: false }));
        return;
      }

      setState((s) => {
        const newAttempts = s.attempts + 1;
        
        if (stopOnError) {
          stop();
          return {
            ...s,
            error: err,
            isFetching: false,
            attempts: newAttempts,
          };
        }
        
        if (typeof maxRetries === "number" && newAttempts >= maxRetries) {
          stop();
          return {
            ...s,
            error: err,
            isFetching: false,
            attempts: newAttempts,
          };
        }
        
        // Programar reintento con backoff
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
    stop,
    stopOnError,
    maxRetries,
    stopCondition,
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
    runningRef.current = true;
    setState((s) => ({ ...s, isRunning: true }));
    if (leading) {
      tick();
    } else {
      scheduleNext(interval);
    }
  }, [interval, leading, scheduleNext, tick]);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, attempts: 0, error: undefined }));
  }, []);

  // Arranque / parada según "enabled"
  useEffect(() => {
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

  // Pausar/continuar al cambiar visibilidad
  useEffect(() => {
    if (!pauseOnHidden) return;
    const onVis = () => {
      if (!runningRef.current) return;
      clearTimer();
      if (document.visibilityState === "visible") {
        scheduleNext(0); // dispara pronto al volver visible
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pauseOnHidden, scheduleNext, clearTimer]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      clearTimer();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [clearTimer]);

  return {
    ...state,
    tick, // fuerza una iteración inmediata
    start, // inicia si estaba parado
    stop, // detiene y cancela la petición en curso
    reset, // limpia error y contador
  };
}
