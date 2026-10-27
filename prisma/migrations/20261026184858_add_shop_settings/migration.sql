-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "currency" TEXT;

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fallbackPrice" INTEGER NOT NULL DEFAULT 0,
    "fallbackName" JSONB NOT NULL DEFAULT '{"en":"Standard Shipping"}',
    "fallbackDescription" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopId_key" ON "ShopSettings"("shopId");

-- AddForeignKey
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
