"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { getIngredient, updateIngredient, deleteIngredient } from "@/actions/ingredients";
import { UNIT_LABELS, UNIT_OPTIONS } from "@/lib/constants/units";
import { INGREDIENT_CATEGORY_OPTIONS } from "@/lib/constants/ingredient-categories";
import { ArrowLeft, Trash2, ShoppingCart, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

type SerializedIngredient = NonNullable<Awaited<ReturnType<typeof getIngredient>>>;

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Pembelian",
  DEDUCTION: "Pemakaian",
  ADJUSTMENT: "Penyesuaian",
};

export function IngredientDetailClient({ ingredient: initial }: { ingredient: SerializedIngredient }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ingredient] = useState(initial);
  const [unit, setUnit] = useState<string>(initial.unit);
  const [category, setCategory] = useState<string>(initial.category);

  const id = ingredient.id;
  const unitLabel = UNIT_LABELS[ingredient.unit];
  const isOut = ingredient.currentStock <= 0;
  const isLow = !isOut && ingredient.currentStock <= ingredient.minimumStock;

  function handleSubmit(formData: FormData) {
    formData.set("unit", unit);
    formData.set("category", category);
    startTransition(async () => {
      const result = await updateIngredient(id, formData);
      if (result.success) {
        toast.success("Bahan berhasil diperbarui!");
        router.push("/bahan-baku");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIngredient(id);
      if (result.success) {
        toast.success("Bahan dihapus");
        router.push("/bahan-baku");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title={ingredient.name}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/bahan-baku"><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="max-w-form space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Stok &amp; Biaya</CardTitle>
              <div className="flex gap-1">
                {isOut && <Badge variant="destructive">Stok Habis</Badge>}
                {isLow && <Badge variant="warning">Stok Menipis</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Stok Saat Ini</p>
                <p className="font-bold text-sm">{ingredient.currentStock} {unitLabel}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Biaya Rata-rata</p>
                <CurrencyDisplay amount={ingredient.averageCost} size="sm" className="font-bold" />
              </div>
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
                <p className="text-xs text-foreground mb-1">Nilai Stok</p>
                <CurrencyDisplay amount={ingredient.inventoryValue} size="sm" className="font-bold text-foreground" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/bahan-baku/${id}/pembelian`}>
                  <ShoppingCart className="h-4 w-4 mr-1" />Catat Pembelian
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/bahan-baku/${id}/penyesuaian`}>
                  <SlidersHorizontal className="h-4 w-4 mr-1" />Sesuaikan Stok
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Info Bahan</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Bahan</Label>
                <Input id="name" name="name" defaultValue={ingredient.name} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INGREDIENT_CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Satuan</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplier">Supplier (opsional)</Label>
                <Input id="supplier" name="supplier" defaultValue={ingredient.supplier ?? ""} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minimumStock">Minimum Stok (opsional)</Label>
                <Input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={ingredient.minimumStock}
                />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Pergerakan Stok</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredient.stockMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pergerakan stok.</p>
            ) : (
              <div className="space-y-2">
                {ingredient.stockMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                        {m.reason ? ` · ${m.reason}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("id-ID")} · {m.performedBy}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${m.quantityChange >= 0 ? "text-success-700" : "text-error"}`}>
                      {m.quantityChange >= 0 ? "+" : ""}{m.quantityChange} {unitLabel}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus Bahan"
        description="Tindakan ini tidak bisa dibatalkan. Bahan ini, komposisi produk yang memakainya, dan riwayat pergerakan stok akan ikut terhapus."
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  );
}
