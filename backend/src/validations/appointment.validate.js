import { z } from "zod";

const visitTypeEnum = z.enum(["NEW", "FOLLOW_UP", "EMERGENCY"], {
  errorMap: () => ({
    message: "visitType must be NEW, FOLLOW_UP or EMERGENCY",
  }),
});

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"], {
  errorMap: () => ({ message: "patientGender must be MALE, FEMALE or OTHER" }),
});

const dateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Use YYYY-MM-DD.",
  })
  .refine(
    (val) => {
      const today = new Date().toLocaleDateString("en-CA"); // gives YYYY-MM-DD in local time
      return val >= today;
    },
    { message: "preferredDate cannot be in the past." },
  );

export const createAppointmentSchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
    problem: z.string().min(1, "Problem description is required"),
    patientAge: z.coerce
      .number()
      .int()
      .min(0, "Age cannot be negative")
      .max(120, "Invalid age"),
    patientGender: genderEnum,
    visitType: visitTypeEnum.optional().default("NEW"),
    preferredDate: dateString,
  }),
};

export const listAppointmentsSchema = {
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "EXPIRED"])
      .optional(),
    preferredDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format. Use YYYY-MM-DD.",
      })
      .optional(),
    assignedDoctorId: z
      .string()
      .uuid("Invalid assignedDoctorId format")
      .optional(),
  }),
};

export const assignAndConvertSchema = {
  body: z.object({
    doctorProfileId: z.string().uuid("Invalid doctorProfileId format"),
    appointmentId: z.string().uuid("Invalid appointmentId format"),
  }),
};
