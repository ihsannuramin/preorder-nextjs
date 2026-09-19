"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAdminPaymentProofUrl } from "@/actions/admin/orders";
import { Eye, Loader2 } from "lucide-react";

export function AdminPaymentProofButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState<{ url: string; isPdf: boolean } | null>(null);

  async function handleView() {
    setOpen(true);
    setLoading(true);
    const result = await getAdminPaymentProofUrl(orderId);
    if (result.success) {
      setProof(result.data);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleView}>
        <Eye className="h-3.5 w-3.5 mr-1" />
        Bukti Bayar
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setProof(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border border-border">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : proof ? (
              proof.isPdf ? (
                <a
                  href={proof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-8 text-center text-primary-600 hover:underline"
                >
                  Buka file PDF
                </a>
              ) : (
                <img
                  src={proof.url}
                  alt="Bukti pembayaran"
                  className="w-full max-h-[70vh] object-contain"
                />
              )
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Gagal memuat bukti pembayaran.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
