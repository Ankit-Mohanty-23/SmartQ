import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";
import logger from "../src/utils/logger.js";
import { checkDatabase } from "./checkDb.js";

/**
 * Default Admin Sedding
 */
async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) {
    logger.error("======================================================");
    logger.error("🚨 URGENT: DATABASE SEEDING BLOCKED! 🚨");
    logger.error("The developer forgot to provide the admin credentials in the environment variables.");
    logger.error("Missing variables: ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME");
    logger.error("Please add them to your deployment dashboard (e.g., Railway) to proceed.");
    logger.error("======================================================");
    throw new Error("Missing Admin credentials in environment variables.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL },
  });

  if (existing) {
    logger.info("Admin already exists, skipping seed.");
    return;
  }

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: hashed,
      role: "ADMIN",
    },
  });

  logger.info(`Admin created: ${admin.email}`);
}

async function main() {
  await seedAdmin();
  await seedSystemSetting();

  logger.info("Running database checks post-seeding...");
  const checkResult = await checkDatabase();
  if (!checkResult.success) {
    throw new Error("Database check failed after seeding.");
  }
}

/**
 * System Setting Seeding
 */

async function seedSystemSetting() {
  const existing = await prisma.systemSettings.findUnique({
    where: { id: "singleton" },
  });

  if (existing) {
    logger.info("System setting already exists, skipping seed.");
    return;
  }

  await prisma.systemSettings.create({
    data: { id: "singleton" },
  });

  logger.info("System settings seeded successfully.");
}

/**
 * Seeding function 
 */

main()
  .catch((err) => {
    logger.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
