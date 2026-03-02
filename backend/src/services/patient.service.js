import prisma from "../config/prisma.js";

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
    }
}

export const getPatientByIdService = async (id) => {
    return prisma.patient.findUnique({
      where: { id },
    });
  };
  
export const updatePatientService = async (id, data) => {
  return prisma.patient.update({
    where: { id },
    data,
  });
};

export const findPatientByPhoneService = async (phone) => {
  const normalizedPhone = phone.trim();

  return prisma.patient.findUnique({
    where: { normalizedPhone },
  });
};
