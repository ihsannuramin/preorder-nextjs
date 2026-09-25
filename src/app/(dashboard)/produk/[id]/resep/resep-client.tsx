"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { OnboardingHint } from "@/components/shared/onboarding-hint";
import { AddIngredientDialog } from "@/components/products/add-ingredient-dialog";
import { RecipeCostingSection } from "@/components/products/recipe-costing-section";
import { removeRecipeItem, getRecipeItems } from "@/actions/recipes";
import { calculateHpp } from "@/lib/utils/hpp";
import { UNIT_LABELS } from "@/lib/constants/units";
import { toDisplayUnit } from "@/lib/utils/units";
import type { getProduct } from "@/actions/products";
import { ArrowLeft, Trash2, Boxes, Wallet } from "lucide-react";
import Link from "next/link";

type ProductForResep = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type RecipeWithIngredient = ProductForResep["recipeItems"][number];

export function ResepClient({
  product,
  initialRecipeItems,
}: {
  product: ProductForResep;
  initialRecipeItems: RecipeWithIngredient[];
}) {
  const productId = product.id;
  const [isPending, startTransition] = useTransition();
  const [recipeItems, setRecipeItems] = useState<RecipeWithIngredient[]>(initialRecipeItems);

  const ingredientsCost = calculateHpp(
    recipeItems.map((ri) => ({
      quantity: Number(ri.quantity),
      ingredient: { averageCost: Number(ri.ingredient.averageCost) },
    }))
  );

  function refreshRecipe() {
    getRecipeItems(productId).then((recipe) => setRecipeItems(recipe as RecipeWithIngredient[]));
  }

  function handleRemove(ingredientId: string) {
    startTransition(async () => {
      const result = await removeRecipeItem(productId, ingredientId);
      if (result.success) {
        setRecipeItems((prev) => prev.filter((ri) => ri.ingredientId !== ingredientId));
        toast.success("Bahan dihapus");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Komposisi Bahan"
        description="Bahan, biaya tambahan, dan harga jual — semua di satu halaman"
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/produk/${productId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />Kembali
            </Link>
          </Button>
        }
      />

      <div className="max-w-form space-y-6">
        <OnboardingHint
          id="resep-first-time"
          show={initialRecipeItems.length === 0}
          message="Tambahkan bahan produk ini dulu. Setelah itu kamu bisa langsung atur biaya tambahan (kemasan, dll) dan simulasikan harga jual — tanpa pindah halaman."
          side="bottom"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  1. Bahan & Material
                </CardTitle>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Subtotal Bahan</p>
                  <CurrencyDisplay amount={ingredientsCost} size="lg" className="text-primary-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipeItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada bahan. Tambahkan bahan untuk menghitung HPP.
                </p>
              ) : (
                <div className="space-y-2">
                  {recipeItems.map((ri) => {
                    const cost = Number(ri.ingredient.averageCost) * Number(ri.quantity);
                    const display = toDisplayUnit(Number(ri.quantity), ri.ingredient.unit);
                    return (
                      <div
                        key={ri.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{ri.ingredient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {display.value} {UNIT_LABELS[display.unit]} ·{" "}
                            <CurrencyDisplay amount={cost} size="sm" />
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemove(ri.ingredientId)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <AddIngredientDialog
                productId={productId}
                existingIngredientIds={recipeItems.map((ri) => ri.ingredientId)}
                onAdded={refreshRecipe}
              />
            </CardContent>
          </Card>
        </OnboardingHint>

        <div>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2 px-1">
            <Wallet className="h-4 w-4" />
            2. Biaya Tambahan &amp; Harga Jual
          </h2>
          <RecipeCostingSection
            productId={productId}
            baseCost={ingredientsCost}
            baseCostRow={
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Bahan</span>
                <CurrencyDisplay amount={ingredientsCost} size="sm" />
              </div>
            }
            initialAdditionalCosts={product.additionalCosts}
            product={product}
          />
        </div>

        <Button asChild className="w-full">
          <Link href={`/produk/${productId}`}>Selesai &amp; Lihat Produk</Link>
        </Button>
      </div>
    </>
  );
}
