import Link from "next/link";
import { getProductionSheet } from "@/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { UNIT_LABELS } from "@/lib/constants/units";
import { ArrowLeft, Factory, CheckCircle2, AlertTriangle } from "lucide-react";
import { GenerateSheetButton } from "./generate-sheet-button";
import { StartProductionButton } from "./start-production-button";

export default async function ProduksiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = await getProductionSheet(id);

  return (
    <>
      <PageHeader
        title="Lembar Produksi"
        description={sheet?.campaign.name}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href={`/periode-po/${id}`}><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Link>
            </Button>
            {!sheet?.startedAt && <GenerateSheetButton campaignId={id} />}
            {sheet && <StartProductionButton campaignId={id} started={!!sheet.startedAt} />}
          </div>
        }
      />

      {!sheet ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Factory className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Lembar produksi belum dibuat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Klik tombol "Generate" untuk menghitung kebutuhan bahan dari semua pesanan yang sudah lunas.
            </p>
            <GenerateSheetButton campaignId={id} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sheet.items.length > 0 && (
            <Alert variant={sheet.availability.ready ? "success" : "warning"}>
              {sheet.availability.ready ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{sheet.availability.ready ? "Siap Produksi" : "Bahan Kurang"}</AlertTitle>
              <AlertDescription>
                {sheet.availability.ready ? (
                  "Semua bahan tersedia untuk memulai produksi."
                ) : (
                  <ul className="space-y-1">
                    {sheet.availability.missing.map((m) => (
                      <li key={m.ingredientId} className="flex items-center justify-between">
                        <span>
                          {m.ingredientName} (kurang {m.shortBy.toFixed(2)} {UNIT_LABELS[m.unit]})
                        </span>
                        <Link
                          href={`/bahan-baku/${m.ingredientId}/pembelian`}
                          className="underline font-medium"
                        >
                          Catat Pembelian
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {sheet.startedAt && (
            <Alert variant="default">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Produksi Sudah Dimulai</AlertTitle>
              <AlertDescription>
                Stok bahan sudah dikurangi dan riwayat produksi telah dicatat pada{" "}
                {new Date(sheet.startedAt).toLocaleDateString("id-ID")}.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Kebutuhan Bahan & Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sheet.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada kebutuhan bahan yang terdeteksi. Pastikan produk sudah punya komposisi bahan.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-semibold">Bahan</th>
                        <th className="pb-2 font-semibold text-right">Jumlah</th>
                        <th className="pb-2 font-semibold text-right">Est. Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sheet.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5">{item.ingredientName}</td>
                          <td className="py-2.5 text-right">
                            {Number(item.totalQuantity).toFixed(2)} {UNIT_LABELS[item.unit]}
                          </td>
                          <td className="py-2.5 text-right">
                            <CurrencyDisplay amount={Number(item.estimatedCost)} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold">
                        <td className="pt-2.5" colSpan={2}>Total Biaya Bahan</td>
                        <td className="pt-2.5 text-right">
                          <CurrencyDisplay
                            amount={sheet.items.reduce((s, i) => s + Number(i.estimatedCost), 0)}
                            size="sm"
                            className="text-primary-700 font-bold"
                          />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
