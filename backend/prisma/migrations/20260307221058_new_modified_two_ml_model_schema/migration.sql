/*
  Warnings:

  - You are about to drop the column `doctorId` on the `queues` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `queues` table. All the data in the column will be lost.
  - You are about to drop the column `visitDate` on the `queues` table. All the data in the column will be lost.
  - You are about to drop the column `averageConsultationMinutes` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `workEndTime` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `workStartTime` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[queueId]` on the table `appointment_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doctorProfileId,appointmentDate,tokenNumber]` on the table `queues` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `appointment_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ageGroup` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointmentDate` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorProfileId` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientAge` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientGender` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientName` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientPhone` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predictedDurationMinutes` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlot` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitType` to the `queues` table without a default value. This is not possible if the table is not empty.
  - Made the column `estimatedEndTime` on table `queues` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estimatedStartTime` on table `queues` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('CHILD', 'ADULT', 'SENIOR');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('NEW', 'FOLLOW_UP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('SUNNY', 'CLOUDY', 'RAINING', 'HEAVY_RAIN', 'CYCLONE_WARNING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FallbackType" AS ENUM ('MODEL', 'CORRECTION_ENGINE', 'DOCTOR_AVERAGE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_handledById_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_patientId_fkey";

-- DropForeignKey
ALTER TABLE "queues" DROP CONSTRAINT "queues_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "queues" DROP CONSTRAINT "queues_patientId_fkey";

-- DropIndex
DROP INDEX "queues_createdAt_idx";

-- DropIndex
DROP INDEX "queues_doctorId_idx";

-- DropIndex
DROP INDEX "queues_patientId_idx";

-- DropIndex
DROP INDEX "queues_status_idx";

-- DropIndex
DROP INDEX "queues_visitDate_idx";

-- AlterTable
ALTER TABLE "appointment_requests" ADD COLUMN     "confirmedDate" DATE,
ADD COLUMN     "confirmedTokenNumber" INTEGER,
ADD COLUMN     "convertedById" TEXT,
ADD COLUMN     "queueId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visitType" "VisitType" NOT NULL DEFAULT 'NEW',
ALTER COLUMN "preferredDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "queues" DROP COLUMN "doctorId",
DROP COLUMN "patientId",
DROP COLUMN "visitDate",
ADD COLUMN     "actualDurationMinutes" DOUBLE PRECISION,
ADD COLUMN     "actualEndTime" TIMESTAMP(3),
ADD COLUMN     "actualStartTime" TIMESTAMP(3),
ADD COLUMN     "ageGroup" "AgeGroup" NOT NULL,
ADD COLUMN     "appointmentDate" DATE NOT NULL,
ADD COLUMN     "doctorProfileId" TEXT NOT NULL,
ADD COLUMN     "fallbackUsed" "FallbackType" NOT NULL DEFAULT 'DOCTOR_AVERAGE',
ADD COLUMN     "isDrifting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOutlierExcluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mlConfidenceScore" DOUBLE PRECISION,
ADD COLUMN     "patientAge" INTEGER NOT NULL,
ADD COLUMN     "patientGender" "Gender" NOT NULL,
ADD COLUMN     "patientName" TEXT NOT NULL,
ADD COLUMN     "patientPhone" TEXT NOT NULL,
ADD COLUMN     "predictedDurationMinutes" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "timeSlot" "TimeSlot" NOT NULL,
ADD COLUMN     "visitType" "VisitType" NOT NULL,
ADD COLUMN     "weatherCondition" "WeatherCondition" NOT NULL DEFAULT 'UNKNOWN',
ALTER COLUMN "estimatedEndTime" SET NOT NULL,
ALTER COLUMN "estimatedStartTime" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "averageConsultationMinutes",
DROP COLUMN "workEndTime",
DROP COLUMN "workStartTime",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "patients";

-- DropTable
DROP TABLE "payments";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "workStartTime" TEXT NOT NULL,
    "workEndTime" TEXT NOT NULL,
    "averageConsultationMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_factors" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "visitType" "VisitType" NOT NULL,
    "correctionFactor" DOUBLE PRECISION NOT NULL,
    "correctedBaseline" DOUBLE PRECISION NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_load_history" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "recordDate" DATE NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "dateOfMonth" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "weekOfMonth" INTEGER NOT NULL,
    "isPostHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isExamSeason" BOOLEAN NOT NULL DEFAULT false,
    "weatherCondition" "WeatherCondition" NOT NULL DEFAULT 'UNKNOWN',
    "isPostRainDay" BOOLEAN NOT NULL DEFAULT false,
    "totalPatientsActual" INTEGER,
    "predictedPatients" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_load_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE INDEX "correction_factors_doctorProfileId_dayOfWeek_timeSlot_idx" ON "correction_factors"("doctorProfileId", "dayOfWeek", "timeSlot");

-- CreateIndex
CREATE INDEX "correction_factors_doctorProfileId_dayOfWeek_idx" ON "correction_factors"("doctorProfileId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "correction_factors_doctorProfileId_idx" ON "correction_factors"("doctorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "correction_factors_doctorProfileId_dayOfWeek_timeSlot_visit_key" ON "correction_factors"("doctorProfileId", "dayOfWeek", "timeSlot", "visitType");

-- CreateIndex
CREATE INDEX "daily_load_history_doctorProfileId_recordDate_idx" ON "daily_load_history"("doctorProfileId", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_load_history_doctorProfileId_recordDate_key" ON "daily_load_history"("doctorProfileId", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_requests_queueId_key" ON "appointment_requests"("queueId");

-- CreateIndex
CREATE INDEX "appointment_requests_status_preferredDate_idx" ON "appointment_requests"("status", "preferredDate");

-- CreateIndex
CREATE INDEX "appointment_requests_phone_idx" ON "appointment_requests"("phone");

-- CreateIndex
CREATE INDEX "queues_doctorProfileId_appointmentDate_status_idx" ON "queues"("doctorProfileId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "queues_status_estimatedEndTime_idx" ON "queues"("status", "estimatedEndTime");

-- CreateIndex
CREATE INDEX "queues_patientPhone_doctorProfileId_appointmentDate_idx" ON "queues"("patientPhone", "doctorProfileId", "appointmentDate");

-- CreateIndex
CREATE INDEX "queues_isOutlierExcluded_actualDurationMinutes_idx" ON "queues"("isOutlierExcluded", "actualDurationMinutes");

-- CreateIndex
CREATE UNIQUE INDEX "queues_doctorProfileId_appointmentDate_tokenNumber_key" ON "queues"("doctorProfileId", "appointmentDate", "tokenNumber");

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_factors" ADD CONSTRAINT "correction_factors_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_load_history" ADD CONSTRAINT "daily_load_history_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_convertedById_fkey" FOREIGN KEY ("convertedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
