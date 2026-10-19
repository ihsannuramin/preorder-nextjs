import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Pilih produk"),
  quantity: z.coerce.number().int().positive("Jumlah minimal 1").max(999, "Jumlah maksimal 999"),
});

export const fulfillmentMethodSchema = z.enum(["DELIVERY", "PICKUP"]);

export const orderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama terlalu panjang"),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Nomor HP tidak valid")
      .max(20, "Nomor HP tidak valid")
      .regex(/^[0-9+\-\s]+$/, "Nomor HP tidak valid"),
    fulfillmentMethod: fulfillmentMethodSchema.default("DELIVERY"),
    customerAddress: z.string().trim().max(500, "Alamat terlalu panjang").default(""),
    customerNotes: z.string().trim().max(500, "Catatan terlalu panjang").optional(),
    items: z.array(orderItemSchema).min(1, "Tambahkan minimal 1 produk"),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentMethod === "DELIVERY" && data.customerAddress.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerAddress"],
        message: "Alamat minimal 5 karakter",
      });
    }
  });

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type FulfillmentMethodInput = z.infer<typeof fulfillmentMethodSchema>;
