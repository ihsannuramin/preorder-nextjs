"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  Menu,
  Boxes,
  Calendar,
  TrendingUp,
  FileText,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/pesanan", label: "Pesanan", icon: ShoppingBag },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/toko", label: "Toko", icon: Store },
];

const moreItems = [
  { href: "/bahan-baku", label: "Bahan & Material", icon: Boxes },
  { href: "/periode-po", label: "Periode PO", icon: Calendar },
  { href: "/keuntungan", label: "Keuntungan", icon: TrendingUp },
  { href: "/laporan", label: "Laporan", icon: FileText },
  { href: "/kalkulator-hpp", label: "Kalkulator HPP", icon: Calculator },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full min-w-[52px] min-h-[44px] justify-center transition-all duration-150",
                  isActive
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full min-w-[52px] min-h-[44px] justify-center transition-all duration-150",
              isMoreActive
                ? "bg-primary-50 text-primary-700 border border-primary-200"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Lainnya</span>
          </button>
        </div>
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-modal rounded-b-none border-b-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0">
          <DialogHeader>
            <DialogTitle>Menu Lainnya</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
            {moreItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 text-sm font-semibold transition-all duration-150 min-h-[88px]",
                    isActive
                      ? "border-primary bg-primary-50 text-primary-700"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
