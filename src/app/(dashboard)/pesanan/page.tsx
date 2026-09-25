import { Suspense } from "react";
import Link from "next/link";
import { getOrders } from "@/actions/orders";
import { getDashboardGroupOrders } from "@/actions/group-orders";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatRelative } from "@/lib/utils/date";
import { formatDate } from "@/lib/utils/date";
import { ShoppingBag, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ORDER_STATUS, GROUP_ORDER_STATUS } from "@/lib/constants/status";
import type { OrderStatus } from "@prisma/client";

const PAGE_SIZE = 10;

// ── Tab switcher (server-rendered, Link-based) ─────────────────────────────
function PesananTabs({ active }: { active: string }) {
  const tabs = [
    { id: "individu", label: "Individu", icon: ShoppingBag },
    { id: "grup", label: "Group Order", icon: Users },
  ];
  return (
    <div className="flex gap-1 mb-4 p-1 bg-muted rounded-xl w-full sm:w-auto">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={`/pesanan?tab=${id}`}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all",
            active === id
              ? "bg-white shadow-sm text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}

// ── Individual orders list ─────────────────────────────────────────────────
async function OrderList({ q, page }: { q?: string; page: number }) {
  let orders, total;
  try {
    ({ data: orders, total } = await getOrders({ search: q, page, pageSize: PAGE_SIZE }));
  } catch (e) {
    if (e instanceof Error && e.message === "Toko belum dibuat") {
      return <p className="text-muted-foreground">Buat toko terlebih dahulu.</p>;
    }
    throw e;
  }

  if (orders.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={ShoppingBag}
        title="Belum ada pesanan"
        description="Pesanan dari pelanggan akan muncul di sini setelah kamu membuka periode PO."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order) => {
          const cfg = ORDER_STATUS[order.status];
          return (
            <Link
              key={order.id}
              href={`/pesanan/${order.id}`}
              className="block rounded-card border border-border bg-white p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={cfg.variant} className="mb-1">{cfg.label}</Badge>
                  <CurrencyDisplay amount={order.totalAmount} size="sm" className="block text-primary-700 font-semibold" />
                  <p className="text-xs text-muted-foreground mt-0.5">{order.items.length} item</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <ListPagination total={total} page={page} pageSize={PAGE_SIZE} search={q} />
    </>
  );
}

// ── Group orders list ──────────────────────────────────────────────────────
async function GroupOrderList({ q, page }: { q?: string; page: number }) {
  let groupOrders, total;
  try {
    ({ data: groupOrders, total } = await getDashboardGroupOrders({ search: q, page, pageSize: PAGE_SIZE }));
  } catch (e) {
    if (e instanceof Error && e.message === "Toko belum dibuat") {
      return <p className="text-muted-foreground">Buat toko terlebih dahulu.</p>;
    }
    throw e;
  }

  if (groupOrders.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={Users}
        title="Belum ada group order"
        description="Group order dibuat langsung dari halaman toko publik."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {groupOrders.map((go) => {
          const cfg = GROUP_ORDER_STATUS[go.status];
          return (
            <Link
              key={go.id}
              href={`/pesanan/grup/${go.id}`}
              className="block rounded-card border border-border bg-white p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{go.facilitatorName}</p>
                    <p className="text-xs text-muted-foreground">{go.campaign.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kode: <span className="font-mono font-medium">{go.sessionCode}</span> · {go._count.memberOrders} anggota
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={cfg.variant} className="mb-1">{cfg.label}</Badge>
                  <CurrencyDisplay amount={go.totalAmount} size="sm" className="block text-primary-700 font-semibold" />
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(go.createdAt)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <ListPagination total={total} page={page} pageSize={PAGE_SIZE} search={q} />
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function PesananPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab = "individu", q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const activeTab = tab === "grup" ? "grup" : "individu";

  const placeholder =
    activeTab === "grup"
      ? "Cari nama fasilitator atau kode sesi..."
      : "Cari nama pelanggan atau nomor pesanan...";

  return (
    <>
      <PageHeader title="Pesanan" description="Kelola semua pesanan dari pelanggan" />
      <PesananTabs active={activeTab} />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder={placeholder} />
      </div>
      <Suspense key={`${activeTab}-${q}-${page}`} fallback={<ListSkeleton />}>
        {activeTab === "grup" ? (
          <GroupOrderList q={q} page={page} />
        ) : (
          <OrderList q={q} page={page} />
        )}
      </Suspense>
    </>
  );
}
