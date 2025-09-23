// src/hooks/usePercentilePolling.js
import { useCallback, useRef } from "react";
import { getGrowthData } from "../services/growthDataApi";
import { usePolling } from "./usePolling"; // <-- tu hook genérico

// ¿Existe algún percentil numérico ya calculado?
function hasAnyPercentile(measurement) {
  const p = measurement?.percentiles;
  if (!p) return false;
  return Object.values(p).some(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
}

/**
 * API:
 *  const { waitForMeasurementRecalc, waitForBirthRecalc, waitForAllRecalc } =
 *    usePercentilePolling(babyId, { interval=1500, maxRetries, backoffFactor, jitter, pauseOnHidden })
 *
 * Cada "waitFor..." devuelve Promise<{ success, measurements, attempts }>
 */
export default function usePercentilePolling(
  babyId,
  {
    interval = 1500,
    maxRetries,
    backoffFactor = 1,
    jitter = false,
    pauseOnHidden = true,
  } = {}
) {
  // Guardamos el "objetivo" a cumplir y los resolvers de la promesa actual
  const predicateRef = useRef(null);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);

  // Construimos la función que llamará usePolling en cada "tick"
  const pollFn = useCallback(
    async (signal) => {
      const list = await getGrowthData(babyId, { signal }); // <-- tu fetch
      // Si hay un predicado activo y se cumple, resolvemos y detenemos el polling.
      if (predicateRef.current && predicateRef.current(list)) {
        const r = resolveRef.current;
        // limpiamos antes de detener
        predicateRef.current = null;
        resolveRef.current = null;
        rejectRef.current = null;
        // devolvemos el "list" como data del polling (también lo devuelve usePolling.state.data)
        if (r) r({ success: true, measurements: list });
      }
      return list;
    },
    [babyId]
  );

  // Montamos el polling genérico con "enabled=false" (arranca sólo cuando alguien llama a waitFor…)
  const { start, stop, reset, attempts, error, data, isRunning } = usePolling(
    pollFn,
    {
      interval,
      leading: true,
      enabled: false,
      maxRetries,
      backoffFactor,
      jitter,
      stopOnError: false,
      pauseOnHidden,
    }
  );

  // "build" crea un waiter que:
  //  1) define el predicado de finalización
  //  2) arranca el polling
  //  3) devuelve una promesa que se resuelve al cumplirse el predicado
  const build = useCallback((predicate) => {
    return new Promise((resolve, reject) => {
      // Limpieza previa por si quedaba algo pendiente
      reset();
      predicateRef.current = predicate;
      resolveRef.current = (payload) => {
        stop(); // detenemos el polling al cumplir
        resolve({
          ...payload,
          attempts, // intentos acumulados en esta tanda de polling
        });
      };
      rejectRef.current = (err) => {
        stop();
        reject(err);
      };
      start(); // ¡a latir!
    });
  }, [attempts, reset, start, stop]);

  // ─────────────────────────────────────────────────────────────
  // PREDICADOS DE FINALIZACIÓN
  // ─────────────────────────────────────────────────────────────

  // Esperar a que UNA medición (dataId) cambie updatedAt y tenga percentiles
  const waitForMeasurementRecalc = useCallback(
    ({ dataId, prevUpdatedAt }) => {
      return build((list) => {
        const m = list?.find((x) => x.dataId === dataId);
        if (!m || !m.updatedAt) return false;
        if (m.updatedAt === prevUpdatedAt) return false;
        if (!hasAnyPercentile(m)) return false;
        return true;
      });
    },
    [build]
  );

  // Esperar a que la medición del nacimiento (por fecha) se recalcule
  // Ajusta la condición si tu dominio usa otro identificador para "nacimiento".
  const waitForBirthRecalc = useCallback(
    ({ birthDate, prevUpdatedAt }) => {
      return build((list) => {
        const m = list?.find((x) => x.measurementDate === birthDate);
        if (!m || !m.updatedAt) return false;
        if (m.updatedAt === prevUpdatedAt) return false;
        if (!hasAnyPercentile(m)) return false;
        return true;
      });
    },
    [build]
  );

  // Esperar a que TODAS las mediciones de snapshotMap cambien updatedAt y tengan percentiles
  // snapshotMap = { [dataId]: prevUpdatedAt }
  const waitForAllRecalc = useCallback(
    ({ snapshotMap }) => {
      const ids = Object.keys(snapshotMap || {});
      return build((list) => {
        if (ids.length === 0) return true;
        for (const id of ids) {
          const m = list?.find((x) => x.dataId === id);
          if (!m || !m.updatedAt) return false;
          if (m.updatedAt === snapshotMap[id]) return false;
          if (!hasAnyPercentile(m)) return false;
        }
        return true;
      });
    },
    [build]
  );

  // (Opcional) podrías exponer info útil de depuración/estado si te interesa
  return {
    waitForMeasurementRecalc,
    waitForBirthRecalc,
    waitForAllRecalc,
    // extra opcional:
    _debug: { isRunning, attempts, error, lastData: data },
  };
}
