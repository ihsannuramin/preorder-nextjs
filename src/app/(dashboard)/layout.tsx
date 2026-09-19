import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StoreCompletionBanner } from "@/components/shared/store-completion-banner";
import { StoreSuspendedBanner } from "@/components/shared/store-suspended-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { store: true },
  });
  const isStoreComplete = Boolean(
    dbUser?.store?.name && dbUser.store.slug && dbUser.store.whatsapp
  );
  const isStoreActive = dbUser?.store ? dbUser.store.isActive : true;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <DashboardShell>
        <StoreSuspendedBanner isActive={isStoreActive} />
        <StoreCompletionBanner isComplete={isStoreComplete} />
        {children}
      </DashboardShell>
      <BottomNav />
    </div>
  );
}
