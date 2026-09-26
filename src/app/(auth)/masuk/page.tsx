"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, loginWithGoogle } from "@/actions/auth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function MasukPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  function handleLogin(formData: FormData) {
    startTransition(async () => {
      const result = await login(formData);
      if (result && !result.success) {
        toast.error(result.error);
      }
    });
  }

  async function handleGoogleLogin() {
    setGooglePending(true);
    const result = await loginWithGoogle();
    if (result.success) {
      window.location.href = result.data.url;
    } else {
      toast.error(result.error);
      setGooglePending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
        <CardDescription>Masukkan email dan password kamu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleLogin}
          disabled={googlePending}
          type="button"
        >
          <GoogleIcon className="h-4 w-4" />
          {googlePending ? "Mengalihkan..." : "Masuk dengan Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">atau</span>
          </div>
        </div>

        <form action={handleLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/lupa-password"
                className="text-xs text-primary-600 hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/daftar" className="text-primary-600 font-medium hover:underline">
            Buat toko
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
