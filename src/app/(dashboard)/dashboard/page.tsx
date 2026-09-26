import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative } from "@/lib/utils/date";
import { getStoreFinanceSummary } from "@/lib/utils/finance";
import { ShoppingBag, Clock, CheckCircle, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingHint } from "@/components/shared/onboarding-hint";

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { store: true },
  });

  if (!dbUser?.store) {
    return (
      <div className="rounded-card border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Selamat datang di POHub! 👋</h2>
        <p className="text-muted-foreground mb-4">
          Mulai dengan membuat toko kamu terlebih dahulu.
        </p>
        <OnboardingHint
          id="onboard-create-store"
          message="👋 Langkah pertama: buat profil toko kamu untuk bisa menerima pesanan dari pelanggan!"
          side="top"
        >
          <Button asChild>
            <Link href="/toko">Buat Toko Sekarang</Link>
          </Button>
        </OnboardingHint>
      </div>
    );
  }

  const store = dbUser.store;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [openCampaigns, pendingPayments, needVerification, recentOrders, ordersToday, finance] =
    await Promise.all([
      prisma.campaign.count({ where: { storeId: store.id, status: "OPEN" } }),
      prisma.order.count({
        where: { campaign: { storeId: store.id }, status: "PENDING_PAYMENT" },
      }),
      prisma.order.count({
        where: { campaign: { storeId: store.id }, status: "PAYMENT_REVIEW" },
      }),
      prisma.order.findMany({
        where: { campaign: { storeId: store.id } },
        include: { campaign: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.count({
        where: {
          campaign: { storeId: store.id },
          createdAt: { gte: todayStart },
        },
      }),
      getStoreFinanceSummary(store.id),
    ]);

  const { revenue, totalHpp, profit: estimatedProfit } = finance;

  const metrics = [
    { label: "Periode PO Aktif", value: openCampaigns, icon: Calendar, color: "text-primary-600" },
    { label: "Menunggu Pembayaran", value: pendingPayments, icon: Clock, color: "text-warning-700" },
    { label: "Perlu Verifikasi", value: needVerification, icon: AlertCircle, color: "text-error" },
    { label: "Pesanan Hari Ini", value: ordersToday, icon: ShoppingBag, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <p className="text-primary-100 text-sm font-medium">Selamat datang kembali!</p>
        <h2 className="text-2xl font-bold mt-1">{store.name}</h2>
        <div className="mt-4 flex gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/${store.slug}`} target="_blank">Lihat Toko</Link>
          </Button>
          <Button asChild size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Link href="/periode-po/baru">+ Buka PO Baru</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              Ringkasan Keuangan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Pendapatan</span>
              <CurrencyDisplay amount={revenue} size="sm" className="font-semibold" />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Modal (HPP)</span>
              <CurrencyDisplay amount={totalHpp} size="sm" className="text-muted-foreground" />
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm font-semibold">Estimasi Keuntungan</span>
              <CurrencyDisplay
                amount={estimatedProfit}
                size="sm"
                className={`font-bold ${estimatedProfit >= 0 ? "text-success-700" : "text-error"}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary-600" />
              Pesanan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pesanan</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/pesanan/${order.id}`}
                    className="flex items-center justify-between py-2 border-b last:border-0 hover:text-primary-600 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay amount={Number(order.totalAmount)} size="sm" className="font-medium" />
                      <p className="text-xs text-muted-foreground">{formatRelative(order.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Pantau bisnis kamu hari ini" />
      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
