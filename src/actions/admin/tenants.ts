"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth/admin";
import { getStoreFinanceSummary } from "@/lib/utils/finance";
import { logAdminAction } from "@/lib/utils/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectStoragePaths } from "@/lib/utils/storage-path";
import { PAYMENT_PROOF_BUCKET } from "@/lib/utils/payment-proof";
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

const PRODUCT_IMAGE_BUCKET = "product-images";
const STORAGE_REMOVE_CHUNK = 100;

async function removeStorageFiles(bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  const admin = createAdminClient();
  for (let i = 0; i < paths.length; i += STORAGE_REMOVE_CHUNK) {
    const chunk = paths.slice(i, i + STORAGE_REMOVE_CHUNK);
    const { error } = await admin.storage.from(bucket).remove(chunk);
    if (error) logger.warn("removeStorageFiles failed", { bucket, count: chunk.length, message: error.message });
  }
}

/**
 * Hapus permanen tenant: akun login Supabase, user, toko, dan seluruh datanya
 * (produk, PO, pesanan, bahan baku — via cascade), plus file di storage.
 * Email & slug jadi bebas sehingga pemilik bisa mendaftar ulang dari awal.
 */
export async function deleteTenantPermanently(
  storeId: string,
  confirmSlug: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const admin = await getAdminUser();
    if (!reason.trim()) {
      return { success: false, error: "Alasan penghapusan wajib diisi" };
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        user: true,
        products: { select: { imageUrl: true, images: true } },
        paymentMethods: { select: { qrisImageUrl: true } },
        orders: { select: { paymentProofUrl: true } },
        campaigns: { select: { groupOrders: { select: { paymentProofUrl: true } } } },
        _count: { select: { products: true, campaigns: true, orders: true } },
      },
    });
    if (!store) return { success: false, error: "Toko tidak ditemukan" };
    if (confirmSlug.trim() !== store.slug) {
      return { success: false, error: "Slug konfirmasi tidak cocok" };
    }
    if (store.user.role === "SUPER_ADMIN" || store.user.id === admin.id) {
      return { success: false, error: "Akun super admin tidak bisa dihapus dari sini" };
    }

    // Akun login dihapus lebih dulu: bila gagal, belum ada data yang hilang.
    // "User not found" dianggap sukses agar penghapusan bisa diulang.
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(store.user.supabaseId);
    if (authError && authError.status !== 404) {
      logger.error("deleteTenantPermanently: auth deleteUser failed", authError);
      return { success: false, error: "Gagal menghapus akun login tenant. Coba lagi." };
    }

    // Cascade: users → stores → produk, PO, pesanan, bahan baku, dll.
    await prisma.user.delete({ where: { id: store.user.id } });

    await logAdminAction(
      { id: admin.id, email: admin.email },
      "DELETE_STORE",
      {
        targetStoreId: store.id,
        targetUserId: store.user.id,
        metadata: {
          reason,
          storeName: store.name,
          slug: store.slug,
          ownerEmail: store.user.email,
          products: store._count.products,
          campaigns: store._count.campaigns,
          orders: store._count.orders,
        },
      },
    );

    // Bersihkan file setelah data terhapus (best effort, tidak menggagalkan aksi).
    await Promise.all([
      removeStorageFiles(
        PRODUCT_IMAGE_BUCKET,
        collectStoragePaths(
          [
            store.logoUrl,
            store.coverUrl,
            ...store.bannerUrls,
            ...store.products.flatMap((p) => [p.imageUrl, ...p.images]),
            ...store.paymentMethods.map((m) => m.qrisImageUrl),
          ],
          PRODUCT_IMAGE_BUCKET,
        ),
      ),
      removeStorageFiles(
        PAYMENT_PROOF_BUCKET,
        collectStoragePaths(
          [
            ...store.orders.map((o) => o.paymentProofUrl),
            ...store.campaigns.flatMap((c) => c.groupOrders.map((g) => g.paymentProofUrl)),
          ],
          PAYMENT_PROOF_BUCKET,
        ),
      ),
    ]);

    revalidatePath("/admin/tenants");
    revalidatePath("/admin");
    revalidatePath(`/${store.slug}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("deleteTenantPermanently failed", err);
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
