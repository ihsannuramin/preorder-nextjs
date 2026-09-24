"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateProductionNeeds, checkAvailability } from "@/lib/utils/production";
import { calculateHpp } from "@/lib/utils/hpp";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:production");

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

async function fetchQualifyingOrders(campaignId: string, storeId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, storeId },
    include: {
      orders: {
        where: { status: { in: ["PAID", "PRODUCTION", "READY", "COMPLETED"] } },
        include: {
          items: {
            include: {
              product: {
                include: {
                  recipeItems: { include: { ingredient: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function generateProductionSheet(
  campaignId: string
): Promise<ActionResult> {
  try {
    const { store } = await getStoreAndUser();

    const existingSheet = await prisma.productionSheet.findUnique({ where: { campaignId } });
    if (existingSheet?.startedAt) {
      return {
        success: false,
        error: "Produksi sudah dimulai untuk kampanye ini. Reset produksi terlebih dahulu jika ingin menghitung ulang.",
      };
    }

    const campaign = await fetchQualifyingOrders(campaignId, store.id);
    if (!campaign) return { success: false, error: "Kampanye tidak ditemukan" };

    const allItems = campaign.orders.flatMap((o) =>
      o.items.map((item) => ({
        quantity: item.quantity,
        product: item.product
          ? {
              recipeItems: item.product.recipeItems.map((ri) => ({
                quantity: Number(ri.quantity),
                ingredient: {
                  id: ri.ingredient.id,
                  name: ri.ingredient.name,
                  unit: ri.ingredient.unit,
                  averageCost: Number(ri.ingredient.averageCost),
                },
              })),
            }
          : null,
      }))
    );

    const needs = generateProductionNeeds(allItems);

    await prisma.productionSheet.upsert({
      where: { campaignId },
      update: {
        items: {
          deleteMany: {},
          create: needs.map((n) => ({
            ingredientId: n.ingredientId,
            ingredientName: n.ingredientName,
            unit: n.unit,
            totalQuantity: n.totalQuantity,
            estimatedCost: n.estimatedCost,
          })),
        },
      },
      create: {
        campaignId,
        items: {
          create: needs.map((n) => ({
            ingredientId: n.ingredientId,
            ingredientName: n.ingredientName,
            unit: n.unit,
            totalQuantity: n.totalQuantity,
            estimatedCost: n.estimatedCost,
          })),
        },
      },
    });

    revalidatePath(`/periode-po/${campaignId}/produksi`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("generateProductionSheet failed", err);
    return { success: false, error: "Terjadi kesalahan saat generate lembar produksi" };
  }
}

export async function getProductionSheet(campaignId: string) {
  const { store } = await getStoreAndUser();
  const sheet = await prisma.productionSheet.findFirst({
    where: { campaign: { id: campaignId, storeId: store.id } },
    include: { items: true, campaign: true },
  });
  if (!sheet) return null;

  const items = sheet.items.map((item) => ({
    ...item,
    totalQuantity: Number(item.totalQuantity),
    estimatedCost: Number(item.estimatedCost),
  }));

  const ingredientIds = items.map((i) => i.ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
  });
  const stockByIngredientId = new Map(ingredients.map((i) => [i.id, Number(i.currentStock)]));
  const availability = checkAvailability(items, stockByIngredientId);

  return { ...sheet, items, availability };
}

export async function startProduction(
  campaignId: string
): Promise<ActionResult<{ recordsCreated: number }>> {
  try {
    const { store, performedBy } = await getStoreAndUser();

    const sheet = await prisma.productionSheet.findFirst({
      where: { campaign: { id: campaignId, storeId: store.id } },
      include: { items: true },
    });
    if (!sheet) {
      return { success: false, error: "Generate lembar produksi terlebih dahulu sebelum memulai produksi" };
    }
    if (sheet.startedAt) {
      return { success: false, error: "Produksi untuk kampanye ini sudah dimulai" };
    }

    const campaign = await fetchQualifyingOrders(campaignId, store.id);
    if (!campaign) return { success: false, error: "Kampanye tidak ditemukan" };

    const productQuantities = new Map<string, number>();
    for (const order of campaign.orders) {
      for (const item of order.items) {
        if (!item.product) continue;
        const pid = item.product.id;
        productQuantities.set(pid, (productQuantities.get(pid) ?? 0) + item.quantity);
      }
    }

    const ingredientIds = sheet.items.map((i) => i.ingredientId);
    const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
    const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

    const deductionOps = sheet.items.flatMap((item) => {
      const ingredient = ingredientById.get(item.ingredientId);
      if (!ingredient) return [];
      const deductQty = Number(item.totalQuantity);
      const stockBefore = Number(ingredient.currentStock);
      const stockAfter = stockBefore - deductQty;
      return [
        prisma.stockMovement.create({
          data: {
            ingredientId: item.ingredientId,
            type: "DEDUCTION",
            quantityChange: -deductQty,
            resultingStock: stockAfter,
            referenceId: campaignId,
            performedBy: "Sistem (otomatis)",
          },
        }),
        prisma.ingredient.update({
          where: { id: item.ingredientId },
          data: { currentStock: { decrement: deductQty } },
        }),
      ];
    });

    const productIds = Array.from(productQuantities.keys());
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        recipeItems: { include: { ingredient: true } },
        additionalCosts: true,
      },
    });

    const recordOps = products.map((p) => {
      const quantity = productQuantities.get(p.id) ?? 0;
      const hpp = calculateHpp(
        p.recipeItems.map((ri) => ({
          quantity: Number(ri.quantity),
          ingredient: { averageCost: Number(ri.ingredient.averageCost) },
        })),
        p.additionalCosts.map((c) => ({ amount: Number(c.amount) })),
        p.costMode === "MANUAL" ? Number(p.manualCostPrice ?? 0) : undefined
      );
      return prisma.productionRecord.create({
        data: {
          productId: p.id,
          campaignId,
          quantity,
          producedBy: performedBy,
          totalCost: hpp * quantity,
        },
      });
    });

    await prisma.$transaction([
      ...deductionOps,
      ...recordOps,
      prisma.productionSheet.update({ where: { id: sheet.id }, data: { startedAt: new Date() } }),
    ]);

    revalidatePath(`/periode-po/${campaignId}/produksi`);
    return { success: true, data: { recordsCreated: recordOps.length } };
  } catch (err) {
    logger.error("startProduction failed", err);
    return { success: false, error: "Terjadi kesalahan saat memulai produksi" };
  }
}

export async function resetProductionSheet(campaignId: string): Promise<ActionResult> {
  try {
    const { store } = await getStoreAndUser();
    const sheet = await prisma.productionSheet.findFirst({
      where: { campaign: { id: campaignId, storeId: store.id } },
    });
    if (!sheet) return { success: false, error: "Lembar produksi tidak ditemukan" };

    await prisma.productionSheet.update({ where: { id: sheet.id }, data: { startedAt: null } });
    revalidatePath(`/periode-po/${campaignId}/produksi`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("resetProductionSheet failed", err);
    return { success: false, error: "Terjadi kesalahan saat mereset produksi" };
  }
}
