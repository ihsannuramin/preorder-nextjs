import { describe, it, expect } from "vitest";
import { isSuperAdmin } from "@/lib/auth/admin";

describe("isSuperAdmin", () => {
  it("returns true when role is SUPER_ADMIN", () => {
    expect(isSuperAdmin({ role: "SUPER_ADMIN" } as never)).toBe(true);
  });

  it("returns false for a regular OWNER", () => {
    expect(isSuperAdmin({ role: "OWNER" } as never)).toBe(false);
  });

  it("returns false when user is null or undefined (not logged in / not found)", () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});
