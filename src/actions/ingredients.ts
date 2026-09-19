"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import { ingredientSchema, ingredientMetaSchema } from "@/lib/validations/ingredient";
import { applyPurchase } from "@/lib/utils/stock";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:ingredients");

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

function serializeIngredient<
  T extends {
    purchaseQty: unknown;
    purchasePrice: unknown;
    currentStock: unknown;
    averageCost: unknown;
    minimumStock: unknown;
  },
>(i: T) {
  return {
    ...i,
    purchaseQty: Number(i.purchaseQty),
    purchasePrice: Number(i.purchasePrice),
    currentStock: Number(i.currentStock),
    averageCost: Number(i.averageCost),
    minimumStock: Number(i.minimumStock),
  };
}

export async function getIngredients() {
  const { store } = await getStoreAndUser();
  const rows = await prisma.ingredient.findMany({
    where: { storeId: store.id },
    orderBy: { name: "asc" },
  });
  return rows.map(serializeIngredient);
}

export async function getIngredientsList(filters?: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const { store } = await getStoreAndUser();
  const pageSize = filters?.pageSize ?? 10;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters?.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters?.category ? { category: filters.category as any } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.ingredient.count({ where }),
  ]);

  return { data: rows.map(serializeIngredient), total };
}

export async function getIngredient(id: string) {
  const { store } = await getStoreAndUser();
  const row = await prisma.ingredient.findFirst({
    where: { id, storeId: store.id },
  });
  if (!row) return null;

  const movements = await prisma.stockMovement.findMany({
    where: { ingredientId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    ...serializeIngredient(row),
    inventoryValue: Number(row.currentStock) * Number(row.averageCost),
    stockMovements: movements.map((m) => ({
      ...m,
      quantityChange: Number(m.quantityChange),
      resultingStock: Number(m.resultingStock),
      unitCost: m.unitCost === null ? null : Number(m.unitCost),
    })),
  };
}

export async function createIngredient(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { store, performedBy } = await getStoreAndUser();
    const raw = {
      name: formData.get("name"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      supplier: formData.get("supplier") || undefined,
      minimumStock: formData.get("minimumStock") || 0,
      initialQuantity: formData.get("initialQuantity") || undefined,
      initialCost: formData.get("initialCost") || undefined,
    };

    const parsed = ingredientSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { initialQuantity, initialCost, ...metaData } = parsed.data;

    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: {
          name: metaData.name,
          category: metaData.category,
          unit: metaData.unit,
          supplier: metaData.supplier,
          minimumStock: metaData.minimumStock,
          storeId: store.id,
          purchaseQty: initialQuantity ?? 0,
          purchasePrice: initialCost ?? 0,
          currentStock: 0,
          averageCost: 0,
        },
      });

      if (initialQuantity && initialCost) {
        await applyPurchase(
          tx,
          created.id,
          0,
          0,
          initialQuantity,
          initialCost,
          performedBy,
          "Stok awal saat pembuatan bahan baku"
        );
        return tx.ingredient.findUniqueOrThrow({ where: { id: created.id } });
      }

      return created;
    });

    revalidatePath("/bahan-baku");
    return { success: true, data: { id: ingredient.id } };
  } catch (err) {
    logger.error("createIngredient failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export type IngredientBatchRow = {
  name: string;
  category: string;
  unit: string;
  supplier?: string;
  minimumStock?: number;
  initialQuantity?: number;
  initialCost?: number;
};

export async function createIngredientsBatch(
  rows: IngredientBatchRow[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const { store, performedBy } = await getStoreAndUser();

    if (rows.length === 0) {
      return { success: false, error: "Tambahkan minimal 1 bahan baku" };
    }

    const parsedRows: z.infer<typeof ingredientSchema>[] = [];
    for (const [index, row] of rows.entries()) {
      const parsed = ingredientSchema.safeParse(row);
      if (!parsed.success) {
        return {
          success: false,
          error: `Baris ${index + 1}: ${parsed.error.issues[0].message}`,
        };
      }
      parsedRows.push(parsed.data);
    }

    await prisma.$transaction(async (tx) => {
      for (const row of parsedRows) {
        const { initialQuantity, initialCost, ...metaData } = row;
        const created = await tx.ingredient.create({
          data: {
            name: metaData.name,
            category: metaData.category,
            unit: metaData.unit,
            supplier: metaData.supplier,
            minimumStock: metaData.minimumStock,
            storeId: store.id,
            purchaseQty: initialQuantity ?? 0,
            purchasePrice: initialCost ?? 0,
            currentStock: 0,
            averageCost: 0,
          },
        });

        if (initialQuantity && initialCost) {
          await applyPurchase(
            tx,
            created.id,
            0,
            0,
            initialQuantity,
            initialCost,
            performedBy,
            "Stok awal saat pembuatan bahan baku"
          );
        }
      }
    });

    revalidatePath("/bahan-baku");
    return { success: true, data: { count: parsedRows.length } };
  } catch (err) {
    logger.error("createIngredientsBatch failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function updateIngredient(
  id: string,
  formData: FormData
): Promise<ActionResult<ReturnType<typeof serializeIngredient>>> {
  try {
    const { store } = await getStoreAndUser();
    const raw = {
      name: formData.get("name"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      supplier: formData.get("supplier") || undefined,
      minimumStock: formData.get("minimumStock") || 0,
    };

    const parsed = ingredientMetaSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const ingredient = await prisma.ingredient.update({
      where: { id, storeId: store.id },
      data: parsed.data,
    });
    revalidatePath("/bahan-baku");
    revalidatePath(`/bahan-baku/${id}`);
    return { success: true, data: serializeIngredient(ingredient) };
  } catch (err) {
    logger.error("updateIngredient failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  try {
    const { store } = await getStoreAndUser();
    await prisma.ingredient.delete({ where: { id, storeId: store.id } });
    revalidatePath("/bahan-baku");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("deleteIngredient failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}
