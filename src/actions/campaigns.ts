"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:campaigns");

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

import type { CampaignProduct, Product, Order, OrderItem } from "@prisma/client";

function serializeCampaignProduct<
  T extends CampaignProduct & { product: Product | null },
>(cp: T) {
  return {
    ...cp,
    product: cp.product
      ? {
          ...cp.product,
          basePrice: Number(cp.product.basePrice),
        }
      : cp.product,
  };
}

function serializeCampaignOrder<T extends Order & { items: OrderItem[] }>(o: T) {
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

export async function getCampaigns(filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const store = await getStore();
  const pageSize = filters?.pageSize ?? 10;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters?.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.campaign.count({ where }),
  ]);

  return { data: rows, total };
}

export async function getCampaign(id: string) {
  const store = await getStore();
  const c = await prisma.campaign.findFirst({
    where: { id, storeId: store.id },
    include: {
      products: { include: { product: true } },
      orders: { include: { items: true } },
    },
  });
  if (!c) return null;
  return {
    ...c,
    products: c.products.map(serializeCampaignProduct),
    orders: c.orders.map(serializeCampaignOrder),
  };
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  openDate: Date;
  closeDate: Date;
  productIds: string[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const store = await getStore();
    const campaign = await prisma.campaign.create({
      data: {
        storeId: store.id,
        name: data.name,
        description: data.description,
        openDate: data.openDate,
        closeDate: data.closeDate,
        products: {
          create: data.productIds.map((productId) => ({ productId })),
        },
      },
    });
    revalidatePath("/periode-po");
    return { success: true, data: { id: campaign.id } };
  } catch (err) {
    logger.error("createCampaign failed", err);
    return { success: false, error: "Terjadi kesalahan saat membuat periode PO" };
  }
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus
): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.campaign.update({
      where: { id, storeId: store.id },
      data: { status },
    });
    revalidatePath("/periode-po");
    revalidatePath(`/periode-po/${id}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("updateCampaignStatus failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.campaign.delete({ where: { id, storeId: store.id } });
    revalidatePath("/periode-po");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("deleteCampaign failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
