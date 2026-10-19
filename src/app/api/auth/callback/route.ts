import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/utils/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      let dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: { store: true },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            supabaseId: data.user.id,
            email: data.user.email!,
            businessName: data.user.user_metadata?.full_name ?? "Toko Baru",
          },
          include: { store: true },
        });
      }

      // If caller specified an explicit next (e.g. OAuth), honour it.
      // Otherwise route based on whether the user already has a store.
      const redirectTo = next ?? (dbUser?.store ? "/dashboard" : "/toko?welcome=1");
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  const errorParam = next === "/reset-password" ? "reset_link_invalid" : "auth_callback_error";
  return NextResponse.redirect(`${origin}/masuk?error=${errorParam}`);
}
