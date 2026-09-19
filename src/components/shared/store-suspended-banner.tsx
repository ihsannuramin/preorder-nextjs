import { AlertTriangle } from "lucide-react";

export function StoreSuspendedBanner({ isActive }: { isActive: boolean }) {
  if (isActive) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-[#0D0D0D] bg-[#FF3B6B] p-4 shadow-[3px_3px_0px_#0D0D0D]">
      <AlertTriangle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-white">Toko kamu sedang dinonaktifkan</p>
        <p className="text-sm text-white/90 mt-0.5">
          Halaman publik tokomu sementara tidak bisa diakses pelanggan. Hubungi tim POHub untuk info
          lebih lanjut.
        </p>
      </div>
    </div>
  );
}
