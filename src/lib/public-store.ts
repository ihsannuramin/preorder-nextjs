import type { Prisma } from "@prisma/client";

/**
 * Field toko yang aman ditampilkan di halaman pelanggan: identitas toko (§11.1)
 * dan cara bayar yang aktif.
 */
export const publicStoreSelect = {
  name: true,
  slug: true,
  whatsapp: true,
  logoUrl: true,
  brandColor: true,
  paymentMethods: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      type: true,
      providerName: true,
      accountNumber: true,
      accountName: true,
      qrisImageUrl: true,
    },
  },
} satisfies Prisma.StoreSelect;
