import { z } from "zod";

const roles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

/**
 * Register User Validation
 */
export const registerUserSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name cannot exceed 50 characters"),

    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .toLowerCase(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters"),

    role: z
      .enum(roles, {
        errorMap: () => ({
          message: "Role must be ADMIN, DOCTOR, or RECEPTIONIST"
        })
      })
  })
};

/**
 * Login User Validation
 */
export const loginUserSchema = {
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .toLowerCase(),

    password: z
      .string()
      .min(1, "Password is required")
  })
};