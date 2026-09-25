import { Suspense } from "react";
import Link from "next/link";
import { getCampaigns } from "@/actions/campaigns";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { formatShortDate } from "@/lib/utils/date";
import { Plus, Calendar, Search } from "lucide-react";
import { CAMPAIGN_STATUS } from "@/lib/constants/status";
import type { CampaignStatus } from "@prisma/client";

const PAGE_SIZE = 10;

async function CampaignList({ q, page }: { q?: string; page: number }) {
  let campaigns, total;
  try {
    ({ data: campaigns, total } = await getCampaigns({ search: q, page, pageSize: PAGE_SIZE }));
  } catch (e) {
    if (e instanceof Error && e.message === "Toko belum dibuat") {
      return <p className="text-muted-foreground">Buat toko terlebih dahulu.</p>;
    }
    throw e;
  }

  if (campaigns.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={Calendar}
        title="Belum ada periode PO"
        description="Buat periode PO untuk mulai menerima pesanan dari pelanggan."
        ctaLabel="Buat Periode PO"
        ctaHref="/periode-po/baru"
        hintId="periode-po-empty"
        hint="Buat Periode PO untuk membuka pemesanan — pelanggan bisa langsung memesan lewat link toko kamu."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const cfg = CAMPAIGN_STATUS[campaign.status];
          return (
            <Link
              key={campaign.id}
              href={`/periode-po/${campaign.id}`}
              className="block rounded-card border border-border bg-white p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(campaign.openDate)} — {formatShortDate(campaign.closeDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {campaign._count.orders} pesanan · {campaign._count.products} produk
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={cfg.variant} className="mb-1">{cfg.label}</Badge>
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

export default async function PeriodePOPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  return (
    <>
      <PageHeader
        title="Periode PO"
        description="Buka PO, pantau pesanan, lalu tutup dan rekap"
        actions={
          <Button asChild>
            <Link href="/periode-po/baru">
              <Plus className="h-4 w-4 mr-1" />
              Buat Periode PO
            </Link>
          </Button>
        }
      />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari nama periode PO..." />
      </div>
      <Suspense key={`${q}-${page}`} fallback={<ListSkeleton />}>
        <CampaignList q={q} page={page} />
      </Suspense>
    </>
  );
}
