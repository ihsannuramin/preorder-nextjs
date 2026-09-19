import { Suspense } from "react";
import Link from "next/link";
import { getTenants } from "@/actions/admin/tenants";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { formatShortDate } from "@/lib/utils/date";
import { Store, Search } from "lucide-react";

const PAGE_SIZE = 20;

async function TenantList({ q, page }: { q?: string; page: number }) {
  const { data: tenants, total } = await getTenants({ search: q, page, pageSize: PAGE_SIZE });

  if (tenants.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={Store}
        title="Belum ada tenant"
        description="Toko yang mendaftar di platform akan muncul di sini."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/admin/tenants/${tenant.id}`}
            className="block rounded-lg border border-border bg-white p-4 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{tenant.name}</p>
                  <Badge variant={tenant.isActive ? "success" : "destructive"}>
                    {tenant.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">/{tenant.slug}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tenant.ownerBusinessName} — {tenant.ownerEmail}
                </p>
              </div>
              <div className="text-right flex-shrink-0 text-xs text-muted-foreground space-y-0.5">
                <p>{tenant.productCount} produk</p>
                <p>{tenant.campaignCount} kampanye</p>
                <p>{tenant.orderCount} pesanan</p>
                <p>{formatShortDate(tenant.createdAt)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <ListPagination total={total} page={page} pageSize={PAGE_SIZE} search={q} />
    </>
  );
}

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  return (
    <>
      <PageHeader title="Tenant" description="Semua toko yang terdaftar di platform" />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari nama toko, slug, atau email owner..." />
      </div>
      <Suspense key={`${q}-${page}`} fallback={<ListSkeleton />}>
        <TenantList q={q} page={page} />
      </Suspense>
    </>
  );
}
