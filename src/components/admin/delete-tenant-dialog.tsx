"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteTenantPermanently } from "@/actions/admin/tenants";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteTenantButton({
  storeId,
  slug,
  storeName,
  ownerEmail,
  counts,
}: {
  storeId: string;
  slug: string;
  storeName: string;
  ownerEmail: string;
  counts: { products: number; campaigns: number; orders: number };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [reason, setReason] = useState("");

  const canSubmit = confirmSlug.trim() === slug && reason.trim().length > 0;

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    setOpen(next);
    if (!next) {
      setConfirmSlug("");
      setReason("");
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTenantPermanently(storeId, confirmSlug, reason);
      if (result.success) {
        toast.success(`Toko ${storeName} dihapus permanen`);
        setOpen(false);
        router.push("/admin/tenants");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" className="text-error hover:bg-error-50 hover:text-error" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Hapus Permanen
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Toko Permanen</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-error/30 bg-error-50 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-error" />
              <div className="space-y-1 text-foreground">
                <p>Yang akan dihapus:</p>
                <ul className="list-disc pl-4 text-muted-foreground">
                  <li>Akun login <strong className="text-foreground">{ownerEmail}</strong></li>
                  <li>
                    {counts.products} produk, {counts.campaigns} periode PO, {counts.orders} pesanan
                  </li>
                  <li>Bahan baku, resep, cara bayar, foto & bukti bayar</li>
                </ul>
                <p className="pt-1 text-muted-foreground">
                  Email dan URL <code>/{slug}</code> jadi bebas — pemilik bisa mendaftar ulang dari awal.
                  Ingin sementara saja? Pakai <strong>Nonaktifkan Toko</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delete-reason">Alasan</Label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Permintaan pemilik untuk menutup akun"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">
                Ketik <code className="font-semibold">{slug}</code> untuk konfirmasi
              </Label>
              <Input
                id="delete-confirm"
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                autoComplete="off"
                placeholder={slug}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!canSubmit || isPending}>
              {isPending ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
