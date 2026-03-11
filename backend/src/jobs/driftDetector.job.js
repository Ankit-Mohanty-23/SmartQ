import cron from "node-cron";
import prisma from "../db/index.js";
import { sendDriftSMS } from "../services/notificationService.js";
import { emit } from "../services/websocketService.js";

const DRIFT_THRESHOLD_MINUTES = 1;

function registerDriftDetectorJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await runDriftDetection();
    } catch (err) {
      console.error("[DriftDetector] Unhandled error:", err);
    }
  });
}

async function runDriftDetection() {
  const inProgressTokens = await prisma.queue.findMany({
    where: { status: "IN_PROGRESS", isDrifting: false },
    select: {
      id: true,
      doctorId: true,
      appointmentDate: true,
      tokenNumber: true,
      estimatedEndTime: true,
      doctor: { select: { name: true } },
    },
  });

  if (inProgressTokens.length === 0) return;

  const now = new Date();

  for (const token of inProgressTokens) {
    const driftDeadline = new Date(
      token.estimatedEndTime.getTime() + DRIFT_THRESHOLD_MINUTES * 60 * 1000,
    );

    if (now > driftDeadline) {
      await handleDrift(token, now);
    }
  }
}

async function handleDrift(driftingToken, now) {
  await prisma.queue.update({
    where: { id: driftingToken.id },
    data: { isDrifting: true },
  });

  const waitingTokens = await prisma.queue.findMany({
    where: {
      doctorId: driftingToken.doctorId,
      appointmentDate: driftingToken.appointmentDate,
      status: "WAITING",
      tokenNumber: { gt: driftingToken.tokenNumber },
    },
    select: { id: true, tokenNumber: true },
    orderBy: { tokenNumber: "asc" },
  });

  emit("drift_detected", {
    doctorId: driftingToken.doctorId,
    doctorName: driftingToken.doctor.name,
    appointmentDate: driftingToken.appointmentDate,
    affectedTokens: waitingTokens.map((t) => ({
      tokenId: t.id,
      tokenNumber: t.tokenNumber,
    })),
  });

  sendDriftSMS(waitingTokens, driftingToken.doctor);
}

export { registerDriftDetectorJob };
