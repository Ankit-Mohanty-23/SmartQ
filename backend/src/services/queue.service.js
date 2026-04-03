import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import { predictDuration } from "../services/ml.service.js";
import { resolve } from "../engine/factor/fallback.js";
import { checkOutlier } from "../engine/factor/outlierFilter.js";
import { emit } from "../services/websocket.service.js";
import { getSettingValuesService } from "../services/setting.service.js";
import {
  updateAfterConsultation,
  getBaseline,
} from "../engine/correctionEngine.js";
import { getCurrentWeather } from "../services/weather.service.js";
import redis from "../config/redis.js";
import {
  pushToken,
  removeToken,
  setServing,
  clearServing,
  recomputeCascade,
  getLiveQueue,
  getTokenData,
  hydrateFromDB,
} from "./redisQueue.service.js";

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
  return new Date(Date.UTC(year, month - 1, day))
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    })
    .toUpperCase();
}

function mapDurationSourceToFallbackType(source) {
  if (source === "ml_model") return "MODEL";
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
  department = "General",
  doctorSpecialization,
  isExistingPatient = false,
  arrivedWithRecords = false,
  chronicConditionFlag = false,
  reasonForVisit = "General Checkup",
  numPriorVisits = 0,
  numComorbidities = 0,
  isOnlineBooking = true,
}) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      specialization: true,
      experienceYears: true,
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

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[new Date(appointmentDate).getUTCMonth()];

    // Auto-fetch weather if frontend didn't supply one
    let resolvedWeather =
      weatherCondition && weatherCondition !== "UNKNOWN"
        ? weatherCondition
        : await getCurrentWeather();

    let correctionData = null;
    try {
      correctionData = await getBaseline({
        doctorId,
        dayOfWeek,
        timeSlot,
        visitType,
      });
    } catch {
      logger.warn(
        "[QUEUE] Correction baseline lookup skipped | Reason: getBaseline failed",
      );
    }

    /**
     * ML Section
     */

    let mlResult = null;
    try {
      const mlInput = {
        Department: department || doctor.specialization,
        AppointmentType: visitType,
        Sex: patientGender
          ? patientGender.charAt(0).toUpperCase() +
            patientGender.slice(1).toLowerCase()
          : "Other",
        IsExistingPatient: isExistingPatient ? "True" : "False",
        ArrivedWithRecords: arrivedWithRecords ? "True" : "False",
        ChronicConditionFlag: chronicConditionFlag ? "True" : "False",
        ReasonForVisit: reasonForVisit,
        ProviderID: doctorId,
        DoctorSpecialization: doctorSpecialization || doctor.specialization,
        DayOfWeek: dayOfWeek,
        Month: month,
        Age: patientAge,
        NumPriorVisits: numPriorVisits,
        NumComorbidities: numComorbidities,
        DoctorExperienceYears: doctor.experienceYears || 0,
        DoctorHistoricalAvgDuration:
          correctionData?.correctedBaseline ??
          doctor.averageConsultationMinutes,
        PatientsBefore: nextTokenNumber - 1,
        FacilityOccupancyRate: 0.5,
        HourOfDay: estimatedStartTime.getHours(),
        IsOnlineBooking: isOnlineBooking ? 1 : 0,
        WeatherCondition: resolvedWeather,
      };

      const mlResponse = await predictDuration(mlInput);

      if (mlResponse && typeof mlResponse.predicted_minutes === "number") {
        mlResult = {
          predicted_minutes: mlResponse.predicted_minutes,
          confidence_score: mlResponse.confidence_score,
        };
      } else {
        throw new Error("Invalid ML output: " + JSON.stringify(mlResponse));
      }
    } catch (err) {
      logger.warn(
        `[ML] Prediction engine failed | Reason: ${err.message} | Action: Falling back to statistical average`,
      );
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
        doctorProfileId: doctor.id,
        tokenNumber: nextTokenNumber,
        appointmentDate: new Date(appointmentDate),
        patientName,
        patientPhone,
        patientAge,
        patientGender: patientGender.toUpperCase(),
        ageGroup: patientAgeGroup.toUpperCase(),
        visitType: visitType.toUpperCase(),
        department: department || doctor.specialization,
        doctorSpecialization: doctorSpecialization || doctor.specialization,
        isExistingPatient,
        arrivedWithRecords,
        chronicConditionFlag,
        reasonForVisit,
        numPriorVisits,
        numComorbidities,
        doctorExperienceYears: doctor.experienceYears || 0,
        doctorHistoricalAvgDuration:
          correctionData?.correctedBaseline ??
          doctor.averageConsultationMinutes,
        patientsBefore: nextTokenNumber - 1,
        facilityOccupancyRate: 0.5,
        isOnlineBooking,
        timeSlot,
        predictedDurationMinutes: resolvedDuration,
        mlConfidenceScore: mlConfidence ?? null,
        fallbackUsed: mapDurationSourceToFallbackType(durationSource),
        estimatedStartTime,
        estimatedEndTime,
        weatherCondition: resolvedWeather,
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

    // Write-through to Redis
    pushToken(token).catch((err) =>
      logger.warn(
        `[REDIS] Write-through failed | Action: pushToken | Error: ${err.message}`,
      ),
    );

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

  const updatedToken = await prisma.queue.update({
    where: { id: tokenId },
    data: {
      status: "IN_PROGRESS",
      actualStartTime: now,
    },
  });

  // Update Redis status
  setServing(
    token.doctorProfileId,
    token.appointmentDate.toISOString().split("T")[0],
    token.tokenNumber,
  ).catch((err) =>
    logger.warn(
      `[REDIS] Status update failed | Action: setServing | Error: ${err.message}`,
    ),
  );

  return updatedToken;
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

  // Lifecycle tracing
  logger.info(
    `[QUEUE] Process: markComplete | Token: ${token.tokenNumber} | ID: ${tokenId}`,
  );

  if (token.status !== "IN_PROGRESS") {
    throw new AppError("Invalid status transition", 400);
  }

  const settings = await getSettingValuesService();
  const actualEndTime = new Date();
  const actualDurationMinutes = (actualEndTime - token.actualStartTime) / 60000;

  const { isOutlier, deviationRatio } = checkOutlier({
    actualDurationMinutes,
    predictedDurationMinutes: token.predictedDurationMinutes,
    outlierMultiplier: settings.outlierMultiplier,
  });

  await prisma.$transaction(async (tx) => {
    await tx.queue.update({
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
        doctorProfileId: token.doctorProfileId,
        dayOfWeek,
        timeSlot: token.timeSlot,
        visitType: token.visitType,
        actualDurationMinutes,
        doctorAvgMinutes: token.doctorProfile.averageConsultationMinutes,
      });
    }

    // Redis cleanup and cascade
    const dateStr = token.appointmentDate.toISOString().split("T")[0];
    removeToken(token.doctorProfileId, dateStr, tokenId).catch((err) =>
      logger.warn(
        `[REDIS] Cleanup failed | Action: removeToken | Error: ${err.message}`,
      ),
    );
    clearServing(token.doctorProfileId, dateStr).catch((err) =>
      logger.warn(
        `[REDIS] Cleanup failed | Action: clearServing | Error: ${err.message}`,
      ),
    );
    recomputeCascade(token.doctorProfileId, dateStr, actualEndTime).catch(
      (err) =>
        logger.warn(
          `[REDIS] Cascade failed | Action: recomputeCascade | Error: ${err.message}`,
        ),
    );
  });

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
  try {
    const liveQueue = await getLiveQueue(doctorId, date);
    if (liveQueue) return liveQueue;

    // Cold start - hydrate from DB
    return await hydrateFromDB(doctorId, date);
  } catch (err) {
    logger.warn(
      `[REDIS] Cache retrieval failed | Action: getQueueService | Reason: ${err.message} | Action: Falling back to DB`,
    );
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
}

