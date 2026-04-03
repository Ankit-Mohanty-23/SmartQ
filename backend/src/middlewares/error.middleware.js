import AppError from "../utils/AppError.js";
import { Prisma } from "@prisma/client";
import multer from "multer";
import logger from "../utils/logger.js";

export default function globalErrorHandler(err, req, res, next) {
  let error = err instanceof Error ? err : new Error(String(err));

  let statusCode = 500;
  let message = "Internal Server Error";

  // Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = Array.isArray(error.meta?.target)
        ? error.meta.target[0]
        : "Field";

      statusCode = 409;
      message = `${field} already exists`;
    } else if (error.code === "P2025") {
      statusCode = 404;
      message = "Resource not found";
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid input data";
  }

  // JWT Errors
  else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer Errors
  else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.message;
  }

  // Email Errors
  else if (error.code === "EAUTH" || error.code === "ECONNECTION") {
    statusCode = 502;
    message = "Email service unavailable";
  }

  // Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // ALWAYS log full error with stack
  // Professional structured error log
  logger.error(
    `[API] Execution failure | Path: ${req.path} | Method: ${req.method} | Error: ${error.message}`,
    {
      statusCode,
      userId: req.user?.id || null,
      stack: error.stack,
    },
  );

  // Client Response (Clean)
  res.status(statusCode).json({
    success: false,
    message,
  });
}
