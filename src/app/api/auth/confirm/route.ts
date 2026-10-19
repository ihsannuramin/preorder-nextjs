import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { safeNextPath } from "@/lib/utils/safe-redirect";
import { createLogger } from "@/lib/logger";

const logger = createLogger("route:auth-confirm");

/**
 * Link di email Supabase (konfirmasi daftar, lupa password, ganti email).
 * Memakai token_hash sehingga link tetap jalan walau dibuka di browser/perangkat
 * lain — beda dengan alur PKCE `?code=` yang butuh cookie dari browser yang sama.
 * Template email Supabase harus diarahkan ke route ini (lihat docs/email-setup.md).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error && data.user) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}${next ?? "/reset-password"}`);
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: { store: true },
      });
      const redirectTo = next ?? (dbUser?.store ? "/dashboard" : "/toko?welcome=1");
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    logger.warn("verifyOtp failed", { type, message: error?.message });
  }

  const errorParam = type === "recovery" ? "reset_link_invalid" : "auth_callback_error";
  return NextResponse.redirect(`${origin}/masuk?error=${errorParam}`);
}
