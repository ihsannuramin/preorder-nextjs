"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  } catch {
    toast.error("Gagal menyalin, salin manual ya");
  }
}

/** Nomor pesanan + link cek status yang gampang disimpan/dibagikan pelanggan. */
export function OrderLinkActions({
  orderId,
  orderNumber,
  storeName,
}: {
  orderId: string;
  orderNumber: string;
  storeName: string;
}) {
  const [trackingUrl, setTrackingUrl] = useState(`/lacak/${orderId}`);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setTrackingUrl(`${window.location.origin}/lacak/${orderId}`);
    setCanShare(typeof navigator.share === "function");
  }, [orderId]);

  const shareText = `Pesanan ${orderNumber} di ${storeName}. Cek status & unggah bukti bayar: ${trackingUrl}`;

  async function handleShare() {
    try {
      await navigator.share({ title: `Pesanan ${orderNumber}`, text: shareText });
    } catch {
      // Dibatalkan pengguna.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Nomor Pesananmu</p>
          <p className="text-xl font-bold text-primary-700">{orderNumber}</p>
        </div>
        <button
          type="button"
          onClick={() => copyText(orderNumber, "Nomor pesanan")}
          className="flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <Copy className="h-3.5 w-3.5" />
          Salin
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-white p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Link2 className="h-3.5 w-3.5" />
          Simpan link cek status pesanan
        </p>
        <p className="mb-2 break-all font-mono text-[11px] text-muted-foreground">{trackingUrl}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => copyText(trackingUrl, "Link")}>
            <Copy className="h-4 w-4 mr-1" />
            Salin Link
          </Button>
          {canShare ? (
            <Button type="button" size="sm" variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Bagikan
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Kirim ke WA
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
