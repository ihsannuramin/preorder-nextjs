import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/actions/orders";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDateTime } from "@/lib/utils/date";
import { OrderStatusActions } from "./order-status-actions";
import { PaymentVerification } from "./payment-verification";
import { WhatsAppActions } from "./whatsapp-actions";
import { ArrowLeft, User, MapPin, Phone, ShoppingBag } from "lucide-react";
import { ORDER_STATUS } from "@/lib/constants/status";
import type { OrderStatus } from "@prisma/client";

export default async function PesananDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const cfg = ORDER_STATUS[order.status];

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/pesanan"><ArrowLeft className="h-4 w-4 mr-1" />Pesanan</Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={cfg.variant} className="text-sm px-3 py-1">{cfg.longLabel}</Badge>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <OrderStatusActions orderId={order.id} status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <WhatsAppActions
              customerPhone={order.customerPhone}
              orderNumber={order.orderNumber}
              status={order.status}
              rejectionReason={order.rejectionReason}
            />
          </CardContent>
        </Card>

        {order.status === "PAYMENT_REVIEW" && (
          <PaymentVerification orderId={order.id} paymentProofUrl={order.paymentProofUrl} />
        )}

        {order.rejectionReason && (
          <Card className="border-error-200 bg-error-50">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-error-700">Alasan Penolakan Pembayaran</p>
              <p className="text-sm text-error">{order.rejectionReason}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />Info Pelanggan
            </CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span>{order.customerAddress}</span>
              </div>
              {order.customerNotes && (
                <p className="text-muted-foreground italic">"{order.customerNotes}"</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />Item Pesanan
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <CurrencyDisplay amount={Number(item.subtotal)} size="sm" />
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-semibold">
                  <span>Total</span>
                  <CurrencyDisplay amount={Number(order.totalAmount)} size="sm" className="text-primary-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
