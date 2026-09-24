"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:additional-costs");

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

export async function getAdditionalCosts(productId: string) {
  const store = await getStore();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return [];

  const rows = await prisma.additionalCost.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((c) => ({ ...c, amount: Number(c.amount) }));
}

export async function addAdditionalCost(
  productId: string,
  label: string,
  amount: number
): Promise<ActionResult> {
  try {
    const store = await getStore();
    const product = await prisma.product.findFirst({ where: { id: productId, storeId: store.id } });
    if (!product) return { success: false, error: "Produk tidak ditemukan" };
    if (!label.trim() || amount <= 0) {
      return { success: false, error: "Label dan jumlah biaya wajib diisi" };
    }

    await prisma.additionalCost.create({ data: { productId, label: label.trim(), amount } });
    revalidatePath(`/produk/${productId}/resep`);
    revalidatePath(`/produk/${productId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("addAdditionalCost failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function updateAdditionalCost(
  id: string,
  label: string,
  amount: number
): Promise<ActionResult> {
  try {
    const store = await getStore();
    const cost = await prisma.additionalCost.findFirst({
      where: { id, product: { storeId: store.id } },
    });
    if (!cost) return { success: false, error: "Biaya tidak ditemukan" };

    await prisma.additionalCost.update({
      where: { id },
      data: { label: label.trim(), amount },
    });
    revalidatePath(`/produk/${cost.productId}/resep`);
    revalidatePath(`/produk/${cost.productId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("updateAdditionalCost failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function removeAdditionalCost(id: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    const cost = await prisma.additionalCost.findFirst({
      where: { id, product: { storeId: store.id } },
    });
    if (!cost) return { success: false, error: "Biaya tidak ditemukan" };

    await prisma.additionalCost.delete({ where: { id } });
    revalidatePath(`/produk/${cost.productId}/resep`);
    revalidatePath(`/produk/${cost.productId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("removeAdditionalCost failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
