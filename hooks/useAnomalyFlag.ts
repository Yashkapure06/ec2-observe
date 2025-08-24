import { useMemo } from "react";
import { AnomalyFlag } from "@/types/cost";

export function useAnomalyFlag(
  timeseries: { amount: number }[],
  threshold: number = 2
): AnomalyFlag {
  return useMemo(() => {
    if (timeseries.length < 3) {
      return {
        isAnomaly: false,
        anomalyIndices: [],
        threshold,
        zScore: 0,
      };
    }

    // Calculate mean and standard deviation
    const amounts = timeseries.map((point) => point.amount);
    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    const variance =
      amounts.reduce((sum, amount) => {
        const diff = amount - mean;
        return sum + diff * diff;
      }, 0) / amounts.length;

    const stdDev = Math.sqrt(variance);

    // Find anomalies (points with z-score > threshold)
    const anomalyIndices: number[] = [];
    let maxZScore = 0;

    amounts.forEach((amount, index) => {
      if (stdDev > 0) {
        const zScore = Math.abs((amount - mean) / stdDev);
        maxZScore = Math.max(maxZScore, zScore);

        if (zScore > threshold) {
          anomalyIndices.push(index);
        }
      }
    });

    return {
      isAnomaly: anomalyIndices.length > 0,
      anomalyIndices,
      threshold,
      zScore: maxZScore,
    };
  }, [timeseries, threshold]);
}
