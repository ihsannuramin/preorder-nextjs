import { describe, it, expect } from "vitest";
import { checkRoleChange } from "@/lib/utils/role-guard";

describe("checkRoleChange", () => {
  it("blocks an admin from changing their own role", () => {
    const result = checkRoleChange({
      actorId: "u1",
      targetId: "u1",
      targetCurrentRole: "SUPER_ADMIN",
      newRole: "OWNER",
      otherSuperAdminCount: 5,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks demoting the last remaining super admin", () => {
    const result = checkRoleChange({
      actorId: "u1",
      targetId: "u2",
      targetCurrentRole: "SUPER_ADMIN",
      newRole: "OWNER",
      otherSuperAdminCount: 0,
    });
    expect(result.allowed).toBe(false);
  });

  it("allows demoting a super admin when another one still exists", () => {
    const result = checkRoleChange({
      actorId: "u1",
      targetId: "u2",
      targetCurrentRole: "SUPER_ADMIN",
      newRole: "OWNER",
      otherSuperAdminCount: 1,
    });
    expect(result.allowed).toBe(true);
  });

  it("allows promoting a regular owner to super admin", () => {
    const result = checkRoleChange({
      actorId: "u1",
      targetId: "u2",
      targetCurrentRole: "OWNER",
      newRole: "SUPER_ADMIN",
      otherSuperAdminCount: 1,
    });
    expect(result.allowed).toBe(true);
  });
});
