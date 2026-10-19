/**
 * Ambil path objek dari public URL Supabase Storage untuk bucket tertentu.
 * Mengembalikan null bila URL bukan milik bucket tersebut.
 */
export function extractStoragePath(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null;
  if (!url.startsWith("http")) return url;
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

/** Path unik & valid dari daftar URL untuk satu bucket. */
export function collectStoragePaths(urls: (string | null | undefined)[], bucket: string): string[] {
  const paths = new Set<string>();
  for (const url of urls) {
    const path = extractStoragePath(url, bucket);
    if (path) paths.add(path);
  }
  return [...paths];
}
