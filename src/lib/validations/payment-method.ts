import { z } from "zod";

export const paymentMethodSchema = z
  .object({
    type: z.enum(["BANK_TRANSFER", "EWALLET", "QRIS"]),
    providerName: z.string().trim().min(2, "Nama bank / e-wallet minimal 2 karakter").max(40),
    accountNumber: z.string().trim().max(40).optional(),
    accountName: z.string().trim().max(80).optional(),
    qrisImageUrl: z.string().url("Gambar QRIS tidak valid").optional(),
  })
  .refine((d) => d.type === "QRIS" || Boolean(d.accountNumber), {
    message: "Nomor rekening / nomor e-wallet wajib diisi",
    path: ["accountNumber"],
  })
  .refine((d) => d.type === "QRIS" || Boolean(d.accountName), {
    message: "Nama pemilik rekening wajib diisi",
    path: ["accountName"],
  })
  .refine((d) => d.type !== "QRIS" || Boolean(d.qrisImageUrl), {
    message: "Unggah gambar QRIS dulu",
    path: ["qrisImageUrl"],
  });

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
