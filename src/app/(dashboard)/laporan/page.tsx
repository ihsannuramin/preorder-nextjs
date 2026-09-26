"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

const reports = [
  {
    title: "Laporan Pesanan",
    description: "Semua pesanan beserta detail pelanggan dan status",
    endpoint: "/api/export/csv?type=orders",
    format: "CSV",
  },
  {
    title: "Laporan Pesanan (Excel)",
    description: "Semua pesanan dalam format spreadsheet",
    endpoint: "/api/export/excel?type=orders",
    format: "Excel",
  },
  {
    title: "Laporan Pesanan (PDF)",
    description: "Semua pesanan dalam format PDF siap cetak",
    endpoint: "/api/export/pdf?type=orders",
    format: "PDF",
  },
  {
    title: "Laporan Keuntungan",
    description: "Ringkasan pendapatan, HPP, dan keuntungan per PO",
    endpoint: "/api/export/csv?type=profit",
    format: "CSV",
  },
  {
    title: "Laporan Produksi",
    description: "Kebutuhan bahan dari semua PO",
    endpoint: "/api/export/csv?type=production",
    format: "CSV",
  },
];

export default function LaporanPage() {
  function handleDownload(endpoint: string) {
    window.open(endpoint, "_blank");
  }

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Unduh laporan data bisnismu"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary-600" />
                    {report.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{report.description}</CardDescription>
                </div>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {report.format}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(report.endpoint)}
              >
                <Download className="h-4 w-4 mr-1" />
                Unduh
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
