-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_categoryTabId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_pearlColourId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_polishId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_stoneId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_typeId_fkey";

-- DropIndex
DROP INDEX "categories_categoryTabId_idx";

-- DropIndex
DROP INDEX "products_pearlColourId_idx";

-- DropIndex
DROP INDEX "products_polishId_idx";

-- DropIndex
DROP INDEX "products_stoneId_idx";

-- DropIndex
DROP INDEX "products_typeId_idx";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "banner",
DROP COLUMN "caption",
DROP COLUMN "categoryTabId",
DROP COLUMN "eyebrow",
DROP COLUMN "text",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'packshot';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "displaySoldCount",
DROP COLUMN "featured",
DROP COLUMN "harvestBatch",
DROP COLUMN "insured",
DROP COLUMN "isNew",
DROP COLUMN "monthsInWater",
DROP COLUMN "occasions",
DROP COLUMN "pearlColourId",
DROP COLUMN "pearlGrade",
DROP COLUMN "pearlLustre",
DROP COLUMN "pearlSizeMm",
DROP COLUMN "pearlType",
DROP COLUMN "polishId",
DROP COLUMN "pond",
DROP COLUMN "purity",
DROP COLUMN "seoOgImage",
DROP COLUMN "setting",
DROP COLUMN "stoneId",
DROP COLUMN "typeId",
ADD COLUMN     "care" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "category_tabs";

-- DropTable
DROP TABLE "content";

-- DropTable
DROP TABLE "homepage_preview_tokens";

-- DropTable
DROP TABLE "homepage_sections";

-- DropTable
DROP TABLE "pearl_colours";

-- DropTable
DROP TABLE "polishes";

-- DropTable
DROP TABLE "product_types";

-- DropTable
DROP TABLE "stones";

-- DropEnum
DROP TYPE "HomepageSectionType";

