"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { createLogger } from "@/lib/logger";
import type { ActionResult } from "@/types";

const logger = createLogger("action:auth");

export async function register(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const raw = {
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { businessName, email, password } = parsed.data;
  const supabase = await createClient();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/api/auth/callback`,
    },
  });

  if (error) {
    logger.warn("signUp failed", { email, message: error.message });
    return { success: false, error: error.message };
  }

  if (data.user) {
    try {
      await prisma.user.create({
        data: { supabaseId: data.user.id, email, businessName },
      });
    } catch (err) {
      logger.error("failed to create user record", err);
      return { success: false, error: "Gagal membuat akun. Coba lagi." };
    }
  }

  logger.info("user registered", { email });
  return { success: true, data: { email } };
}

export async function login(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logger.warn("login failed", { email: parsed.data.email, message: error.message });
    return { success: false, error: "Email atau password salah" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
    include: { store: true },
  });

  revalidatePath("/", "layout");
  redirect(dbUser?.store ? "/dashboard" : "/toko");
}

export async function loginWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { url: data.url } };
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/api/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/masuk");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
