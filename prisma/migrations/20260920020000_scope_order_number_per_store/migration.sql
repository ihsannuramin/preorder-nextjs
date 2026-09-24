-- AlterTable: add storeId (nullable first, so existing rows can be backfilled)
ALTER TABLE "orders" ADD COLUMN "storeId" TEXT;

-- Backfill from the order's campaign
UPDATE "orders" o SET "storeId" = c."storeId" FROM "campaigns" c WHERE o."campaignId" = c."id";

-- Now enforce NOT NULL
ALTER TABLE "orders" ALTER COLUMN "storeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex: orderNumber is no longer globally unique
DROP INDEX "orders_orderNumber_key";

-- CreateIndex: orderNumber is now unique per store instead
CREATE UNIQUE INDEX "orders_storeId_orderNumber_key" ON "orders"("storeId", "orderNumber");

-- CreateIndex
CREATE INDEX "orders_storeId_idx" ON "orders"("storeId");
