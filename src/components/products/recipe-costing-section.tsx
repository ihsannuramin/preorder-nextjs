"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { AdditionalCostSection } from "@/components/products/additional-cost-section";
import { ProfitSimulator } from "@/components/products/profit-simulator";
import { calculateAdditionalCostsTotal } from "@/lib/utils/hpp";
import type { getProduct } from "@/actions/products";
import type { getAdditionalCosts } from "@/actions/additional-costs";

type ProductForSimulator = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
type AdditionalCostItem = Awaited<ReturnType<typeof getAdditionalCosts>>[number];

/**
 * Shared "Total HPP + Biaya Tambahan + Simulasi Harga" block, used both on the
 * recipe-setup page (/produk/[id]/resep) and the HPP tab on the product detail
 * page, so the two surfaces can never drift out of sync.
 *
 * `baseCostRow` is caller-rendered because MANUAL-mode products show an
 * editable cost input there (with its own save state), while RECIPE-mode
 * shows a read-only "Biaya Bahan" line — only `baseCost` (the number) is
 * shared for the total calculation.
 */
export function RecipeCostingSection({
  productId,
  baseCost,
  baseCostRow,
  initialAdditionalCosts,
  product,
}: {
  productId: string;
  baseCost: number;
  baseCostRow: React.ReactNode;
  initialAdditionalCosts: AdditionalCostItem[];
  product: ProductForSimulator;
}) {
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>(
    initialAdditionalCosts
  );
  const additionalCostTotal = calculateAdditionalCostsTotal(additionalCosts);
  const hpp = baseCost + additionalCostTotal;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total HPP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {baseCostRow}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Biaya Tambahan</span>
            <CurrencyDisplay amount={additionalCostTotal} size="sm" />
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total HPP</span>
            <CurrencyDisplay amount={hpp} size="sm" className="text-primary-700" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Biaya Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <AdditionalCostSection
            productId={productId}
            initialCosts={additionalCosts}
            onChange={setAdditionalCosts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulasi Harga &amp; Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitSimulator hpp={hpp} product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
