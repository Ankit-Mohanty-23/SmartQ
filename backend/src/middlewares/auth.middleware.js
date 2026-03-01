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
      role: true
    }
  });
};

export default async function auth(req, res, next) {
  try {
    let token;

    // 1. Get token
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      throw new AppError(
        "Authentication required. Please login.",
        401
      );
    }

    // 2. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 3. Check user exists
    const currentUser = await findUserByIdService(decoded.id);

    if (!currentUser) {
      throw new AppError(
        "User belonging to this token no longer exists",
        401
      );
    }

    // 4. Attach user
    req.user = currentUser;

    next();

  } catch (error) {

    logger.error("Auth middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Session expired. Please login again.",
          401
        )
      );
    }

    if (error.name === "JsonWebTokenError") {
      return next(
        new AppError(
          "Invalid token. Please login again.",
          401
        )
      );
    }

    next(error);
  }
}