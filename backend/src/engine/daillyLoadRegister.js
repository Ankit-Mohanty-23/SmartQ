import prisma from "../config/prisma.js";
import { isPostHoliday } from "../services/setting.service.js";

function getDayOfWeek(date) {
  return date
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
    .toUpperCase();
}

function getWeekOfMonth(date) {
  const firstDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  return Math.ceil((date.getUTCDate() + firstDay.getUTCDay()) / 7);
}

export default async function createDailyLoadStubs(date = new Date()) {
  const dateOnly = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dateStr = dateOnly.toISOString().split("T")[0];

  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { isActive: true } },
    select: { id: true },
  });

  if (doctors.length === 0) return;

  const month = dateOnly.getUTCMonth() + 1;
  const postHoliday = await isPostHoliday(dateStr);

  const rows = doctors.map((doctor) => ({
    doctorProfileId: doctor.id,
    recordDate: dateOnly,
    dayOfWeek: getDayOfWeek(dateOnly),
    dateOfMonth: dateOnly.getUTCDate(),
    month,
    weekOfMonth: getWeekOfMonth(dateOnly),
    isPostHoliday: postHoliday,
    isExamSeason: isExamSeason(month),
    weatherCondition: "UNKNOWN",
    isPostRainDay: false,
    totalPatientsActual: null,
    predictedPatients: null,
  }));

  await prisma.dailyLoadHistory.createMany({
    data: rows,
    skipDuplicates: true,
  });
}
