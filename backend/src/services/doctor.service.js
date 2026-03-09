import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

/**
 * Get All Doctors
 */

export async function getAllDoctorService() {
  const doctors = await prisma.doctorProfile.findMany({
    where: {
      user: {
        role: "DOCTOR",
        isActive: true,
      },
    },
    select: {
      id: true,
      specialization: true,
      workStartTime: true,
      workEndTime: true,
      averageConsultationMinutes: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return doctors;
}

/**
 * Get Doctor by Id
 */

export async function getDoctorByIdService(doctorId) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return doctor;
}

/**
 * Update Doctor data
 */

export async function updateDoctorService(doctorId) {
  const doctor = await prisma.doctorProfile.update({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const updateDoctor = await prisma.doctorProfile.update({
    where: {
      id: doctorId,
    },
    data: {
      specialization: data.specialization,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
      averageConsultationMinutes: data.averageConsultationMinutes,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updateDoctor;
}
