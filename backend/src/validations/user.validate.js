import { z } from "zod";

const roles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

/**
 * Register User Validation
 */

export const registerUserSchema = {
  body: z
    .object({
      name: z.string().trim().min(3).max(50),
      email: z.string().trim().email().toLowerCase(),
      password: z.string().min(6).max(50),
      role: z.enum(roles),

      workStartTime: z.string().optional(),
      workEndTime: z.string().optional(),
      averageConsultationMinutes: z.number().int().positive().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "DOCTOR") {
        if (!data.workStartTime) {
          ctx.addIssue({
            path: ["workStartTime"],
            message: "Doctor must have workStartTime",
          });
        }

        if (!data.workEndTime) {
          ctx.addIssue({
            path: ["workEndTime"],
            message: "Doctor must have workEndTime",
          });
        }

        if (!data.averageConsultationMinutes) {
          ctx.addIssue({
            path: ["averageConsultationMinutes"],
            message: "Doctor must have averageConsultationMinutes",
          });
        }
      }
    }),
};

/**
 * Login User Validation
 */
export const loginUserSchema = {
  body: z.object({
    email: z.string().trim().email("Invalid email format").toLowerCase(),

    password: z.string().min(1, "Password is required"),
  }),
};
