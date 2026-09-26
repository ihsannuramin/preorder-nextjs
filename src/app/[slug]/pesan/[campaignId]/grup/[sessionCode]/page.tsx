import { getPublicGroupOrder } from "@/actions/group-orders";
import { PublicNotice } from "@/components/public/public-notice";
import { MemberOrderClient } from "./member-order-client";

export default async function MemberOrderPage({
  params,
}: {
  params: Promise<{ slug: string; campaignId: string; sessionCode: string }>;
}) {
  const { slug, campaignId, sessionCode } = await params;
  const groupOrder = await getPublicGroupOrder(sessionCode);

  const store = groupOrder?.campaign?.store;
  if (!groupOrder || !store || store.slug !== slug || groupOrder.campaignId !== campaignId) {
    return (
      <PublicNotice
        title="Link pesanan grup tidak ditemukan"
        message="Cek lagi link dari penanggung grup, ya."
      />
    );
  }

  if (groupOrder.status !== "COLLECTING") {
    return (
      <PublicNotice
        store={store}
        title="Pesanan grup ini sudah ditutup"
        message={`${groupOrder.facilitatorName} sudah menutup pesanan grup ini. Kalau masih mau pesan, kabari ${groupOrder.facilitatorName} atau chat ${store.name}.`}
      />
    );
  }

  const group = {
    id: groupOrder.id,
    store: { name: store.name, logoUrl: store.logoUrl, brandColor: store.brandColor },
    sessionCode: groupOrder.sessionCode,
    facilitatorName: groupOrder.facilitatorName,
    memberCount: groupOrder.memberOrders?.length ?? 0,
    campaign: {
      id: groupOrder.campaign!.id,
      name: groupOrder.campaign!.name,
      products: (groupOrder.campaign!.products ?? []).map((cp) => ({
        product: {
          id: cp.product!.id,
          name: cp.product!.name,
          basePrice: Number(cp.product!.basePrice),
          imageUrl: cp.product!.imageUrl,
        },
      })),
    },
  };

  return (
    <MemberOrderClient
      group={group}
      slug={slug}
      campaignId={campaignId}
      sessionCode={sessionCode}
    />
  );
}
