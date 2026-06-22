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
      // Doctor-specific fields — always optional at schema level.
      specialization: z.preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
        z.string().trim().min(3).max(100).optional()
      ),
      workStartTime: z.preprocess(
        (val) =>
          typeof val === "string" && (val.trim() === "" || val.trim() === "undefined")
            ? undefined
            : val,
        z.string().optional()
      ),
      workEndTime: z.preprocess(
        (val) =>
          typeof val === "string" && (val.trim() === "" || val.trim() === "undefined")
            ? undefined
            : val,
        z.string().optional()
      ),
      averageConsultationMinutes: z.preprocess(
        (val) => (val === "" || val === null ? undefined : val),
        z.number().int().positive().optional()
      ),
    })
    .superRefine((data, ctx) => {
      if (data.role === "DOCTOR") {
        if (!data.specialization) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["specialization"],
            message: "Specialization is required for doctors",
          });
        }

        if (!data.workStartTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workStartTime"],
            message: "Work start time is required for doctors",
          });
        }

        if (!data.workEndTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workEndTime"],
            message: "Work end time is required for doctors",
          });
        }

        if (!data.averageConsultationMinutes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["averageConsultationMinutes"],
            message: "Average consultation minutes is required for doctors",
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
