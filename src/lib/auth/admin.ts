import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export function isSuperAdmin(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "SUPER_ADMIN";
}

/**
 * Resolves the logged-in user and enforces SUPER_ADMIN access.
 * Redirects (does not throw) so it can be called directly from a layout/page.
 */
export async function getAdminUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!isSuperAdmin(dbUser)) redirect("/dashboard");

  return dbUser!;
}
