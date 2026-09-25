"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { register } from "@/actions/auth";
import { CheckCircle } from "lucide-react";

export default function DaftarPage() {
  const [isPending, startTransition] = useTransition();
  const [registered, setRegistered] = useState<string | null>(null);

  function handleRegister(formData: FormData) {
    startTransition(async () => {
      const result = await register(formData);
      if (result.success) {
        setRegistered(result.data.email);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (registered) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-success-50 p-4">
              <CheckCircle className="h-8 w-8 text-success-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Cek email kamu!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kami sudah mengirim link konfirmasi ke{" "}
                <strong>{registered}</strong>. Klik link tersebut untuk
                mengaktifkan akun.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/masuk">Kembali ke halaman masuk</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Buat Toko</CardTitle>
        <CardDescription>Coba buat PO pertamamu. Pelanggan pesan lewat satu link, kamu tahu untungnya.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Nama Toko</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="Contoh: Dapur Bu Rini"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="kamu@email.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Mendaftar..." : "Daftar Sekarang"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-primary-600 font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
