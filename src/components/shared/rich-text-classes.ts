/** Tipografi bersama untuk editor & tampilan deskripsi toko. */
export const RICH_TEXT_CLASSES = [
  "text-sm leading-relaxed text-foreground break-words",
  "[&_p]:my-2 [&>p:first-child]:mt-0",
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&>h2:first-child]:mt-0",
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&>h3:first-child]:mt-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_li_p]:my-0",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
  "[&_a]:font-medium [&_a]:text-primary-600 [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold",
].join(" ");

/** Batas panjang teks (tanpa tag) deskripsi toko. */
export const STORE_DESCRIPTION_MAX_CHARS = 3000;
