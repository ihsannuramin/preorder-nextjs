-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_TRANSFER', 'EWALLET', 'QRIS');

-- AlterTable: optional store accent colour (nullable, no backfill needed)
ALTER TABLE "stores" ADD COLUMN "brandColor" TEXT;

-- CreateTable
CREATE TABLE "store_payment_methods" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "providerName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "qrisImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_payment_methods_storeId_idx" ON "store_payment_methods"("storeId");

-- AddForeignKey
ALTER TABLE "store_payment_methods" ADD CONSTRAINT "store_payment_methods_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
