"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth/admin";
import { getStoreFinanceSummary } from "@/lib/utils/finance";
import { logAdminAction } from "@/lib/utils/admin-audit";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:admin/tenants");

export type TenantListItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  ownerEmail: string;
  ownerBusinessName: string;
  productCount: number;
  campaignCount: number;
  orderCount: number;
};

export async function getTenants(filters?: {
  search?: string;
  status?: "active" | "suspended";
  page?: number;
  pageSize?: number;
}): Promise<{ data: TenantListItem[]; total: number }> {
  await getAdminUser();

  const pageSize = filters?.pageSize ?? 20;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(filters?.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { slug: { contains: filters.search, mode: "insensitive" as const } },
            { user: { email: { contains: filters.search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(filters?.status ? { isActive: filters.status === "active" } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        user: { select: { email: true, businessName: true } },
        _count: { select: { products: true, campaigns: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.store.count({ where }),
  ]);

  const data: TenantListItem[] = await Promise.all(
    rows.map(async (s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      isActive: s.isActive,
      createdAt: s.createdAt,
      ownerEmail: s.user.email,
      ownerBusinessName: s.user.businessName,
      productCount: s._count.products,
      campaignCount: s._count.campaigns,
      orderCount: await prisma.order.count({ where: { campaign: { storeId: s.id } } }),
    }))
  );

  return { data, total };
}

export async function getTenantDetail(id: string) {
  await getAdminUser();

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, businessName: true, createdAt: true } },
      _count: { select: { products: true, ingredients: true, campaigns: true } },
    },
  });
  if (!store) return null;

  const [finance, orderCount, recentOrders, recentCampaigns] = await Promise.all([
    getStoreFinanceSummary(store.id),
    prisma.order.count({ where: { campaign: { storeId: store.id } } }),
    prisma.order.findMany({
      where: { campaign: { storeId: store.id } },
      include: { campaign: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.campaign.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    store,
    finance,
    orderCount,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      campaignName: o.campaign.name,
      createdAt: o.createdAt,
    })),
    recentCampaigns: recentCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      openDate: c.openDate,
      closeDate: c.closeDate,
    })),
  };
}

export async function suspendTenant(storeId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await getAdminUser();
    if (!reason.trim()) {
      return { success: false, error: "Alasan penonaktifan wajib diisi" };
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { isActive: false },
    });

    await logAdminAction(
      { id: admin.id, email: admin.email },
      "SUSPEND_STORE",
      { targetStoreId: store.id, targetUserId: store.userId, metadata: { reason } }
    );

    revalidatePath("/admin/tenants");
    revalidatePath(`/admin/tenants/${storeId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("suspendTenant failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function reactivateTenant(storeId: string): Promise<ActionResult> {
  try {
    const admin = await getAdminUser();

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { isActive: true },
    });

    await logAdminAction(
      { id: admin.id, email: admin.email },
      "REACTIVATE_STORE",
      { targetStoreId: store.id, targetUserId: store.userId }
    );

    revalidatePath("/admin/tenants");
    revalidatePath(`/admin/tenants/${storeId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("reactivateTenant failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
