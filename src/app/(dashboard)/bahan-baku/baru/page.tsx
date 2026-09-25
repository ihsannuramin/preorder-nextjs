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
import { CurrencyInput } from "@/components/shared/currency-input";
import { createIngredientsBatch, type IngredientBatchRow } from "@/actions/ingredients";
import { UNIT_OPTIONS } from "@/lib/constants/units";
import { INGREDIENT_CATEGORY_OPTIONS } from "@/lib/constants/ingredient-categories";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Row = {
  name: string;
  category: string;
  unit: string;
  supplier: string;
  minimumStock: string;
  initialQuantity: string;
  initialCost: string;
  showInitialStock: boolean;
};

function emptyRow(): Row {
  return {
    name: "",
    category: "OTHER",
    unit: "",
    supplier: "",
    minimumStock: "",
    initialQuantity: "",
    initialCost: "",
    showInitialStock: false,
  };
}

export default function BahanBakuBaruPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  function updateRow(index: number, field: keyof Row, value: string | boolean) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const incomplete = rows.find((r) => !r.name.trim() || !r.unit);
    if (incomplete) {
      toast.error("Lengkapi nama dan satuan untuk semua bahan");
      return;
    }

    const payload: IngredientBatchRow[] = rows.map((r) => ({
      name: r.name,
      category: r.category,
      unit: r.unit,
      supplier: r.supplier || undefined,
      minimumStock: r.minimumStock ? parseFloat(r.minimumStock) : 0,
      initialQuantity: r.initialQuantity ? parseFloat(r.initialQuantity) : undefined,
      initialCost: r.initialCost ? parseFloat(r.initialCost) : undefined,
    }));

    startTransition(async () => {
      const result = await createIngredientsBatch(payload);
      if (result.success) {
        toast.success(
          result.data.count > 1
            ? `${result.data.count} bahan berhasil ditambahkan!`
            : "Bahan berhasil ditambahkan!"
        );
        router.push("/bahan-baku");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Tambah Bahan & Material"
        description="Bisa tambah lebih dari satu bahan sekaligus"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/bahan-baku"><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Link>
          </Button>
        }
      />

      <div className="max-w-form space-y-4">
        {rows.map((row, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bahan #{index + 1}</CardTitle>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${index}`}>Nama Bahan</Label>
                <Input
                  id={`name-${index}`}
                  value={row.name}
                  onChange={(e) => updateRow(index, "name", e.target.value)}
                  placeholder="Contoh: Kopi Arabika"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select
                    value={row.category}
                    onValueChange={(v) => updateRow(index, "category", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {INGREDIENT_CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Satuan</Label>
                  <Select
                    value={row.unit}
                    onValueChange={(v) => updateRow(index, "unit", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`supplier-${index}`}>Supplier (opsional)</Label>
                <Input
                  id={`supplier-${index}`}
                  value={row.supplier}
                  onChange={(e) => updateRow(index, "supplier", e.target.value)}
                  placeholder="Contoh: Toko Bahan Roti Jaya"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`minimumStock-${index}`}>Minimum Stok (opsional)</Label>
                <Input
                  id={`minimumStock-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.minimumStock}
                  onChange={(e) => updateRow(index, "minimumStock", e.target.value)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  Tandai stok menipis jika stok turun ke angka ini atau lebih rendah.
                </p>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => updateRow(index, "showInitialStock", !row.showInitialStock)}
                  className="text-sm font-medium text-primary-700"
                >
                  {row.showInitialStock ? "− Sembunyikan" : "+"} Stok Awal (opsional)
                </button>
                {row.showInitialStock && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`initialQuantity-${index}`}>Jumlah Awal</Label>
                      <Input
                        id={`initialQuantity-${index}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={row.initialQuantity}
                        onChange={(e) => updateRow(index, "initialQuantity", e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`initialCost-${index}`}>Biaya Pembelian</Label>
                      <CurrencyInput
                        id={`initialCost-${index}`}
                        value={row.initialCost}
                        onChange={(value) => updateRow(index, "initialCost", String(value))}
                        placeholder="180.000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground col-span-2">
                      Isi jika sudah punya stok sekarang. Kosongkan jika ingin mulai dari stok 0 dan catat pembelian nanti.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" className="w-full" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Bahan Lain
        </Button>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={isPending} className="flex-1 sm:flex-none">
            {isPending
              ? "Menyimpan..."
              : rows.length > 1
                ? `Simpan ${rows.length} Bahan`
                : "Simpan Bahan"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/bahan-baku">Batal</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
