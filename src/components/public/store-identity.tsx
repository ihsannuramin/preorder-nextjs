import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: { box: "w-12 h-12", icon: "h-6 w-6", img: "48px", name: "text-sm font-semibold" },
  lg: { box: "w-20 h-20", icon: "h-10 w-10", img: "80px", name: "text-2xl font-bold" },
} as const;

/**
 * Brand §11.1 — identitas toko yang tampil di atas halaman pelanggan:
 * logo, nama, dan warna toko. Warna toko hanya untuk bingkai identitas;
 * tombol dan status tetap memakai biru POHub.
 */
export function StoreIdentity({
  name,
  logoUrl,
  brandColor,
  size = "lg",
  priority,
  nameAs: NameTag = "p",
}: {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  size?: keyof typeof SIZES;
  priority?: boolean;
  nameAs?: "h1" | "p";
}) {
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center overflow-hidden ring-4 ring-offset-2 ring-offset-background",
          s.box,
          !brandColor && "bg-primary-50 ring-primary-100",
        )}
        style={brandColor ? { backgroundColor: `${brandColor}1A`, ["--tw-ring-color" as string]: brandColor } : undefined}
      >
        {logoUrl ? (
          <Image src={logoUrl} alt={name} fill className="object-cover" sizes={s.img} priority={priority} />
        ) : (
          <Package
            className={cn(s.icon, !brandColor && "text-primary-600")}
            style={brandColor ? { color: brandColor } : undefined}
          />
        )}
      </div>
      <NameTag className={cn("mt-3 text-foreground", s.name)}>{name}</NameTag>
    </div>
  );
}
