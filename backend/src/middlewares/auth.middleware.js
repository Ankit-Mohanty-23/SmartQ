import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import prisma from "../config/prisma.js";

export const findUserByIdService = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

export async function auth(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }
    if (!token) {
      throw new AppError("Authentication required. Please login.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await findUserByIdService(decoded.id);

    if (!currentUser) {
      throw new AppError("User belonging to this token no longer exists", 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    logger.error(
      `[AUTH] Middleware failure | Reason: ${error.message} | Path: ${req.path}`,
    );

    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please login again.", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please login again.", 401));
    }
    next(error);
  }
}

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
