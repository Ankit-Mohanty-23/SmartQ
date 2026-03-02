/*
  Warnings:

  - You are about to drop the column `status` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_handledById_fkey";

-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "status",
DROP COLUMN "updatedAt",
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "estimatedEndTime" TIMESTAMP(3),
ADD COLUMN     "estimatedStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "averageConsultationMinutes" INTEGER,
ADD COLUMN     "workEndTime" TEXT,
ADD COLUMN     "workStartTime" TEXT;

-- CreateIndex
CREATE INDEX "queues_visitDate_idx" ON "queues"("visitDate");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
