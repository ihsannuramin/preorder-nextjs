"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatDateTime, getCloseCountdown } from "@/lib/utils/date";

/**
 * Hitung mundur tutup PO. Render awal (server) hanya tanggal agar tidak beda
 * zona waktu saat hydration; setelah mount tampil jam lokal + hitung mundur.
 */
export function CloseCountdown({
  closeDate,
  className,
}: {
  closeDate: string;
  className?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return <p className={cn("text-xs", className)}>Ditutup {formatDate(closeDate)}</p>;
  }

  const { label, urgent } = getCloseCountdown(closeDate, now);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-xs", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold",
          urgent && "rounded-full bg-warning-50 px-2 py-0.5 text-warning-700",
        )}
      >
        <Clock className="h-3 w-3" />
        {label}
      </span>
      <span className="opacity-80">· {formatDateTime(closeDate)}</span>
    </p>
  );
}
