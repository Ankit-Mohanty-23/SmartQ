import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { emit } from "../services/websocket.service.js";
import { bookTokenService } from "../services/queue.service.js";

/**
 * Create new Appointments
 */

export async function createAppointmentService({
  name,
  phone,
  problem,
  patientAge,
  patientGender,
  visitType,
  preferredDate,
}) {
  return prisma.appointmentRequest.create({
    data: {
      name,
      phone,
      problem,
      patientAge,
      patientGender,
      visitType: visitType ?? "NEW",
      preferredDate: new Date(preferredDate),
      status: "PENDING",
    },
  });
}

/**
 * List all Appointments
 */

export async function listAppointmentService({
  status,
  preferredDate,
  assignedDoctorId,
}) {
  return prisma.appointmentRequest.findMany({
    where: {
      status,
      preferredDate,
      assignedDoctorId,
    },
    orderBy: {
      preferredDate: "asc",
    },
    include: {
      assignedDoctor: {
        select: {
          id: true,
          specialization: true,
          user: { select: { name: true } },
        },
      },
    },
  });
}

/**
 * Get Appointment detail
 */

export async function appointmentInfoService(appointmentId) {
  return prisma.appointmentRequest.findUnique({
    where: { id: appointmentId },
    select: {
      name: true,
      phone: true,
      patientAge: true,
      patientGender: true,
      problem: true,
      preferredDate: true,
      status: true,
      visitType: true,
      assignedDoctor: {
        select: {
          id: true,
          specialization: true,
          user: { select: { name: true } },
        },
      },
    },
  });
}

/**
 * Convert appointment to token
 */

export async function convertAppointmentService(
  receptionistId,
  appointmentId,
  doctorProfileId,
) {
  const appointment = await prisma.appointmentRequest.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "PENDING") {
    throw new AppError(
      `Appointment cannot be converted. Current status: ${appointment.status}`,
      409,
    );
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    select: { id: true, isActive: true },
  });

  if (!doctor || !doctor.isActive) {
    throw new AppError("Doctor not found", 404);
  }

  const weatherCondition = "UNKNOWN"
  const ageGroup = appointment.patientAge < 18 ? "CHILD" : appointment.patientAge >= 60 ? "SENIOR" : "ADULT";

  const result = await bookTokenService({
    doctorId: doctor.id,
    appointmentDate: appointment.preferredDate.toISOString().split("T")[0],
    patientName: appointment.name,
    patientPhone: appointment.phone,
    patientAge: appointment.patientAge,
    patientGender: appointment.patientGender,
    patientAgeGroup: ageGroup,
    visitType: appointment.visitType,
    weatherCondition: weatherCondition ? weatherCondition : "UNKNOWN",
  });

  await prisma.appointmentRequest.update({
    where: { id: appointment.id },
    data: {
      status: "CONFIRMED",
      assignedDoctorId: doctorProfileId,
      queueId: result.tokenId,
      confirmedTokenNumber: result.tokenNumber,
      confirmedDate: appointment.preferredDate,
      convertedById: receptionistId,
    },
  });

  return result;
}

/**
 * Reject appointment
 */

export async function rejectAppointmentService(appointmentId) {
  const appointment = await prisma.appointmentRequest.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return prisma.appointmentRequest.update({
    where: { id: appointmentId },
    data: {
      status: "REJECTED",
    },
  });
}

/**
 * Cancel appointment
 */

export async function cancelAppointment(appointmentId) {
  const appointment = await prisma.appointmentRequest.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return prisma.appointmentRequest.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
    },
  });
}
