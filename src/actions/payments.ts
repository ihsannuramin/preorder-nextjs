"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:payments");

const PAYMENT_PROOF_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_PAYMENTS ?? "payment-proofs";

function extractStoragePath(value: string): string {
  if (!value.startsWith("http")) return value;
  const marker = `/object/public/${PAYMENT_PROOF_BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value;
  return decodeURIComponent(value.slice(idx + marker.length));
}

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

export async function approvePayment(orderId: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.order.update({
      where: { id: orderId, campaign: { storeId: store.id } },
      data: { status: "PAID", verifiedAt: new Date() },
    });
    revalidatePath("/pesanan");
    revalidatePath(`/pesanan/${orderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("approvePayment failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getPaymentProofUrl(
  orderId: string
): Promise<ActionResult<{ url: string; isPdf: boolean }>> {
  try {
    const store = await getStore();
    const order = await prisma.order.findFirst({
      where: { id: orderId, campaign: { storeId: store.id } },
      select: { paymentProofUrl: true },
    });
    if (!order?.paymentProofUrl) {
      return { success: false, error: "Bukti pembayaran tidak ditemukan" };
    }

    const path = extractStoragePath(order.paymentProofUrl);
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(path, 300);

    if (error || !data) {
      logger.error("getPaymentProofUrl: signed URL creation failed", error);
      return { success: false, error: "Gagal memuat bukti pembayaran" };
    }

    return {
      success: true,
      data: { url: data.signedUrl, isPdf: /\.pdf$/i.test(path) },
    };
  } catch (err) {
    logger.error("getPaymentProofUrl failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function approveGroupPayment(groupOrderId: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.groupOrder.update({
      where: { id: groupOrderId, campaign: { storeId: store.id } },
      data: { status: "PAID", verifiedAt: new Date() },
    });
    revalidatePath("/pesanan/grup");
    revalidatePath(`/pesanan/grup/${groupOrderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("approveGroupPayment failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getGroupPaymentProofUrl(
  groupOrderId: string
): Promise<ActionResult<{ url: string; isPdf: boolean }>> {
  try {
    const store = await getStore();
    const groupOrder = await prisma.groupOrder.findFirst({
      where: { id: groupOrderId, campaign: { storeId: store.id } },
      select: { paymentProofUrl: true },
    });
    if (!groupOrder?.paymentProofUrl) {
      return { success: false, error: "Bukti pembayaran tidak ditemukan" };
    }

    const path = extractStoragePath(groupOrder.paymentProofUrl);
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(path, 300);

    if (error || !data) {
      logger.error("getGroupPaymentProofUrl: signed URL creation failed", error);
      return { success: false, error: "Gagal memuat bukti pembayaran" };
    }

    return {
      success: true,
      data: { url: data.signedUrl, isPdf: /\.pdf$/i.test(path) },
    };
  } catch (err) {
    logger.error("getGroupPaymentProofUrl failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function rejectGroupPayment(
  groupOrderId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.groupOrder.update({
      where: { id: groupOrderId, campaign: { storeId: store.id } },
      data: {
        status: "CLOSED",
        rejectionReason: reason,
        paymentProofUrl: null,
      },
    });
    revalidatePath("/pesanan/grup");
    revalidatePath(`/pesanan/grup/${groupOrderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("rejectGroupPayment failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function rejectPayment(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.order.update({
      where: { id: orderId, campaign: { storeId: store.id } },
      data: {
        status: "PENDING_PAYMENT",
        rejectionReason: reason,
        paymentProofUrl: null,
      },
    });
    revalidatePath("/pesanan");
    revalidatePath(`/pesanan/${orderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("rejectPayment failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
