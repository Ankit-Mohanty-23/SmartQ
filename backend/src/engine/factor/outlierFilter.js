/**
 * Outlier filter — Defense Layer 1
 * @returns {{ isOutlier: boolean, deviationRatio: number }}
 */

export function checkOutlier({
  actualDurationMinutes,
  predictedDurationMinutes,
  outlierMultiplier,
}) {
  const deviationRatio = actualDurationMinutes / predictedDurationMinutes;
  const isOutlier = deviationRatio > outlierMultiplier;
  return { isOutlier, deviationRatio };
}
