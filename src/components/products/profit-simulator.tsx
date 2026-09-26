"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { CurrencyInput } from "@/components/shared/currency-input";
import {
  calculatePriceFromMargin,
  calculatePriceFromMarkup,
  calculateMargin,
  calculateProfit,
} from "@/lib/utils/hpp";
import { updateProduct, getProduct } from "@/actions/products";
import { cn } from "@/lib/utils/cn";

type Mode = "manual" | "margin" | "markup";

type ProductForSimulator = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export function ProfitSimulator({ hpp, product }: { hpp: number; product: ProductForSimulator }) {
  const [mode, setMode] = useState<Mode>("manual");
  const [manualPrice, setManualPrice] = useState(String(Number(product.basePrice)));
  const [marginPercent, setMarginPercent] = useState("40");
  const [markup, setMarkup] = useState("2");
  const [sellingPrice, setSellingPrice] = useState(Number(product.basePrice));
  const [isPending, startTransition] = useTransition();

  const recommendedPrice =
    mode === "margin"
      ? calculatePriceFromMargin(hpp, parseFloat(marginPercent) || 0)
      : mode === "markup"
        ? calculatePriceFromMarkup(hpp, parseFloat(markup) || 0)
        : parseFloat(manualPrice) || 0;

  const previewPrice = mode === "manual" ? parseFloat(manualPrice) || 0 : recommendedPrice;
  const profit = calculateProfit(sellingPrice, hpp);
  const margin = calculateMargin(sellingPrice, hpp);

  function handleApply() {
    const newPrice = Number.isFinite(previewPrice) ? previewPrice : 0;
    startTransition(async () => {
      const result = await updateProduct(product.id, { basePrice: newPrice });
      if (result.success) {
        setSellingPrice(newPrice);
        toast.success("Harga jual diperbarui!");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["manual", "margin", "markup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 text-sm font-semibold px-3 py-2 rounded-input border border-border transition-colors",
              mode === m ? "bg-primary text-white" : "bg-white text-muted-foreground"
            )}
          >
            {m === "manual" ? "Manual" : m === "margin" ? "Target Margin" : "Markup"}
          </button>
        ))}
      </div>

      {mode === "manual" && (
        <div className="space-y-1.5">
          <Label htmlFor="manualPrice">Harga Jual</Label>
          <CurrencyInput
            id="manualPrice"
            value={manualPrice}
            onChange={(value) => setManualPrice(String(value))}
          />
        </div>
      )}

      {mode === "margin" && (
        <div className="space-y-1.5">
          <Label htmlFor="marginPercent">Target Margin (%)</Label>
          <Input
            id="marginPercent"
            type="number"
            min="0"
            max="99"
            value={marginPercent}
            onChange={(e) => setMarginPercent(e.target.value)}
          />
        </div>
      )}

      {mode === "markup" && (
        <div className="space-y-2">
          <Label htmlFor="markup">Markup (x)</Label>
          <Input
            id="markup"
            type="number"
            min="0"
            step="0.1"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
          />
          <div className="flex gap-2">
            {["2", "2.5", "3"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarkup(m)}
                className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-primary-300"
              >
                {m}x
              </button>
            ))}
          </div>
        </div>
      )}

      {mode !== "manual" && (
        <div className="rounded-lg border border-border bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Harga Jual yang Disarankan</p>
          <CurrencyDisplay
            amount={Number.isFinite(recommendedPrice) ? recommendedPrice : 0}
            size="lg"
            className="font-bold text-primary-700"
          />
        </div>
      )}

      <Button onClick={handleApply} disabled={isPending} className="w-full">
        {isPending ? "Menyimpan..." : "Terapkan Harga"}
      </Button>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        <div className="rounded-lg border border-border bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Harga Jual Saat Ini</p>
          <CurrencyDisplay amount={sellingPrice} size="sm" className="font-bold" />
        </div>
        <div className="rounded-lg border border-border bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Modal (HPP)</p>
          <CurrencyDisplay amount={hpp} size="sm" className="font-bold text-muted-foreground" />
        </div>
        <div className="rounded-lg border border-border bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Profit</p>
          <CurrencyDisplay
            amount={profit}
            size="sm"
            className={cn("font-bold", profit >= 0 ? "text-success-700" : "text-error")}
          />
        </div>
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-center">
          <p className="text-xs text-foreground mb-1">Margin</p>
          <p className="font-bold text-sm text-foreground">{margin.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
