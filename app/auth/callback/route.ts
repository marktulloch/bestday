import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/portal";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/portal";
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = next;
      const after = new URL("/auth/after-signin", site);
      after.searchParams.set("next", target);
      return NextResponse.redirect(after.toString());
    }
  }

  return NextResponse.redirect(`${site}/login?error=auth`);
}
