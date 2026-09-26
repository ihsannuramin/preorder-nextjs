"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { paymentMethodSchema, type PaymentMethodInput } from "@/lib/validations/payment-method";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";
import type { StorePaymentMethod } from "@prisma/client";

const logger = createLogger("action:payment-methods");

const MAX_METHODS = 10;

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

function revalidateStorePages(slug: string) {
  revalidatePath("/toko");
  revalidatePath(`/${slug}`);
}

export async function getPaymentMethods(): Promise<StorePaymentMethod[]> {
  const store = await getStore();
  return prisma.storePaymentMethod.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

function normalize(data: PaymentMethodInput) {
  // QRIS doesn't carry an account number; bank/e-wallet doesn't carry a QR image.
  return data.type === "QRIS"
    ? { ...data, accountNumber: null, accountName: data.accountName || null }
    : { ...data, qrisImageUrl: null };
}

export async function createPaymentMethod(
  input: PaymentMethodInput,
): Promise<ActionResult<StorePaymentMethod>> {
  try {
    const store = await getStore();
    const parsed = paymentMethodSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const count = await prisma.storePaymentMethod.count({ where: { storeId: store.id } });
    if (count >= MAX_METHODS) {
      return { success: false, error: `Maksimal ${MAX_METHODS} cara bayar per toko` };
    }

    const method = await prisma.storePaymentMethod.create({
      data: { ...normalize(parsed.data), storeId: store.id, sortOrder: count },
    });
    revalidateStorePages(store.slug);
    return { success: true, data: method };
  } catch (err) {
    logger.error("createPaymentMethod failed", err);
    return { success: false, error: "Gagal menyimpan cara bayar" };
  }
}

export async function updatePaymentMethod(
  id: string,
  input: PaymentMethodInput,
): Promise<ActionResult<StorePaymentMethod>> {
  try {
    const store = await getStore();
    const parsed = paymentMethodSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const existing = await prisma.storePaymentMethod.findFirst({ where: { id, storeId: store.id } });
    if (!existing) return { success: false, error: "Cara bayar tidak ditemukan" };

    const method = await prisma.storePaymentMethod.update({
      where: { id },
      data: normalize(parsed.data),
    });
    revalidateStorePages(store.slug);
    return { success: true, data: method };
  } catch (err) {
    logger.error("updatePaymentMethod failed", err);
    return { success: false, error: "Gagal menyimpan cara bayar" };
  }
}

export async function togglePaymentMethod(id: string): Promise<ActionResult<StorePaymentMethod>> {
  try {
    const store = await getStore();
    const existing = await prisma.storePaymentMethod.findFirst({ where: { id, storeId: store.id } });
    if (!existing) return { success: false, error: "Cara bayar tidak ditemukan" };

    const method = await prisma.storePaymentMethod.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    revalidateStorePages(store.slug);
    return { success: true, data: method };
  } catch (err) {
    logger.error("togglePaymentMethod failed", err);
    return { success: false, error: "Gagal mengubah cara bayar" };
  }
}

export async function deletePaymentMethod(id: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    const { count } = await prisma.storePaymentMethod.deleteMany({ where: { id, storeId: store.id } });
    if (count === 0) return { success: false, error: "Cara bayar tidak ditemukan" };
    revalidateStorePages(store.slug);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("deletePaymentMethod failed", err);
    return { success: false, error: "Gagal menghapus cara bayar" };
  }
}
