"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { getIngredient } from "@/actions/ingredients";
import { recordStockAdjustment } from "@/actions/stock-movements";
import { UNIT_LABELS } from "@/lib/constants/units";
import { ADJUSTMENT_REASON_OPTIONS } from "@/lib/constants/ingredient-categories";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type SerializedIngredient = NonNullable<Awaited<ReturnType<typeof getIngredient>>>;

export function PenyesuaianClient({ ingredient }: { ingredient: SerializedIngredient }) {
  const router = useRouter();
  const id = ingredient.id;
  const [isPending, startTransition] = useTransition();
  const [newStock, setNewStock] = useState(String(ingredient.currentStock));
  const [reason, setReason] = useState("CORRECTION");

  const unitLabel = UNIT_LABELS[ingredient.unit];
  const delta = (parseFloat(newStock) || 0) - ingredient.currentStock;

  function handleSubmit(formData: FormData) {
    formData.set("quantityChange", String(delta));
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await recordStockAdjustment(id, formData);
      if (result.success) {
        toast.success("Stok berhasil disesuaikan!");
        router.push(`/bahan-baku/${id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Sesuaikan Stok"
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
            <div className="space-y-1.5">
              <Label htmlFor="newStockDisplay">Stok Aktual ({unitLabel})</Label>
              <Input
                id="newStockDisplay"
                type="number"
                step="0.01"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
              <p className={`text-xs ${delta >= 0 ? "text-success-700" : "text-error"}`}>
                Perubahan: {delta >= 0 ? "+" : ""}{delta} {unitLabel}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Alasan</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASON_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Catatan {reason !== "CORRECTION" ? "(wajib)" : "(opsional)"}</Label>
              <Input id="note" name="note" placeholder="Detail tambahan..." required={reason !== "CORRECTION"} />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Menyimpan..." : "Simpan Penyesuaian"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
