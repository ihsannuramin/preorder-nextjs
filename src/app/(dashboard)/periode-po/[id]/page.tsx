import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaign } from "@/actions/campaigns";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils/date";
import { CampaignStatusActions } from "./campaign-status-actions";
import { ArrowLeft, ShoppingBag, Package, Factory } from "lucide-react";
import { CAMPAIGN_STATUS } from "@/lib/constants/status";
import type { CampaignStatus } from "@prisma/client";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const cfg = CAMPAIGN_STATUS[campaign.status];
  const totalRevenue = campaign.orders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  );
  const totalHpp = campaign.orders.reduce((sum, o) => sum + Number(o.totalHpp), 0);

  return (
    <>
      <PageHeader
        title={campaign.name}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/periode-po"><ArrowLeft className="h-4 w-4 mr-1" />Periode PO</Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={cfg.variant} className="text-sm px-3 py-1">{cfg.longLabel}</Badge>
              <p className="text-sm text-muted-foreground">
                {formatDate(campaign.openDate)} — {formatDate(campaign.closeDate)}
              </p>
            </div>
            <CampaignStatusActions campaign={campaign} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-5 w-5 text-primary-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{campaign.orders.length}</p>
              <p className="text-xs text-muted-foreground">Pesanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pendapatan</p>
              <CurrencyDisplay amount={totalRevenue} size="sm" className="font-bold" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Est. Profit</p>
              <CurrencyDisplay
                amount={totalRevenue - totalHpp}
                size="sm"
                className="font-bold text-success-700"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produk ({campaign.products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.products.map((cp) => (
                <div key={cp.id} className="py-2 border-b last:border-0 text-sm">
                  {cp.product.name}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Produksi
                </CardTitle>
                {(campaign.status === "CLOSED" || campaign.status === "PRODUCTION") && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/periode-po/${campaign.id}/produksi`}>
                      Lihat Lembar Produksi
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Setelah PO ditutup, buka lembar produksi buat tahu bahan yang harus dibeli dari pesanan yang udah lunas.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pesanan?campaignId=${campaign.id}`}>Lihat Semua</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaign.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada pesanan masuk
              </p>
            ) : (
              <div className="space-y-2">
                {campaign.orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/pesanan/${order.id}`}
                    className="flex justify-between py-2 border-b last:border-0 hover:text-primary-600 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                    </div>
                    <CurrencyDisplay amount={Number(order.totalAmount)} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
