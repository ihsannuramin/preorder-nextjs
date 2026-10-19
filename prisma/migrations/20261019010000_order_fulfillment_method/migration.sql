-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- AlterTable: existing orders were all delivered (address was required)
ALTER TABLE "orders" ADD COLUMN "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'DELIVERY';
