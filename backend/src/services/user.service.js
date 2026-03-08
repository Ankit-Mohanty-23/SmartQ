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
  specialization,
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

  const result = await prisma.$transaction(async (tx) => {

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        role,
      },
    });

    let doctorProfile = null;

    if (role === "DOCTOR") {

      if (!specialization || !workStartTime || !workEndTime) {
        throw new AppError("Doctor profile fields missing", 400);
      }

      doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialization,
          workStartTime,
          workEndTime,
          averageConsultationMinutes: averageConsultationMinutes || 15,
        },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctorProfile,
      createdAt: user.createdAt,
    };
  });

  return result;
}

/**
 * Login Hospital Staff
 */

export async function loginUserService({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctorProfile: true },
  });

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { 
      id: user.id,
      role: user.role,
      doctorProfileId: user.doctorProfile?.id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

  return {
    token,
    user: {
      name: user.name,
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
      isActive: true,
      createdAt: true,

      doctorProfile: {
        select: {
          specialization: true,
          workStartTime: true,
          workEndTime: true,
          averageConsultationMinutes: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("User not found", 404);
  }

  return user;
}

/**
 * User logout
 */

export async function userLogoutService(){
  return {
    success: true,
    message: "Logged out Successfully"
  };
}

/**
 * Get All Users Service
 */

export async function getAllUsersService({ role, isActive}){
  const users = await prisma.user.findMany({
    where: { 
      role: role || undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
    select: { 
      id: true,
      name: true,
      role: true,
      doctorProfile: {
        select: { specialization: true }
      }
    }
  });

  return users;
}

/**
 * Update User Service
 */

export async function updateUserService(userId, data){
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { doctorProfileId: true }
  });

  if(!user || user.isActive){
    throw new AppError("User not found", 404);
  }

  const { 
    name, 
    email, 
    specialization, 
    workStartTime, 
    workEndTime, 
    averageConsultationMinutes
   } = data;

   if(email && email !== user.email){
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });

    if(emailExists){
      throw new AppError("Email already in use" ,409);
    }
   }

   const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data :{
        name: name ?? user.name,
        email: email ?? user.email
      }
    });

    let doctorProfile = null;

    if(user.role === "DOCTOR"){
      doctorProfile = await tx.doctorProfile.update({
        where: { userId: userId },
        data: {
          specialization: specialization ?? user.doctorProfile?.specialization,
          workStartTime: workStartTime ?? user.doctorProfile?.workStartTime,
          workEndTime: workEndTime ?? user.doctorProfile?.workEndTime,
          averageConsultationMinutes:
            averageConsultationMinutes ??
            user.doctorProfile?.averageConsultationMinutes
        }
      });
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      doctorProfile
    };
   });

   return result;
}

/**
 * Deactivate User Service
 */

export async function deactivateUserService(userId){
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { doctorProfile: true }
  })

  if(!existingUser){
    throw new AppError("User not found", 404);
  }

  if(!existingUser.isActive){
    throw new AppError("User Account is already deactivated", 400);
  }

  if(user.role === "DOCTOR" && user.doctorProfile){
    const futureTokens = await prisma.queue.findFirst({
      where: {
        doctorProfileId: user.doctorProfile.id,
        appointmentDate: {
          gte: new Date()
        },
        status: {
          in: ["WAITING", "IN_PROGRESS"]
        }
      }
    });

    if(futureTokens){
      throw new AppError("Doctor has upcoming appointments. Cannot deactivate", 409);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  return updatedUser;
}