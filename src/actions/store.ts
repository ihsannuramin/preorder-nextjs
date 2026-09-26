"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { storeSchema } from "@/lib/validations/store";
import { isReservedSlug } from "@/lib/utils/slug";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";
import type { Store } from "@prisma/client";

const logger = createLogger("action:store");

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });
  if (!dbUser) throw new Error("Pengguna tidak ditemukan");
  return dbUser;
}

export async function getStore(): Promise<Store | null> {
  const user = await getCurrentUser();
  return prisma.store.findUnique({ where: { userId: user.id } });
}

export async function getStoreSetupData(): Promise<{
  store: Store | null;
  businessName: string;
}> {
  const user = await getCurrentUser();
  const store = await prisma.store.findUnique({ where: { userId: user.id } });
  return { store, businessName: user.businessName };
}

export async function createOrUpdateStore(
  formData: FormData,
): Promise<ActionResult<Store>> {
  try {
    const user = await getCurrentUser();
    const socialLinksRaw = formData.get("socialLinks");
    let socialLinks: { platform: string; value: string }[] | undefined;
    if (typeof socialLinksRaw === "string" && socialLinksRaw) {
      try {
        socialLinks = JSON.parse(socialLinksRaw);
      } catch {
        return { success: false, error: "Format sosial media tidak valid" };
      }
    }

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || undefined,
      whatsapp: formData.get("whatsapp") || undefined,
      instagram: formData.get("instagram") || undefined,
      logoUrl: formData.get("logoUrl") || undefined,
      coverUrl: formData.get("coverUrl") || undefined,
      socialLinks,
      googleMapsUrl: formData.get("googleMapsUrl") || undefined,
      showGoogleMaps: formData.get("showGoogleMaps") === "on",
      brandColor: formData.get("brandColor") || null,
    };

    const parsed = storeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (isReservedSlug(parsed.data.slug)) {
      return { success: false, error: "Slug ini tidak bisa digunakan" };
    }

    const existingStore = await prisma.store.findUnique({
      where: { userId: user.id },
    });

    if (existingStore) {
      const slugTaken = await prisma.store.findFirst({
        where: { slug: parsed.data.slug, id: { not: existingStore.id } },
      });
      if (slugTaken)
        return { success: false, error: "Sudah digunakan toko lain" };

      const store = await prisma.store.update({
        where: { id: existingStore.id },
        data: parsed.data,
      });
      revalidatePath("/toko");
      return { success: true, data: store };
    } else {
      const slugTaken = await prisma.store.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugTaken)
        return { success: false, error: "Sudah digunakan toko lain" };

      const store = await prisma.store.create({
        data: { ...parsed.data, userId: user.id },
      });
      revalidatePath("/toko");
      return { success: true, data: store };
    }
  } catch (err) {
    logger.error("createOrUpdateStore failed", err);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function checkSlugAvailability(
  slug: string,
  excludeStoreId?: string,
): Promise<boolean> {
  const store = await prisma.store.findFirst({
    where: { slug, ...(excludeStoreId ? { id: { not: excludeStoreId } } : {}) },
  });
  return !store;
}
