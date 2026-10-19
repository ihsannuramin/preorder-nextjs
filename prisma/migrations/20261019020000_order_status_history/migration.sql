-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing orders: creation time, confirmed payment time, and current status.
INSERT INTO "order_status_history" ("id", "orderId", "status", "createdAt")
SELECT 'bf_c_' || "id", "id", 'PENDING_PAYMENT', "createdAt" FROM "orders";

INSERT INTO "order_status_history" ("id", "orderId", "status", "createdAt")
SELECT 'bf_p_' || "id", "id", 'PAID', "verifiedAt" FROM "orders"
WHERE "verifiedAt" IS NOT NULL AND "status" <> 'PAID';

INSERT INTO "order_status_history" ("id", "orderId", "status", "createdAt")
SELECT 'bf_s_' || "id", "id", "status",
       CASE WHEN "status" = 'PAID' THEN COALESCE("verifiedAt", "updatedAt") ELSE "updatedAt" END
FROM "orders"
WHERE "status" <> 'PENDING_PAYMENT';
