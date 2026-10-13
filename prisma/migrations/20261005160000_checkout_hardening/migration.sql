-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL', 'RESERVE', 'RELEASE', 'SALE', 'RESTOCK', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "InventoryMovementType" NOT NULL,
    "onHandDelta" INTEGER NOT NULL DEFAULT 0,
    "reservedDelta" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_movements_variantId_createdAt_idx" ON "inventory_movements"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_movements_orderId_idx" ON "inventory_movements"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_customerId_idempotencyKey_key" ON "orders"("customerId", "idempotencyKey");

