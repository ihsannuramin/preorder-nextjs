import { headers } from "next/headers";
import { getPublicGroupOrder } from "@/actions/group-orders";
import { PublicNotice } from "@/components/public/public-notice";
import { RingkasanClient } from "./ringkasan-client";

export default async function RingkasanPage({
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
        message="Cek lagi link pesanan grupmu, ya."
      />
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const memberLink = `${protocol}://${host}/${slug}/pesan/${campaignId}/grup/${sessionCode}`;

  const group = {
    id: groupOrder.id,
    sessionCode: groupOrder.sessionCode,
    facilitatorName: groupOrder.facilitatorName,
    facilitatorPhone: groupOrder.facilitatorPhone,
    facilitatorAddress: groupOrder.facilitatorAddress,
    facilitatorNotes: groupOrder.facilitatorNotes,
    status: groupOrder.status,
    totalAmount: Number(groupOrder.totalAmount),
    paymentProofUrl: groupOrder.paymentProofUrl,
    rejectionReason: groupOrder.rejectionReason,
    campaign: { id: groupOrder.campaign!.id, name: groupOrder.campaign!.name },
    store: {
      name: store.name,
      whatsapp: store.whatsapp,
      logoUrl: store.logoUrl,
      brandColor: store.brandColor,
      paymentMethods: store.paymentMethods,
    },
  };

  const members = (groupOrder.memberOrders ?? []).map((m) => ({
    id: m.id,
    memberName: m.memberName,
    subtotal: Number(m.subtotal),
    items: (m.items ?? []).map((i) => ({
      id: i.id,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    })),
  }));

  return (
    <RingkasanClient group={group} members={members} memberLink={memberLink} sessionCode={sessionCode} />
  );
}
