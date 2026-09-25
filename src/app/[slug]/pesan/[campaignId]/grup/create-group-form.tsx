"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroupOrder } from "@/actions/group-orders";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateGroupOrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const campaignId = params.campaignId as string;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    facilitatorName: "",
    facilitatorPhone: "",
    facilitatorAddress: "",
    facilitatorNotes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createGroupOrder({ campaignId, ...form });
      if (result.success) {
        router.push(`/${slug}/pesan/${campaignId}/grup/${result.data.sessionCode}/ringkasan`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/${slug}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary-600" />
              <h1 className="text-xl font-bold">Buat Group Order</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Kamu akan mendapat link untuk dibagikan ke anggota. Tagihan akan dikirim ke kamu.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info Penanggung Tagihan (Bos)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="facilitatorName">Nama Lengkap</Label>
                <Input
                  id="facilitatorName"
                  value={form.facilitatorName}
                  onChange={(e) => setForm({ ...form, facilitatorName: e.target.value })}
                  placeholder="Nama penanggung tagihan"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facilitatorPhone">Nomor HP / WhatsApp</Label>
                <Input
                  id="facilitatorPhone"
                  value={form.facilitatorPhone}
                  onChange={(e) => setForm({ ...form, facilitatorPhone: e.target.value })}
                  placeholder="08123456789"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facilitatorAddress">Alamat / Titik Ambil</Label>
                <Textarea
                  id="facilitatorAddress"
                  value={form.facilitatorAddress}
                  onChange={(e) => setForm({ ...form, facilitatorAddress: e.target.value })}
                  placeholder="Alamat pengiriman atau titik ambil untuk seluruh grup"
                  rows={2}
                  required
                  minLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facilitatorNotes">Catatan (opsional)</Label>
                <Input
                  id="facilitatorNotes"
                  value={form.facilitatorNotes}
                  onChange={(e) => setForm({ ...form, facilitatorNotes: e.target.value })}
                  placeholder="Info tambahan untuk anggota..."
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isPending} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            {isPending ? "Membuat sesi..." : "Buat Sesi Group Order"}
          </Button>
        </form>
      </div>
    </div>
  );
}
