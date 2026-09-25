import { describe, it, expect } from "vitest";
import { paymentMethodSchema, HEX_COLOR } from "@/lib/validations/payment-method";
import { cleanPhone } from "@/lib/utils/whatsapp";

describe("paymentMethodSchema", () => {
  it("accepts a complete bank transfer", () => {
    const r = paymentMethodSchema.safeParse({
      type: "BANK_TRANSFER",
      providerName: "BCA",
      accountNumber: "1234567890",
      accountName: "Rini",
    });
    expect(r.success).toBe(true);
  });

  it("requires account number and holder name for bank / e-wallet", () => {
    const noNumber = paymentMethodSchema.safeParse({ type: "EWALLET", providerName: "GoPay", accountName: "Rini" });
    expect(noNumber.success).toBe(false);
    const noName = paymentMethodSchema.safeParse({ type: "BANK_TRANSFER", providerName: "BCA", accountNumber: "123" });
    expect(noName.success).toBe(false);
  });

  it("requires a QR image for QRIS but not an account number", () => {
    expect(paymentMethodSchema.safeParse({ type: "QRIS", providerName: "QRIS" }).success).toBe(false);
    expect(
      paymentMethodSchema.safeParse({
        type: "QRIS",
        providerName: "QRIS",
        qrisImageUrl: "https://example.com/qris.png",
      }).success,
    ).toBe(true);
  });
});

describe("HEX_COLOR", () => {
  it("only accepts #RRGGBB", () => {
    expect(HEX_COLOR.test("#2563EB")).toBe(true);
    expect(HEX_COLOR.test("#fff")).toBe(false);
    expect(HEX_COLOR.test("red")).toBe(false);
    expect(HEX_COLOR.test("#2563EB; background:url(x)")).toBe(false);
  });
});

describe("order lookup phone matching", () => {
  it("treats 08…, 628… and +62 … as the same number", () => {
    expect(cleanPhone("0812-3456-789")).toBe(cleanPhone("+62 812 3456 789"));
    expect(cleanPhone("08123456789")).toBe(cleanPhone("628123456789"));
  });
});
