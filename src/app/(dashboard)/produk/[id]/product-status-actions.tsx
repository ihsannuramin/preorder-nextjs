"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProduct } from "@/actions/products";
import type { ProductStatus } from "@prisma/client";

type Props = { productId: string; status: ProductStatus };

export function ProductStatusActions({ productId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: ProductStatus, label: string) {
    startTransition(async () => {
      const result = await updateProduct(productId, { status: next });
      if (result.success) {
        toast.success(`Produk berhasil ${label}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal mengubah status");
      }
    });
  }

  return (
    <div className="space-y-2">
      {status === "DRAFT" && (
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() => update("PUBLISHED", "diterbitkan")}
        >
          {isPending ? "Memproses..." : "Terbitkan"}
        </Button>
      )}

      {status === "PUBLISHED" && (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => update("DRAFT", "dijadikan draf")}
          >
            {isPending ? "Memproses..." : "Jadikan Draf"}
          </Button>
          <Button
            variant="outline"
            className="w-full text-muted-foreground"
            disabled={isPending}
            onClick={() => update("ARCHIVED", "diarsipkan")}
          >
            {isPending ? "Memproses..." : "Arsipkan"}
          </Button>
        </>
      )}

      {status === "ARCHIVED" && (
        <>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => update("PUBLISHED", "diaktifkan kembali")}
          >
            {isPending ? "Memproses..." : "Aktifkan Kembali"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => update("DRAFT", "dijadikan draf")}
          >
            {isPending ? "Memproses..." : "Jadikan Draf"}
          </Button>
        </>
      )}
    </div>
  );
}
