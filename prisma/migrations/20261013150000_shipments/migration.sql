-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'AWB_ASSIGNED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'shiprocket',
    "providerOrderId" TEXT,
    "providerShipmentId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "rawStatus" TEXT,
    "courierId" INTEGER,
    "courierName" TEXT,
    "awb" TEXT,
    "labelUrl" TEXT,
    "trackingUrl" TEXT,
    "weightG" INTEGER,
    "dims" JSONB,
    "freightCharge" INTEGER,
    "pickupScheduledAt" TIMESTAMP(3),
    "etd" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "activity" TEXT,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_providerOrderId_key" ON "shipments"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_providerShipmentId_key" ON "shipments"("providerShipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_awb_key" ON "shipments"("awb");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipment_events_shipmentId_occurredAt_idx" ON "shipment_events"("shipmentId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_events_shipmentId_fingerprint_key" ON "shipment_events"("shipmentId", "fingerprint");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

