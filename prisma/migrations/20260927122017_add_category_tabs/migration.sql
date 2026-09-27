-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "categoryTabId" TEXT;

-- CreateTable
CREATE TABLE "category_tabs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_tabs_slug_key" ON "category_tabs"("slug");

-- CreateIndex
CREATE INDEX "categories_categoryTabId_idx" ON "categories"("categoryTabId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_categoryTabId_fkey" FOREIGN KEY ("categoryTabId") REFERENCES "category_tabs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

