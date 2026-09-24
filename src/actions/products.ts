"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { calculateHpp } from "@/lib/utils/hpp";
import { calculateCapacity } from "@/lib/utils/production";
import { productSchema, productUpdateSchema, type ProductInput } from "@/lib/validations/product";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:products");

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

function serializeProduct<
  T extends {
    basePrice: unknown;
    manualCostPrice?: unknown;
    recipeItems: Array<{
      quantity: unknown;
      ingredient: {
        purchaseQty: unknown;
        purchasePrice: unknown;
        averageCost: unknown;
        currentStock: unknown;
        minimumStock: unknown;
      };
    }>;
  },
>(p: T) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    manualCostPrice: p.manualCostPrice != null ? Number(p.manualCostPrice) : null,
    recipeItems: p.recipeItems.map((ri) => ({
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
    })),
  };
}

export async function getProducts() {
  const store = await getStore();
  const rows = await prisma.product.findMany({
    where: { storeId: store.id },
    include: { recipeItems: { include: { ingredient: true } } },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(serializeProduct);
}

export async function getProductsList(filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const store = await getStore();
  const pageSize = filters?.pageSize ?? 10;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters?.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { recipeItems: { include: { ingredient: true } }, additionalCosts: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { data: rows.map(serializeProduct), total };
}

export async function getProduct(id: string) {
  const store = await getStore();
  const row = await prisma.product.findFirst({
    where: { id, storeId: store.id },
    include: {
      recipeItems: { include: { ingredient: true } },
      additionalCosts: true,
    },
  });
  if (!row) return null;
  return {
    ...serializeProduct(row),
    additionalCosts: row.additionalCosts.map((c) => ({ ...c, amount: Number(c.amount) })),
  };
}

export async function createProduct(data: {
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  category: string;
  costMode?: string;
  manualCostPrice?: number;
  basePrice: number;
  status: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    const input = parsed.data;

    const store = await getStore();
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: input.name,
        description: input.description,
        imageUrl: input.images?.[0] ?? input.imageUrl,
        images: input.images ?? [],
        category: input.category,
        costMode: input.costMode,
        manualCostPrice: input.manualCostPrice,
        basePrice: input.basePrice,
        status: input.status,
      },
    });
    revalidatePath("/produk");
    return { success: true, data: { id: product.id } };
  } catch (err) {
    logger.error("createProduct failed", err);
    return { success: false, error: "Terjadi kesalahan saat membuat produk" };
  }
}

export async function updateProduct(
  id: string,
  data: Partial<ProductInput>
): Promise<ActionResult> {
  try {
    const parsed = productUpdateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    const { images, ...rest } = parsed.data;

    const store = await getStore();
    await prisma.product.update({
      where: { id, storeId: store.id },
      data: {
        ...rest,
        ...(images ? { images, imageUrl: images[0] } : {}),
      },
    });
    revalidatePath("/produk");
    revalidatePath(`/produk/${id}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("updateProduct failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    await prisma.product.delete({ where: { id, storeId: store.id } });
    revalidatePath("/produk");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error("deleteProduct failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getProductHpp(productId: string): Promise<number> {
  const store = await getStore();
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    include: {
      recipeItems: { include: { ingredient: true } },
      additionalCosts: true,
    },
  });
  if (!product) return 0;

  return calculateHpp(
    product.recipeItems.map((ri) => ({
      quantity: Number(ri.quantity),
      ingredient: { averageCost: Number(ri.ingredient.averageCost) },
    })),
    product.additionalCosts.map((c) => ({ amount: Number(c.amount) })),
    product.costMode === "MANUAL" ? Number(product.manualCostPrice ?? 0) : undefined
  );
}

export async function getProductCapacity(productId: string): Promise<number> {
  const store = await getStore();
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    include: { recipeItems: { include: { ingredient: true } } },
  });
  if (!product) return 0;

  return calculateCapacity(
    product.recipeItems.map((ri) => ({
      quantity: Number(ri.quantity),
      ingredient: { currentStock: Number(ri.ingredient.currentStock) },
    }))
  );
}

export async function getProductionRecords(productId: string) {
  const store = await getStore();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return [];

  const rows = await prisma.productionRecord.findMany({
    where: { productId },
    include: { campaign: { select: { name: true } } },
    orderBy: { productionDate: "desc" },
  });
  return rows.map((r) => ({ ...r, totalCost: Number(r.totalCost) }));
}
