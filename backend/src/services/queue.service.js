import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import { predictDuration } from "../services/ml.service.js";
import { resolve } from "../engine/factor/fallback.js";
import { checkOutlier } from "../engine/factor/outlierFilter.js";
import { emit } from "../services/websocket.service.js";

function combineDateAndTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`);
}

function getTimeSlot(hour) {
  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}

function getDayOfWeek(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function mapDurationSourceToFallbackType(source) {
  if (source === "ml_model") return "ML_MODEL";
  if (source === "correction_engine") return "CORRECTION_ENGINE";
  return "DOCTOR_AVERAGE";
}

/**
 * Create new Queue token
 */

export async function bookTokenService({
  doctorId,
  appointmentDate,
  patientName,
  patientAgeGroup,
  visitType,
  patientPhone,
  patientAge,
  weatherCondition,
  patientGender,
}) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id : doctorId },
    select: {
      workStartTime: true,
      workEndTime: true,
      averageConsultationMinutes: true,
      user: {
        select: { isActive: true },
      },
    },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }
   
  if (!doctor.user.isActive) {
    throw new AppError("Doctor is not active", 403);
  }

  return prisma.$transaction(async (tx) => {
    const lastToken = await tx.$queryRaw`
      SELECT "tokenNumber", "estimatedEndTime"
      FROM queues
      WHERE "doctorProfileId" = ${doctor.id}
        AND "appointmentDate" = ${new Date(appointmentDate)}
        AND status != 'CANCELLED'
      ORDER BY "tokenNumber" DESC
      LIMIT 1
      FOR UPDATE
    `;

    const last = lastToken[0] || null;
    const nextTokenNumber = last ? last.tokenNumber + 1 : 1;

    const estimatedStartTime = last
      ? new Date(last.estimatedEndTime)
      : combineDateAndTime(appointmentDate, doctor.workStartTime);

    const dayOfWeek = getDayOfWeek(appointmentDate);
    const timeSlot = getTimeSlot(estimatedStartTime.getHours());
    const month = new Date(appointmentDate).getUTCMonth() + 1;

    let correctionData = null;
    try {
      correctionData = await getBaseline({
        doctorId,
        dayOfWeek,
        timeSlot,
        visitType,
      });
    } catch {
      logger.warn("[queueService] getBaseline failed, continuing");
    }

    /**
     * ML Section
     */

    let mlResult = null;
    try {
      mlResult = await predictDuration({
        doctor_id: doctorId,
        visit_type: visitType,
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
        month,
        patient_age_group: patientAgeGroup,
        corrected_baseline: correctionData?.correctedBaseline ?? null,
      });
    } catch {
      logger.warn("[queueService] predictDuration failed, using fallback");
    }

    const { resolvedDuration, durationSource, mlConfidence } = resolve({
      mlResult,
      correctionData,
      doctorAvgMinutes: doctor.averageConsultationMinutes,
    });

    const estimatedEndTime = new Date(
      estimatedStartTime.getTime() + resolvedDuration * 60 * 1000,
    );
    const workEndTime = combineDateAndTime(appointmentDate, doctor.workEndTime);

    if (estimatedEndTime > workEndTime) {
      throw new AppError("Queue is full, no more patients accepted", 400);
    }

    const token = await tx.queue.create({
      data: {
        doctorProfileId: doctorId,
        tokenNumber: nextTokenNumber,
        appointmentDate: new Date(appointmentDate),
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        ageGroup: patientAgeGroup,
        visitType,
        timeSlot,
        predictedDurationMinutes: resolvedDuration,
        mlConfidenceScore: mlConfidence ?? null,
        fallbackUsed: mapDurationSourceToFallbackType(durationSource),
        estimatedStartTime,
        estimatedEndTime,
        weatherCondition: weatherCondition ?? "UNKNOWN",
      },
    });

    const patientsAhead = await tx.queue.count({
      where: {
        doctorProfileId: doctor.id,
        appointmentDate: new Date(appointmentDate),
        status: "WAITING",
        tokenNumber: {
          lt: nextTokenNumber,
        },
      },
    });

    return {
      tokenId: token.id,
      tokenNumber: nextTokenNumber,
      estimatedStartTime: estimatedStartTime.toISOString(),
      estimatedEndTime: estimatedEndTime.toISOString(),
      predictedDuration: resolvedDuration,
      patientsAhead,
      mlConfidence,
      fallbackUsed: token.fallbackUsed,
    };
  });
}

/**
 * Mark token in progress
 */

export async function markInProgressService(tokenId) {
  const token = await prisma.queue.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  if (token.status !== "WAITING") {
    throw new AppError("Invalid status transition", 400);
  }

  const now = new Date();
  if (now < token.estimatedStartTime) {
    throw new AppError(
      "Cannot start token before its scheduled start time",
      400,
    );
  }

  return prisma.queue.update({
    where: { id: tokenId },
    data: {
      status: "IN_PROGRESS",
      actualStartTime: new Date(),
    },
  });
}

/**
 * Mark token as completed
 */

export async function markCompleteService(tokenId) {
  const token = await prisma.queue.findUnique({
    where: { id: tokenId },
    include: {
      doctorProfile: {
        select: {
          averageConsultationMinutes: true,
        },
      },
    },
  });

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  if (token.status !== "IN_PROGRESS") {
    throw new AppError("Invalid status transaction");
  }

  const actualEndTime = new Date();
  const actualDurationMinutes = (actualEndTime - token.actualStartTime) / 60000;

  const { isOutlier, deviationRatio } = checkOutlier({
    actualDurationMinutes,
    predictedDurationMinutes: token.predictedDurationMinutes,
  });

  await prisma.queue.update({
    where: { id: tokenId },
    data: {
      status: "COMPLETED",
      actualEndTime,
      actualDurationMinutes,
      isOutlierExcluded: isOutlier,
    },
  });

  if (!isOutlier) {
    const dayOfWeek = getDayOfWeek(
      token.appointmentDate.toISOString().split("T")[0],
    );

    await updateAfterConsultation({
      doctorId: token.doctorProfileId,
      dayOfWeek,
      timeSlot: token.timeSlot,
      visitType: token.visitType,
      actualDurationMinutes,
      doctorAvgMinutes: token.doctorProfile.averageConsultationMinutes,
    });
  }

  if (token.isDrifting) {
    await recalibratedAfterDrift({
      ...token,
      actualEndTime,
    });
  }

  emit("token_completed", {
    doctorId: token.doctorProfileId,
    tokenId,
    tokenNumber: token.tokenNumber,
    isOutlier,
    deviationRatio,
  });

  return {
    tokenId,
    actualDurationMinutes,
    isOutlier,
    deviationRatio,
  };
}

/**
 * Get Queue data
 */

export async function getQueueService(doctorId, date) {
  return prisma.queue.findMany({
    where: {
      doctorProfileId: doctorId,
      appointmentDate: new Date(date),
      status: {
        in: ["WAITING", "IN_PROGRESS"],
      },
    },
    orderBy: {
      tokenNumber: "asc",
    },
  });
}

/**
 * Get Queue data for patients
 */

export async function getPatientViewService({ tokenId }) {
  const token = await prisma.queue.findUnique({
    where: { id: tokenId },
    include: {
      doctorProfile: {
        select: {
          specialization: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  const currentlyServing = await prisma.queue.findFirst({
    where: {
      doctorProfileId: token.doctorProfileId,
      appointmentDate: token.appointmentDate,
      status: "IN_PROGRESS",
    },
    select: { tokenNumber: true },
  });

  const patientsAhead = await prisma.queue.count({
    where: {
      doctorProfileId: token.doctorProfileId,
      appointmentDate: token.appointmentDate,
      status: "WAITING",
      tokenNumber: { lt: token.tokenNumber },
    },
  });

  const waitingAhead = await prisma.queue.findMany({
    where: {
      doctorProfileId: token.doctorProfileId,
      appointmentDate: token.appointmentDate,
      status: "WAITING",
      tokenNumber: { lt: token.tokenNumber },
    },
    select: { predictedDurationMinutes: true },
  });

  const estimatedWaitMinutes = waitingAhead.reduce(
    (sum, t) => sum + t.predictedDurationMinutes,
    0,
  );

  return {
    tokenNumber: token.tokenNumber,
    status: token.status,
    currentlyServing: currentlyServing?.tokenNumber ?? null,
    patientsAhead,
    estimatedStartTime: token.estimatedStartTime,
    estimatedWaitMinutes,
    isDrifting: token.isDrifting,
    doctorName: token.doctorProfile.user.name,
    specialization: token.doctorProfile.specialization,
  };
}

/**
 * Cancel token
 */

export async function cancelQueueService(tokenId) {
  const token = await prisma.queue.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  if (token.status === "CANCELLED" || token.status === "COMPLETED") {
    throw new AppError("Invalid status transition", 400);
  }

  await prisma.queue.update({
    where: { id: tokenId },
    data: { status: "CANCELLED" },
  });

  const waitingAfter = await prisma.queue.findMany({
    where: {
      doctorProfileId: token.doctorProfileId,
      appointmentDate: token.appointmentDate,
      status: "WAITING",
      tokenNumber: { gt: token.tokenNumber },
    },
    orderBy: { tokenNumber: "asc" },
  });

  let runningTime = token.estimatedStartTime;

  for (const t of waitingAfter) {
    const newStart = new Date(runningTime);
    const newEnd = new Date(
      newStart.getTime() + t.predictedDurationMinutes * 60 * 1000,
    );

    await prisma.queue.update({
      where: { id: t.id },
      data: {
        estimatedStartTime: newStart,
        estimatedEndTime: newEnd,
      },
    });

    runningTime = newEnd;
  }

  emit("token_cancelled", {
    doctorId: token.doctorProfileId,
    tokenId,
    tokenNumber: token.tokenNumber,
  });

  return {
    tokenId,
    status: "CANCELLED",
  };
}
