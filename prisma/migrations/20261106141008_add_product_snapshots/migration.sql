-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "productsSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "tags" TEXT[],
    "productType" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT NOT NULL DEFAULT '',
    "collectionIds" BIGINT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSnapshot_shopId_productId_key" ON "ProductSnapshot"("shopId", "productId");

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
