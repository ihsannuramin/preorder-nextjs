"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { suspendTenant, reactivateTenant } from "@/actions/admin/tenants";
import { Ban, CheckCircle2 } from "lucide-react";

export function TenantStatusActions({
  storeId,
  isActive,
}: {
  storeId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleSuspend() {
    if (!reason.trim()) {
      toast.error("Masukkan alasan penonaktifan");
      return;
    }
    startTransition(async () => {
      const result = await suspendTenant(storeId, reason);
      if (result.success) {
        toast.success("Toko dinonaktifkan");
        setSuspendOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateTenant(storeId);
      if (result.success) {
        toast.success("Toko diaktifkan kembali");
        setReactivateOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (isActive) {
    return (
      <>
        <Button variant="destructive" size="sm" onClick={() => setSuspendOpen(true)}>
          <Ban className="h-4 w-4 mr-1" />
          Nonaktifkan Toko
        </Button>

        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nonaktifkan Toko</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Halaman publik toko ini akan langsung disembunyikan dari pelanggan.
              </p>
              <Label htmlFor="suspend-reason">Alasan</Label>
              <Textarea
                id="suspend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Laporan penipuan dari pelanggan"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleSuspend} disabled={isPending}>
                {isPending ? "Memproses..." : "Nonaktifkan Toko"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setReactivateOpen(true)}>
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Aktifkan Kembali
      </Button>

      <ConfirmDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title="Aktifkan Kembali Toko"
        description="Halaman publik toko ini akan bisa diakses pelanggan kembali."
        confirmLabel="Aktifkan"
        onConfirm={handleReactivate}
        loading={isPending}
      />
    </>
  );
}
