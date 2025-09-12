// src/hooks/usePercentilePolling.js
import { useCallback } from "react";
import usePolling from "./usePolling";
import { getBabyById } from "../services/babyApi";

const MEASUREMENT_KEYS = ["weight", "height", "headCircumference"];

const hasValidPercentiles = (data) => {
  const measurements = data?.baby?.measurements || data?.measurements;
  if (!Array.isArray(measurements) || measurements.length === 0) return false;
  return measurements.every((m) => {
    const pct = m.percentiles;
    return pct && MEASUREMENT_KEYS.every((k) => typeof pct[k] === "number");
  });
};

/**
 * Polls baby data until all measurements contain valid percentiles
 * @param {Object} params
 * @param {string} params.babyId - baby identifier
 * @param {Function} params.onComplete - callback when polling succeeds
 * @param {number} [params.interval=3000] - polling interval in ms
 */
export default function usePercentilePolling({ babyId, onComplete, interval = 3000 }) {
  const check = useCallback(async () => {
    const babyData = await getBabyById(babyId);
    if (hasValidPercentiles(babyData)) {
      onComplete?.(babyData);
      return false; // stop polling
    }
    return true; // continue polling
  }, [babyId, onComplete]);

  const { start, stop } = usePolling(check, interval, { autoStart: false });

  return { startPolling: start, stopPolling: stop };
}

