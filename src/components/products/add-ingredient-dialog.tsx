"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { CurrencyInput } from "@/components/shared/currency-input";
import { getIngredients, createIngredient } from "@/actions/ingredients";
import { addRecipeItem } from "@/actions/recipes";
import { UNIT_LABELS, UNIT_OPTIONS } from "@/lib/constants/units";
import { getInputUnitOptions, getDefaultInputUnit, toBaseUnit } from "@/lib/utils/units";
import { Plus, Search, ArrowLeft } from "lucide-react";
import type { Unit } from "@prisma/client";

type IngredientOption = Awaited<ReturnType<typeof getIngredients>>[number];

export function AddIngredientDialog({
  productId,
  existingIngredientIds,
  onAdded,
}: {
  productId: string;
  existingIngredientIds: string[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"search" | "create">("search");
  const [isPending, startTransition] = useTransition();
  const [allIngredients, setAllIngredients] = useState<IngredientOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<Unit | null>(null);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newSupplier, setNewSupplier] = useState("");

  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      getIngredients().then(setAllIngredients);
    }
  }, [open]);

  function resetState() {
    setView("search");
    setSearch("");
    setSelectedId(null);
    setQuantity("");
    setQuantityUnit(null);
    setNewName("");
    setNewUnit("");
    setNewQty("");
    setNewCost("");
    setNewSupplier("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetState();
  }

  const available = allIngredients.filter(
    (ing) =>
      !existingIngredientIds.includes(ing.id) &&
      ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIngredient = allIngredients.find((ing) => ing.id === selectedId) ?? null;

  function handleSelectIngredient(ing: IngredientOption) {
    if (selectedId === ing.id) {
      setSelectedId(null);
      setQuantityUnit(null);
    } else {
      setSelectedId(ing.id);
      setQuantityUnit(getDefaultInputUnit(ing.unit));
    }
  }

  function handleAddToRecipe() {
    if (!selectedId || !selectedIngredient || !quantity || parseFloat(quantity) <= 0) {
      toast.error("Pilih bahan dan masukkan jumlah");
      return;
    }
    const baseQty = toBaseUnit(
      parseFloat(quantity),
      quantityUnit ?? selectedIngredient.unit,
      selectedIngredient.unit
    );
    startTransition(async () => {
      const result = await addRecipeItem(productId, selectedId, baseQty);
      if (result.success) {
        toast.success("Bahan ditambahkan!");
        handleOpenChange(false);
        onAdded();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCreateIngredient() {
    if (!newName.trim() || !newUnit || !newQty || !newCost) {
      toast.error("Lengkapi nama, satuan, jumlah, dan biaya pembelian");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName);
      formData.set("category", "OTHER");
      formData.set("unit", newUnit);
      formData.set("minimumStock", "0");
      formData.set("initialQuantity", newQty);
      formData.set("initialCost", newCost);
      if (newSupplier) formData.set("supplier", newSupplier);

      const result = await createIngredient(formData);
      if (result.success) {
        const refreshed = await getIngredients();
        setAllIngredients(refreshed);
        setSelectedId(result.data.id);
        setQuantityUnit(getDefaultInputUnit(newUnit as Unit));
        setView("search");
        toast.success("Bahan dibuat!");
        setTimeout(() => quantityInputRef.current?.focus(), 50);
      } else {
        toast.error(result.error);
      }
    });
  }

  const costPerUnitPreview =
    newQty && newCost && parseFloat(newQty) > 0
      ? parseFloat(newCost) / parseFloat(newQty)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Tambah Bahan
      </Button>
      <DialogContent>
        {view === "search" ? (
          <>
            <DialogHeader>
              <DialogTitle>Pilih Bahan</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder="Cari bahan atau material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada bahan ditemukan.
                  </p>
                ) : (
                  available.map((ing) => {
                    const unitOptions = getInputUnitOptions(ing.unit);
                    const showUnitSelector = unitOptions.length > 1;
                    const convertedPreview =
                      selectedId === ing.id && quantity && quantityUnit
                        ? toBaseUnit(parseFloat(quantity) || 0, quantityUnit, ing.unit)
                        : null;

                    return (
                      <div key={ing.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectIngredient(ing)}
                          className={`w-full text-left px-3 py-2 rounded-input border text-sm transition-colors ${
                            selectedId === ing.id
                              ? "border-primary-600 bg-primary-50"
                              : "border-border hover:border-primary-300"
                          }`}
                        >
                          {ing.name} ({UNIT_LABELS[ing.unit]})
                        </button>
                        {selectedId === ing.id && (
                          <div className="mt-2 pl-1 space-y-1">
                            <div className="flex gap-2">
                              <Input
                                ref={quantityInputRef}
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Jumlah"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="flex-1"
                                autoFocus
                              />
                              {showUnitSelector && (
                                <Select
                                  value={quantityUnit ?? unitOptions[0]}
                                  onValueChange={(v) => setQuantityUnit(v as Unit)}
                                >
                                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {unitOptions.map((u) => (
                                      <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Button onClick={handleAddToRecipe} disabled={isPending}>
                                Tambah ke Komposisi
                              </Button>
                            </div>
                            {convertedPreview !== null && quantityUnit !== ing.unit && (
                              <p className="text-xs text-muted-foreground">
                                = {convertedPreview} {UNIT_LABELS[ing.unit]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setView("create")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Buat Bahan Baru
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Buat Bahan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newName">Nama Bahan</Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Tepung Terigu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Satuan</Label>
                  <Select value={newUnit} onValueChange={setNewUnit}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newQty">Jumlah Pembelian</Label>
                  <Input
                    id="newQty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newCost">Biaya Pembelian</Label>
                <CurrencyInput
                  id="newCost"
                  value={newCost}
                  onChange={(value) => setNewCost(String(value))}
                />
                {costPerUnitPreview > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Biaya per satuan: <CurrencyDisplay amount={costPerUnitPreview} size="sm" />
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newSupplier">Supplier (opsional)</Label>
                <Input
                  id="newSupplier"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setView("search")}>
                  <ArrowLeft className="h-4 w-4 mr-1" />Kembali
                </Button>
                <Button onClick={handleCreateIngredient} disabled={isPending} className="flex-1">
                  Buat &amp; Gunakan
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
