"use server";

import { prisma } from "@/lib/prisma";
import { publicStoreSelect } from "@/lib/public-store";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:group-orders");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateSessionCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const existing = await prisma.groupOrder.findUnique({ where: { sessionCode: code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique session code");
}

// ─── Public Actions (no auth) ─────────────────────────────────────────────────

export async function createGroupOrder(data: {
  campaignId: string;
  facilitatorName: string;
  facilitatorPhone: string;
  facilitatorAddress: string;
  facilitatorNotes?: string;
}): Promise<ActionResult<{ sessionCode: string }>> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) return { success: false, error: "PO tidak ditemukan" };
    if (campaign.status !== "OPEN") return { success: false, error: "PO ini sudah tutup. Chat toko buat tahu PO berikutnya." };
    if (new Date() > campaign.closeDate) return { success: false, error: "PO ini sudah tutup. Chat toko buat tahu PO berikutnya." };

    const sessionCode = await generateSessionCode();

    await prisma.groupOrder.create({
      data: {
        campaignId: data.campaignId,
        sessionCode,
        facilitatorName: data.facilitatorName.trim(),
        facilitatorPhone: data.facilitatorPhone.trim(),
        facilitatorAddress: data.facilitatorAddress.trim(),
        facilitatorNotes: data.facilitatorNotes?.trim() || null,
      },
    });

    return { success: true, data: { sessionCode } };
  } catch (e) {
    logger.error("createGroupOrder failed", e);
    return { success: false, error: "Gagal membuat group order" };
  }
}

