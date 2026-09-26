"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { createPublicOrder } from "@/actions/orders";
import { Plus, Minus, ShoppingBag } from "lucide-react";

type CampaignData = {
  id: string;
  name: string;
  store: { name: string; slug: string };
  products: {
    product: {
      id: string;
      name: string;
      basePrice: number;
      imageUrl: string | null;
    };
  }[];
};

export function OrderForm({
  campaign,
  slug,
  campaignId,
}: {
  campaign: CampaignData;
  slug: string;
  campaignId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerData, setCustomerData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerNotes: "",
  });

  const orderItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const total = orderItems.reduce((sum, item) => {
    const cp = campaign.products.find((cp) => cp.product.id === item.productId);
    return sum + (cp ? cp.product.basePrice * item.quantity : 0);
  }, 0);

  function handleQty(productId: string, delta: number) {
    setQuantities((prev) => {
      const next = (prev[productId] ?? 0) + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error("Pilih minimal 1 produk dulu, ya.");
      return;
    }

    startTransition(async () => {
      const result = await createPublicOrder({
        campaignId,
        ...customerData,
        items: orderItems,
      });

      if (result.success) {
        router.push(`/${slug}/pesan/${campaignId}/sukses?id=${result.data.orderId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.products.map((cp) => {
            const qty = quantities[cp.product.id] ?? 0;
            return (
              <div
                key={cp.product.id}
                className="flex items-center justify-between gap-3 border-b last:border-0 pb-4 last:pb-0"
              >
                <div>
                  <p className="font-semibold">{cp.product.name}</p>
                  <CurrencyDisplay
                    amount={cp.product.basePrice}
                    size="sm"
                    className="text-primary-700 font-medium"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQty(cp.product.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm disabled:opacity-40"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => handleQty(cp.product.id, 1)}
                    className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customerName">Nama Lengkap</Label>
            <Input
              id="customerName"
              value={customerData.customerName}
              onChange={(e) => setCustomerData({ ...customerData, customerName: e.target.value })}
              placeholder="Nama kamu"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerPhone">Nomor HP / WhatsApp</Label>
            <Input
              id="customerPhone"
              value={customerData.customerPhone}
              onChange={(e) => setCustomerData({ ...customerData, customerPhone: e.target.value })}
              placeholder="08123456789"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerAddress">Alamat Lengkap</Label>
            <Textarea
              id="customerAddress"
              value={customerData.customerAddress}
              onChange={(e) => setCustomerData({ ...customerData, customerAddress: e.target.value })}
              placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
              rows={2}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerNotes">Catatan (opsional)</Label>
            <Input
              id="customerNotes"
              value={customerData.customerNotes}
              onChange={(e) => setCustomerData({ ...customerData, customerNotes: e.target.value })}
              placeholder="Misalnya: titip ke satpam"
            />
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex justify-between items-center rounded-card border border-border bg-white p-4">
          <span className="font-semibold">Total Pembayaran</span>
          <CurrencyDisplay amount={total} size="lg" className="text-primary-700 font-bold" />
        </div>
      )}

      <Button type="submit" disabled={isPending || orderItems.length === 0} className="w-full">
        <ShoppingBag className="h-4 w-4 mr-2" />
        {isPending ? "Mengirim pesanan..." : "Kirim Pesanan"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Setelah dikirim, kamu dapat nomor pesanan dan cara bayar dari {campaign.store.name}.
      </p>
    </form>
  );
}
