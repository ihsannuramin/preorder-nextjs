import { getAdminUser } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAdminUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
