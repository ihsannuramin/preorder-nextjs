"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createProduct } from "@/actions/products";
import { CATEGORY_OPTIONS } from "@/lib/constants/categories";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProdukBaruPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState("OTHER");
  const [costMode, setCostMode] = useState<"RECIPE" | "MANUAL">("MANUAL");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    manualCostPrice: "",
  });
  const [images, setImages] = useState<string[]>([]);

  function handleSubmit() {
    if (!formData.name || !formData.basePrice) {
      toast.error("Nama produk dan harga wajib diisi");
      return;
    }
    if (costMode === "MANUAL" && !formData.manualCostPrice) {
      toast.error("Harga modal wajib diisi");
      return;
    }

    startTransition(async () => {
      const result = await createProduct({
        name: formData.name,
        description: formData.description,
        images,
        category,
        costMode,
        manualCostPrice:
          costMode === "MANUAL" ? parseFloat(formData.manualCostPrice) : undefined,
        basePrice: parseFloat(formData.basePrice),
        status: "DRAFT",
      });

      if (result.success) {
        toast.success("Produk berhasil dibuat!");
        if (costMode === "RECIPE") {
          router.push(`/produk/${result.data.id}/resep`);
        } else {
          router.push(`/produk/${result.data.id}`);
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  const steps = ["Informasi Dasar", "Harga & Publikasi"];

  return (
    <>
      <PageHeader
        title="Buat Produk Baru"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/produk">
              <ArrowLeft className="h-4 w-4 mr-1" />Kembali
            </Link>
          </Button>
        }
      />

      <div className="max-w-form space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  step === i + 1
                    ? "bg-primary text-white border-primary"
                    : step > i + 1
                    ? "bg-primary-50 text-primary-700 border-primary-200"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs hidden sm:block font-semibold ${
                  step === i + 1 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-border mx-1 min-w-[20px]" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image upload */}
              <div className="space-y-1.5">
                <Label>Foto Produk</Label>
                <MultiImageUpload value={images} onChange={setImages} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Produk <span className="text-error">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Gula Aren"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ceritakan produk ini..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cara Hitung Modal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCostMode("MANUAL")}
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${
                      costMode === "MANUAL"
                        ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Manual (Cepat)
                    <p className="text-[11px] font-normal mt-0.5">
                      Langsung isi modal per produk, tanpa atur komposisi bahan. Cocok buat mulai cepat.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostMode("RECIPE")}
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${
                      costMode === "RECIPE"
                        ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Pakai Komposisi Bahan
                    <p className="text-[11px] font-normal mt-0.5">
                      Untuk produk yang kamu buat sendiri dari bahan & material. Modal dan kebutuhan bahan dihitung otomatis.
                    </p>
                  </button>
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(2)}>
                Lanjut →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Price & Publish */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Harga &amp; Publikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="basePrice">
                  Harga Jual <span className="text-error">*</span>
                </Label>
                <CurrencyInput
                  id="basePrice"
                  value={formData.basePrice}
                  onChange={(value) => setFormData({ ...formData, basePrice: String(value) })}
                  placeholder="25.000"
                  required
                />
              </div>

              {costMode === "MANUAL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="manualCostPrice">
                    Harga Modal <span className="text-error">*</span>
                  </Label>
                  <CurrencyInput
                    id="manualCostPrice"
                    value={formData.manualCostPrice}
                    onChange={(value) =>
                      setFormData({ ...formData, manualCostPrice: String(value) })
                    }
                    placeholder="15.000"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Biaya modal per item, misalnya harga beli/produksi.</p>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg border border-border p-4 bg-muted space-y-2 shadow-sm">
                <p className="text-sm font-bold text-foreground">Ringkasan Produk</p>
                {images[0] && (
                  <div className="w-12 h-12 rounded-lg border border-border overflow-hidden">
                    <img
                      src={images[0]}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Nama: <span className="text-foreground font-semibold">{formData.name || "—"}</span></p>
                <p className="text-sm text-muted-foreground">
                  Status:{" "}
                  <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-semibold text-foreground">
                    Draft
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  ← Kembali
                </Button>
                <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                  {isPending ? "Menyimpan..." : "Buat Produk"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
