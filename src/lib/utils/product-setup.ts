import type { ProductCostMode } from "@prisma/client";

export function isRecipeSetupIncomplete(product: {
  costMode: ProductCostMode;
  recipeItems: unknown[];
  additionalCosts: unknown[];
}): boolean {
  if (product.costMode !== "RECIPE") return false;
  return product.recipeItems.length === 0 || product.additionalCosts.length === 0;
}
