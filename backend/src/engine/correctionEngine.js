import prisma from "../db/index.js";

const ROLLING_WINDOW = 50;
const MIN_RECORDS = 10;

async function getBaseline({ doctorId, dayOfWeek, timeSlot, visitType }) {
  const exact = await prisma.correctionEngine.findUnique({
    where: { lookupKey: buildKey(doctorId, dayOfWeek, timeSlot, visitType) },
  });
  if (exact?.recordCount >= MIN_RECORDS) return format(exact, "exact");

  const noVisitType = await prisma.$queryRaw`
    SELECT AVG(correction_factor) AS correction_factor,
           AVG(corrected_baseline) AS corrected_baseline,
           SUM(record_count) AS record_count
    FROM correction_engine
    WHERE doctor_id = ${doctorId} AND day_of_week = ${dayOfWeek} AND time_slot = ${timeSlot}
  `;
  const nvt = parseAgg(noVisitType[0]);
  if (nvt?.recordCount >= MIN_RECORDS) return format(nvt, "no_visit_type");

  const noTimeSlot = await prisma.$queryRaw`
    SELECT AVG(correction_factor) AS correction_factor,
           AVG(corrected_baseline) AS corrected_baseline,
           SUM(record_count) AS record_count
    FROM correction_engine
    WHERE doctor_id = ${doctorId} AND day_of_week = ${dayOfWeek}
  `;
  const nts = parseAgg(noTimeSlot[0]);
  if (nts?.recordCount >= MIN_RECORDS) return format(nts, "no_time_slot");

  const global = await prisma.$queryRaw`
    SELECT AVG(correction_factor) AS correction_factor,
           AVG(corrected_baseline) AS corrected_baseline,
           SUM(record_count) AS record_count
    FROM correction_engine
    WHERE doctor_id = ${doctorId}
  `;
  const g = parseAgg(global[0]);
  if (g?.recordCount >= MIN_RECORDS) return format(g, "global");

  return {
    correctedBaseline: null,
    correctionFactor: null,
    recordCount: 0,
    fallbackLevel: "none",
  };
}

async function updateAfterConsultation({
  doctorId,
  dayOfWeek,
  timeSlot,
  visitType,
  actualDurationMinutes,
  doctorAvgMinutes,
}) {
  const overrunFactor = actualDurationMinutes / doctorAvgMinutes;
  const lookupKey = buildKey(doctorId, dayOfWeek, timeSlot, visitType);

  const existing = await prisma.correctionEngine.findUnique({
    where: { lookupKey },
  });

  let newCorrectionFactor;
  let newRecordCount;

  if (!existing) {
    newCorrectionFactor = overrunFactor;
    newRecordCount = 1;
  } else {
    const weight = Math.min(existing.recordCount, ROLLING_WINDOW - 1);
    newCorrectionFactor =
      (existing.correctionFactor * weight + overrunFactor) / (weight + 1);
    newRecordCount = existing.recordCount + 1;
  }

  const correctedBaseline = doctorAvgMinutes * newCorrectionFactor;

  await prisma.correctionEngine.upsert({
    where: { lookupKey },
    update: {
      correctionFactor: newCorrectionFactor,
      recordCount: newRecordCount,
      correctedBaseline,
      lastUpdated: new Date(),
    },
    create: {
      lookupKey,
      doctorId,
      dayOfWeek,
      timeSlot,
      visitType,
      correctionFactor: newCorrectionFactor,
      recordCount: newRecordCount,
      correctedBaseline,
      lastUpdated: new Date(),
    },
  });

  return {
    newCorrectionFactor,
    correctedBaseline,
    recordCount: newRecordCount,
  };
}

function buildKey(doctorId, dayOfWeek, timeSlot, visitType) {
  return `${doctorId}:${dayOfWeek}:${timeSlot}:${visitType}`;
}

function parseAgg(row) {
  if (!row || row.record_count == null) return null;
  return {
    correctionFactor: parseFloat(row.correction_factor),
    correctedBaseline: parseFloat(row.corrected_baseline),
    recordCount: parseInt(row.record_count, 10),
  };
}

function format(row, fallbackLevel) {
  return {
    correctedBaseline: parseFloat(
      row.correctedBaseline ?? row.corrected_baseline,
    ),
    correctionFactor: parseFloat(row.correctionFactor ?? row.correction_factor),
    recordCount: parseInt(row.recordCount ?? row.record_count, 10),
    fallbackLevel,
  };
}

export { getBaseline, updateAfterConsultation };
