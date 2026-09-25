"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { approvePayment, rejectPayment, getPaymentProofUrl } from "@/actions/payments";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
type PaymentVerificationProps = { orderId: string; paymentProofUrl: string | null };

export function PaymentVerification({ orderId, paymentProofUrl }: PaymentVerificationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [signedProof, setSignedProof] = useState<{ url: string; isPdf: boolean } | null>(null);

  async function handleViewProof() {
    setProofOpen(true);
    setProofLoading(true);
    const result = await getPaymentProofUrl(orderId);
    if (result.success) {
      setSignedProof(result.data);
    } else {
      toast.error(result.error);
    }
    setProofLoading(false);
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePayment(orderId);
      if (result.success) {
        toast.success("Pembayaran disetujui!");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      toast.error("Masukkan alasan penolakan");
      return;
    }
    startTransition(async () => {
      const result = await rejectPayment(orderId, reason);
      if (result.success) {
        toast.success("Pembayaran ditolak");
        setRejectOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Card className="border-warning-200 bg-warning-50">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Verifikasi Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentProofUrl ? (
            <Button variant="outline" size="sm" onClick={handleViewProof}>
              <Eye className="h-4 w-4 mr-1" />
              Lihat Bukti Pembayaran
            </Button>
          ) : (
            <p className="text-sm text-warning-700">Pelanggan belum mengunggah bukti pembayaran.</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={isPending} size="sm" className="bg-success text-secondary hover:bg-success/90">
              <CheckCircle className="h-4 w-4 mr-1" />
              Setujui
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Tolak
            </Button>
          </div>
        </CardContent>
      </Card>

      {paymentProofUrl && (
        <Dialog
          open={proofOpen}
          onOpenChange={(open) => {
            setProofOpen(open);
            if (!open) setSignedProof(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bukti Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="rounded-lg overflow-hidden border border-border">
              {proofLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : signedProof ? (
                signedProof.isPdf ? (
                  <a
                    href={signedProof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-8 text-center text-primary-600 hover:underline"
                  >
                    Buka file PDF
                  </a>
                ) : (
                  <img
                    src={signedProof.url}
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
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reason">Alasan Penolakan</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Jumlah transfer tidak sesuai"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? "Memproses..." : "Tolak Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
