import { describe, it, expect } from "vitest";
import { orderSchema } from "@/lib/validations/order";

const base = {
  customerName: "Rini",
  customerPhone: "08123456789",
  items: [{ productId: "p1", quantity: 2 }],
};

describe("orderSchema fulfillment", () => {
  it("defaults to DELIVERY and requires an address", () => {
    const result = orderSchema.safeParse({ ...base, customerAddress: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["customerAddress"]);
  });

  it("accepts delivery with an address", () => {
    const result = orderSchema.safeParse({ ...base, customerAddress: "Jl. Mawar No. 1" });
    expect(result.success && result.data.fulfillmentMethod).toBe("DELIVERY");
  });

  it("allows pickup without an address", () => {
    expect(orderSchema.safeParse({ ...base, fulfillmentMethod: "PICKUP" }).success).toBe(true);
  });

  it("rejects unknown fulfillment methods and zero quantities", () => {
    expect(orderSchema.safeParse({ ...base, fulfillmentMethod: "DRONE" }).success).toBe(false);
    expect(
      orderSchema.safeParse({ ...base, customerAddress: "Jl. Mawar", items: [{ productId: "p1", quantity: 0 }] }).success,
    ).toBe(false);
  });
});
