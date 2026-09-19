-- CreateEnum
CREATE TYPE "ProductCostMode" AS ENUM ('RECIPE', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductCategory" ADD VALUE 'FASHION';
ALTER TYPE "ProductCategory" ADD VALUE 'CRAFT';
ALTER TYPE "ProductCategory" ADD VALUE 'ACCESSORY';
ALTER TYPE "ProductCategory" ADD VALUE 'ELECTRONIC';
ALTER TYPE "ProductCategory" ADD VALUE 'HOUSEHOLD';
ALTER TYPE "ProductCategory" ADD VALUE 'BEAUTY';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costMode" "ProductCostMode" NOT NULL DEFAULT 'RECIPE',
ADD COLUMN     "manualCostPrice" DECIMAL(12,2);
