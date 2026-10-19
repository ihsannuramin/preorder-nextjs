"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { createPublicOrder } from "@/actions/orders";
import { orderSchema } from "@/lib/validations/order";
import { cn } from "@/lib/utils/cn";
import { Plus, Minus, ShoppingBag, Package } from "lucide-react";

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
      images: string[];
      description: string | null;
    };
  }[];
};

type CustomerField = "customerName" | "customerPhone" | "customerAddress" | "customerNotes";
type CustomerData = Record<CustomerField, string>;

// Data pelanggan diingat di perangkat ini untuk pesanan berikutnya.
const CUSTOMER_STORAGE_KEY = "pohub:customer";
const FIELD_ORDER: CustomerField[] = ["customerName", "customerPhone", "customerAddress"];

function loadSavedCustomer(): Partial<CustomerData> {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<CustomerData>) : {};
  } catch {
    return {};
  }
}

function saveCustomer(data: CustomerData) {
  try {
    const { customerName, customerPhone, customerAddress } = data;
    window.localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify({ customerName, customerPhone, customerAddress }),
    );
  } catch {
    // Storage tidak tersedia (mode privat) — abaikan.
  }
}

export function OrderForm({
  campaign,
  slug,
  campaignId,
  initialProductId,
}: {
  campaign: CampaignData;
  slug: string;
  campaignId: string;
  initialProductId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    initialProductId && campaign.products.some((cp) => cp.product.id === initialProductId)
      ? { [initialProductId]: 1 }
      : {},
  );
  const [customerData, setCustomerData] = useState<CustomerData>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerNotes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<CustomerField | "items", string>>>({});
  const fieldRefs = useRef<Partial<Record<CustomerField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  useEffect(() => {
    const saved = loadSavedCustomer();
    if (Object.keys(saved).length > 0) {
      setCustomerData((prev) => ({ ...prev, ...saved, customerNotes: prev.customerNotes }));
    }
  }, []);

  const orderItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = orderItems.reduce((sum, item) => {
    const cp = campaign.products.find((cp) => cp.product.id === item.productId);
    return sum + (cp ? cp.product.basePrice * item.quantity : 0);
  }, 0);

  function handleQty(productId: string, delta: number) {
    setErrors((prev) => ({ ...prev, items: undefined }));
    setQuantities((prev) => {
      const next = (prev[productId] ?? 0) + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  }

  function updateField(field: CustomerField, value: string) {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = orderSchema.safeParse({ ...customerData, items: orderItems });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as CustomerField | "items";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      if (next.items) {
        toast.error("Pilih minimal 1 produk dulu, ya.");
        return;
      }
      const firstInvalid = FIELD_ORDER.find((f) => next[f]);
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    startTransition(async () => {
      const result = await createPublicOrder({
        campaignId,
        ...customerData,
        items: orderItems,
      });

      if (result.success) {
        saveCustomer(customerData);
        router.push(`/${slug}/pesan/${campaignId}/sukses?id=${result.data.orderId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function fieldProps(field: CustomerField) {
    const errorId = `${field}-error`;
    return {
      id: field,
      value: customerData[field],
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? errorId : undefined,
      className: cn(errors[field] && "border-error focus-visible:ring-error"),
    };
  }

  function FieldError({ field }: { field: CustomerField }) {
    if (!errors[field]) return null;
    return (
      <p id={`${field}-error`} role="alert" className="text-xs font-medium text-error">
        {errors[field]}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Card className={cn(errors.items && "border-error")}>
        <CardHeader>
          <CardTitle className="text-base">Pilih Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.products.map((cp) => {
            const qty = quantities[cp.product.id] ?? 0;
            const cover = cp.product.images[0] ?? cp.product.imageUrl;
            return (
              <div
                key={cp.product.id}
                className="flex items-center gap-3 border-b last:border-0 pb-4 last:pb-0"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  {cover ? (
                    <Image src={cover} alt={cp.product.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{cp.product.name}</p>
                  {cp.product.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {cp.product.description}
                    </p>
                  )}
                  <CurrencyDisplay
                    amount={cp.product.basePrice}
                    size="sm"
                    className="mt-0.5 text-primary-700 font-medium"
                  />
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQty(cp.product.id, -1)}
                    disabled={qty === 0}
                    aria-label={`Kurangi ${cp.product.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-sm transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQty(cp.product.id, 1)}
                    aria-label={`Tambah ${cp.product.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
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
              {...fieldProps("customerName")}
              ref={(el) => {
                fieldRefs.current.customerName = el;
              }}
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="Nama kamu"
              autoComplete="name"
              autoCapitalize="words"
            />
            <FieldError field="customerName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerPhone">Nomor HP / WhatsApp</Label>
            <Input
              {...fieldProps("customerPhone")}
              ref={(el) => {
                fieldRefs.current.customerPhone = el;
              }}
              onChange={(e) => updateField("customerPhone", e.target.value)}
              placeholder="08123456789"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            <FieldError field="customerPhone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerAddress">Alamat Lengkap</Label>
            <Textarea
              {...fieldProps("customerAddress")}
              ref={(el) => {
                fieldRefs.current.customerAddress = el;
              }}
              onChange={(e) => updateField("customerAddress", e.target.value)}
              placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
              autoComplete="street-address"
              rows={2}
            />
            <FieldError field="customerAddress" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerNotes">Catatan (opsional)</Label>
            <Input
              {...fieldProps("customerNotes")}
              onChange={(e) => updateField("customerNotes", e.target.value)}
              placeholder="Misalnya: titip ke satpam"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Nama, HP, dan alamat diingat di perangkat ini supaya pesanan berikutnya lebih cepat.
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {itemCount > 0 ? `${itemCount} item` : "Belum ada produk dipilih"}
          </span>
          <CurrencyDisplay amount={total} size="lg" className="font-bold text-primary-700" />
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          <ShoppingBag className="h-4 w-4 mr-2" />
          {isPending ? "Mengirim pesanan..." : "Kirim Pesanan"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Setelah dikirim, kamu dapat nomor pesanan dan cara bayar dari {campaign.store.name}.
        </p>
      </div>
    </form>
  );
}
