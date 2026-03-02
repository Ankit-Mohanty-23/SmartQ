import prisma from "../config/prisma.js";

/**
 * Register New Patient
 * Used by receptionist to create a patient record.
 */

export const createPatientService = async (data) => {
  const { name, phone, gender, dateOfBirth } = data;

  return prisma.patient.create({
    data: {
      name,
      phone,
      gender,
      dateOfBirth: new Date(dateOfBirth),
    },
  });
};

/**
 * Get All Patients
 * Supports pagination for listing patient records.
 */

export const getAllPatientsService = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.patient.count(),
  ]);

  return {
    patients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get Patient By ID
 * Returns detailed information of a specific patient.
 */

export const getPatientByIdService = async (id) => {
  return prisma.patient.findUnique({
    where: { id },
  });
};

/**
 * Update Patient Information
 * Allows receptionist/admin to modify patient details.
 */

export const updatePatientService = async (id, data) => {
  return prisma.patient.update({
    where: { id },
    data,
  });
};

/**
 * Find Patient By Phone
 * Internal utility used during appointment confirmation flow.
 */

export const findPatientByPhoneService = async (phone) => {
  const normalizedPhone = phone.trim();

  return prisma.patient.findUnique({
    where: { normalizedPhone },
  });
};
