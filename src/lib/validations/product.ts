import { z } from "zod";
import { ProductCategory, ProductCostMode, ProductStatus } from "@prisma/client";

export const productSchema = z
  .object({
    name: z.string().min(2, "Nama produk minimal 2 karakter"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).max(5, "Maksimal 5 foto produk").optional(),
    category: z.nativeEnum(ProductCategory).default(ProductCategory.OTHER),
    costMode: z.nativeEnum(ProductCostMode).default(ProductCostMode.RECIPE),
    manualCostPrice: z.coerce.number().min(0, "Harga modal harus lebih dari 0").optional(),
    basePrice: z.coerce.number().min(0, "Harga harus lebih dari 0"),
    status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  })
  .refine(
    (data) => data.costMode !== ProductCostMode.MANUAL || data.manualCostPrice != null,
    { message: "Harga modal wajib diisi untuk produk tanpa bahan baku", path: ["manualCostPrice"] }
  );

export const productUpdateSchema = productSchema.innerType().partial();

export type ProductInput = z.infer<typeof productSchema>;
