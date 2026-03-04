import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export async function createQueueService({
  patientId,
  doctorId,
  visitDate,
  predictedDuration,
}) {
  return prisma.$transaction(async (tx) => {
    const dateObj = new Date(visitDate);

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await tx.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new AppError("Invalid doctor", 400);
    }

    if (!doctor.workStartTime || !doctor.workEndTime) {
      throw new AppError("Doctor schedule not configured", 400);
    }

    const [startHour, startMinute] = doctor.workStartTime.split(":");
    const [endHour, endMinute] = doctor.workEndTime.split(":");

    const workStart = new Date(visitDate);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(visitDate);
    workEnd.setHours(endHour, endMinute, 0, 0);

    const lastQueue = await tx.queue.findFirst({
      where: {
        doctorId,
        visitDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        estimatedEndTime: "desc",
      },
    });

    const estimatedStartTime = lastQueue
      ? lastQueue.estimatedEndTime
      : workStart;

    const finalDuration =
      predictedDuration || doctor.averageConsultationMinutes || 15;

    const estimatedEndTime = new Date(
      estimatedStartTime.getTime() + finalDuration * 60000,
    );

    if (estimatedEndTime > workEnd) {
      throw new AppError("Doctor fully booked for selected date", 400);
    }

    const lastToken = await tx.queue.findFirst({
      where: {
        doctorId,
        visitDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        tokenNumber: "desc",
      },
    });

    const nextToken = lastToken ? lastToken.tokenNumber + 1 : 1;

    return tx.queue.create({
      data: {
        patientId,
        doctorId,
        visitDate: new Date(visitDate),
        tokenNumber: nextToken,
        estimatedStartTime,
        estimatedEndTime,
      },
    });
  });
}

/**
 * Get Queue By ID
 */

export async function getQueueByIdService(queueId) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!queue) {
    throw new AppError("Queue not found", 404);
  }

  return queue;
}

export async function getDoctorQueueService(docterId, date) {
  const dateObj = new Date(date);

  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.queue.findMany({
    where: {
      docterId,
      visitDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      tokenNumber: "asc",
    },
    include: {
      patient: true,
    },
  });
}

/**
 * Update Queue Status
 */

export async function updateQueueStatusService(queueId, status) {
  const queue = await prisma.queue.findUnique({
    where: {
      id: queueId,
    },
  });

  if (!queue) {
    throw new AppError("Queue not found", 404);
  }

  return prisma.queue.update({
    where: { id: queueId },
    data: { status },
  });
}

/**
 * Track Queue Status (Public)
 */

export async function trackQueueService({ docterId, tokenNumber, visitDate }) {
  const dateObj = new Date(visitDate);

  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const queue = await prisma.queue.findFirst({
    where: {
      docterId,
      tokenNumber,
      visitDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (!queue) {
    throw new AppError("Queue not found", 404);
  }

  const patientsAhead = await prisma.queue.count({
    where: {
      docterId,
      visitDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      tokenNumber: {
        lt: tokenNumber,
      },
      status: "WAITING",
    },
  });

  return {
    status: queue.status,
    tokenNumber: queue.tokenNumber,
    patientsAhead,
    estimatedStartTime: queue.estimatedStartTime,
    estimatedEndTime: queue.estimatedEndTime,
  };
}

/**
 * Cancel Queue Entry
 */

export async function cancelQueueService(queueId) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
  });

  if (!queue) {
    throw new AppError("Queue not found", 404);
  }

  if (queue.status === "COMPLETED") {
    throw new AppError("Completed queue cannot be cancelled", 400);
  }

  return prisma.queue.update({
    where: { id: queueId },
    data: { status: "CANCELLED" },
  });
}
