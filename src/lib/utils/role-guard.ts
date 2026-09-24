import type { UserRole } from "@prisma/client";

export type RoleChangeCheck = {
  actorId: string;
  targetId: string;
  targetCurrentRole: UserRole;
  newRole: UserRole;
  otherSuperAdminCount: number;
};

export type RoleChangeResult = { allowed: true } | { allowed: false; error: string };

export function checkRoleChange({
  actorId,
  targetId,
  targetCurrentRole,
  newRole,
  otherSuperAdminCount,
}: RoleChangeCheck): RoleChangeResult {
  if (actorId === targetId) {
    return { allowed: false, error: "Kamu tidak bisa mengubah role akunmu sendiri" };
  }

  if (targetCurrentRole === "SUPER_ADMIN" && newRole === "OWNER" && otherSuperAdminCount === 0) {
    return { allowed: false, error: "Tidak bisa menghapus Super Admin terakhir" };
  }

  return { allowed: true };
}
