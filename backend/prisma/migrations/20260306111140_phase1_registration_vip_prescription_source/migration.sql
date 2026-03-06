-- Phase 1: Numéro d'immatriculation unique, Système VIP, Source ordonnances

-- CreateEnum
CREATE TYPE "PrescriptionSource" AS ENUM ('INTERNAL', 'EXTERNAL');

-- AlterTable patients: add VIP fields
ALTER TABLE "patients" ADD COLUMN "isVIP" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "vipReason" TEXT;

-- AlterTable patients: add registrationNumber (nullable first)
ALTER TABLE "patients" ADD COLUMN "registrationNumber" TEXT;

-- Generate registration numbers for existing patients
UPDATE "patients" 
SET "registrationNumber" = 'CAMG-' || EXTRACT(YEAR FROM "createdAt")::TEXT || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::TEXT, 5, '0')
WHERE "registrationNumber" IS NULL;

-- Now make it NOT NULL and add constraints
ALTER TABLE "patients" ALTER COLUMN "registrationNumber" SET NOT NULL;

-- AlterTable prescriptions: add source fields
ALTER TABLE "prescriptions" ADD COLUMN "externalClinic" TEXT,
ADD COLUMN "externalDoctor" TEXT,
ADD COLUMN "source" "PrescriptionSource" NOT NULL DEFAULT 'INTERNAL';

-- CreateIndex
CREATE UNIQUE INDEX "patients_registrationNumber_key" ON "patients"("registrationNumber");

-- CreateIndex
CREATE INDEX "patients_registrationNumber_idx" ON "patients"("registrationNumber");
