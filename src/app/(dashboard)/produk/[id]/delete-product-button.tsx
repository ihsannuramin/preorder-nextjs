"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteProduct } from "@/actions/products";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast.success("Produk berhasil dihapus");
        router.push("/produk");
      } else {
        toast.error(result.error ?? "Gagal menghapus produk");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Hapus Produk
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus Produk"
        description="Tindakan ini tidak bisa dibatalkan. Produk beserta komposisi bahannya akan dihapus permanen."
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleConfirm}
        loading={isPending}
      />
    </>
  );
}
