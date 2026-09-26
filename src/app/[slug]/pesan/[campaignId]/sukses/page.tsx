import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { getPublicOrder } from "@/actions/orders";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { PaymentInstructions } from "@/components/public/payment-instructions";
import { buildChatSellerMessage, buildWaLink } from "@/lib/utils/whatsapp";
import { CheckCircle, Home, MessageCircle, MapPin } from "lucide-react";

export default async function SuksesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; campaignId: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;

  const order = id ? await getPublicOrder(id) : null;
  if (id && !order) notFound();

  const hasPaymentMethods = (order?.store.paymentMethods.length ?? 0) > 0;

  const chatSellerLink =
    order?.store.whatsapp &&
    buildWaLink(
      order.store.whatsapp,
      buildChatSellerMessage({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items,
      })
    );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-success-700" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pesananmu sudah tercatat</h1>
          <p className="text-muted-foreground mt-2">
            {!order
              ? "Langkah berikutnya: bayar, lalu unggah buktinya di halaman cek status."
              : hasPaymentMethods
                ? `Pesananmu sudah diterima ${order.store.name}. Langkah berikutnya: bayar, lalu unggah buktinya.`
                : `Pesananmu sudah diterima ${order.store.name}. Chat toko buat tahu cara bayarnya, lalu unggah buktinya di halaman cek status.`}
          </p>
        </div>

        {order && (
          <div className="rounded-card border border-border bg-muted p-4 mb-6 text-left space-y-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nomor Pesananmu</p>
              <p className="text-xl font-bold text-primary-700">{order.orderNumber}</p>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <CurrencyDisplay amount={order.totalAmount} size="lg" className="text-primary-700 font-bold" />
            </div>
            <p className="text-xs text-muted-foreground">
              Pesananmu sudah tercatat dengan nomor {order.orderNumber}. Simpan link cek status
              buat lihat pesananmu kapan aja.
            </p>
          </div>
        )}

        {order && hasPaymentMethods && (
          <div className="rounded-card border border-border bg-white p-4 mb-6">
            <p className="text-left font-semibold mb-3">Cara bayar</p>
            <PaymentInstructions
              methods={order.store.paymentMethods}
              totalAmount={order.totalAmount}
            />
          </div>
        )}

        <div className="space-y-3">
          {order && (
            <Button asChild className="w-full">
              <Link href={`/lacak/${order.id}`}>
                <MapPin className="h-4 w-4 mr-2" />
                {hasPaymentMethods ? "Sudah Bayar? Unggah Bukti" : "Cek Status & Unggah Bukti Bayar"}
              </Link>
            </Button>
          )}

          {chatSellerLink && (
            <Button asChild variant="secondary" className="w-full">
              <a href={chatSellerLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                Chat Toko (WA)
              </a>
            </Button>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href={`/${slug}`}>
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Toko
            </Link>
          </Button>
        </div>

        <PoweredByFooter className="mt-6" />
      </div>
    </div>
  );
}
