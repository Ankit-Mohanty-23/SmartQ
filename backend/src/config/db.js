import prisma from "./prisma.js";
import logger from "../utils/logger.js";

export default async function connectDB() {
  try {
    await prisma.$connect();
    logger.info("[DATABASE] Connection established | Provider: Prisma");
  } catch (error) {
    logger.error(
      `[DATABASE] Connection failure | Provider: Prisma | Error: ${error.message}`,
    );
    process.exit(1);
  }
}
