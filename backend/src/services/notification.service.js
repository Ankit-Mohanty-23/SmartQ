import axios from "axios";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

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
      logger.log(
        `[NotificationService] SMS failed for token ${token.id}: `,
        err,
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

