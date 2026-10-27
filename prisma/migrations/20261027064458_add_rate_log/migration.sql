-- CreateTable
CREATE TABLE "RateLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "locale" TEXT,
    "destination" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "rates" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "testMode" BOOLEAN NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "error" TEXT,

    CONSTRAINT "RateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLog_shopId_createdAt_idx" ON "RateLog"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "RateLog" ADD CONSTRAINT "RateLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
