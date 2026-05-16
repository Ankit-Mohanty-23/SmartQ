import { z } from "zod";

/**
 * Create Queue Validation
 */

export const createQueueSchema = {
  body: z.object({
    doctorId: z.string().uuid("Invalid doctorId format"),

    appointmentDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid appointmentDate format. Use YYYY-MM-DD.",
      })
      .optional(),

    patientName: z.string().min(1, "Patient name is required"),

    patientPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

    patientAge: z
      .number()
      .int()
      .min(0, "Age cannot be negative")
      .max(120, "Invalid age"),

    patientGender: z.enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({
        message: "patientGender must be MALE, FEMALE or OTHER",
      }),
    }),

    visitType: z.enum(["NEW", "FOLLOW_UP", "EMERGENCY"], {
      errorMap: () => ({
        message: "visitType must be NEW, FOLLOW_UP or EMERGENCY",
      }),
    }),

    reasonForVisit: z.string().optional().default("General Checkup"),

    arrivedWithRecords: z.boolean().optional().default(false),
  }),
};


/**
 * Track Queue Validation (Public)
 */

export const trackQueueSchema = {
  params: z.object({
    number: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  }),
};
