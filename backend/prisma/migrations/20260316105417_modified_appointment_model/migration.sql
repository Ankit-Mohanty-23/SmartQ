/*
  Warnings:

  - Added the required column `patientAge` to the `appointment_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientGender` to the `appointment_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointment_requests" ADD COLUMN     "patientAge" INTEGER NOT NULL,
ADD COLUMN     "patientGender" "Gender" NOT NULL;
