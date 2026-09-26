import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { StoreIdentity } from "@/components/public/store-identity";
import { cleanPhone } from "@/lib/utils/whatsapp";
import { Home, MessageCircle } from "lucide-react";

type NoticeStore = {
  name: string;
  slug: string;
  whatsapp: string | null;
  logoUrl: string | null;
  brandColor: string | null;
};

/**
 * Halaman pemberitahuan untuk pelanggan (PO tutup, sesi grup ditutup, link tidak valid).
 * Brand §11.3: toko yang bicara, lalu beri langkah berikutnya (chat toko / kembali ke toko).
 */
export function PublicNotice({
  store,
  title,
  message,
}: {
  store?: NoticeStore | null;
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full text-center">
        {store && (
          <div className="mb-6">
            <StoreIdentity
              name={store.name}
              logoUrl={store.logoUrl}
              brandColor={store.brandColor}
              size="sm"
            />
          </div>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>

        {store && (
          <div className="space-y-3 mt-6">
            {store.whatsapp && (
              <Button asChild className="w-full">
                <a
                  href={`https://wa.me/${cleanPhone(store.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat {store.name}
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/${store.slug}`}>
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Toko
              </Link>
            </Button>
          </div>
        )}

        <PoweredByFooter className="mt-6" />
      </div>
    </div>
  );
}
