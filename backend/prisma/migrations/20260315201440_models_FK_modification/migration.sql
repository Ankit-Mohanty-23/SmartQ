-- DropForeignKey
ALTER TABLE "appointment_requests" DROP CONSTRAINT "appointment_requests_assignedDoctorId_fkey";

-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
