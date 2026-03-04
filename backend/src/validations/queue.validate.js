import { z } from "zod";

/**
 * Create Queue Validation
 */
export const createQueueSchema = {
  body: z.object({
    patientId: z.string().uuid("Invalid patientId format"),

    doctorId: z.string().uuid("Invalid doctorId format"),

    visitDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid visitDate format. Use ISO date string.",
      }),
  }),
};

/**
 * Update Queue Status Validation
 */
export const updateQueueStatusSchema = {
  body: z.object({
    status: z.enum(["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], {
      errorMap: () => ({
        message: "Status must be WAITING, IN_PROGRESS, COMPLETED, or CANCELLED",
      }),
    }),
  }),
};

/**
 * Track Queue Validation (Public)
 */
export const trackQueueSchema = {
  query: z.object({
    doctorId: z.string().uuid("Invalid doctorId format"),

    tokenNumber: z.string().regex(/^\d+$/, "tokenNumber must be a number"),

    visitDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid visitDate format. Use ISO date string.",
      }),
  }),
};
