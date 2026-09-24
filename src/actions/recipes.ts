"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:recipes");

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

export async function addRecipeItem(
  productId: string,
  ingredientId: string,
  quantity: number
): Promise<ActionResult> {
  try {
    const store = await getStore();
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });
    if (!product) return { success: false, error: "Produk tidak ditemukan" };

    await prisma.recipeItem.upsert({
      where: { productId_ingredientId: { productId, ingredientId } },
      update: { quantity },
      create: { productId, ingredientId, quantity },
    });

    revalidatePath(`/produk/${productId}/resep`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("addRecipeItem failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function removeRecipeItem(
  productId: string,
  ingredientId: string
): Promise<ActionResult> {
  try {
    const store = await getStore();
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });
    if (!product) return { success: false, error: "Produk tidak ditemukan" };

    await prisma.recipeItem.delete({
      where: { productId_ingredientId: { productId, ingredientId } },
    });

    revalidatePath(`/produk/${productId}/resep`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("removeRecipeItem failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getRecipeItems(productId: string) {
  const store = await getStore();
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
  });
  if (!product) return [];

  const rows = await prisma.recipeItem.findMany({
    where: { productId },
    include: { ingredient: true },
  });
  return rows.map((ri) => ({
    ...ri,
    quantity: Number(ri.quantity),
    ingredient: {
      ...ri.ingredient,
      purchaseQty: Number(ri.ingredient.purchaseQty),
      purchasePrice: Number(ri.ingredient.purchasePrice),
      averageCost: Number(ri.ingredient.averageCost),
      currentStock: Number(ri.ingredient.currentStock),
      minimumStock: Number(ri.ingredient.minimumStock),
    },
  }));
}
