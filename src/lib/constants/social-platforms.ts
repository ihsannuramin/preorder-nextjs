export interface SocialPlatform {
  value: string;
  label: string;
  placeholder: string;
  urlPrefix?: string;
  stripChars?: RegExp;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    value: "instagram",
    label: "Instagram",
    placeholder: "@namatoko",
    urlPrefix: "https://instagram.com/",
    stripChars: /^@/,
  },
  {
    value: "threads",
    label: "Threads",
    placeholder: "@namatoko",
    urlPrefix: "https://www.threads.net/@",
    stripChars: /^@/,
  },
  {
    value: "tiktok",
    label: "TikTok",
    placeholder: "@namatoko",
    urlPrefix: "https://tiktok.com/@",
    stripChars: /^@/,
  },
  {
    value: "facebook",
    label: "Facebook",
    placeholder: "nama.halaman atau URL",
    urlPrefix: "https://facebook.com/",
  },
  {
    value: "twitter",
    label: "X (Twitter)",
    placeholder: "@namatoko",
    urlPrefix: "https://x.com/",
    stripChars: /^@/,
  },
  {
    value: "shopee",
    label: "Shopee",
    placeholder: "URL toko Shopee",
  },
  {
    value: "tokopedia",
    label: "Tokopedia",
    placeholder: "URL toko Tokopedia",
  },
  {
    value: "gofood",
    label: "GoFood",
    placeholder: "URL toko GoFood",
  },
  {
    value: "grabfood",
    label: "GrabFood",
    placeholder: "URL toko GrabFood",
  },
  {
    value: "shopeefood",
    label: "ShopeeFood",
    placeholder: "URL toko ShopeeFood",
  },
  {
    value: "website",
    label: "Website",
    placeholder: "https://tokokamu.com",
  },
  {
    value: "other",
    label: "Lainnya",
    placeholder: "Link atau username",
  },
];

export function getSocialPlatform(value: string): SocialPlatform {
  return (
    SOCIAL_PLATFORMS.find((p) => p.value === value) ??
    SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]
  );
}

export function resolveSocialUrl(platform: string, value: string): string {
  const def = getSocialPlatform(platform);
  const cleaned = def.stripChars ? value.replace(def.stripChars, "") : value;
  if (!def.urlPrefix) return /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`;
  return `${def.urlPrefix}${cleaned}`;
}

export interface StoreSocialLink {
  platform: string;
  value: string;
}
