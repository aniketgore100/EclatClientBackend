/*
  Warnings:

  - You are about to drop the column `chainLength` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `clasp` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "chainLength",
DROP COLUMN "clasp";

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_attributes_productId_idx" ON "product_attributes"("productId");

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
