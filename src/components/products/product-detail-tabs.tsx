"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { CurrencyInput } from "@/components/shared/currency-input";
import { RecipeCostingSection } from "@/components/products/recipe-costing-section";
import { calculateIngredientsCost } from "@/lib/utils/hpp";
import { isRecipeSetupIncomplete } from "@/lib/utils/product-setup";
import { CATEGORY_LABELS } from "@/lib/constants/categories";
import { UNIT_LABELS } from "@/lib/constants/units";
import { toDisplayUnit } from "@/lib/utils/units";
import { updateProduct } from "@/actions/products";
import type { getProduct, getProductionRecords } from "@/actions/products";
import { Boxes, ImageIcon, Factory, History, AlertTriangle } from "lucide-react";
import type { ProductStatus } from "@prisma/client";
import { ProductImageUpload } from "@/app/(dashboard)/produk/[id]/product-image-upload";
import { ProductStatusActions } from "@/app/(dashboard)/produk/[id]/product-status-actions";

type ProductForTabs = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
type ProductionRecord = Awaited<ReturnType<typeof getProductionRecords>>[number];

const statusConfig: Record<ProductStatus, { label: string; variant: any }> = {
  DRAFT: { label: "Draf", variant: "secondary" },
  PUBLISHED: { label: "Terbit", variant: "success" },
  ARCHIVED: { label: "Arsip", variant: "outline" },
};

export function ProductDetailTabs({
  product,
  capacity,
  productionRecords,
}: {
  product: ProductForTabs;
  capacity: number;
  productionRecords: ProductionRecord[];
}) {
  const isManual = product.costMode === "MANUAL";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [manualCostInput, setManualCostInput] = useState(
    product.manualCostPrice != null ? String(product.manualCostPrice) : ""
  );
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const [activeImage, setActiveImage] = useState(0);

  function handleSaveManualCost() {
    const value = parseFloat(manualCostInput);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Harga modal tidak valid");
      return;
    }
    startTransition(async () => {
      const result = await updateProduct(product.id, { manualCostPrice: value });
      if (result.success) {
        toast.success("Harga modal diperbarui");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const ingredientsCost = calculateIngredientsCost(
    product.recipeItems.map((ri) => ({
      quantity: Number(ri.quantity),
      ingredient: { averageCost: Number(ri.ingredient.averageCost) },
    }))
  );
  const baseCost = isManual ? Number(product.manualCostPrice ?? 0) : ingredientsCost;
  const cfg = statusConfig[product.status];
  const setupIncomplete = isRecipeSetupIncomplete(product);

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {!isManual && <TabsTrigger value="recipe">Komposisi Bahan</TabsTrigger>}
        <TabsTrigger value="costing">Modal (HPP)</TabsTrigger>
        {!isManual && <TabsTrigger value="production">Produksi</TabsTrigger>}
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {setupIncomplete && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-foreground">
                Komposisi bahan belum lengkap. Lengkapi bahan & biaya tambahan supaya modal per produk (HPP) akurat.
              </p>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0" asChild>
              <Link href={`/produk/${product.id}/resep`}>Lengkapi</Link>
            </Button>
          </div>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {CATEGORY_LABELS[product.category]}
                </p>
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {galleryImages.length > 0 && (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-lg border border-border overflow-hidden shadow-sm bg-muted">
                  <Image
                    src={galleryImages[activeImage] ?? galleryImages[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                    priority
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {galleryImages.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`relative flex-shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                          i === activeImage ? "border-border shadow-sm" : "border-border"
                        }`}
                      >
                        <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="rounded-lg border border-border bg-muted p-3 text-center shadow-sm">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Harga Jual</p>
              <CurrencyDisplay
                amount={Number(product.basePrice)}
                size="sm"
                className="font-bold text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Foto Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageUpload
              productId={product.id}
              initialImages={product.images}
              initialUrl={product.imageUrl}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductStatusActions productId={product.id} status={product.status} />
          </CardContent>
        </Card>
      </TabsContent>

      {!isManual && (
      <TabsContent value="recipe" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Komposisi Bahan
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/produk/${product.id}/resep`}>Atur Komposisi Bahan</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {product.recipeItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada komposisi bahan. Tambahkan bahan supaya modal per produk (HPP) terhitung.
              </p>
            ) : (
              <div className="space-y-2">
                {product.recipeItems.map((ri) => {
                  const display = toDisplayUnit(Number(ri.quantity), ri.ingredient.unit);
                  return (
                    <div
                      key={ri.id}
                      className="flex justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-foreground">{ri.ingredient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {display.value} {UNIT_LABELS[display.unit]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      )}

      <TabsContent value="costing" className="space-y-4">
        <RecipeCostingSection
          productId={product.id}
          baseCost={baseCost}
          initialAdditionalCosts={product.additionalCosts}
          product={product}
          baseCostRow={
            isManual ? (
              <div className="space-y-1.5">
                <Label htmlFor="manualCostPrice">Harga Modal</Label>
                <div className="flex gap-2">
                  <CurrencyInput
                    id="manualCostPrice"
                    value={manualCostInput}
                    onChange={(value) => setManualCostInput(String(value))}
                  />
                  <Button onClick={handleSaveManualCost} disabled={isPending} size="sm">
                    {isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Bahan</span>
                <CurrencyDisplay amount={ingredientsCost} size="sm" />
              </div>
            )
          }
        />
      </TabsContent>

      {!isManual && (
      <TabsContent value="production" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Kapasitas Produksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Bisa Produksi</p>
              <p className="font-bold text-2xl text-foreground">
                {Number.isFinite(capacity) ? `${capacity} pcs` : "—"}
              </p>
              {!Number.isFinite(capacity) && (
                <p className="text-xs text-muted-foreground mt-1">Belum ada komposisi bahan</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Produksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productionRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada produksi. Mulai produksi dari halaman Periode PO.
              </p>
            ) : (
              <div className="space-y-2">
                {productionRecords.map((r) => (
                  <div key={r.id} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.productionDate).toLocaleDateString("id-ID")} · {r.producedBy}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{r.quantity} pcs</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      )}
    </Tabs>
  );
}
