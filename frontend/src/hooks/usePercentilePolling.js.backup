// src/hooks/usePercentilePolling.js
import { useCallback, useRef } from "react";
import { getGrowthData } from "../services/growthDataApi";

// Helper to detect any numeric percentile
function hasAnyPercentile(measurement) {
  const p = measurement?.percentiles;
  if (!p) return false;
  return Object.values(p).some(v => typeof v === 'number' && !Number.isNaN(v));
}

/**
 * Declarative waiters for percentile recalculation using updatedAt changes.
 * Exposes the same default export name to avoid breaking imports, but API changes.
 *
 * API:
 *  const { waitForMeasurementRecalc, waitForBirthRecalc, waitForAllRecalc } = usePercentilePolling(babyId, opts)
 *
 *  waitForMeasurementRecalc({ dataId, prevUpdatedAt })
 *  waitForBirthRecalc({ birthDate, prevUpdatedAt })
 *  waitForAllRecalc({ snapshotMap }) where snapshotMap = { dataId: updatedAt }
 *
 * Each returns Promise<{ success, measurements, attempts }>
 */
export default function usePercentilePolling(
  babyId,
  { intervalMs = 1000, maxAttempts = 15, debug = false } = {}
) {
  const timersRef = useRef([]);

  const build = useCallback((stopConditionBuilder) => {
    return new Promise((resolve) => {
      let attempt = 0;
      let done = false;
      const run = async () => {
        if (done) return;
        attempt += 1;
        let list = [];
        try {
          list = await getGrowthData(babyId) || [];
        } catch (e) {
          if (debug) console.warn('[percentile-wait] fetch error', e);
        }
        if (debug) console.log(`[percentile-wait] attempt=${attempt} size=${list.length}`);
        try {
          if (stopConditionBuilder(list)) {
            done = true;
            resolve({ success: true, measurements: list, attempts: attempt });
            return;
          }
        } catch (e) {
          void e; // ignore condition error
        }
        if (attempt >= maxAttempts) {
            done = true;
            resolve({ success: false, measurements: list, attempts: attempt });
            return;
        }
        const t = setTimeout(run, intervalMs);
        timersRef.current.push(t);
      };
      run();
    });
  }, [babyId, debug, intervalMs, maxAttempts]);

  const waitForMeasurementRecalc = useCallback(({ dataId, prevUpdatedAt }) => {
    return build(list => {
      const m = list.find(x => x.dataId === dataId);
      if (!m || !m.updatedAt) return false;
      if (prevUpdatedAt && m.updatedAt === prevUpdatedAt) return false;
      return hasAnyPercentile(m);
    });
  }, [build]);

  const waitForBirthRecalc = useCallback(({ birthDate, prevUpdatedAt }) => {
    return build(list => {
      const m = list.find(x => x.measurementDate === birthDate);
      if (!m || !m.updatedAt) return false;
      if (prevUpdatedAt && m.updatedAt === prevUpdatedAt) return false;
      return hasAnyPercentile(m);
    });
  }, [build]);

  const waitForAllRecalc = useCallback(({ snapshotMap }) => {
    const ids = Object.keys(snapshotMap || {});
    return build(list => {
      if (ids.length === 0) return true;
      for (const id of ids) {
        const m = list.find(x => x.dataId === id);
        if (!m || !m.updatedAt) return false;
        if (m.updatedAt === snapshotMap[id]) return false;
        if (!hasAnyPercentile(m)) return false;
      }
      return true;
    });
  }, [build]);

  return { waitForMeasurementRecalc, waitForBirthRecalc, waitForAllRecalc };
}

