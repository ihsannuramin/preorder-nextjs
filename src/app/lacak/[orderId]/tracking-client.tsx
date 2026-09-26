"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PaymentProofUpload } from "@/components/shared/payment-proof-upload";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { PaymentInstructions } from "@/components/public/payment-instructions";
import { StoreIdentity } from "@/components/public/store-identity";
import { buildChatSellerMessage, buildPaymentProofFollowupMessage, buildWaLink } from "@/lib/utils/whatsapp";
import { MessageCircle, CheckCircle2, Circle } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import type { getPublicOrder } from "@/actions/orders";

type OrderData = NonNullable<Awaited<ReturnType<typeof getPublicOrder>>>;

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING_PAYMENT", label: "Pesanan tercatat, menunggu pembayaranmu" },
  { status: "PAYMENT_REVIEW", label: "Bukti bayarmu sedang dicek toko" },
  { status: "PAID", label: "Pembayaran dikonfirmasi" },
  { status: "PRODUCTION", label: "Pesananmu sedang dibuat" },
  { status: "READY", label: "Siap diambil/dikirim" },
  { status: "COMPLETED", label: "Selesai" },
];

export function TrackingClient({ order }: { order: OrderData }) {
  const router = useRouter();
  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);
  const canUploadProof = order.status === "PENDING_PAYMENT";
  const isAwaitingVerification = order.status === "PAYMENT_REVIEW";

  const chatSellerLink = order.store.whatsapp
    ? buildWaLink(
        order.store.whatsapp,
        isAwaitingVerification
          ? buildPaymentProofFollowupMessage({ orderNumber: order.orderNumber })
          : buildChatSellerMessage({
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              items: order.items,
            })
      )
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="text-center mb-2">
          <StoreIdentity
            name={order.store.name}
            logoUrl={order.store.logoUrl}
            brandColor={order.store.brandColor}
            size="sm"
          />
          <p className="text-xs text-muted-foreground mt-3">Nomor pesanan</p>
          <h1 className="text-xl font-bold">{order.orderNumber}</h1>
        </div>

        {order.status === "CANCELLED" ? (
          <Card className="border-error-200 bg-error-50">
            <CardContent className="pt-4 text-center text-error-700 font-medium">
              Pesanan ini dibatalkan. Chat {order.store.name} kalau ada pertanyaan.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Pesananmu</CardTitle>
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

        {order.rejectionReason && (
          <Card className="border-error-200 bg-error-50">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-error-700">
                Bukti bayarmu belum bisa dikonfirmasi: {order.rejectionReason}
              </p>
              {canUploadProof && (
                <p className="text-sm text-foreground mt-1">Unggah ulang di bawah, ya.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Item Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                  <span>{item.productName} x{item.quantity}</span>
                  <CurrencyDisplay amount={item.subtotal} size="sm" />
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold">
                <span>Total</span>
                <CurrencyDisplay amount={order.totalAmount} size="sm" className="text-primary-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {(canUploadProof || isAwaitingVerification) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bukti Bayar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAwaitingVerification ? (
                <p className="text-sm text-muted-foreground text-center">
                  Bukti bayarmu sudah diterima. {order.store.name} akan mengeceknya.
                </p>
              ) : (
                <>
                  {order.store.paymentMethods.length > 0 ? (
                    <PaymentInstructions
                      methods={order.store.paymentMethods}
                      totalAmount={order.totalAmount}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum tahu cara bayarnya? Chat {order.store.name} dulu, lalu unggah buktinya di sini.
                    </p>
                  )}
                  <PaymentProofUpload orderId={order.id} onUploaded={() => router.refresh()} />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {chatSellerLink && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-3 md:hidden">
          <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white border-0">
            <a href={chatSellerLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Toko (WA)
            </a>
          </Button>
        </div>
      )}

      <PoweredByFooter />

      {chatSellerLink && (
        <div className="hidden md:block max-w-xl mx-auto px-4">
          <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white border-0">
            <a href={chatSellerLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Toko (WA)
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
