"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stockPurchaseSchema, stockAdjustmentSchema } from "@/lib/validations/ingredient";
import { applyPurchase } from "@/lib/utils/stock";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:stock-movements");

async function getStoreAndUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { store: true },
  });
  if (!dbUser?.store) throw new Error("Toko belum dibuat");
  return { store: dbUser.store, performedBy: dbUser.businessName || dbUser.email };
}

export async function recordStockPurchase(
  ingredientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { store, performedBy } = await getStoreAndUser();
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, storeId: store.id },
    });
    if (!ingredient) return { success: false, error: "Bahan tidak ditemukan" };

    const raw = {
      purchaseQuantity: formData.get("purchaseQuantity"),
      purchaseCost: formData.get("purchaseCost"),
      purchaseDate: formData.get("purchaseDate") || undefined,
      supplier: formData.get("supplier") || undefined,
      invoiceNumber: formData.get("invoiceNumber") || undefined,
    };
    const parsed = stockPurchaseSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { purchaseQuantity, purchaseCost, supplier, invoiceNumber } = parsed.data;
    const note = invoiceNumber ? `Invoice ${invoiceNumber}` : undefined;

    await prisma.$transaction(async (tx) => {
      await applyPurchase(
        tx,
        ingredientId,
        Number(ingredient.currentStock),
        Number(ingredient.averageCost),
        purchaseQuantity,
        purchaseCost,
        performedBy,
        note
      );
      if (supplier) {
        await tx.ingredient.update({ where: { id: ingredientId }, data: { supplier } });
      }
    });

    revalidatePath("/bahan-baku");
    revalidatePath(`/bahan-baku/${ingredientId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("recordStockPurchase failed", err);
    return { success: false, error: "Terjadi kesalahan saat mencatat pembelian" };
  }
}

export async function recordStockAdjustment(
  ingredientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { store, performedBy } = await getStoreAndUser();
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, storeId: store.id },
    });
    if (!ingredient) return { success: false, error: "Bahan tidak ditemukan" };

    const raw = {
      quantityChange: formData.get("quantityChange"),
      reason: formData.get("reason"),
      note: formData.get("note") || undefined,
    };
    const parsed = stockAdjustmentSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { quantityChange, reason, note } = parsed.data;
    const currentStock = Number(ingredient.currentStock);
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      return { success: false, error: "Stok tidak bisa kurang dari 0" };
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          ingredientId,
          type: "ADJUSTMENT",
          reason,
          quantityChange,
          resultingStock: newStock,
          note,
          performedBy,
        },
      }),
      prisma.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      }),
    ]);

    revalidatePath("/bahan-baku");
    revalidatePath(`/bahan-baku/${ingredientId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("recordStockAdjustment failed", err);
    return { success: false, error: "Terjadi kesalahan saat menyesuaikan stok" };
  }
}
