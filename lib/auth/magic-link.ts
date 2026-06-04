"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "/portal");
  const nextPath = nextRaw.startsWith("/") ? nextRaw : "/portal";

  if (!email) {
    redirect("/login?error=missing_email");
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) {
    redirect("/login?error=missing_site_url");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?check_email=1");
}
