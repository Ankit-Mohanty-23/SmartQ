/*
  Warnings:

  - Added the required column `visitDate` to the `queues` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "visitDate" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "appointment_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedDoctorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
