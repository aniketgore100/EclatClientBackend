-- CreateTable
CREATE TABLE "site_content" (
    "id" TEXT NOT NULL,
    "draft" JSONB NOT NULL,
    "published" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_revisions" (
    "id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_preview_tokens" (
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_preview_tokens_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "site_revisions_publishedAt_idx" ON "site_revisions"("publishedAt");

