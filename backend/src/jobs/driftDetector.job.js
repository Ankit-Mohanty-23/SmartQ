import cron from "node-cron";
import prisma from "../config/prisma.js";
import { getSettingValuesService } from "../services/setting.service.js";
import { checkAndNotify } from "../services/notification.service.js";
import { emit } from "../services/websocket.service.js";
import logger from "../utils/logger.js";

function registerDriftDetectorJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info(
        "[DRIFT] Analysis cycle initialized | Action: checkAndNotify",
      );
      await runDriftDetection();
    } catch (err) {
      logger.error(
        `[DRIFT] Analysis cycle failure | Action: checkAndNotify | Error: ${err.message}`,
      );
    }
  });
}

async function runDriftDetection() {
  const settings = await getSettingValuesService();
  const driftThreshold = settings?.driftThreshold ?? 0.3;

  const inProgressTokens = await prisma.queue.findMany({
    where: { status: "IN_PROGRESS" },
    select: {
      id: true,
      doctorProfileId: true,
      appointmentDate: true,
      tokenNumber: true,
      estimatedEndTime: true,
      predictedDurationMinutes: true,
      isDrifting: true,
      doctorProfile: { 
        select: { 
          user: {
            select: {
              name: true
            }
          } 
        } 
      },
    },
  });

  if (inProgressTokens.length === 0) return;

  const now = new Date();

  for (const token of inProgressTokens) {
    const driftAllowanceMs =
      token.predictedDurationMinutes * driftThreshold * 60 * 1000;
    const driftDeadline = new Date(
      token.estimatedEndTime.getTime() + driftAllowanceMs,
    );
    const isDriftingNow = now > driftDeadline;

    if (!isDriftingNow) continue;

    if (!token.isDrifting) {
      await handleNewDrift(token, now);
    } else {
      emitOngoingDrift(token, now);
    }
  }
}

async function handleNewDrift(token, now) {
  await prisma.queue.update({
    where: { id: token.id },
    data: { isDrifting: true },
  });

  const waitingTokens = await prisma.queue.findMany({
    where: {
      doctorProfileId: token.doctorProfileId,
      appointmentDate: token.appointmentDate,
      status: "WAITING",
      tokenNumber: { gt: token.tokenNumber },
    },
    select: {
      id: true,
      tokenNumber: true,
      patientPhone: true,
      patientName: true,
    },
    orderBy: { tokenNumber: "asc" },
  });

  const elapsedMs = now - token.estimatedEndTime;

  emit("drift_detected", {
    doctorProfileId: token.doctorProfileId,
    doctorName: token.doctorProfile.user.name,
    appointmentDate: token.appointmentDate,
    elapsedMs,
    affectedTokens: waitingTokens.map((t) => ({
      tokenId: t.id,
      tokenNumber: t.tokenNumber,
    })),
  });

  checkAndNotify(token.doctorProfileId, token.appointmentDate).catch((err) =>
    logger.error("[DriftDetector] checkAndNotify failed:", err),
  );
}

function emitOngoingDrift(token, now) {
  const elapsedMs = now - token.estimatedEndTime;

  emit("drift_ongoing", {
    doctorProfileId: token.doctorProfileId,
    appointmentDate: token.appointmentDate,
    tokenId: token.id,
    elapsedMs,
  });
}

export { registerDriftDetectorJob };
