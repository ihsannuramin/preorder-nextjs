import { Suspense } from "react";
import { getAdminUser } from "@/lib/auth/admin";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { GrowthChart } from "@/components/admin/growth-chart";
import {
  getPlatformOverviewCounts,
  getPlatformFinanceSummary,
  getSignupGrowth,
  getOrderGrowth,
  getNeedsAttention,
} from "@/lib/utils/admin-metrics";
import { Store, Users, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";

async function OverviewContent() {
  const [counts, finance, signupGrowth, orderGrowth, attention] = await Promise.all([
    getPlatformOverviewCounts(),
    getPlatformFinanceSummary(),
    getSignupGrowth(14),
    getOrderGrowth(14),
    getNeedsAttention(),
  ]);

  const metrics = [
    { label: "Total Tenant", value: counts.totalStores, icon: Store, color: "text-primary-600" },
    { label: "Tenant Aktif", value: counts.activeStores, icon: Store, color: "text-success-700" },
    { label: "Tenant Nonaktif", value: counts.suspendedStores, icon: Store, color: "text-error" },
    { label: "Total Pengguna", value: counts.totalUsers, icon: Users, color: "text-info" },
    { label: "Total Pesanan", value: counts.totalOrders, icon: ShoppingBag, color: "text-primary-600" },
    { label: "Pesanan Hari Ini", value: counts.ordersToday, icon: ShoppingBag, color: "text-warning-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              Pendapatan Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Pendapatan</span>
              <CurrencyDisplay amount={finance.revenue} size="sm" className="font-semibold" />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total HPP</span>
              <CurrencyDisplay amount={finance.totalHpp} size="sm" className="text-muted-foreground" />
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm font-semibold">Estimasi Keuntungan</span>
              <CurrencyDisplay
                amount={finance.profit}
                size="sm"
                className={`font-bold ${finance.profit >= 0 ? "text-success-700" : "text-error"}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendaftaran Toko Baru (14 hari terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={signupGrowth} label="Toko baru" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pesanan Masuk (14 hari terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart data={orderGrowth} label="Pesanan" color="#f59e0b" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            Perlu Perhatian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">
              Menunggu verifikasi pembayaran &gt; {2} hari ({attention.stalePaymentReviews.length})
            </p>
            {attention.stalePaymentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {attention.stalePaymentReviews.map((o) => (
                  <li key={o.id} className="flex justify-between gap-4 text-muted-foreground">
                    <span className="truncate">
                      {o.orderNumber} — {o.customerName} <span className="text-xs">({o.storeName})</span>
                    </span>
                    <span className="flex-shrink-0">{o.daysWaiting} hari</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Periode PO lewat tanggal tutup tapi masih OPEN ({attention.overdueOpenCampaigns.length})
            </p>
            {attention.overdueOpenCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {attention.overdueOpenCampaigns.map((c) => (
                  <li key={c.id} className="flex justify-between gap-4 text-muted-foreground">
                    <span className="truncate">
                      {c.name} <span className="text-xs">({c.storeName})</span>
                    </span>
                    <span className="flex-shrink-0">{c.closedDaysAgo} hari lalu</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const admin = await getAdminUser();

  return (
    <>
      <PageHeader title="Ringkasan Platform" description={`Masuk sebagai ${admin.email}`} />
      <Suspense fallback={<PageSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}
