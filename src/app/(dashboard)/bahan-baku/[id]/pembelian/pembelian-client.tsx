"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { CurrencyInput } from "@/components/shared/currency-input";
import { getIngredient } from "@/actions/ingredients";
import { recordStockPurchase } from "@/actions/stock-movements";
import { UNIT_LABELS } from "@/lib/constants/units";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type SerializedIngredient = NonNullable<Awaited<ReturnType<typeof getIngredient>>>;

export function PembelianClient({ ingredient }: { ingredient: SerializedIngredient }) {
  const router = useRouter();
  const id = ingredient.id;
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");

  const unitLabel = UNIT_LABELS[ingredient.unit];
  const qty = parseFloat(quantity) || 0;
  const cost = parseFloat(purchaseCost) || 0;
  const newStock = ingredient.currentStock + qty;
  const newAverageCost =
    qty > 0 && cost > 0
      ? ingredient.currentStock === 0
        ? cost / qty
        : (ingredient.currentStock * ingredient.averageCost + cost) / newStock
      : ingredient.averageCost;

  function handleSubmit(formData: FormData) {
    formData.set("purchaseCost", purchaseCost);
    startTransition(async () => {
      const result = await recordStockPurchase(id, formData);
      if (result.success) {
        toast.success("Pembelian berhasil dicatat!");
        router.push(`/bahan-baku/${id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Catat Pembelian"
        description={`Stok saat ini: ${ingredient.currentStock} ${unitLabel}`}
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/bahan-baku/${id}`}><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Link>
          </Button>
        }
      />
      <Card className="max-w-form">
        <CardHeader>
          <CardTitle className="text-base">{ingredient.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseQuantity">Jumlah Dibeli ({unitLabel})</Label>
                <Input
                  id="purchaseQuantity"
                  name="purchaseQuantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchaseCost">Total Biaya</Label>
                <CurrencyInput
                  id="purchaseCost"
                  value={purchaseCost}
                  onChange={(value) => setPurchaseCost(String(value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Tanggal Pembelian</Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier">Supplier (opsional)</Label>
              <Input id="supplier" name="supplier" placeholder={ingredient.supplier ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Nomor Invoice (opsional)</Label>
              <Input id="invoiceNumber" name="invoiceNumber" />
            </div>

            {qty > 0 && cost > 0 && (
              <div className="rounded-lg border border-border bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stok baru</span>
                  <span className="font-semibold">{newStock} {unitLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Biaya rata-rata baru</span>
                  <CurrencyDisplay amount={newAverageCost} size="sm" className="font-semibold" />
                </div>
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Menyimpan..." : "Simpan Pembelian"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
