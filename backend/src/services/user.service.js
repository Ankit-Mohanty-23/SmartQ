import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";

/**
 * Register Hospital Staff
 */

import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";

/**
 * Register Hospital Staff
 */

export async function registerUserService({
  name,
  email,
  password,
  role,
  workStartTime,
  workEndTime,
  averageConsultationMinutes,
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User already exists", 403);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  // Extra safety (validation middleware should already enforce this)
  if (role === "DOCTOR") {
    if (!workStartTime || !workEndTime || !averageConsultationMinutes) {
      throw new AppError(
        "Doctor must have workStartTime, workEndTime and averageConsultationMinutes",
        400
      );
    }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword,
      role,

      ...(role === "DOCTOR" && {
        workStartTime,
        workEndTime,
        averageConsultationMinutes,
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      workStartTime: true,
      workEndTime: true,
      averageConsultationMinutes: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Login Hospital Staff
 */

export async function loginUserService({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Get Current Logged-in User
 */

export async function getCurrentUserService(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      workStartTime: true,
      workEndTime: true,
      averageConsultationMinutes: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}