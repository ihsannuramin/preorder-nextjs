import { Suspense } from "react";
import Link from "next/link";
import { getUsers } from "@/actions/admin/users";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { formatShortDate } from "@/lib/utils/date";
import { Users, Search, ExternalLink } from "lucide-react";

const PAGE_SIZE = 20;

async function UserList({ q, page }: { q?: string; page: number }) {
  const { data: users, total } = await getUsers({ search: q, page, pageSize: PAGE_SIZE });

  if (users.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState icon={Users} title="Belum ada pengguna" description="Pengguna yang mendaftar akan muncul di sini." />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{user.businessName}</p>
                  {user.role === "SUPER_ADMIN" && <Badge variant="warning">Super Admin</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bergabung {formatShortDate(user.createdAt)}
                </p>
                {user.store ? (
                  <Link
                    href={`/admin/tenants/${user.store.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
                  >
                    {user.store.name}
                    {!user.store.isActive && <Badge variant="destructive" className="ml-1">Nonaktif</Badge>}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 italic">Belum punya toko</p>
                )}
              </div>
              <UserRowActions userId={user.id} email={user.email} role={user.role} />
            </div>
          </div>
        ))}
      </div>
      <ListPagination total={total} page={page} pageSize={PAGE_SIZE} search={q} />
    </>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  return (
    <>
      <PageHeader title="Pengguna" description="Semua pengguna yang terdaftar di platform" />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari nama bisnis atau email..." />
      </div>
      <Suspense key={`${q}-${page}`} fallback={<ListSkeleton />}>
        <UserList q={q} page={page} />
      </Suspense>
    </>
  );
}
