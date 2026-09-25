import { Suspense } from "react";
import Link from "next/link";
import { getAdminOrders } from "@/actions/admin/orders";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { AdminPaymentProofButton } from "@/components/admin/admin-payment-proof-button";
import { formatShortDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { ShoppingBag, Search } from "lucide-react";
import { ORDER_STATUS } from "@/lib/constants/status";
import type { OrderStatus } from "@prisma/client";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING_PAYMENT", label: "Menunggu Bayar" },
  { value: "PAYMENT_REVIEW", label: "Verifikasi" },
  { value: "PAID", label: "Lunas" },
  { value: "PRODUCTION", label: "Produksi" },
  { value: "READY", label: "Siap Kirim" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Batal" },
];

function isOrderStatus(value?: string): value is OrderStatus {
  return Boolean(value) && value !== "ALL" && value! in ORDER_STATUS;
}

async function OrderList({
  q,
  status,
  page,
}: {
  q?: string;
  status?: OrderStatus;
  page: number;
}) {
  const { data: orders, total } = await getAdminOrders({ search: q, status, page, pageSize: PAGE_SIZE });

  if (orders.length === 0) {
    return q || status ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil</p>
      </div>
    ) : (
      <EmptyState
        icon={ShoppingBag}
        title="Belum ada pesanan"
        description="Pesanan dari semua tenant akan muncul di sini."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((o) => {
          const cfg = ORDER_STATUS[o.status];
          return (
            <div key={o.id} className="rounded-lg border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{o.orderNumber}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.customerName} · {o.customerPhone}
                  </p>
                  <Link
                    href={`/admin/tenants/${o.storeId}`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {o.storeName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {o.campaignName} · {formatShortDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1.5">
                  <CurrencyDisplay amount={o.totalAmount} size="sm" className="font-semibold block" />
                  {o.hasPaymentProof && <AdminPaymentProofButton orderId={o.id} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ListPagination
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        search={q}
        extraParams={{ status }}
      />
    </>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status: statusStr, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const status = isOrderStatus(statusStr) ? statusStr : undefined;

  return (
    <>
      <PageHeader title="Pesanan" description="Cari pesanan di semua tenant" />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari nomor pesanan, nama, atau nomor HP..." />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value === "ALL" ? !status : status === f.value;
          const href =
            f.value === "ALL"
              ? `/admin/orders${q ? `?q=${q}` : ""}`
              : `/admin/orders?status=${f.value}${q ? `&q=${q}` : ""}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                isActive
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-muted-foreground border-border hover:border-primary-300"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
      <Suspense key={`${q}-${status}-${page}`} fallback={<ListSkeleton />}>
        <OrderList q={q} status={status} page={page} />
      </Suspense>
    </>
  );
}
