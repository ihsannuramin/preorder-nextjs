import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicGroupOrder } from "@/actions/group-orders";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { PublicNotice } from "@/components/public/public-notice";
import { StoreIdentity } from "@/components/public/store-identity";

export default async function SuksesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; campaignId: string; sessionCode: string }>;
  searchParams: Promise<{ nama?: string }>;
}) {
  const { slug, campaignId, sessionCode } = await params;
  const { nama } = await searchParams;

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="text-center max-w-sm w-full">
        <div className="mb-6">
          <StoreIdentity
            name={store.name}
            logoUrl={store.logoUrl}
            brandColor={store.brandColor}
            size="sm"
          />
        </div>
        <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-9 w-9 text-success-700" />
        </div>
        <h1 className="text-xl font-bold mb-2">Pilihanmu sudah masuk</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {nama ? (
            <>
              Pilihan <strong>{nama}</strong> sudah masuk ke pesanan grup{" "}
              {groupOrder.facilitatorName}.
            </>
          ) : (
            <>Pilihanmu sudah masuk ke pesanan grup {groupOrder.facilitatorName}.</>
          )}{" "}
          Pembayarannya diurus {groupOrder.facilitatorName} langsung ke {store.name}.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/${slug}/pesan/${campaignId}/grup/${sessionCode}`}>
            Kembali ke Pesanan Grup
          </Link>
        </Button>
        <PoweredByFooter className="mt-6" />
      </div>
    </div>
  );
}
