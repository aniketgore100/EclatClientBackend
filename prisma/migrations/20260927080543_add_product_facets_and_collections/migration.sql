/*
  Warnings:

  - The `pearlColour` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('NECKLACE', 'PENDANT', 'EARRINGS', 'BRACELET', 'RING');

-- CreateEnum
CREATE TYPE "PolishType" AS ENUM ('GOLD', 'ROSE_GOLD', 'SILVER', 'RHODIUM');

-- CreateEnum
CREATE TYPE "StoneType" AS ENUM ('NONE', 'CZ', 'RUBY', 'EMERALD', 'SAPPHIRE');

-- CreateEnum
CREATE TYPE "PearlColour" AS ENUM ('WHITE', 'CREAM', 'PEACH', 'LAVENDER', 'GREY');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "displaySoldCount" INTEGER,
ADD COLUMN     "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "polish" "PolishType",
ADD COLUMN     "stone" "StoneType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "type" "ProductType",
DROP COLUMN "pearlColour",
ADD COLUMN     "pearlColour" "PearlColour";

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "text" TEXT,
    "caption" TEXT,
    "image" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collections" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "product_collections_collectionId_idx" ON "product_collections"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_productId_collectionId_key" ON "product_collections"("productId", "collectionId");

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
