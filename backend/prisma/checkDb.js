import prisma from "../src/config/prisma.js";
import logger from "../src/utils/logger.js";
import { fileURLToPath } from "url";

const EXPECTED_TABLES = [
  "users",
  "doctor_profiles",
  "queues",
  "correction_factors",
  "daily_load_history",
  "appointment_requests",
  "system_settings",
];

export async function checkDatabase() {
  try {
    logger.info("Checking database for expected tables and seeded data...");

    // 1. Check Tables
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    const existingTables = result.map((row) => row.tablename);

    let missingTables = [];
    for (const table of EXPECTED_TABLES) {
      if (!existingTables.includes(table)) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      logger.error(`Missing tables: ${missingTables.join(", ")}`);
      return { success: false, missingTables };
    } else {
      logger.info("All expected tables are present.");
    }

    // 2. Check Seeded Data
    // Check Admin
    if (!process.env.ADMIN_EMAIL) {
      logger.warn("ADMIN_EMAIL is not set in environment variables. Cannot check admin seed.");
    } else {
      const admin = await prisma.user.findUnique({
        where: { email: process.env.ADMIN_EMAIL },
      });
      if (!admin) {
        logger.error(`Admin user with email ${process.env.ADMIN_EMAIL} is missing.`);
        return { success: false, missingData: "Admin" };
      } else {
        logger.info("Admin user is present.");
      }
    }

    // Check System Settings
    const systemSettings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!systemSettings) {
      logger.error("System settings singleton is missing.");
      return { success: false, missingData: "SystemSettings" };
    } else {
      logger.info("System settings singleton is present.");
    }

    logger.info("Database check completed successfully.");
    return { success: true };
  } catch (error) {
    logger.error("Error checking database:", error);
    return { success: false, error };
  }
}

// Allow running as a standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkDatabase()
    .then((res) => {
      if (!res.success) process.exit(1);
      process.exit(0);
    })
    .finally(() => prisma.$disconnect());
}
