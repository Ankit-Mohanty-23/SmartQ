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
      specialization: z.string().trim().min(3).max(100).optional(),
      workStartTime: z.string().optional(),
      workEndTime: z.string().optional(),
      averageConsultationMinutes: z.number().int().positive().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "DOCTOR") {
        if (!data.specialization) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["specialization"],
            message: "Doctor must have specialization",
          });
        }

        if (!data.workStartTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workStartTime"],
            message: "Doctor must have workStartTime",
          });
        }

        if (!data.workEndTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workEndTime"],
            message: "Doctor must have workEndTime",
          });
        }

        if (!data.averageConsultationMinutes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
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

/**
 * Get All Users Validation
 */

export const getAllUsersSchema = {
  query: z.object({
    role: z.enum(roles).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        return val === "true";
      }),
  }),
};

/**
 * Update User Validation
 */

export const updateUserSchema = {
  params: z.object({
    id: z.string().uuid("Invalid user id"),
  }),

  body: z.object({
    name: z.string().trim().min(3).max(50).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    specialization: z.string().trim().min(3).max(100).optional(),
    workStartTime: z.string().optional(),
    workEndTime: z.string().optional(),
    averageConsultationMinutes: z.number().int().positive().optional(),
  }),
};

/**
 * Deactivate User Validation
 */

export const deactivateUserSchema = {
  params: z.object({
    id: z.string().uuid("Invalid user id"),
  }),
};
