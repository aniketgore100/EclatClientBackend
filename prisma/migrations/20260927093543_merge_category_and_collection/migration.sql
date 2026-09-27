/*
  Warnings:

  - You are about to drop the `collections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_collections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_collections" DROP CONSTRAINT "product_collections_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "product_collections" DROP CONSTRAINT "product_collections_productId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "eyebrow" TEXT,
ADD COLUMN     "text" TEXT,
ADD COLUMN     "title" TEXT;

-- DropTable
DROP TABLE "collections";

-- DropTable
DROP TABLE "product_collections";
