import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantDetail } from "@/actions/admin/tenants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { TenantStatusActions } from "@/components/admin/suspend-tenant-dialog";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { ExternalLink } from "lucide-react";
import { ORDER_STATUS, CAMPAIGN_STATUS } from "@/lib/constants/status";
import type { OrderStatus, CampaignStatus } from "@prisma/client";

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTenantDetail(id);
  if (!detail) notFound();

  const { store, finance, orderCount, recentOrders, recentCampaigns } = detail;

  return (
    <>
      <PageHeader
        title={store.name}
        description={`/${store.slug}`}
        actions={<TenantStatusActions storeId={store.id} isActive={store.isActive} />}
      />

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profil Toko</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={store.isActive ? "success" : "destructive"}>
                {store.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp</span>
              <span>{store.whatsapp ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Terdaftar</span>
              <span>{formatDate(store.createdAt)}</span>
            </div>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-600 hover:underline pt-1"
            >
              Lihat halaman publik <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pemilik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Bisnis</span>
              <span>{store.user.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate">{store.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bergabung</span>
              <span>{formatDate(store.user.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Keuangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendapatan</span>
              <CurrencyDisplay amount={finance.revenue} size="sm" className="font-semibold" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">HPP</span>
              <CurrencyDisplay amount={finance.totalHpp} size="sm" />
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Keuntungan</span>
              <CurrencyDisplay
                amount={finance.profit}
                size="sm"
                className={`font-bold ${finance.profit >= 0 ? "text-success-700" : "text-error"}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{store._count.products}</p>
            <p className="text-xs text-muted-foreground">Produk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{store._count.campaigns}</p>
            <p className="text-xs text-muted-foreground">Periode PO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Pesanan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pesanan</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => {
                  const cfg = ORDER_STATUS[o.status];
                  return (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.orderNumber} · {o.campaignName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <CurrencyDisplay amount={o.totalAmount} size="sm" className="block mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Periode PO Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada periode PO</p>
            ) : (
              <div className="space-y-2">
                {recentCampaigns.map((c) => {
                  const cfg = CAMPAIGN_STATUS[c.status];
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Tutup {formatDateTime(c.closeDate)}
                        </p>
                      </div>
                      <Badge variant={cfg.variant} className="flex-shrink-0">{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
