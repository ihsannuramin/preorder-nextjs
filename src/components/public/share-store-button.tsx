"use client";

import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Bagikan halaman toko: share sheet bawaan HP, atau salin link di desktop. */
export function ShareStoreButton({ storeName }: { storeName: string }) {
  async function handleShare() {
    const url = window.location.href.split("?")[0];
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: storeName, text: `Cek PO dari ${storeName}`, url });
      } catch {
        // Dibatalkan pengguna.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link toko disalin");
    } catch {
      toast.error("Gagal menyalin, salin manual ya");
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-1" />
      Bagikan
    </Button>
  );
}
