-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'LOST');

-- CreateEnum
CREATE TYPE "ReferralReason" AS ENUM ('SERVICE_UNAVAILABLE', 'EQUIPMENT_MISSING', 'SPECIALIST_NEEDED', 'EMERGENCY', 'PATIENT_CHOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "referredBy" TEXT NOT NULL,
    "reason" "ReferralReason" NOT NULL,
    "customReason" TEXT,
    "serviceNeeded" TEXT NOT NULL,
    "externalClinic" TEXT NOT NULL,
    "externalDoctor" TEXT,
    "externalPhone" TEXT,
    "externalAddress" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appointmentDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "diagnosis" TEXT,
    "treatmentNotes" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT true,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "station" "Station" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "neededByDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "notes" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_op_materials" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isPrepared" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_op_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referrals_patientId_idx" ON "referrals"("patientId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "referrals_reason_idx" ON "referrals"("reason");

-- CreateIndex
CREATE INDEX "referrals_serviceNeeded_idx" ON "referrals"("serviceNeeded");

-- CreateIndex
CREATE INDEX "referrals_referralDate_idx" ON "referrals"("referralDate");

-- CreateIndex
CREATE UNIQUE INDEX "internal_orders_orderNumber_key" ON "internal_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "internal_orders_station_idx" ON "internal_orders"("station");

-- CreateIndex
CREATE INDEX "internal_orders_status_idx" ON "internal_orders"("status");

-- CreateIndex
CREATE INDEX "internal_orders_requestDate_idx" ON "internal_orders"("requestDate");

-- CreateIndex
CREATE INDEX "pre_op_materials_surgeryId_idx" ON "pre_op_materials"("surgeryId");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "internal_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_op_materials" ADD CONSTRAINT "pre_op_materials_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "surgeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
