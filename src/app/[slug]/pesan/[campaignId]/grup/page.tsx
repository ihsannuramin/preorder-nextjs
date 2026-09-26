import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { publicStoreSelect } from "@/lib/public-store";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { PublicNotice } from "@/components/public/public-notice";
import { StoreIdentity } from "@/components/public/store-identity";
import { CreateGroupForm } from "./create-group-form";

type Props = { params: Promise<{ slug: string; campaignId: string }> };

async function getCampaign(slug: string, campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      name: true,
      status: true,
      closeDate: true,
      store: { select: publicStoreSelect },
    },
  });
  if (!campaign || campaign.store.slug !== slug) return null;
  return campaign;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, campaignId } = await params;
  const campaign = await getCampaign(slug, campaignId);
  if (!campaign) return {};
  return { title: `Pesanan Grup — ${campaign.store.name}` };
}

export default async function CreateGroupOrderPage({ params }: Props) {
  const { slug, campaignId } = await params;
  const campaign = await getCampaign(slug, campaignId);
  if (!campaign) notFound();

  if (campaign.status !== "OPEN" || new Date() > campaign.closeDate) {
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
          <h1 className="text-xl font-bold mt-3">Buat Pesanan Grup</h1>
          <p className="text-sm text-muted-foreground mt-1">{campaign.name}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Kamu dapat satu link buat dibagikan ke teman-teman. Mereka pilih pesanan sendiri,
            kamu yang bayar sekaligus.
          </p>
        </div>

        <CreateGroupForm slug={slug} campaignId={campaignId} storeName={campaign.store.name} />
        <PoweredByFooter className="mt-8" />
      </div>
    </div>
  );
}
