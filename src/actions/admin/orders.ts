"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { PAYMENT_PROOF_BUCKET, extractPaymentProofPath } from "@/lib/utils/payment-proof";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";
import type { OrderStatus } from "@prisma/client";

const logger = createLogger("action:admin/orders");

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  storeId: string;
  storeName: string;
  campaignName: string;
  hasPaymentProof: boolean;
};

export async function getAdminOrders(filters?: {
  search?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}): Promise<{ data: AdminOrderListItem[]; total: number }> {
  await getAdminUser();

  const pageSize = filters?.pageSize ?? 20;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.search
      ? {
          OR: [
            { orderNumber: { contains: filters.search, mode: "insensitive" as const } },
            { customerName: { contains: filters.search, mode: "insensitive" as const } },
            { customerPhone: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { campaign: { include: { store: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      storeId: o.campaign.store.id,
      storeName: o.campaign.store.name,
      campaignName: o.campaign.name,
      hasPaymentProof: Boolean(o.paymentProofUrl),
    })),
    total,
  };
}

export async function getAdminPaymentProofUrl(
  orderId: string
): Promise<ActionResult<{ url: string; isPdf: boolean }>> {
  try {
    await getAdminUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentProofUrl: true },
    });
    if (!order?.paymentProofUrl) {
      return { success: false, error: "Bukti pembayaran tidak ditemukan" };
    }

    const path = extractPaymentProofPath(order.paymentProofUrl);
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(path, 300);

    if (error || !data) {
      logger.error("getAdminPaymentProofUrl: signed URL creation failed", error);
      return { success: false, error: "Gagal memuat bukti pembayaran" };
    }

    return {
      success: true,
      data: { url: data.signedUrl, isPdf: /\.pdf$/i.test(path) },
    };
  } catch (err) {
    logger.error("getAdminPaymentProofUrl failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
