import { describe, it, expect } from "vitest";
import {
  sanitizeStoreDescription,
  richTextToPlain,
  isRichTextEmpty,
  toDisplayHtml,
} from "@/lib/utils/rich-text";

describe("sanitizeStoreDescription", () => {
  it("keeps basic formatting tags", () => {
    const html = "<h2>Tentang</h2><p><strong>Kue</strong> <em>enak</em></p><ul><li>A</li></ul>";
    expect(sanitizeStoreDescription(html)).toBe(html);
  });

  it("removes script tags and event handlers", () => {
    const out = sanitizeStoreDescription('<p>Hai</p><script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(out).toBe("<p>Hai</p>");
  });

  it("drops javascript: links but keeps the text", () => {
    const out = sanitizeStoreDescription('<a href="javascript:alert(1)">klik</a>');
    expect(out).not.toContain("javascript");
    expect(out).toContain("klik");
  });

  it("forces safe target/rel on links", () => {
    const out = sanitizeStoreDescription('<a href="https://contoh.com" onclick="x()">web</a>');
    expect(out).toBe('<a href="https://contoh.com" target="_blank" rel="noopener noreferrer nofollow">web</a>');
  });
});

describe("richTextToPlain / isRichTextEmpty", () => {
  it("strips tags and collapses whitespace", () => {
    expect(richTextToPlain("<p>Halo</p><p>dunia&nbsp; ini</p>")).toBe("Halo dunia ini");
  });

  it("treats empty editor output as empty", () => {
    expect(isRichTextEmpty("<p></p>")).toBe(true);
    expect(isRichTextEmpty("")).toBe(true);
    expect(isRichTextEmpty(null)).toBe(true);
    expect(isRichTextEmpty("<p>x</p>")).toBe(false);
  });
});

describe("toDisplayHtml", () => {
  it("converts legacy plain text into escaped paragraphs", () => {
    expect(toDisplayHtml("Baris 1\nBaris 2\n\nPara <2>")).toBe(
      "<p>Baris 1<br />Baris 2</p><p>Para &lt;2&gt;</p>",
    );
  });

  it("sanitizes stored HTML", () => {
    expect(toDisplayHtml("<p>ok</p><script>x</script>")).toBe("<p>ok</p>");
  });

  it("returns empty string for empty input", () => {
    expect(toDisplayHtml(null)).toBe("");
  });
});
