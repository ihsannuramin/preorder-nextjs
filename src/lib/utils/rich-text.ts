import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }),
    // Tiptap memakai <b>/<i> saat menempel dari sumber lain.
    b: "strong",
    i: "em",
    h1: "h2",
  },
};

const HTML_TAG = /<\/?[a-z][\s\S]*?>/i;

/** Bersihkan HTML deskripsi toko — hanya format teks dasar & link http(s)/mailto. */
export function sanitizeStoreDescription(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/** Teks polos dari HTML (untuk meta description & cek kosong). */
export function richTextToPlain(html: string): string {
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ");
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  return !html || richTextToPlain(html).length === 0;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * HTML aman untuk ditampilkan. Deskripsi lama berupa teks polos diubah
 * menjadi paragraf (baris kosong) dan <br> (baris baru).
 */
export function toDisplayHtml(description: string | null | undefined): string {
  if (!description) return "";
  if (HTML_TAG.test(description)) return sanitizeStoreDescription(description);
  return description
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}
