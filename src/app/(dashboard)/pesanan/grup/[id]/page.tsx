import { notFound } from "next/navigation";
import { getDashboardGroupOrder } from "@/actions/group-orders";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { GroupOrderStatusActions } from "./group-order-status-actions";
import { GroupPaymentVerification } from "./group-payment-verification";
import { Users, Phone, MapPin, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GROUP_ORDER_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/date";

export default async function GroupOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupOrder = await getDashboardGroupOrder(id);

  if (!groupOrder) notFound();

  const cfg = GROUP_ORDER_STATUS[groupOrder.status];

  // Consolidated item list
  const consolidatedMap = new Map<
    string,
    { name: string; qty: number; subtotal: number }
  >();
  for (const member of groupOrder.memberOrders) {
    for (const item of member.items) {
      const key = item.productName;
      const existing = consolidatedMap.get(key);
      if (existing) {
        existing.qty += item.quantity;
        existing.subtotal += Number(item.subtotal);
      } else {
        consolidatedMap.set(key, {
          name: item.productName,
          qty: item.quantity,
          subtotal: Number(item.subtotal),
        });
      }
    }
  }
  const consolidated = Array.from(consolidatedMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        title={`Group Order — ${groupOrder.facilitatorName}`}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/pesanan/grup">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Link>
          </Button>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {groupOrder.status === "PAYMENT_REVIEW" && (
            <GroupPaymentVerification
              groupOrderId={groupOrder.id}
              paymentProofUrl={groupOrder.paymentProofUrl}
            />
          )}

          {/* Member orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pesanan Anggota ({groupOrder.memberOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {groupOrder.memberOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Belum ada anggota yang pesan.
                </p>
              ) : (
                groupOrder.memberOrders.map((member) => (
                  <div key={member.id} className="py-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{member.memberName}</p>
                      <CurrencyDisplay
                        amount={Number(member.subtotal)}
                        size="sm"
                        className="text-primary-700 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      {member.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-xs text-muted-foreground pl-2"
                        >
                          <span>
                            {item.productName} ×{item.quantity}
                          </span>
                          <CurrencyDisplay
                            amount={Number(item.subtotal)}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Consolidated */}
          {consolidated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Rekap Item (untuk produksi)
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {consolidated.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span>{item.name}</span>
                    <span className="font-medium">×{item.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-semibold">
                  <span>Total Tagihan</span>
                  <CurrencyDisplay
                    amount={Number(groupOrder.totalAmount)}
                    size="sm"
                    className="text-primary-700"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={cfg.variant}>{cfg.longLabel}</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {groupOrder.sessionCode}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(groupOrder.createdAt)}
              </p>
              <GroupOrderStatusActions
                groupOrderId={groupOrder.id}
                status={groupOrder.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info Bos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{groupOrder.facilitatorName}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{groupOrder.facilitatorPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{groupOrder.facilitatorAddress}</span>
              </div>
              {groupOrder.facilitatorNotes && (
                <p className="text-muted-foreground text-xs border-t pt-2">
                  {groupOrder.facilitatorNotes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
