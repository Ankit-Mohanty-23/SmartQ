-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('CHILD', 'ADULT', 'SENIOR');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('NEW', 'FOLLOW_UP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('SUNNY_NORMAL', 'SUNNY_HOT', 'SUNNY_EXTREME_HEAT', 'CLOUDY_NORMAL', 'CLOUDY_HOT', 'RAINING_NORMAL', 'HUMIDITY', 'HEAVY_RAIN_NORMAL', 'CYCLONE_WARNING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FallbackType" AS ENUM ('MODEL', 'CORRECTION_ENGINE', 'DOCTOR_AVERAGE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "workStartTime" TEXT NOT NULL,
    "workEndTime" TEXT NOT NULL,
    "averageConsultationMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queues" (
    "id" TEXT NOT NULL,
    "tokenNumber" INTEGER NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "doctorProfileId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "patientGender" "Gender" NOT NULL,
    "visitType" "VisitType" NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "predictedDurationMinutes" DOUBLE PRECISION NOT NULL,
    "mlConfidenceScore" DOUBLE PRECISION,
    "fallbackUsed" "FallbackType" NOT NULL DEFAULT 'DOCTOR_AVERAGE',
    "estimatedStartTime" TIMESTAMP(3) NOT NULL,
    "estimatedEndTime" TIMESTAMP(3) NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "actualDurationMinutes" DOUBLE PRECISION,
    "isDrifting" BOOLEAN NOT NULL DEFAULT false,
    "isOutlierExcluded" BOOLEAN NOT NULL DEFAULT false,
    "earlyWarningSent" BOOLEAN NOT NULL DEFAULT false,
    "lastNotifiedEstimatedTime" TIMESTAMP(3),
    "weatherCondition" "WeatherCondition" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "appointment_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "patientGender" "Gender" NOT NULL,
    "visitType" "VisitType" NOT NULL DEFAULT 'NEW',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "preferredDate" DATE NOT NULL,
    "assignedDoctorId" TEXT,
    "convertedById" TEXT,
    "queueId" TEXT,
    "confirmedTokenNumber" INTEGER,
    "confirmedDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "driftThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "outlierMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "earlyWarningMinutes" INTEGER NOT NULL DEFAULT 15,
    "driftCorrectionThreshold" INTEGER NOT NULL DEFAULT 10,
    "earlyWarningSmsTemplate" TEXT NOT NULL DEFAULT 'Hi {patientName}, your token #{tokenNumber} with {doctorName} is coming up. Estimated time: {estimatedTime}.',
    "driftSmsTemplate" TEXT NOT NULL DEFAULT 'Hi {patientName}, your token #{tokenNumber} with {doctorName} has been delayed. New estimated time: {estimatedTime}.',
    "mlTimeout" INTEGER NOT NULL DEFAULT 500,
    "holidays" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

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

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_factors" ADD CONSTRAINT "correction_factors_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_load_history" ADD CONSTRAINT "daily_load_history_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_convertedById_fkey" FOREIGN KEY ("convertedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
