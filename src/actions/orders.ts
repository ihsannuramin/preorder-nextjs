"use server";

import { revalidatePath } from "next/cache";
import { publicStoreSelect } from "@/lib/public-store";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { calculateHpp } from "@/lib/utils/hpp";
import { formatOrderNumber, isOrderNumberConflict } from "@/lib/utils/order-number";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";
import { cleanPhone } from "@/lib/utils/whatsapp";

const logger = createLogger("action:orders");

async function getStore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { store: true },
  });
  if (!dbUser?.store) throw new Error("Toko belum dibuat");
  return dbUser.store;
}

import type { Order, OrderItem, Campaign } from "@prisma/client";

function serializeOrder<T extends Order & { items: OrderItem[]; campaign?: Campaign | null }>(o: T) {
  return {
    ...o,
    totalAmount: Number(o.totalAmount),
    totalHpp: Number(o.totalHpp),
    items: o.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      unitHpp: Number(item.unitHpp),
      subtotal: Number(item.subtotal),
    })),
  };
}

async function generateOrderNumber(storeId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { storeId },
  });
  return formatOrderNumber(year, count + 1);
}

export async function getOrders(filters?: {
  status?: OrderStatus;
  search?: string;
  campaignId?: string;
  page?: number;
  pageSize?: number;
}) {
  const store = await getStore();
  const pageSize = filters?.pageSize ?? 10;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    campaign: { storeId: store.id },
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters?.search
      ? {
          OR: [
            { customerName: { contains: filters.search, mode: "insensitive" as const } },
            { orderNumber: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { campaign: true, items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { data: rows.map(serializeOrder), total };
}

export async function getOrder(id: string) {
  const store = await getStore();
  const row = await prisma.order.findFirst({
    where: { id, campaign: { storeId: store.id } },
    include: { campaign: true, items: true },
  });
  return row ? serializeOrder(row) : null;
}

export async function createPublicOrder(data: {
  campaignId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: { productId: string; quantity: number }[];
}): Promise<ActionResult<{ orderNumber: string; orderId: string }>> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      include: { store: true },
    });

    if (!campaign) return { success: false, error: "PO ini tidak ditemukan. Cek lagi link dari toko, ya." };
    if (campaign.status !== "OPEN") return { success: false, error: "PO ini sudah tutup. Chat toko buat tahu PO berikutnya." };
    if (new Date() > campaign.closeDate) return { success: false, error: "PO ini sudah tutup. Chat toko buat tahu PO berikutnya." };

    let totalAmount = 0;
    let totalHpp = 0;

    const orderItems = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            recipeItems: { include: { ingredient: true } },
            additionalCosts: true,
          },
        });

        if (!product) throw new Error("Produk tidak ditemukan");

        const unitPrice = Number(product.basePrice);
        const unitHpp = calculateHpp(
          product.recipeItems.map((ri) => ({
            quantity: Number(ri.quantity),
            ingredient: { averageCost: Number(ri.ingredient.averageCost) },
          })),
          product.additionalCosts.map((c) => ({ amount: Number(c.amount) })),
          product.costMode === "MANUAL" ? Number(product.manualCostPrice ?? 0) : undefined
        );
        const subtotal = unitPrice * item.quantity;

        totalAmount += subtotal;
        totalHpp += unitHpp * item.quantity;

        return {
          productId: item.productId,
          productName: product.name,
          unitPrice,
          unitHpp,
          quantity: item.quantity,
          subtotal,
        };
      })
    );

    const MAX_ATTEMPTS = 5;
    let order;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const orderNumber = await generateOrderNumber(campaign.storeId);
      try {
        order = await prisma.order.create({
          data: {
            campaignId: data.campaignId,
            storeId: campaign.storeId,
            orderNumber,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            customerNotes: data.customerNotes,
            totalAmount,
            totalHpp,
            items: { create: orderItems },
          },
        });
        break;
      } catch (e) {
        if (!isOrderNumberConflict(e) || attempt === MAX_ATTEMPTS) throw e;
      }
    }

    return { success: true, data: { orderNumber: order!.orderNumber, orderId: order!.id } };
  } catch (err) {
    logger.error("createPublicOrder failed", err);
    return { success: false, error: "Terjadi kesalahan saat membuat pesanan" };
  }
}

export async function getPublicOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      campaign: {
        include: {
          store: { select: publicStoreSelect },
        },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    paymentProofUrl: order.paymentProofUrl,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
    store: order.campaign.store,
  };
}

/**
 * Pelanggan yang kehilangan link cek status bisa menemukan pesanannya lagi
 * dengan nomor pesanan + nomor HP. Keduanya harus cocok supaya nomor pesanan
 * saja tidak cukup untuk melihat data pesanan orang lain.
 */
export async function findPublicOrder(
  slug: string,
  orderNumber: string,
  phone: string,
): Promise<ActionResult<{ orderId: string }>> {
  const notFound = {
    success: false as const,
    error: "Pesanan nggak ketemu. Cek lagi nomor pesanan dan nomor HP yang kamu pakai waktu pesan.",
  };
  try {
    const number = orderNumber.trim().toUpperCase();
    const inputPhone = cleanPhone(phone);
    if (!number || inputPhone.length < 8) return notFound;

    const store = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
    if (!store) return notFound;

    const order = await prisma.order.findUnique({
      where: { storeId_orderNumber: { storeId: store.id, orderNumber: number } },
      select: { id: true, customerPhone: true },
    });
    if (!order || cleanPhone(order.customerPhone) !== inputPhone) return notFound;

    return { success: true, data: { orderId: order.id } };
  } catch (err) {
    logger.error("findPublicOrder failed", err);
    return { success: false, error: "Terjadi kesalahan, coba lagi sebentar lagi." };
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.order.update({
      where: { id, campaign: { storeId: store.id } },
      data: { status },
    });
    revalidatePath("/pesanan");
    revalidatePath(`/pesanan/${id}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("updateOrderStatus failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function bulkUpdateOrderStatus(
  ids: string[],
  status: OrderStatus
): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.order.updateMany({
      where: { id: { in: ids }, campaign: { storeId: store.id } },
      data: { status },
    });
    revalidatePath("/pesanan");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("bulkUpdateOrderStatus failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function uploadPaymentProof(
  orderId: string,
  proofUrl: string
): Promise<ActionResult> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProofUrl: proofUrl,
        status: "PAYMENT_REVIEW",
      },
    });
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("uploadPaymentProof failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