/**
 * Get Queue data for patients
 */

export async function getPatientViewService({ tokenId }) {
  try {
    const redisToken = await getTokenData(tokenId);

    if (redisToken) {
      // In a real production system, you'd also fetch metadata like doctorName from a doctor cache
      // For now, we fetch details from DB but use Redis for the live queue context
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

      const dateStr = token.appointmentDate.toISOString().split("T")[0];
      const servingNum = await redis.get(
        `serving:${token.doctorProfileId}:${dateStr}`,
      );

      const liveQueue = await getLiveQueue(token.doctorProfileId, dateStr);
      const myIndex = liveQueue.findIndex((t) => t.id === tokenId);
      const patientsAhead = liveQueue.filter(
        (t, i) => i < myIndex && t.status === "WAITING",
      ).length;

      return {
        tokenNumber: parseInt(redisToken.tokenNumber),
        status: redisToken.status,
        currentlyServing: servingNum ? parseInt(servingNum) : null,
        patientsAhead,
        estimatedStartTime: redisToken.estimatedStartTime,
        estimatedWaitMinutes: liveQueue
          .slice(0, myIndex)
          .reduce((sum, t) => sum + parseFloat(t.predictedDurationMinutes), 0),
        isDrifting: token.isDrifting,
        doctorName: token.doctorProfile.user.name,
        specialization: token.doctorProfile.specialization,
      };
    }
  } catch (err) {
    logger.warn(
      `[REDIS] Cache retrieval failed | Action: getPatientViewService | Reason: ${err.message} | Action: Falling back to DB`,
    );
  }

  // DB Fallback Logic
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

export async function cancelQueueService(tokenId, phone) {
  const token = await prisma.queue.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  if (token.status === "CANCELLED" || token.status === "COMPLETED") {
    throw new AppError("Invalid status transition", 400);
  }

  if (token.patientPhone !== phone) {
    throw new AppError("Only token owner can cancel a token", 400);
  }

  await prisma.queue.update({
    where: { id: tokenId },
    data: { status: "CANCELLED" },
  });

  // Redis update and cascade re-compute
  const dateStr = token.appointmentDate.toISOString().split("T")[0];
  removeToken(token.doctorProfileId, dateStr, tokenId).catch((err) =>
    logger.warn(
      `[REDIS] Cleanup failed | Action: removeToken | Error: ${err.message}`,
    ),
  );
  recomputeCascade(
    token.doctorProfileId,
    dateStr,
    token.estimatedStartTime,
  ).catch((err) =>
    logger.warn(
      `[REDIS] Cascade failed | Action: recomputeCascade | Error: ${err.message}`,
    ),
  );

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
