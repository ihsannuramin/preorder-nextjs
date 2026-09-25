"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findPublicOrder } from "@/actions/orders";
import { Search } from "lucide-react";

export function LookupForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await findPublicOrder(slug, orderNumber, phone);
      if (result.success) {
        router.push(`/lacak/${result.data.orderId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="orderNumber">Nomor pesanan</Label>
        <Input
          id="orderNumber"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          placeholder="PO-2026-0012"
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Nomor HP</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08123456789"
          autoComplete="tel"
          required
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        <Search className="h-4 w-4 mr-2" />
        {isPending ? "Mencari..." : "Cek Pesanan"}
      </Button>
    </form>
  );
}
