import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { reconcileSeededTestProfileIfNeeded } from "@/lib/auth/profile-bootstrap";
import { linkFunnelRecordsToUser } from "@/lib/portal/link-funnel";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let nextPath = searchParams.get("next") ?? "/portal";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    nextPath = "/portal";
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", base);
    login.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/portal");
    return NextResponse.redirect(login);
  }

  await supabase.rpc("ensure_own_profile");
  await reconcileSeededTestProfileIfNeeded(user.id, user.email);

  const jar = await cookies();
  await linkFunnelRecordsToUser(user.id, user.email ?? undefined, {
    get: (name) => {
      const c = jar.get(name);
      return c ? { value: c.value } : undefined;
    },
    delete: (name) => {
      jar.delete(name);
    },
  });

  return NextResponse.redirect(new URL(nextPath, base));
}
