import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: id });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy, HH:mm", { locale: id });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy", { locale: id });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Label hitung mundur tutup PO, mis. "Tutup dalam 3 jam". `urgent` bila < 24 jam. */
export function getCloseCountdown(
  closeDate: Date | string,
  now: Date = new Date(),
): { label: string; urgent: boolean; closed: boolean } {
  const close = typeof closeDate === "string" ? new Date(closeDate) : closeDate;
  const diff = close.getTime() - now.getTime();
  if (diff <= 0) return { label: "PO sudah tutup", urgent: false, closed: true };
  if (diff < HOUR) {
    return { label: `Tutup dalam ${Math.max(1, Math.ceil(diff / MINUTE))} menit`, urgent: true, closed: false };
  }
  if (diff < DAY) {
    return { label: `Tutup dalam ${Math.floor(diff / HOUR)} jam`, urgent: true, closed: false };
  }
  return { label: `Tutup dalam ${Math.floor(diff / DAY)} hari`, urgent: false, closed: false };
}
