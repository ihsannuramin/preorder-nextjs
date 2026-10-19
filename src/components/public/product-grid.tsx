"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PublicProduct = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  images: string[];
  /** PO yang sedang buka dan menjual produk ini. */
  openCampaigns: { id: string; name: string }[];
};

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={images[active]}
          alt={`${name} ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 480px"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductGrid({ products, slug }: { products: PublicProduct[]; slug: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelectedId(product.id)}
            className="group overflow-hidden rounded-card border border-border bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 250px"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
              {product.openCampaigns.length > 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  PO Buka
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
              <CurrencyDisplay
                amount={product.price}
                size="sm"
                className="mt-0.5 font-medium text-primary-700"
              />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          {selected && (
            <>
              <ProductGallery images={selected.images} name={selected.name} />
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg">{selected.name}</DialogTitle>
                <CurrencyDisplay amount={selected.price} size="lg" className="font-bold text-primary-700" />
                {selected.description ? (
                  <DialogDescription className="whitespace-pre-line pt-1 text-sm leading-relaxed text-foreground/80">
                    {selected.description}
                  </DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">Detail produk {selected.name}</DialogDescription>
                )}
              </DialogHeader>

              {selected.openCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {selected.openCampaigns.map((campaign) => (
                    <Button key={campaign.id} asChild className="w-full">
                      <Link href={`/${slug}/pesan/${campaign.id}?produk=${selected.id}`}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {selected.openCampaigns.length > 1 ? `Pesan di ${campaign.name}` : "Pesan Sekarang"}
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                  Belum ada PO yang buka untuk produk ini. Chat toko buat tahu jadwal PO berikutnya.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
