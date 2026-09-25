"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { startProduction, resetProductionSheet } from "@/actions/production";
import { Factory, RotateCcw } from "lucide-react";

export function StartProductionButton({
  campaignId,
  started,
}: {
  campaignId: string;
  started: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  function handleStart() {
    startTransition(async () => {
      const result = await startProduction(campaignId);
      if (result.success) {
        toast.success(`Produksi dimulai! ${result.data.recordsCreated} produk dicatat.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      const result = await resetProductionSheet(campaignId);
      if (result.success) {
        toast.success("Produksi direset");
        setConfirmReset(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (started) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} disabled={isPending}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Produksi
        </Button>
        <ConfirmDialog
          open={confirmReset}
          onOpenChange={setConfirmReset}
          title="Reset Produksi"
          description="Mengulang produksi akan menghitung ulang kebutuhan bahan dari SEMUA pesanan yang lunas di PO ini, termasuk yang sudah diproduksi sebelumnya. Lanjutkan hanya kalau kamu memang mau menghitung ulang."
          confirmLabel="Reset"
          variant="destructive"
          onConfirm={handleReset}
          loading={isPending}
        />
      </>
    );
  }

  return (
    <Button onClick={handleStart} disabled={isPending} size="sm">
      <Factory className="h-4 w-4 mr-1" />
      {isPending ? "Memproses..." : "Mulai Produksi"}
    </Button>
  );
}
