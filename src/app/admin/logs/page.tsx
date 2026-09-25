import Link from "next/link";
import { getAdminUser } from "@/lib/auth/admin";
import { listLogFiles, readLogRecords, type LogLevel } from "@/lib/utils/log-reader";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListSearch } from "@/components/shared/list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, FileText } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";

const LEVEL_FILTERS: { value: LogLevel | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "error", label: "Error" },
  { value: "warn", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" },
];

const LEVEL_BADGE: Record<string, BadgeProps["variant"]> = {
  error: "destructive",
  warn: "warning",
  info: "info",
  debug: "secondary",
  unknown: "outline",
};

function isLogLevel(value?: string): value is LogLevel {
  return value === "error" || value === "warn" || value === "info" || value === "debug";
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string; level?: string; q?: string }>;
}) {
  await getAdminUser();

  const { file: fileParam, level: levelParam, q } = await searchParams;
  const files = listLogFiles();
  const activeFile = fileParam && files.includes(fileParam) ? fileParam : files[0];
  const level = isLogLevel(levelParam) ? levelParam : undefined;

  const records = activeFile
    ? readLogRecords(activeFile, { level, search: q, limit: 300 })
    : [];

  return (
    <>
      <PageHeader title="Log Sistem" description="Log error dan aktivitas server terbaru" />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-warning-700" />
        <p>
          Log ini dibaca dari file lokal (<code>logs/*.log</code>) di server yang sedang menangani
          request ini. Jika aplikasi berjalan di platform serverless dengan banyak instance (mis.
          Vercel), log dari instance lain <strong>tidak akan terlihat di sini</strong> karena
          filesystem-nya sementara/per-instance. Untuk observability produksi yang andal, sambungkan
          ke layanan logging eksternal (mis. Axiom, Better Stack, atau Vercel's built-in log drain).
        </p>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada file log"
          description="File log akan muncul di sini setelah ada aktivitas yang tercatat di server ini."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((f) => (
              <Link
                key={f}
                href={`/admin/logs?file=${f}${level ? `&level=${level}` : ""}${q ? `&q=${q}` : ""}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  f === activeFile
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-muted-foreground border-border hover:border-slate-400"
                )}
              >
                {f}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {LEVEL_FILTERS.map((lvl) => {
              const isActive = lvl.value === "ALL" ? !level : level === lvl.value;
              const href = `/admin/logs?file=${activeFile}${
                lvl.value !== "ALL" ? `&level=${lvl.value}` : ""
              }${q ? `&q=${q}` : ""}`;
              return (
                <Link
                  key={lvl.value}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    isActive
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-muted-foreground border-border hover:border-primary-300"
                  )}
                >
                  {lvl.label}
                </Link>
              );
            })}
          </div>

          <div className="mb-4">
            <ListSearch defaultValue={q ?? ""} placeholder="Cari pesan, context, atau isi error..." />
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Tidak ada entri log yang cocok.
            </p>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-3 font-mono text-xs">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={LEVEL_BADGE[r.level]}>{r.level.toUpperCase()}</Badge>
                      <span className="text-muted-foreground">{r.timestamp}</span>
                      <span className="text-muted-foreground">[{r.context}]</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{r.message}</p>
                    {r.details && (
                      <pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground border-t border-border pt-2">
                        {r.details}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
