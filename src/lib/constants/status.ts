import type { CampaignStatus, GroupOrderStatus, OrderStatus } from "@prisma/client";

// Brand Guideline v1.1 §14 — makna warna status konsisten di seluruh aplikasi:
//   success (teal)   = lunas, selesai, untung
//   warning (orange) = perlu verifikasi / perlu perhatian
//   default (biru)   = aktif, sedang berjalan
//   secondary (abu)  = draf, arsip, tidak aktif, menunggu pihak lain
//   destructive (merah sistem) = ditolak, batal, gagal
export type StatusVariant = "default" | "secondary" | "success" | "warning" | "destructive";

type StatusConfig = { label: string; longLabel: string; variant: StatusVariant };

export const ORDER_STATUS: Record<OrderStatus, StatusConfig> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", longLabel: "Menunggu Pembayaran", variant: "secondary" },
  PAYMENT_REVIEW: { label: "Perlu Verifikasi", longLabel: "Perlu Verifikasi Pembayaran", variant: "warning" },
  PAID: { label: "Lunas", longLabel: "Lunas", variant: "success" },
  PRODUCTION: { label: "Produksi", longLabel: "Sedang Diproduksi", variant: "default" },
  READY: { label: "Siap Kirim", longLabel: "Siap Diambil/Dikirim", variant: "default" },
  COMPLETED: { label: "Selesai", longLabel: "Selesai", variant: "success" },
  CANCELLED: { label: "Batal", longLabel: "Dibatalkan", variant: "destructive" },
};

export const CAMPAIGN_STATUS: Record<CampaignStatus, StatusConfig> = {
  DRAFT: { label: "Draf", longLabel: "Draf", variant: "secondary" },
  OPEN: { label: "Buka", longLabel: "PO Dibuka", variant: "default" },
  CLOSED: { label: "Tutup", longLabel: "PO Ditutup", variant: "secondary" },
  PRODUCTION: { label: "Produksi", longLabel: "Sedang Diproduksi", variant: "default" },
  COMPLETED: { label: "Selesai", longLabel: "Selesai", variant: "success" },
  CANCELLED: { label: "Batal", longLabel: "Dibatalkan", variant: "destructive" },
};

export const GROUP_ORDER_STATUS: Record<GroupOrderStatus, StatusConfig> = {
  COLLECTING: { label: "Mengumpulkan", longLabel: "Mengumpulkan Pesanan", variant: "default" },
  CLOSED: { label: "Ditutup", longLabel: "Ditutup", variant: "secondary" },
  PAYMENT_REVIEW: { label: "Perlu Verifikasi", longLabel: "Perlu Verifikasi Pembayaran", variant: "warning" },
  PAID: { label: "Lunas", longLabel: "Lunas", variant: "success" },
  CANCELLED: { label: "Dibatalkan", longLabel: "Dibatalkan", variant: "destructive" },
};
