import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StoreIdentity } from "@/components/public/store-identity";
import { PoweredByFooter } from "@/components/public/powered-by-footer";
import { LookupForm } from "./lookup-form";

async function getStore(slug: string) {
  return prisma.store.findFirst({
    where: { slug, isActive: true },
    select: { name: true, slug: true, logoUrl: true, brandColor: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  return { title: { absolute: store ? `Cek Pesanan · ${store.name}` : "Cek Pesanan" } };
}

export default async function CekPesananPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  return (
    <div className="min-h-screen bg-background">
      {store.brandColor && (
        <div className="h-1.5 w-full" style={{ backgroundColor: store.brandColor }} aria-hidden="true" />
      )}
      <div className="max-w-sm mx-auto px-4 pt-10 pb-8">
        <StoreIdentity
          name={store.name}
          logoUrl={store.logoUrl}
          brandColor={store.brandColor}
          size="sm"
        />
        <h1 className="mt-6 text-xl font-bold text-center">Cek status pesananmu</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground text-center">
          Masukkan nomor pesanan dan nomor HP yang kamu pakai waktu pesan.
        </p>

        <LookupForm slug={store.slug} />

        <div className="mt-6 text-center">
          <Link href={`/${store.slug}`} className="text-sm text-primary-600 hover:underline">
            Kembali ke {store.name}
          </Link>
        </div>

        <PoweredByFooter className="mt-8" />
      </div>
    </div>
  );
}
