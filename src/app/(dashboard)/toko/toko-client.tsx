"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { OnboardingHint } from "@/components/shared/onboarding-hint";
import { ImageUpload } from "@/components/shared/image-upload";
import { createOrUpdateStore, getStoreSetupData } from "@/actions/store";
import { generateSlug } from "@/lib/utils/slug";
import { SOCIAL_PLATFORMS, type StoreSocialLink } from "@/lib/constants/social-platforms";
import { ExternalLink, Copy, PartyPopper, Plus, Trash2 } from "lucide-react";

type StoreSetupData = Awaited<ReturnType<typeof getStoreSetupData>>;

const BRAND_COLOR_PRESETS = ["#B45309", "#BE123C", "#7C3AED", "#0F766E", "#15803D", "#1F2937"];

function initialSocialLinks(store: StoreSetupData["store"]): StoreSocialLink[] {
  const stored = store?.socialLinks;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored as unknown as StoreSocialLink[];
  }
  if (store?.instagram) {
    return [{ platform: "instagram", value: store.instagram }];
  }
  return [];
}

export function TokoClient({
  initialStore,
  businessName,
  isWelcome,
}: {
  initialStore: StoreSetupData["store"];
  businessName: string;
  isWelcome: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [store, setStore] = useState(initialStore);
  const [slug, setSlug] = useState(
    initialStore?.slug ?? generateSlug(businessName),
  );
  const [name, setName] = useState(initialStore?.name ?? businessName);
  const [logoUrl, setLogoUrl] = useState(initialStore?.logoUrl ?? "");
  const [whatsapp, setWhatsapp] = useState(
    initialStore?.whatsapp?.replace(/^62/, "") ?? "",
  );
  const [socialLinks, setSocialLinks] = useState<StoreSocialLink[]>(
    initialSocialLinks(initialStore),
  );
  const [hasOfflineStore, setHasOfflineStore] = useState(
    Boolean(initialStore?.googleMapsUrl),
  );
  const [showGoogleMaps, setShowGoogleMaps] = useState(
    initialStore?.showGoogleMaps ?? false,
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialStore?.googleMapsUrl ?? "",
  );
  const [brandColor, setBrandColor] = useState(initialStore?.brandColor ?? "");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!store) {
      setSlug(generateSlug(val));
    }
  }

  function addSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "instagram", value: "" }]);
  }

  function updateSocialLink(index: number, patch: Partial<StoreSocialLink>) {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function removeSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(formData: FormData) {
    formData.set("slug", slug);
    formData.set("logoUrl", logoUrl);
    formData.set("whatsapp", whatsapp ? `62${whatsapp}` : "");
    formData.set(
      "socialLinks",
      JSON.stringify(socialLinks.filter((link) => link.value.trim())),
    );
    formData.set("googleMapsUrl", hasOfflineStore ? googleMapsUrl : "");
    formData.set("brandColor", brandColor);
    if (hasOfflineStore && showGoogleMaps) {
      formData.set("showGoogleMaps", "on");
    }

    startTransition(async () => {
      const result = await createOrUpdateStore(formData);
      if (result.success) {
        setStore(result.data);
        toast.success("Toko berhasil disimpan!");
      } else {
        toast.error(result.error);
      }
    });
  }

  const storeUrl = store
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://pohub.app"}/${store.slug}`
    : null;

  return (
    <>
      <PageHeader
        title="Toko Saya"
        description="Kelola profil dan tampilan toko kamu"
      />

      {isWelcome && !store && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <PartyPopper className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground">
              Akun kamu sudah aktif! 🎉
            </p>
            <p className="text-sm text-foreground/80 mt-0.5">
              Yuk lengkapi profil toko kamu dulu — nama toko sudah diisi
              otomatis dari saat kamu daftar.
            </p>
          </div>
        </div>
      )}

      {storeUrl && (
        <Card className="mb-6 bg-primary-50 border-primary-200">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary-800">
                URL Toko Publik
              </p>
              <p className="text-sm text-primary-600 font-mono">{storeUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(storeUrl);
                  toast.success("URL disalin!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profil Toko</CardTitle>
          <CardDescription>
            Informasi yang akan ditampilkan ke pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Foto Profil Toko</Label>
              <div className="max-w-[140px]">
                <ImageUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  folder="store-logos"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Opsional. Ditampilkan di halaman toko publik kamu.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Warna Toko</Label>
              <div className="flex flex-wrap items-center gap-2">
                {BRAND_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      brandColor.toLowerCase() === c.toLowerCase()
                        ? "border-foreground scale-110"
                        : "border-white shadow-sm"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Pilih warna ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={brandColor || "#2563EB"}
                  onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-white"
                  aria-label="Pilih warna lain"
                />
                {brandColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBrandColor("")}>
                    Hapus
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Opsional. Dipakai sebagai aksen di bagian atas halaman tokomu.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Toko</Label>
              <OnboardingHint
                id="toko-setup-name"
                message="Nama ini akan ditampilkan ke pelanggan kamu di halaman pemesanan. Pastikan mudah diingat!"
                show={!store}
                side="bottom"
              >
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Contoh: Dapur Bu Rini"
                  required
                />
              </OnboardingHint>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">
                URL Toko{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (hanya huruf kecil, angka, dan tanda hubung)
                </span>
              </Label>
              <div className="flex rounded-input overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring">
                <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                  {process.env.NEXT_PUBLIC_APP_URL}/
                </span>
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="flex-1 h-12 px-3 text-sm bg-white outline-none"
                  placeholder="nama-toko-kamu"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi Toko</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={store?.description ?? ""}
                placeholder="Ceritakan tentang toko kamu..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
              <OnboardingHint
                id="toko-setup-whatsapp"
                message="Pelanggan bisa langsung hubungi kamu lewat WhatsApp setelah memesan."
                show={!store?.whatsapp}
                side="bottom"
              >
                <div className="flex rounded-input overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring">
                  <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                    +62
                  </span>
                  <input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(
                        e.target.value
                          .replace(/\D/g, "")
                          .replace(/^0+/, "")
                          .replace(/^62/, ""),
                      )
                    }
                    className="flex-1 h-12 px-3 text-sm bg-white outline-none"
                    placeholder="8123456789"
                  />
                </div>
              </OnboardingHint>
            </div>

            <div className="space-y-2">
              <Label>Sosial Media</Label>
              {socialLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={link.platform}
                    onValueChange={(val) => updateSocialLink(index, { platform: val })}
                  >
                    <SelectTrigger className="w-[140px] flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={link.value}
                    onChange={(e) => updateSocialLink(index, { value: e.target.value })}
                    placeholder={
                      SOCIAL_PLATFORMS.find((p) => p.value === link.platform)
                        ?.placeholder ?? ""
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSocialLink(index)}
                    aria-label="Hapus sosial media"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialLink}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Sosial Media
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <button
                type="button"
                onClick={() => setHasOfflineStore((v) => !v)}
                className={`w-full text-left rounded-lg border-2 p-3 text-sm transition-all ${
                  hasOfflineStore
                    ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                    : "border-border text-muted-foreground"
                }`}
              >
                Saya punya toko offline
                <p className="text-[11px] font-normal mt-0.5">
                  Tambahkan link Google Maps lokasi toko kamu
                </p>
              </button>

              {hasOfflineStore && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="googleMapsUrl">Link Google Maps</Label>
                    <Input
                      id="googleMapsUrl"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGoogleMaps((v) => !v)}
                    className={`w-full text-left rounded-lg border-2 p-3 text-sm transition-all ${
                      showGoogleMaps
                        ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {showGoogleMaps ? "Tampilkan" : "Sembunyikan"} di halaman toko publik
                    <p className="text-[11px] font-normal mt-0.5">
                      Klik untuk {showGoogleMaps ? "menyembunyikan" : "menampilkan"} link
                      Maps dari pelanggan
                    </p>
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
