import { Suspense } from "react";
import Link from "next/link";
import { getProductsList } from "@/actions/products";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ListSearch, ListPagination } from "@/components/shared/list-controls";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { CATEGORY_LABELS } from "@/lib/constants/categories";
import { calculateHpp } from "@/lib/utils/hpp";
import { calculateCapacity } from "@/lib/utils/production";
import { isRecipeSetupIncomplete } from "@/lib/utils/product-setup";
import { Plus, Package, Search, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { ProductStatus } from "@prisma/client";

const PAGE_SIZE = 10;

const statusConfig: Record<ProductStatus, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Terbit", variant: "success" },
  ARCHIVED: { label: "Arsip", variant: "outline" },
};

async function ProductList({ q, page }: { q?: string; page: number }) {
  let products, total;
  try {
    ({ data: products, total } = await getProductsList({ search: q, page, pageSize: PAGE_SIZE }));
  } catch (e) {
    if (e instanceof Error && e.message === "Toko belum dibuat") {
      return <p className="text-muted-foreground">Buat toko terlebih dahulu.</p>;
    }
    throw e;
  }

  if (products.length === 0) {
    return q ? (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Tidak ada hasil untuk <span className="font-medium">"{q}"</span></p>
      </div>
    ) : (
      <EmptyState
        icon={Package}
        title="Belum ada produk"
        description="Buat produk pertama kamu dan mulai terima pesanan."
        ctaLabel="Buat Produk"
        ctaHref="/produk/baru"
        hintId="produk-empty"
        hint="Tambahkan produk yang kamu jual di sini — ini yang akan muncul di halaman pesanan pelangganmu."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {products.map((product) => {
          const hpp = calculateHpp(
            product.recipeItems.map((ri) => ({
              quantity: Number(ri.quantity),
              ingredient: { averageCost: Number(ri.ingredient.averageCost) },
            })),
            [],
            product.costMode === "MANUAL" ? Number(product.manualCostPrice ?? 0) : undefined
          );
          const capacity = calculateCapacity(
            product.recipeItems.map((ri) => ({
              quantity: Number(ri.quantity),
              ingredient: { currentStock: Number(ri.ingredient.currentStock) },
            }))
          );
          const cfg = statusConfig[product.status];
          const setupIncomplete = isRecipeSetupIncomplete(product);

          return (
            <Link
              key={product.id}
              href={`/produk/${product.id}`}
              className="block rounded-card border border-border bg-white p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-9 h-9 rounded-md flex-shrink-0 overflow-hidden bg-primary-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[product.category]}</p>
                    {hpp > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        HPP: <CurrencyDisplay amount={hpp} size="sm" />
                      </p>
                    )}
                    {Number.isFinite(capacity) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bisa produksi: {capacity} pcs
                      </p>
                    )}
                    {setupIncomplete && (
                      <p className="flex items-center gap-1 text-xs text-warning mt-0.5 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Resep belum lengkap
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={cfg.variant} className="mb-1">{cfg.label}</Badge>
                  <CurrencyDisplay amount={product.basePrice} size="sm" className="block text-primary-700 font-semibold" />
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

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  return (
    <>
      <PageHeader
        title="Produk"
        description="Kelola produk yang kamu jual"
        actions={
          <Button asChild>
            <Link href="/produk/baru">
              <Plus className="h-4 w-4 mr-1" />
              Buat Produk
            </Link>
          </Button>
        }
      />
      <div className="mb-3">
        <ListSearch defaultValue={q ?? ""} placeholder="Cari nama produk..." />
      </div>
      <Suspense key={`${q}-${page}`} fallback={<ListSkeleton />}>
        <ProductList q={q} page={page} />
      </Suspense>
    </>
  );
}
