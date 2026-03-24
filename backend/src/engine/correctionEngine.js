import prisma from "../config/prisma.js";

const ROLLING_WINDOW = 50;
const MIN_RECORDS = 10;

function buildKey(doctorProfileId, dayOfWeek, timeSlot, visitType) {
  return `${doctorProfileId}:${dayOfWeek}:${timeSlot}:${visitType}`;
}

/* we use aggregateRow function to get sum of all rows from DB, 
reduce(SUM, CURRENT_VALUE, 0) = function used to get sum of records */

function aggregateRows(rows) {
  if (!rows || rows.length === 0) return null;
  const totalRecords = rows.reduce((sum, r) => sum + r.recordCount, 0);
  if (totalRecords === 0) return null;
  const avgCorrectionFactor =
    rows.reduce((sum, r) => sum + r.correctionFactor * r.recordCount, 0) /
    totalRecords;
  const avgCorrectedBaseline =
    rows.reduce((sum, r) => sum + r.correctedBaseline * r.recordCount, 0) /
    totalRecords;
  return {
    correctionFactor: avgCorrectionFactor,
    correctedBaseline: avgCorrectedBaseline,
    recordCount: totalRecords,
  };
}

function format(row, fallbackLevel) {
  return {
    correctedBaseline: row.correctedBaseline,
    correctionFactor: row.correctionFactor,
    recordCount: row.recordCount,
    fallbackLevel,
  };
}

export async function getBaseline({
  doctorProfileId,
  dayOfWeek,
  timeSlot,
  visitType,
}) {
  const exact = await prisma.correctionFactor.findUnique({
    where: {
      lookupKey: buildKey(doctorProfileId, dayOfWeek, timeSlot, visitType),
    },
  });
  if (exact?.recordCount >= MIN_RECORDS) return format(exact, "exact");

  const noVisitTypeRows = await prisma.correctionFactor.findMany({
    where: { doctorProfileId, dayOfWeek, timeSlot },
  });
  const nvt = aggregateRows(noVisitTypeRows);
  if (nvt?.recordCount >= MIN_RECORDS) return format(nvt, "no_visit_type");

  const noTimeSlotRows = await prisma.correctionFactor.findMany({
    where: { doctorProfileId, dayOfWeek },
  });
  const nts = aggregateRows(noTimeSlotRows);
  if (nts?.recordCount >= MIN_RECORDS) return format(nts, "no_time_slot");

  const globalRows = await prisma.correctionFactor.findMany({
    where: { doctorProfileId },
  });
  const g = aggregateRows(globalRows);
  if (g?.recordCount >= MIN_RECORDS) return format(g, "global");

  return {
    correctedBaseline: null,
    correctionFactor: null,
    recordCount: 0,
    fallbackLevel: "none",
  };
}

export async function updateAfterConsultation({
  doctorProfileId,
  dayOfWeek,
  timeSlot,
  visitType,
  actualDurationMinutes,
  doctorAvgMinutes,
}) {
  const overrunFactor = actualDurationMinutes / doctorAvgMinutes;
  const lookupKey = buildKey(doctorProfileId, dayOfWeek, timeSlot, visitType);

  const existing = await prisma.correctionFactor.findUnique({
    where: { id: lookupKey },
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

  await prisma.correctionFactor.upsert({
    where: { id: lookupKey },
    update: {
      correctionFactor: newCorrectionFactor,
      recordCount: newRecordCount,
      correctedBaseline,
    },
    create: {
      id: lookupKey,
      doctorProfileId,
      dayOfWeek,
      timeSlot,
      visitType,
      correctionFactor: newCorrectionFactor,
      recordCount: newRecordCount,
      correctedBaseline,
    },
  });

  return {
    newCorrectionFactor,
    correctedBaseline,
    recordCount: newRecordCount,
  };
}
