const CONFIDENCE_THRESHOLD = 0.6;
const MIN_CORRECTION_RECORDS = 10;

/**
 * Confidence Fallback Chain — Defense Layer 3
 * @returns {{ isOutlier: boolean, deviationRatio: number }}
 */

export function resolve({ mlResult, correctionData, doctorAvgMinutes }) {
  if (
    mlResult &&
    typeof mlResult.confidence_score === "number" &&
    mlResult.confidence_score >= CONFIDENCE_THRESHOLD
  ) {
    return {
      resolvedDuration: mlResult.predicted_minutes,
      durationSource: "ml_model",
      mlConfidence: mlResult.confidence_score,
    };
  }

  if (correctionData && correctionData.recordCount >= MIN_CORRECTION_RECORDS) {
    return {
      resolvedDuration: correctionData.correctedBaseline,
      durationSource: "correction_engine",
      mlConfidence: mlResult?.confidence_score ?? null,
    };
  }

  return {
    resolvedDuration: doctorAvgMinutes,
    durationSource: "doctor_average",
    mlConfidence: mlResult?.confidence_score ?? null,
  };
}
