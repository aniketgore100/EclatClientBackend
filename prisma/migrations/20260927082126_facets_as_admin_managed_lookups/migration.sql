-- AlterTable
ALTER TABLE "products" DROP COLUMN "pearlColour",
DROP COLUMN "polish",
DROP COLUMN "stone",
DROP COLUMN "type",
ADD COLUMN     "pearlColourId" TEXT,
ADD COLUMN     "polishId" TEXT,
ADD COLUMN     "stoneId" TEXT,
ADD COLUMN     "typeId" TEXT;

-- DropEnum
DROP TYPE "PearlColour";

-- DropEnum
DROP TYPE "PolishType";

-- DropEnum
DROP TYPE "ProductType";

-- DropEnum
DROP TYPE "StoneType";

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polishes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pearl_colours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pearl_colours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_types_slug_key" ON "product_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "polishes_slug_key" ON "polishes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stones_slug_key" ON "stones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pearl_colours_slug_key" ON "pearl_colours"("slug");

-- CreateIndex
CREATE INDEX "products_typeId_idx" ON "products"("typeId");

-- CreateIndex
CREATE INDEX "products_polishId_idx" ON "products"("polishId");

-- CreateIndex
CREATE INDEX "products_stoneId_idx" ON "products"("stoneId");

-- CreateIndex
CREATE INDEX "products_pearlColourId_idx" ON "products"("pearlColourId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_pearlColourId_fkey" FOREIGN KEY ("pearlColourId") REFERENCES "pearl_colours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_polishId_fkey" FOREIGN KEY ("polishId") REFERENCES "polishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "stones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

