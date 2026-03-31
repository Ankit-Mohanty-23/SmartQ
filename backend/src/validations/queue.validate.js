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

    patientAgeGroup: z.enum(["CHILD", "ADULT", "SENIOR"], {
      errorMap: () => ({
        message: "patientAgeGroup must be CHILD, ADULT or SENIOR",
      }),
    }),

    visitType: z.enum(["NEW", "FOLLOW_UP", "EMERGENCY"], {
      errorMap: () => ({
        message: "visitType must be NEW, FOLLOW_UP or EMERGENCY",
      }),
    }),

    weatherCondition: z
      .enum([
        "SUNNY_NORMAL",
        "SUNNY_HOT",
        "SUNNY_EXTREME_HEAT",
        "CLOUDY_NORMAL",
        "CLOUDY_HOT",
        "RAINING_NORMAL",
        "HUMIDITY",
        "HEAVY_RAIN_NORMAL",
        "CYCLONE_WARNING",
      ])
      .optional()
      .default("UNKNOWN"),
  }),
};


/**
 * Track Queue Validation (Public)
 */

export const trackQueueSchema = {
  params: z.object({
    tokenId: z.string().uuid("Invalid tokenId format"),
  }),
};
