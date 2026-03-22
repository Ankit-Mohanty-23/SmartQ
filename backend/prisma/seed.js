import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import logger from "../src/utils/logger.js";

async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL },
  });

  if (existing) {
    logger.log("Admin already exists, skipping seed.");
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

  logger.log(`Admin created: ${admin.email}`);
}

seedAdmin()
  .catch((err) => {
    logger.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
