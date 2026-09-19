import { describe, it, expect, vi } from "vitest";
import { applyPurchase } from "@/lib/utils/stock";
import type { Prisma } from "@prisma/client";

function createMockTx() {
  return {
    ingredient: { update: vi.fn() },
    stockMovement: { create: vi.fn() },
  } as unknown as Prisma.TransactionClient;
}

describe("applyPurchase", () => {
  it("computes a weighted-average cost across the existing and new stock", async () => {
    const tx = createMockTx();
    // existing: 10 units @ Rp1000 avg cost. Buying 10 more units for Rp30,000 total.
    const result = await applyPurchase(tx, "ing-1", 10, 1000, 10, 30000, "Owner");

    // new stock = 20, new average cost = (10*1000 + 30000) / 20 = 2000
    expect(result.newStock).toBe(20);
    expect(result.newAverageCost).toBe(2000);
  });

  it("handles a first-ever purchase (currentStock and averageCost both 0)", async () => {
    const tx = createMockTx();
    const result = await applyPurchase(tx, "ing-1", 0, 0, 5, 25000, "Owner");

    expect(result.newStock).toBe(5);
    expect(result.newAverageCost).toBe(5000);
  });

  it("writes the recalculated stock/cost to the ingredient row", async () => {
    const tx = createMockTx();
    await applyPurchase(tx, "ing-1", 10, 1000, 10, 30000, "Owner");

    expect(tx.ingredient.update).toHaveBeenCalledWith({
      where: { id: "ing-1" },
      data: {
        currentStock: 20,
        averageCost: 2000,
        purchaseQty: 10,
        purchasePrice: 30000,
      },
    });
  });

  it("records a PURCHASE stock movement with the resulting stock and unit cost", async () => {
    const tx = createMockTx();
    await applyPurchase(tx, "ing-1", 10, 1000, 10, 30000, "Owner", "Invoice #123");

    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        ingredientId: "ing-1",
        type: "PURCHASE",
        quantityChange: 10,
        resultingStock: 20,
        unitCost: 3000, // 30000 total / 10 units
        note: "Invoice #123",
        performedBy: "Owner",
      },
    });
  });

  it("guards against a zero resulting stock (would otherwise divide by zero)", async () => {
    const tx = createMockTx();
    // negative quantity purchase shouldn't happen in practice, but the function
    // itself must not divide by zero when newStock resolves to 0.
    const result = await applyPurchase(tx, "ing-1", 5, 1000, -5, 0, "Owner");
    expect(result.newStock).toBe(0);
    expect(result.newAverageCost).toBe(0);
  });
});
