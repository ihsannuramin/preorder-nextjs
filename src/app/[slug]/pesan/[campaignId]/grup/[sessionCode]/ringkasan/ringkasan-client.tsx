"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { GroupPaymentProofUpload } from "@/components/shared/group-payment-proof-upload";
import { closeGroupOrder } from "@/actions/group-orders";
import { PaymentInstructions, type PublicPaymentMethod } from "@/components/public/payment-instructions";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { StoreIdentity } from "@/components/public/store-identity";
import { cleanPhone } from "@/lib/utils/whatsapp";
import { Users, Copy, Lock, ChevronDown, ChevronUp, CheckCircle2, Circle, MessageCircle } from "lucide-react";

type GroupStatus = "COLLECTING" | "CLOSED" | "PAYMENT_REVIEW" | "PAID" | "CANCELLED";

const STEPS: { status: GroupStatus; label: string }[] = [
  { status: "COLLECTING", label: "Teman-teman sedang memilih pesanan" },
  { status: "CLOSED", label: "Menunggu pembayaran" },
  { status: "PAYMENT_REVIEW", label: "Bukti bayar sedang dicek toko" },
  { status: "PAID", label: "Pembayaran diterima" },
];

type GroupData = {
  id: string;
  sessionCode: string;
  facilitatorName: string;
  facilitatorPhone: string;
  facilitatorAddress: string;
  facilitatorNotes: string | null;
  status: GroupStatus;
  totalAmount: number;
  paymentProofUrl: string | null;
  rejectionReason: string | null;
  campaign: { id: string; name: string };
  store: {
    name: string;
    whatsapp: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    paymentMethods: PublicPaymentMethod[];
  };
};

type MemberOrder = {
  id: string;
  memberName: string;
  subtotal: number;
  items: { id: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[];
};

export function RingkasanClient({
  group,
  members,
  memberLink,
  sessionCode,
}: {
  group: GroupData;
  members: MemberOrder[];
  memberLink: string;
  sessionCode: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const currentStepIndex = STEPS.findIndex((s) => s.status === group.status);

  function copyLink() {
    navigator.clipboard.writeText(memberLink);
    toast.success("Link sudah disalin");
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeGroupOrder(sessionCode);
      if (result.success) {
        toast.success("Pesanan grup ditutup. Sekarang tinggal bayar tagihannya.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="text-center mb-2">
          <StoreIdentity
            name={group.store.name}
            logoUrl={group.store.logoUrl}
            brandColor={group.store.brandColor}
            size="sm"
          />
          <h1 className="text-xl font-bold mt-3">Ringkasan Pesanan Grup</h1>
          <p className="text-sm text-muted-foreground">{group.campaign.name}</p>
        </div>

        {group.status === "CANCELLED" ? (
          <Card className="border-error-200 bg-error-50">
            <CardContent className="pt-4 text-center text-error-700 font-medium">
              Pesanan grup ini dibatalkan. Chat {group.store.name} kalau ada pertanyaan.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const done = i <= currentStepIndex;
                  return (
                    <div key={step.status} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-success-700 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Info Penanggung Tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{group.facilitatorName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">HP</span><span>{group.facilitatorPhone}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground flex-shrink-0">Alamat</span><span className="text-right">{group.facilitatorAddress}</span></div>
            {group.facilitatorNotes && (
              <div className="flex justify-between gap-4"><span className="text-muted-foreground flex-shrink-0">Catatan</span><span className="text-right">{group.facilitatorNotes}</span></div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center rounded-card border border-border bg-white p-4">
          <div>
            <p className="font-semibold">Total Tagihan Grup</p>
            <p className="text-xs text-muted-foreground">{members.length} anggota · {members.reduce((s, m) => s + m.items.reduce((si, i) => si + i.quantity, 0), 0)} item</p>
          </div>
          <CurrencyDisplay amount={group.totalAmount} size="lg" className="text-primary-700 font-bold" />
        </div>

        {group.status === "CLOSED" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bayar Tagihan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {group.rejectionReason && (
                <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
                  <p>{group.store.name} belum bisa memverifikasi bukti bayarmu. Alasannya: {group.rejectionReason}</p>
                  <p className="mt-1">Unggah ulang bukti yang jelas di bawah, ya.</p>
                </div>
              )}
              {group.store.paymentMethods.length > 0 ? (
                <PaymentInstructions
                  methods={group.store.paymentMethods}
                  totalAmount={group.totalAmount}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Chat {group.store.name} buat tahu cara bayarnya, lalu unggah buktinya di sini.
                  </p>
                  {group.store.whatsapp && (
                    <Button asChild variant="secondary" className="w-full">
                      <a
                        href={`https://wa.me/${cleanPhone(group.store.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                        Chat {group.store.name} (WA)
                      </a>
                    </Button>
                  )}
                </div>
              )}
              <GroupPaymentProofUpload sessionCode={sessionCode} onUploaded={() => router.refresh()} />
            </CardContent>
          </Card>
        )}

        {group.status === "COLLECTING" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bagikan Link ke Teman-teman</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground flex-1 break-all">{memberLink}</span>
              </div>
              <Button onClick={copyLink} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Salin Link
              </Button>
            </CardContent>
          </Card>
        )}

        {members.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Pesanan Anggota ({members.length})</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {members.map((m) => (
                <div key={m.id} className="py-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)}
                  >
                    <div>
                      <p className="font-medium text-sm">{m.memberName}</p>
                      <p className="text-xs text-muted-foreground">{m.items.length} item</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDisplay amount={m.subtotal} size="sm" className="text-primary-700" />
                      {expandedMember === m.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {expandedMember === m.id && (
                    <div className="mt-2 space-y-1">
                      {m.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-muted-foreground pl-2">
                          <span>{item.productName} ×{item.quantity}</span>
                          <CurrencyDisplay amount={item.subtotal} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada yang pesan. Bagikan link di atas ke teman-teman.</p>
          </div>
        )}

        {group.status === "COLLECTING" && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleClose}
            disabled={isPending}
          >
            <Lock className="h-4 w-4 mr-2" />
            {isPending ? "Menutup..." : "Tutup Pesanan Grup (Tidak Bisa Dibuka Lagi)"}
          </Button>
        )}

        <PoweredByFooter />
      </div>
    </div>
  );
}
