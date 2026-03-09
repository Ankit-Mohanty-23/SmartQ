import { z } from "zod";

export const updateDoctorSchema = {
  body: z
    .object({
      specialization: z.string().trim().min(2).max(100).optional(),

      workStartTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
        .optional(),

      workEndTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
        .optional(),

      averageConsultationMinutes: z
        .number()
        .int()
        .positive("Consultation time must be positive")
        .max(180, "Consultation time too large")
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.workStartTime && data.workEndTime) {
        if (data.workEndTime <= data.workStartTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workEndTime"],
            message: "workEndTime must be after workStartTime",
          });
        }
      }

      if (Object.keys(data).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one field must be provided for update",
        });
      }
    }),
};
