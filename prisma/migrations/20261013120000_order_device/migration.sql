-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

