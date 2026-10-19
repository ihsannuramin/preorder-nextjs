import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { StoreIdentity } from "@/components/public/store-identity";
import { StoreBannerCarousel } from "@/components/public/store-banner-carousel";
import { RichTextContent } from "@/components/shared/rich-text-content";
import { ProductGrid, type PublicProduct } from "@/components/public/product-grid";
import { isRichTextEmpty, richTextToPlain } from "@/lib/utils/rich-text";
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

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  threads: ThreadsIcon,
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
  const plainDescription = store.description
    ? richTextToPlain(store.description).slice(0, 160)
    : "";
  const ogImage = store.bannerUrls[0] ?? store.logoUrl;
  return {
    title: { absolute: store.name },
    description: plainDescription || `Pre-order dari ${store.name}`,
    openGraph: {
      title: store.name,
      description: plainDescription,
      images: ogImage ? [ogImage] : [],
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
  const hasBanners = store.bannerUrls.length > 0;
  const publicProducts: PublicProduct[] = store.products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.basePrice),
    description: product.description,
    images: product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : [],
    openCampaigns: store.campaigns
      .filter((c) => c.products.some((cp) => cp.productId === product.id))
      .map((c) => ({ id: c.id, name: c.name })),
  }));

  return (
    <div className="min-h-screen bg-background">
      {store.brandColor && (
        <div className="h-1.5 w-full" style={{ backgroundColor: store.brandColor }} aria-hidden="true" />
      )}
      <div className={`max-w-3xl mx-auto px-4 pb-16 ${hasBanners ? "pt-4" : "pt-8"}`}>
        {hasBanners && (
          <div className="mb-6">
            <StoreBannerCarousel images={store.bannerUrls} storeName={store.name} />
          </div>
        )}
        <div className="flex flex-col items-center text-center mb-8">
          <StoreIdentity
            name={store.name}
            logoUrl={store.logoUrl}
            brandColor={store.brandColor}
            priority
            nameAs="h1"
          />
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

        {!isRichTextEmpty(store.description) && (
          <section className="mb-8 rounded-card border border-border bg-white p-5">
            <h2 className="text-lg font-semibold mb-3">Tentang {store.name}</h2>
            <RichTextContent html={store.description} />
          </section>
        )}

        {publicProducts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Produk</h2>
            <ProductGrid products={publicProducts} slug={store.slug} />
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
