-- CreateTable
CREATE TABLE "homepage_preview_tokens" (
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_preview_tokens_pkey" PRIMARY KEY ("token")
);

