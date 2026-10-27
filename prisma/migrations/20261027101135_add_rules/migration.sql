-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RuleMatch" AS ENUM ('ALL', 'ANY', 'NONE');

-- CreateEnum
CREATE TYPE "ConditionSubject" AS ENUM ('CART', 'PRODUCT', 'ADDRESS');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN', 'IN_POSTCODE_LIST', 'NOT_IN_POSTCODE_LIST');

-- CreateEnum
CREATE TYPE "ProductQuantifier" AS ENUM ('ANY', 'ALL', 'NONE');

-- CreateEnum
CREATE TYPE "RateMode" AS ENUM ('FLAT', 'BANDS', 'INCREMENTAL', 'PERCENT');

-- CreateEnum
CREATE TYPE "RateBasis" AS ENUM ('WEIGHT', 'QUANTITY', 'SUBTOTAL');

-- CreateEnum
CREATE TYPE "AdjustmentKind" AS ENUM ('HANDLING_FEE', 'MIN_PRICE', 'MAX_PRICE', 'ROUND_TO', 'FREE_OVER');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "CombineStrategy" AS ENUM ('SUM', 'HIGHEST', 'LOWEST');

-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "combineStrategy" "CombineStrategy" NOT NULL DEFAULT 'SUM';

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "match" "RuleMatch" NOT NULL DEFAULT 'ALL',
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "templateKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "subject" "ConditionSubject" NOT NULL,
    "field" TEXT NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "value" JSONB,
    "quantifier" "ProductQuantifier",
    "postcodeListId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "preset" TEXT,
    "name" TEXT,
    "description" TEXT,
    "minDeliveryDays" INTEGER,
    "maxDeliveryDays" INTEGER,
    "mode" "RateMode" NOT NULL DEFAULT 'FLAT',
    "basis" "RateBasis",
    "price" INTEGER,
    "stepSize" INTEGER,
    "stepPrice" INTEGER,
    "percentBps" INTEGER,
    "combineTag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateBand" (
    "id" TEXT NOT NULL,
    "rateId" TEXT NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER,
    "price" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateAdjustment" (
    "id" TEXT NOT NULL,
    "rateId" TEXT NOT NULL,
    "kind" "AdjustmentKind" NOT NULL,
    "type" "AdjustmentType" NOT NULL DEFAULT 'FIXED',
    "value" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostcodeList" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostcodeList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_shopId_status_priority_idx" ON "Rule"("shopId", "status", "priority");

-- CreateIndex
CREATE INDEX "Condition_ruleId_idx" ON "Condition"("ruleId");

-- CreateIndex
CREATE INDEX "Rate_ruleId_idx" ON "Rate"("ruleId");

-- CreateIndex
CREATE INDEX "RateBand_rateId_idx" ON "RateBand"("rateId");

-- CreateIndex
CREATE INDEX "RateAdjustment_rateId_idx" ON "RateAdjustment"("rateId");

-- CreateIndex
CREATE INDEX "PostcodeList_shopId_idx" ON "PostcodeList"("shopId");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_postcodeListId_fkey" FOREIGN KEY ("postcodeListId") REFERENCES "PostcodeList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateBand" ADD CONSTRAINT "RateBand_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateAdjustment" ADD CONSTRAINT "RateAdjustment_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostcodeList" ADD CONSTRAINT "PostcodeList_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