export async function addMemberOrder(
  sessionCode: string,
  memberName: string,
  items: { productId: string; quantity: number }[]
): Promise<ActionResult<{ memberName: string }>> {
  try {
    const groupOrder = await prisma.groupOrder.findUnique({
      where: { sessionCode },
    });

    if (!groupOrder) return { success: false, error: "Sesi tidak ditemukan" };
    if (groupOrder.status !== "COLLECTING") return { success: false, error: "Sesi ini sudah ditutup" };
    if (!memberName.trim()) return { success: false, error: "Nama tidak boleh kosong" };
    if (items.length === 0) return { success: false, error: "Pilih minimal 1 produk" };

    let memberSubtotal = 0;
    const itemsWithPrice: {
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      const unitPrice = Number(product.basePrice);
      const subtotal = unitPrice * item.quantity;
      memberSubtotal += subtotal;

      itemsWithPrice.push({
        productId: item.productId,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    if (itemsWithPrice.length === 0) return { success: false, error: "Tidak ada item valid" };

    await prisma.$transaction(async (tx) => {
      const memberOrder = await tx.groupMemberOrder.create({
        data: {
          groupOrderId: groupOrder.id,
          memberName: memberName.trim(),
          subtotal: memberSubtotal,
          items: {
            create: itemsWithPrice.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      await tx.groupOrder.update({
        where: { id: groupOrder.id },
        data: {
          totalAmount: { increment: memberSubtotal },
        },
      });

      return memberOrder;
    });

    return { success: true, data: { memberName: memberName.trim() } };
  } catch (e) {
    logger.error("addMemberOrder failed", e);
    return { success: false, error: "Gagal menambahkan pesanan" };
  }
}

import type {
  GroupOrder, GroupMemberOrder, GroupMemberOrderItem,
  Campaign, CampaignProduct, Product,
} from "@prisma/client";

type FullGroupOrder = GroupOrder & {
  campaign?: (Campaign & {
    products?: (CampaignProduct & {
      product: Product | null;
    })[];
  }) | null;
  memberOrders?: (GroupMemberOrder & { items?: GroupMemberOrderItem[] })[];
};

function serializeGroupOrder<T extends FullGroupOrder>(g: T) {
  return {
    ...g,
    totalAmount: Number(g.totalAmount),
    campaign: g.campaign
      ? {
          ...g.campaign,
          products: g.campaign.products?.map((cp) => ({
            ...cp,
            product: cp.product
              ? {
                  ...cp.product,
                  basePrice: Number(cp.product.basePrice),
                }
              : cp.product,
          })),
        }
      : g.campaign,
    memberOrders: g.memberOrders?.map((m) => ({
      ...m,
      subtotal: Number(m.subtotal),
      items: m.items?.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    })),
  };
}

export async function getPublicGroupOrder(sessionCode: string) {
  const g = await prisma.groupOrder.findUnique({
    where: { sessionCode },
    include: {
      campaign: {
        include: {
          store: { select: publicStoreSelect },
          products: {
            include: { product: true },
          },
        },
      },
      memberOrders: {
        orderBy: { createdAt: "asc" },
        include: {
          items: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  return g ? serializeGroupOrder(g) : null;
}

export async function uploadGroupPaymentProof(
  sessionCode: string,
  path: string
): Promise<ActionResult<void>> {
  try {
    const groupOrder = await prisma.groupOrder.findUnique({ where: { sessionCode } });
    if (!groupOrder) return { success: false, error: "Sesi tidak ditemukan" };
    if (groupOrder.status !== "CLOSED") {
      return { success: false, error: "Sesi belum ditutup atau sudah diverifikasi" };
    }

    await prisma.groupOrder.update({
      where: { sessionCode },
      data: { paymentProofUrl: path, status: "PAYMENT_REVIEW", rejectionReason: null },
    });

    return { success: true, data: undefined };
  } catch (e) {
    logger.error("uploadGroupPaymentProof failed", e);
    return { success: false, error: "Gagal mengunggah bukti pembayaran" };
  }
}

export async function closeGroupOrder(sessionCode: string): Promise<ActionResult<void>> {
  try {
    const groupOrder = await prisma.groupOrder.findUnique({ where: { sessionCode } });
    if (!groupOrder) return { success: false, error: "Sesi tidak ditemukan" };

    await prisma.groupOrder.update({
      where: { sessionCode },
      data: { status: "CLOSED" },
    });

    return { success: true, data: undefined };
  } catch (e) {
    logger.error("closeGroupOrder failed", e);
    return { success: false, error: "Gagal menutup sesi" };
  }
}

// ─── Dashboard Actions (auth required) ────────────────────────────────────────

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

export async function getDashboardGroupOrders(filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const store = await getStore();
  const pageSize = filters?.pageSize ?? 10;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    campaign: { storeId: store.id },
    ...(filters?.search
      ? {
          OR: [
            { facilitatorName: { contains: filters.search, mode: "insensitive" as const } },
            { sessionCode: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.groupOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { name: true } },
        _count: { select: { memberOrders: true } },
      },
      skip,
      take: pageSize,
    }),
    prisma.groupOrder.count({ where }),
  ]);

  return { data: rows.map((g) => ({ ...g, totalAmount: Number(g.totalAmount) })), total };
}

export async function getDashboardGroupOrder(id: string) {
  const store = await getStore();

  const g = await prisma.groupOrder.findFirst({
    where: { id, campaign: { storeId: store.id } },
    include: {
      campaign: { select: { name: true, id: true } },
      memberOrders: {
        orderBy: { createdAt: "asc" },
        include: {
          items: { orderBy: { productName: "asc" } },
        },
      },
    },
  });
  if (!g) return null;
  return {
    ...g,
    totalAmount: Number(g.totalAmount),
    memberOrders: g.memberOrders.map((m) => ({
      ...m,
      subtotal: Number(m.subtotal),
      items: m.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    })),
  };
}

export async function updateGroupOrderStatus(
  id: string,
  status: "COLLECTING" | "CLOSED" | "PAYMENT_REVIEW" | "PAID" | "CANCELLED"
): Promise<ActionResult<void>> {
  try {
    const store = await getStore();

    const groupOrder = await prisma.groupOrder.findFirst({
      where: { id, campaign: { storeId: store.id } },
    });

    if (!groupOrder) return { success: false, error: "Group order tidak ditemukan" };

    await prisma.groupOrder.update({ where: { id }, data: { status } });

    return { success: true, data: undefined };
  } catch (e) {
    logger.error("updateGroupOrderStatus failed", e);
    return { success: false, error: "Gagal update status" };
  }
}
