import { describe, it, expect } from "vitest";
import { extractStoragePath, collectStoragePaths } from "@/lib/utils/storage-path";

const BASE = "https://abc.supabase.co/storage/v1/object/public";

describe("extractStoragePath", () => {
  it("extracts the object path for the matching bucket", () => {
    expect(extractStoragePath(`${BASE}/product-images/store-logos/1-a%20b.png`, "product-images")).toBe(
      "store-logos/1-a b.png",
    );
  });

  it("returns null for another bucket or empty input", () => {
    expect(extractStoragePath(`${BASE}/payment-proofs/x.png`, "product-images")).toBeNull();
    expect(extractStoragePath(null, "product-images")).toBeNull();
  });

  it("keeps raw (non-URL) paths as-is", () => {
    expect(extractStoragePath("payment-proofs/x.pdf", "payment-proofs")).toBe("payment-proofs/x.pdf");
  });
});

describe("collectStoragePaths", () => {
  it("dedupes and skips foreign URLs", () => {
    const url = `${BASE}/product-images/products/a.jpg`;
    expect(
      collectStoragePaths([url, url, null, "https://example.com/a.jpg"], "product-images"),
    ).toEqual(["products/a.jpg"]);
  });
});
