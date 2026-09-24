-- Remove the Variant feature: OrderItem/GroupMemberOrderItem now reference Product directly.

-- AddColumn: productId (nullable, backfilled below before old columns are dropped)
ALTER TABLE "order_items" ADD COLUMN "productId" TEXT;
ALTER TABLE "group_member_order_items" ADD COLUMN "productId" TEXT;

-- Backfill productId from the variant's product before dropping variant columns
UPDATE "order_items" oi
SET "productId" = pv."productId"
FROM "product_variants" pv
WHERE oi."variantId" = pv."id";

UPDATE "group_member_order_items" gmoi
SET "productId" = pv."productId"
FROM "product_variants" pv
WHERE gmoi."variantId" = pv."id";

-- DropForeignKey (old variant relations)
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_variantId_fkey";
ALTER TABLE "group_member_order_items" DROP CONSTRAINT IF EXISTS "group_member_order_items_variantId_fkey";
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_productId_fkey";

-- DropColumn (variant-specific fields)
ALTER TABLE "order_items" DROP COLUMN "variantId";
ALTER TABLE "order_items" DROP COLUMN "variantName";
ALTER TABLE "group_member_order_items" DROP COLUMN "variantId";
ALTER TABLE "group_member_order_items" DROP COLUMN "variantName";

-- DropTable
DROP TABLE "product_variants";

-- AddForeignKey (new direct product relations)
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "group_member_order_items" ADD CONSTRAINT "group_member_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
