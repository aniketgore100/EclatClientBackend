-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM ('ANNOUNCEMENT_BAR', 'HEADER', 'HERO', 'TRUST_STRIP', 'CATEGORY_NAV', 'HIGHLIGHTS', 'ECLAT_EDIT', 'BANNER', 'OCCASIONS', 'FEATURED_COLLECTION', 'CURATED_EDITS', 'PEARL_MOOD', 'SHOP_THE_LOOK', 'TESTIMONIALS', 'JOURNAL', 'PEARL_GUIDE', 'MOST_SEARCHED', 'NEWSLETTER', 'FOOTER');

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "type" "HomepageSectionType" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL,
    "settings" JSONB,
    "publishedOrder" INTEGER,
    "publishedEnabled" BOOLEAN,
    "publishedContent" JSONB,
    "publishedSettings" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_key_key" ON "homepage_sections"("key");

-- CreateIndex
CREATE INDEX "homepage_sections_type_idx" ON "homepage_sections"("type");

