import { getAdminUser } from "@/lib/auth/admin";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const admin = await getAdminUser();

  return (
    <>
      <PageHeader
        title="Ringkasan Platform"
        description={`Masuk sebagai ${admin.email}`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fondasi Super Admin siap</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Metrik platform (jumlah tenant, pendapatan, pertumbuhan) akan hadir di fase berikutnya.
        </CardContent>
      </Card>
    </>
  );
}
