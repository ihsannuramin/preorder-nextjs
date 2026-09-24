export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 md:ml-60 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">{children}</div>
    </main>
  );
}
