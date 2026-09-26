import { Suspense } from "react";
import Link from "next/link";
import { getIngredientsList } from "@/actions/ingredients";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { UNIT_LABELS } from "@/lib/constants/units";
import { INGREDIENT_CATEGORY_LABELS } from "@/lib/constants/ingredient-categories";
import { Plus, Boxes, Search } from "lucide-react";

const PAGE_SIZE = 10;

async function IngredientList({ q, page }: { q?: string; page: number }) {
  let ingredients, total;
  try {
    ({ data: ingredients, total } = await getIngredientsList({ search: q, page, pageSize: PAGE_SIZE }));
  } catch (e) {
    if (e instanceof Error && e.message === "Toko belum dibuat") {
      return <p className="text-muted-foreground">Buat toko terlebih dahulu.</p>;
    }
    throw e;
  }

  if (ingredients.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={Boxes}
        title="Belum ada bahan"
        description="Catat bahan & material yang kamu pakai. Modal per produk (HPP) dan kebutuhan belanja jadi terhitung."
        ctaLabel="Tambah Bahan & Material"
        ctaHref="/bahan-baku/baru"
        hintId="bahan-baku-empty"
        hint="Isi bahan & material supaya modal per produk (HPP) terhitung otomatis."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {ingredients.map((ingredient) => {
          const unitLabel = UNIT_LABELS[ingredient.unit];
          const isOut = ingredient.currentStock <= 0;
          const isLow = !isOut && ingredient.currentStock <= ingredient.minimumStock;

          return (
            <Link
              key={ingredient.id}
              href={`/bahan-baku/${ingredient.id}`}
              className="block rounded-card border border-border bg-white p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Boxes className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{ingredient.name}</p>
                      {isOut && <Badge variant="destructive">Stok Habis</Badge>}
                      {isLow && <Badge variant="warning">Stok Menipis</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {INGREDIENT_CATEGORY_LABELS[ingredient.category]} · Stok: {ingredient.currentStock} {unitLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Biaya rata-rata: <CurrencyDisplay amount={ingredient.averageCost} size="sm" />/{unitLabel}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <CurrencyDisplay
                    amount={ingredient.currentStock * ingredient.averageCost}
                    size="sm"
                    className="block text-primary-700 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">nilai stok</p>
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

export default async function BahanBakuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  return (
    <>
      <PageHeader
        title="Bahan & Material"
        description="Tahu bahan mana yang mulai habis, dan berapa modalnya"
        actions={
          <Button asChild>
            <Link href="/bahan-baku/baru">
              <Plus className="h-4 w-4 mr-1" />
              Tambah Bahan
            </Link>
          </Button>
        }
      />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari bahan atau material..." />
      </div>
      <Suspense key={`${q}-${page}`} fallback={<ListSkeleton />}>
        <IngredientList q={q} page={page} />
      </Suspense>
    </>
  );
}
