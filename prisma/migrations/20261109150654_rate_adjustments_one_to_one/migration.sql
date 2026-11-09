/*
  Warnings:

  - You are about to drop the column `kind` on the `RateAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `RateAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `RateAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `RateAdjustment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rateId]` on the table `RateAdjustment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RateAdjustment_rateId_idx";

-- AlterTable
ALTER TABLE "RateAdjustment" DROP COLUMN "kind",
DROP COLUMN "sortOrder",
DROP COLUMN "type",
DROP COLUMN "value",
ADD COLUMN     "freeOver" INTEGER,
ADD COLUMN     "handlingFee" INTEGER,
ADD COLUMN     "handlingFeeType" "AdjustmentType",
ADD COLUMN     "maxPrice" INTEGER,
ADD COLUMN     "minPrice" INTEGER,
ADD COLUMN     "roundTo" INTEGER;

-- DropEnum
DROP TYPE "AdjustmentKind";

-- CreateIndex
CREATE UNIQUE INDEX "RateAdjustment_rateId_key" ON "RateAdjustment"("rateId");
