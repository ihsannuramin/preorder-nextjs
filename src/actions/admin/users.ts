"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/utils/admin-audit";
import { checkRoleChange } from "@/lib/utils/role-guard";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";
import type { UserRole } from "@prisma/client";

const logger = createLogger("action:admin/users");

export type AdminUserListItem = {
  id: string;
  email: string;
  businessName: string;
  role: UserRole;
  createdAt: Date;
  store: { id: string; name: string; slug: string; isActive: boolean } | null;
};

export async function getUsers(filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: AdminUserListItem[]; total: number }> {
  await getAdminUser();

  const pageSize = filters?.pageSize ?? 20;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = filters?.search
    ? {
        OR: [
          { email: { contains: filters.search, mode: "insensitive" as const } },
          { businessName: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { store: { select: { id: true, name: true, slug: true, isActive: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: rows.map((u) => ({
      id: u.id,
      email: u.email,
      businessName: u.businessName,
      role: u.role,
      createdAt: u.createdAt,
      store: u.store,
    })),
    total,
  };
}

export async function triggerPasswordReset(userId: string): Promise<ActionResult> {
  try {
    const admin = await getAdminUser();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Pengguna tidak ditemukan" };

    const supabase = await createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    if (error) return { success: false, error: error.message };

    await logAdminAction(
      { id: admin.id, email: admin.email },
      "TRIGGER_PASSWORD_RESET",
      { targetUserId: user.id }
    );

    return { success: true, data: undefined };
  } catch (err) {
    logger.error("triggerPasswordReset failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  try {
    const admin = await getAdminUser();

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

    const otherSuperAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN", id: { not: userId } },
    });

    const check = checkRoleChange({
      actorId: admin.id,
      targetId: userId,
      targetCurrentRole: target.role,
      newRole: role,
      otherSuperAdminCount,
    });
    if (!check.allowed) return { success: false, error: check.error };

    await prisma.user.update({ where: { id: userId }, data: { role } });

    await logAdminAction(
      { id: admin.id, email: admin.email },
      role === "SUPER_ADMIN" ? "PROMOTE_TO_SUPER_ADMIN" : "DEMOTE_TO_OWNER",
      { targetUserId: userId }
    );

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("setUserRole failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
