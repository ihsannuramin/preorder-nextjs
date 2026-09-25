"use client";

import Image from "next/image";
import { toast } from "sonner";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Copy, Landmark, QrCode, Wallet } from "lucide-react";
import type { PaymentMethodType } from "@prisma/client";

export type PublicPaymentMethod = {
  id: string;
  type: PaymentMethodType;
  providerName: string;
  accountNumber: string | null;
  accountName: string | null;
  qrisImageUrl: string | null;
};

const ICONS = { BANK_TRANSFER: Landmark, EWALLET: Wallet, QRIS: QrCode } as const;

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  } catch {
    toast.error("Gagal menyalin, salin manual ya");
  }
}

/**
 * Brand §11.3 "Instruksi bayar": "Transfer Rp85.000 ke BCA 123xxx a.n. Rini.
 * Lalu unggah buktinya di sini." Renders nothing if the store has no methods,
 * so callers can fall back to "chat toko".
 */
export function PaymentInstructions({
  methods,
  totalAmount,
}: {
  methods: PublicPaymentMethod[];
  totalAmount: number;
}) {
  if (methods.length === 0) return null;

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2">
        <span className="text-sm text-foreground">Total yang perlu dibayar</span>
        <div className="flex items-center gap-1">
          <CurrencyDisplay amount={totalAmount} size="lg" className="text-primary-700" />
          <button
            type="button"
            onClick={() => copy(String(Math.round(totalAmount)), "Nominal")}
            className="rounded-full p-1.5 text-primary-700 hover:bg-primary-100"
            aria-label="Salin nominal"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Transfer ke salah satu di bawah ini, lalu unggah buktinya di sini.
      </p>

      {methods.map((m) => {
        const Icon = ICONS[m.type];
        if (m.type === "QRIS" && m.qrisImageUrl) {
          return (
            <div key={m.id} className="rounded-lg border border-border p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 text-primary-600" />
                Scan QRIS{m.accountName ? ` a.n. ${m.accountName}` : ""}
              </p>
              <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-lg border border-border bg-white">
                <Image
                  src={m.qrisImageUrl}
                  alt={`QRIS ${m.accountName ?? m.providerName}`}
                  fill
                  className="object-contain p-2"
                  sizes="240px"
                />
              </div>
            </div>
          );
        }
        return (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Icon className="h-5 w-5 flex-shrink-0 text-primary-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{m.providerName}</p>
              <p className="font-semibold tabular-nums tracking-wide">{m.accountNumber}</p>
              {m.accountName && <p className="text-xs text-muted-foreground">a.n. {m.accountName}</p>}
            </div>
            {m.accountNumber && (
              <button
                type="button"
                onClick={() => copy(m.accountNumber!, "Nomor")}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />
                Salin
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
