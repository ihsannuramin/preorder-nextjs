"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils/date";

/**
 * Tanggal + jam dalam zona waktu perangkat pengguna. Server (UTC) tidak
 * merender jamnya agar tidak salah zona & tidak mismatch saat hydration.
 */
export function LocalDateTime({ date, className }: { date: Date | string; className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(formatDateTime(date));
  }, [date]);

  const iso = typeof date === "string" ? date : date.toISOString();
  return (
    <time dateTime={iso} className={className}>
      {text ?? " "}
    </time>
  );
}
