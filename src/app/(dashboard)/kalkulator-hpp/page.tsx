"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/shared/currency-input";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Plus, Trash2 } from "lucide-react";
import {
  calculateSimpleHpp,
  calculatePriceFromMargin,
  calculateProfit,
} from "@/lib/utils/hpp";

const MARGINS = [25, 35, 50];

type CostItem = { label: string; amount: number };

function emptyItem(): CostItem {
  return { label: "", amount: 0 };
}

function CostItemList({
  items,
  onAdd,
  onUpdate,
  onRemove,
  labelPlaceholder,
}: {
  items: CostItem[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CostItem>) => void;
  onRemove: (index: number) => void;
  labelPlaceholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder={labelPlaceholder}
            className="flex-1"
          />
          <CurrencyInput
            value={item.amount}
            onChange={(value) => onUpdate(index, { amount: value })}
            className="w-40"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onRemove(index)}
            aria-label="Hapus"
            disabled={items.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" />
        Tambah
      </Button>
    </div>
  );
}

function useCostItemList(initial: CostItem[] = [emptyItem()]) {
  const [items, setItems] = useState<CostItem[]>(initial);

  function add() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function update(index: number, patch: Partial<CostItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return { items, add, update, remove, total };
}

export default function KalkulatorHppPage() {
  const bahanBaku = useCostItemList();
  const tenagaKerja = useCostItemList();
  const overhead = useCostItemList();
  const [jumlahProduk, setJumlahProduk] = useState("");

  const jumlah = parseInt(jumlahProduk, 10) || 0;
  const hpp = calculateSimpleHpp(bahanBaku.total, tenagaKerja.total, overhead.total, jumlah);

  return (
    <>
      <PageHeader
        title="Kalkulator HPP"
        description="Hitung Harga Pokok Produksi (HPP) dan harga jual berdasarkan margin keuntungan"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Langkah 1 — Bahan yang Dibeli</CardTitle>
          </CardHeader>
          <CardContent>
            <CostItemList
              items={bahanBaku.items}
              onAdd={bahanBaku.add}
              onUpdate={bahanBaku.update}
              onRemove={bahanBaku.remove}
              labelPlaceholder="Contoh: Gula 1kg"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Langkah 2 — Biaya Tenaga Kerja</CardTitle>
          </CardHeader>
          <CardContent>
            <CostItemList
              items={tenagaKerja.items}
              onAdd={tenagaKerja.add}
              onUpdate={tenagaKerja.update}
              onRemove={tenagaKerja.remove}
              labelPlaceholder="Contoh: Upah karyawan"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Langkah 3 — Biaya Overhead</CardTitle>
          </CardHeader>
          <CardContent>
            <CostItemList
              items={overhead.items}
              onAdd={overhead.add}
              onUpdate={overhead.update}
              onRemove={overhead.remove}
              labelPlaceholder="Contoh: Listrik, gas, sewa"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Langkah 4 — Jumlah Produk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor="jumlahProduk">Total produk yang dihasilkan</Label>
            <Input
              id="jumlahProduk"
              type="number"
              min="0"
              placeholder="Contoh: 100"
              value={jumlahProduk}
              onChange={(e) => setJumlahProduk(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hasil Kalkulasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">HPP per Produk</p>
              <CurrencyDisplay amount={hpp} size="xl" className="font-bold text-primary-700" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Pilihan Harga Jual per Margin Keuntungan
              </p>
              {MARGINS.map((margin) => {
                const price = calculatePriceFromMargin(hpp, margin);
                const profit = calculateProfit(price, hpp);
                return (
                  <div
                    key={margin}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <span className="text-sm font-semibold">{margin}%</span>
                    <div className="text-right">
                      <CurrencyDisplay amount={price} size="md" className="font-bold" />
                      <p className="text-xs text-muted-foreground">
                        untung <CurrencyDisplay amount={profit} size="sm" />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
