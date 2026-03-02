import { z } from "zod";

export const createPatientSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name cannot exceed 50 characters"),

    phone: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits"),

    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({
        message: "Gender must be MALE, FEMALE, or OTHER",
      }),
    }),

    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  }),
};

export const updatePatientSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name cannot exceed 50 characters")
      .optional(),

    phone: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .optional(),

    gender: z
      .enum(["MALE", "FEMALE", "OTHER"], {
        errorMap: () => ({
          message: "Gender must be MALE, FEMALE, or OTHER",
        }),
      })
      .optional(),

    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
  }),
};
