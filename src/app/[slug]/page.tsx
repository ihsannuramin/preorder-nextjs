import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils/date";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { StoreIdentity } from "@/components/public/store-identity";
import {
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Store,
  Package,
  ShoppingBag,
  Users,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getSocialPlatform,
  resolveSocialUrl,
  type StoreSocialLink,
} from "@/lib/constants/social-platforms";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  facebook: Facebook,
  twitter: XIcon,
  website: Globe,
};

const FallbackPlatformIcon = Store;

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return { title: "Toko tidak ditemukan" };
  return {
    title: { absolute: store.name },
    description: store.description ?? `Pre-order dari ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description ?? "",
      images: store.logoUrl ? [store.logoUrl] : [],
    },
  };
}

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findFirst({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      },
      campaigns: {
        where: {
          status: "OPEN",
          openDate: { lte: new Date() },
          closeDate: { gte: new Date() },
        },
        include: {
          products: {
            include: { product: true },
          },
        },
        orderBy: { closeDate: "asc" },
      },
    },
  });

  if (!store) notFound();

  const socialLinks: StoreSocialLink[] =
    Array.isArray(store.socialLinks) && store.socialLinks.length > 0
      ? (store.socialLinks as unknown as StoreSocialLink[])
      : store.instagram
        ? [{ platform: "instagram", value: store.instagram }]
        : [];

  return (
    <div className="min-h-screen bg-background">
      {store.brandColor && (
        <div className="h-1.5 w-full" style={{ backgroundColor: store.brandColor }} aria-hidden="true" />
      )}
      <div className="max-w-2xl mx-auto px-4 pb-16 pt-8">
        <div className="flex flex-col items-center text-center mb-8">
          <StoreIdentity
            name={store.name}
            logoUrl={store.logoUrl}
            brandColor={store.brandColor}
            priority
            nameAs="h1"
          />
          {store.description && (
            <p className="text-muted-foreground mt-2 text-sm max-w-sm">{store.description}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {store.whatsapp && (
              <Button asChild size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </a>
              </Button>
            )}
            {socialLinks.map((link, i) => {
              const def = getSocialPlatform(link.platform);
              const Icon = PLATFORM_ICONS[link.platform] ?? FallbackPlatformIcon;
              return (
                <Button key={i} asChild size="sm" variant="outline">
                  <a
                    href={resolveSocialUrl(link.platform, link.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {def.label}
                  </a>
                </Button>
              );
            })}
            {store.showGoogleMaps && store.googleMapsUrl && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={store.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Lihat Lokasi
                </a>
              </Button>
            )}
          </div>
        </div>

        {store.campaigns.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-semibold">PO yang Lagi Buka</h2>
            {store.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-card border border-primary-200 bg-primary-50 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-primary-900">{campaign.name}</h3>
                    <p className="text-xs text-primary-700">
                      Ditutup {formatDate(campaign.closeDate)}
                    </p>
                  </div>
                  <Badge variant="default" className="flex-shrink-0">Buka</Badge>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/${store.slug}/pesan/${campaign.id}`}>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Pesan Sekarang
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${store.slug}/pesan/${campaign.id}/grup`}>
                      <Users className="h-4 w-4 mr-2" />
                      Pesanan Grup
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {store.products.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Produk</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {store.products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-card border border-border bg-white overflow-hidden"
                >
                  <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm">{product.name}</p>
                    <CurrencyDisplay
                      amount={Number(product.basePrice)}
                      size="sm"
                      className="text-primary-700 font-medium mt-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {store.products.length === 0 && store.campaigns.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada PO yang buka. Chat toko buat tahu PO berikutnya.</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href={`/${store.slug}/cek-pesanan`}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Sudah pesan? Cek status pesananmu
          </Link>
        </div>

        <PoweredByFooter className="mt-8" />
      </div>
    </div>
  );
}
