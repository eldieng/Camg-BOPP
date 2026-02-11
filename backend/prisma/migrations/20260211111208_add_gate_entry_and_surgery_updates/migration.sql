-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('GLYCEMIE', 'TENSION_ARTERIELLE', 'RADIOLOGIE', 'ECHOGRAPHIE', 'BILAN_SANGUIN', 'NFS', 'GROUPE_SANGUIN', 'BIOCHIMIE', 'AUTRE');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('WAITING_ANALYSIS', 'ANALYSIS_COMPLETE', 'ELIGIBLE', 'NOT_ELIGIBLE', 'SCHEDULED', 'PRE_OP', 'IN_SURGERY', 'POST_OP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SurgeryType" AS ENUM ('CATARACTE', 'GLAUCOME', 'PTERYGION', 'STRABISME', 'DECOLLEMENT_RETINE', 'GREFFE_CORNEE', 'LASER', 'AUTRE');

-- CreateEnum
CREATE TYPE "OperatedEye" AS ENUM ('OD', 'OG', 'LES_DEUX');

-- CreateEnum
CREATE TYPE "GateEntryStatus" AS ENUM ('EXPECTED', 'ARRIVED', 'SENT_TO_ACCUEIL', 'REGISTERED', 'NO_SHOW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Station" ADD VALUE 'MEDICAMENTS';
ALTER TYPE "Station" ADD VALUE 'BLOC_OPERATOIRE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'MEDICAMENTS';
ALTER TYPE "UserRole" ADD VALUE 'BLOC';
ALTER TYPE "UserRole" ADD VALUE 'PORTE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assignedRoom" INTEGER;

-- CreateTable
CREATE TABLE "gate_entries" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "appointmentId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "GateEntryStatus" NOT NULL DEFAULT 'EXPECTED',
    "arrivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "notes" TEXT,
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_analyses" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "type" "AnalysisType" NOT NULL,
    "customType" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PRESCRIBED',
    "prescribedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "results" TEXT,
    "resultValue" DOUBLE PRECISION,
    "normalRange" TEXT,
    "isNormal" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeries" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "surgeonId" TEXT,
    "type" "SurgeryType" NOT NULL,
    "customType" TEXT,
    "operatedEye" "OperatedEye",
    "status" "SurgeryStatus" NOT NULL DEFAULT 'WAITING_ANALYSIS',
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "anesthesiaType" TEXT,
    "diagnosis" TEXT,
    "operativeNotes" TEXT,
    "complications" TEXT,
    "consentSigned" BOOLEAN NOT NULL DEFAULT false,
    "preOpChecklist" JSONB,
    "analysisId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_op_follow_ups" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "visualAcuity" TEXT,
    "intraocularPressure" DOUBLE PRECISION,
    "woundStatus" TEXT,
    "complications" TEXT,
    "treatment" TEXT,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_op_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gate_entries_appointmentId_key" ON "gate_entries"("appointmentId");

-- CreateIndex
CREATE INDEX "gate_entries_date_idx" ON "gate_entries"("date");

-- CreateIndex
CREATE INDEX "gate_entries_status_idx" ON "gate_entries"("status");

-- CreateIndex
CREATE INDEX "gate_entries_patientId_idx" ON "gate_entries"("patientId");

-- CreateIndex
CREATE INDEX "lab_analyses_patientId_idx" ON "lab_analyses"("patientId");

-- CreateIndex
CREATE INDEX "lab_analyses_status_idx" ON "lab_analyses"("status");

-- CreateIndex
CREATE INDEX "lab_analyses_consultationId_idx" ON "lab_analyses"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "surgeries_analysisId_key" ON "surgeries"("analysisId");

-- CreateIndex
CREATE INDEX "surgeries_patientId_idx" ON "surgeries"("patientId");

-- CreateIndex
CREATE INDEX "surgeries_status_idx" ON "surgeries"("status");

-- CreateIndex
CREATE INDEX "surgeries_scheduledDate_idx" ON "surgeries"("scheduledDate");

-- CreateIndex
CREATE INDEX "surgeries_surgeonId_idx" ON "surgeries"("surgeonId");

-- CreateIndex
CREATE INDEX "post_op_follow_ups_surgeryId_idx" ON "post_op_follow_ups"("surgeryId");

-- CreateIndex
CREATE INDEX "post_op_follow_ups_scheduledDate_idx" ON "post_op_follow_ups"("scheduledDate");

-- AddForeignKey
ALTER TABLE "gate_entries" ADD CONSTRAINT "gate_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_entries" ADD CONSTRAINT "gate_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_analyses" ADD CONSTRAINT "lab_analyses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_analyses" ADD CONSTRAINT "lab_analyses_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "lab_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_op_follow_ups" ADD CONSTRAINT "post_op_follow_ups_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "surgeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
