import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicStoreSelect } from "@/lib/public-store";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { PublicNotice } from "@/components/public/public-notice";
import { StoreIdentity } from "@/components/public/store-identity";
import { OrderForm } from "./order-form";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string; campaignId: string }>;
  searchParams?: Promise<{ produk?: string }>;
};

async function getCampaign(slug: string, campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      store: { select: publicStoreSelect },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              imageUrl: true,
              images: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!campaign || campaign.store.slug !== slug || !campaign.store.isActive) return null;

  return {
    id: campaign.id,
    name: campaign.name,
    isOpen: campaign.status === "OPEN" && new Date() <= campaign.closeDate,
    store: campaign.store,
    products: campaign.products.map((cp) => ({
      product: {
        ...cp.product,
        basePrice: Number(cp.product.basePrice),
      },
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, campaignId } = await params;
  const campaign = await getCampaign(slug, campaignId);
  if (!campaign) return {};
  return {
    title: `${campaign.name} — ${campaign.store.name}`,
  };
}

export default async function OrderFormPage({ params, searchParams }: Props) {
  const { slug, campaignId } = await params;
  const { produk } = (await searchParams) ?? {};
  const campaign = await getCampaign(slug, campaignId);

  if (!campaign) notFound();

  if (!campaign.isOpen) {
    return (
      <PublicNotice
        store={campaign.store}
        title="PO ini sudah tutup"
        message="Chat toko buat tahu PO berikutnya."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <StoreIdentity
            name={campaign.store.name}
            logoUrl={campaign.store.logoUrl}
            brandColor={campaign.store.brandColor}
            size="sm"
          />
          <h1 className="text-xl font-bold mt-3">{campaign.name}</h1>
        </div>
        <OrderForm
          campaign={campaign}
          slug={slug}
          campaignId={campaignId}
          initialProductId={produk}
        />
        <PoweredByFooter className="mt-8" />
      </div>
    </div>
  );
}
