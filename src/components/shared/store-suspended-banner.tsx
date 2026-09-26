import { AlertTriangle } from "lucide-react";

export function StoreSuspendedBanner({ isActive }: { isActive: boolean }) {
  if (isActive) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 p-4">
      <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-error-700">Toko kamu sedang dinonaktifkan</p>
        <p className="text-sm text-foreground mt-0.5">
          Halaman publik tokomu sementara tidak bisa diakses pelanggan. Hubungi tim POHub untuk info
          lebih lanjut.
        </p>
      </div>
    </div>
  );
}
