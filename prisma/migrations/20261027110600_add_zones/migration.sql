/*
  Warnings:

  - You are about to drop the column `zoneName` on the `Rate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rate" DROP COLUMN "zoneName";

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "restOfWorld" BOOLEAN NOT NULL DEFAULT false,
    "regions" JSONB NOT NULL DEFAULT '[]',
    "shopifyZoneId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Zone_shopId_idx" ON "Zone"("shopId");

-- CreateIndex
CREATE INDEX "Rate_zoneId_idx" ON "Rate"("zoneId");

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
