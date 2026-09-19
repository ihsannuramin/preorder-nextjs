import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { formatOrderNumber, isOrderNumberConflict } from "@/lib/utils/order-number";

describe("formatOrderNumber", () => {
  it("formats as PO-<year>-<4-digit sequence>", () => {
    expect(formatOrderNumber(2026, 1)).toBe("PO-2026-0001");
    expect(formatOrderNumber(2026, 42)).toBe("PO-2026-0042");
  });

  it("does not truncate a sequence longer than 4 digits", () => {
    expect(formatOrderNumber(2026, 12345)).toBe("PO-2026-12345");
  });
});

describe("isOrderNumberConflict", () => {
  function makeUniqueConstraintError(target: string[]) {
    return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.22.0",
      meta: { target },
    });
  }

  it("returns true for a P2002 unique-constraint error targeting orderNumber", () => {
    expect(isOrderNumberConflict(makeUniqueConstraintError(["orderNumber"]))).toBe(true);
  });

  it("returns true for a compound unique-constraint error including orderNumber (e.g. [storeId, orderNumber])", () => {
    expect(isOrderNumberConflict(makeUniqueConstraintError(["storeId", "orderNumber"]))).toBe(true);
  });

  it("returns false for a P2002 error on a different field", () => {
    expect(isOrderNumberConflict(makeUniqueConstraintError(["email"]))).toBe(false);
  });

  it("returns false for a non-Prisma error", () => {
    expect(isOrderNumberConflict(new Error("boom"))).toBe(false);
  });

  it("returns false for a Prisma error with a different code", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "5.22.0",
    });
    expect(isOrderNumberConflict(err)).toBe(false);
  });
});
