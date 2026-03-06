-- CreateEnum
CREATE TYPE "GlassesOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "glasses_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "odSphere" DOUBLE PRECISION,
    "odCylinder" DOUBLE PRECISION,
    "odAxis" INTEGER,
    "odAddition" DOUBLE PRECISION,
    "ogSphere" DOUBLE PRECISION,
    "ogCylinder" DOUBLE PRECISION,
    "ogAxis" INTEGER,
    "ogAddition" DOUBLE PRECISION,
    "lensType" TEXT,
    "coating" TEXT,
    "frameType" TEXT,
    "frameReference" TEXT,
    "pupillaryDistance" DOUBLE PRECISION,
    "status" "GlassesOrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedDate" TIMESTAMP(3),
    "readyDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "notes" TEXT,
    "workshopNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "preparedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glasses_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "glasses_orders_orderNumber_key" ON "glasses_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "glasses_orders_patientId_idx" ON "glasses_orders"("patientId");

-- CreateIndex
CREATE INDEX "glasses_orders_consultationId_idx" ON "glasses_orders"("consultationId");

-- CreateIndex
CREATE INDEX "glasses_orders_status_idx" ON "glasses_orders"("status");

-- CreateIndex
CREATE INDEX "glasses_orders_orderDate_idx" ON "glasses_orders"("orderDate");

-- AddForeignKey
ALTER TABLE "glasses_orders" ADD CONSTRAINT "glasses_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glasses_orders" ADD CONSTRAINT "glasses_orders_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
