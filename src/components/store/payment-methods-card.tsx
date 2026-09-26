"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  createPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  updatePaymentMethod,
} from "@/actions/payment-methods";
import { cn } from "@/lib/utils/cn";
import { Landmark, Pencil, Plus, QrCode, Trash2, Wallet } from "lucide-react";
import type { PaymentMethodType, StorePaymentMethod } from "@prisma/client";

const TYPE_OPTIONS: {
  value: PaymentMethodType;
  label: string;
  icon: typeof Landmark;
  providerPlaceholder: string;
  numberLabel: string;
}[] = [
  { value: "BANK_TRANSFER", label: "Transfer Bank", icon: Landmark, providerPlaceholder: "BCA", numberLabel: "Nomor rekening" },
  { value: "EWALLET", label: "E-Wallet", icon: Wallet, providerPlaceholder: "GoPay / OVO / DANA", numberLabel: "Nomor e-wallet" },
  { value: "QRIS", label: "QRIS", icon: QrCode, providerPlaceholder: "QRIS", numberLabel: "" },
];

type FormState = {
  type: PaymentMethodType;
  providerName: string;
  accountNumber: string;
  accountName: string;
  qrisImageUrl: string;
};

const EMPTY_FORM: FormState = {
  type: "BANK_TRANSFER",
  providerName: "",
  accountNumber: "",
  accountName: "",
  qrisImageUrl: "",
};

function toForm(m: StorePaymentMethod): FormState {
  return {
    type: m.type,
    providerName: m.providerName,
    accountNumber: m.accountNumber ?? "",
    accountName: m.accountName ?? "",
    qrisImageUrl: m.qrisImageUrl ?? "",
  };
}

export function PaymentMethodsCard({ initialMethods }: { initialMethods: StorePaymentMethod[] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<StorePaymentMethod | null>(null);
  const [isPending, startTransition] = useTransition();

  const typeDef = TYPE_OPTIONS.find((t) => t.value === form.type)!;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(m: StorePaymentMethod) {
    setEditingId(m.id);
    setForm(toForm(m));
    setDialogOpen(true);
  }

  function handleSave() {
    const payload = {
      type: form.type,
      providerName: form.type === "QRIS" && !form.providerName ? "QRIS" : form.providerName,
      accountNumber: form.accountNumber || undefined,
      accountName: form.accountName || undefined,
      qrisImageUrl: form.qrisImageUrl || undefined,
    };
    startTransition(async () => {
      const result = editingId
        ? await updatePaymentMethod(editingId, payload)
        : await createPaymentMethod(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setMethods((prev) =>
        editingId ? prev.map((m) => (m.id === editingId ? result.data : m)) : [...prev, result.data],
      );
      setDialogOpen(false);
      toast.success("Cara bayar disimpan");
    });
  }

  function handleToggle(m: StorePaymentMethod) {
    startTransition(async () => {
      const result = await togglePaymentMethod(m.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setMethods((prev) => prev.map((x) => (x.id === m.id ? result.data : x)));
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deletePaymentMethod(target.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setMethods((prev) => prev.filter((m) => m.id !== target.id));
      setDeleteTarget(null);
      toast.success("Cara bayar dihapus");
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Cara Bayar</CardTitle>
        <CardDescription>
          Ditampilkan ke pelanggan setelah pesan. Kamu nggak perlu kirim nomor rekening satu-satu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-strong bg-muted p-4 text-sm text-muted-foreground">
            Belum ada cara bayar. Tambahkan rekening bank, e-wallet, atau QRIS supaya pelangganmu
            langsung tahu harus bayar ke mana.
          </div>
        )}

        {methods.map((m) => {
          const def = TYPE_OPTIONS.find((t) => t.value === m.type)!;
          const Icon = def.icon;
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border p-3",
                !m.isActive && "opacity-60",
              )}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {m.providerName}
                  {!m.isActive && (
                    <Badge variant="secondary" className="ml-2 align-middle">
                      Disembunyikan
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.type === "QRIS"
                    ? "Gambar QRIS"
                    : `${m.accountNumber} · a.n. ${m.accountName}`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(m)}
                disabled={isPending}
              >
                {m.isActive ? "Sembunyikan" : "Tampilkan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => openEdit(m)}
                aria-label={`Ubah ${m.providerName}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setDeleteTarget(m)}
                aria-label={`Hapus ${m.providerName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Cara Bayar
        </Button>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Ubah Cara Bayar" : "Tambah Cara Bayar"}</DialogTitle>
            <DialogDescription>Pastikan datanya benar. Pelanggan akan transfer ke sini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const Icon = t.icon;
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                        : "border-border text-muted-foreground hover:border-primary-300",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {form.type !== "QRIS" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="pm-provider">
                    {form.type === "BANK_TRANSFER" ? "Nama bank" : "Nama e-wallet"}
                  </Label>
                  <Input
                    id="pm-provider"
                    value={form.providerName}
                    onChange={(e) => setForm((f) => ({ ...f, providerName: e.target.value }))}
                    placeholder={typeDef.providerPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pm-number">{typeDef.numberLabel}</Label>
                  <Input
                    id="pm-number"
                    inputMode="numeric"
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pm-name">
                Atas nama{form.type === "QRIS" && <span className="text-muted-foreground font-normal"> (opsional)</span>}
              </Label>
              <Input
                id="pm-name"
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                placeholder="Rini Lestari"
              />
            </div>

            {form.type === "QRIS" && (
              <div className="space-y-1.5">
                <Label>Gambar QRIS</Label>
                <div className="max-w-[180px]">
                  <ImageUpload
                    value={form.qrisImageUrl}
                    onChange={(url) => setForm((f) => ({ ...f, qrisImageUrl: url }))}
                    folder="store-qris"
                  />
                </div>
                {form.qrisImageUrl && (
                  <p className="text-[11px] text-muted-foreground">
                    Pastikan QR-nya jelas dan bisa di-scan.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus cara bayar?"
        description={`${deleteTarget?.providerName ?? ""} nggak akan tampil lagi ke pelanggan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
