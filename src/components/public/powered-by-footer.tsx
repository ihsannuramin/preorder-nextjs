import { cn } from "@/lib/utils/cn";

/**
 * Brand Guideline v1.1 §11.1 — di halaman pelanggan, toko yang bicara.
 * POHub cukup muncul di footer: kecil, abu-abu (#6B7280), bisa diklik.
 */
export function PoweredByFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("py-6 text-center text-xs text-neutral", className)}>
      <a href="/" className="hover:underline">
        Dibuat dengan POHub by Tojuko.ID
      </a>
    </footer>
  );
}
