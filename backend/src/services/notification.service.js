import axios from "axios";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { getSettingValuesService } from "./setting.service.js";

export async function sendDriftSMS(tokens, doctor) {
  const promises = tokens.map(async (token) => {
    const record = await prisma.queue.findUnique({
      where: { id: token.id },
      select: { patientPhone: true },
    });

    if (!record?.patientPhone) return;

    const message =
      `SmartQ: Dr. ${doctor.name}'s queue is running behind schedule. ` +
      `Your token #${token.tokenNumber} may be delayed. we will notidy you once your turn is near.`;

    await sendSMS(record.patientPhone, message).catch((err) =>
      logger.error(
        `[NOTIFICATION] Dispatch failure | TokenID: ${token.id} | Action: Send SMS | Error: ${err.message}`,
      ),
    );
  });

  Promise.allSettled(promises);
}

async function sendSMS(phone, message) {
  const payload = {
    sender: process.env.MSG91_SENDER_ID,
    route: "4",
    country: "91",
    sms: [{ message, to: [sanitizePhone(phone)] }],
  };

  const response = await axios.post(
    "https://api.msg91.com/api/sendhttp.php",
    payload,
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    },
  );

  if (response.data?.type !== "success") {
    throw new Error(`MSG91 error: ${JSON.stringify(response.data)}`);
  }
}

function sanitizePhone(phone) {
  return phone
    .replace(/\D/g, "")
    .replace(/^(91|0)/, "")
    .slice(-10);
}

export async function checkAndNotify(doctorProfileId, appointmentDate) {
  try {
    const settings = await getSettingValuesService();
    const template =
      settings?.driftSmsTemplate ||
      "Hi {patientName}, your token #{tokenNumber} with {doctorName} has been delayed. New estimated time: {estimatedTime}.";

    const waitingTokens = await prisma.queue.findMany({
      where: {
        doctorProfileId,
        appointmentDate,
        status: "WAITING",
      },
      include: {
        doctorProfile: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (waitingTokens.length === 0) return;

    logger.info(
      `[NOTIFICATION] Dispatching check | Date: ${new Date().toISOString()} | TokensFound: ${waitingTokens.length}`,
    );

    const promises = waitingTokens.map(async (token) => {
      if (!token.patientPhone) return;

      const message = template
        .replace(/{patientName}/g, token.patientName || "Patient")
        .replace(/{tokenNumber}/g, token.tokenNumber)
        .replace(/{doctorName}/g, token.doctorProfile?.user?.name || "Doctor")
        .replace(
          /{estimatedTime}/g,
          new Date(token.estimatedStartTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );

      try {
        return await sendSMS(token.patientPhone, message);
      } catch (err) {
        logger.error(
          `[NOTIFICATION] Dispatch failure | TokenID: ${token.id} | Action: Send SMS | Error: ${err.message}`,
        );
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    logger.error(
      `[NOTIFICATION] Service failure | Method: checkAndNotify | Error: ${error.message}`,
    );
    throw error;
  }
}
