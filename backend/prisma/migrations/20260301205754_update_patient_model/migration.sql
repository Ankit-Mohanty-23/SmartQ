/*
  Warnings:

  - You are about to drop the column `age` on the `patients` table. All the data in the column will be lost.
  - Added the required column `dateOfBirth` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `patients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "age",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;
