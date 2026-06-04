import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { AppRole } from "@/lib/auth/roles";
import { canAccessAdminRoute, canAccessDoctorRoute } from "@/lib/auth/rbac";
import type { Database } from "@/lib/database.types";

type ProfileRoleFetch = {
  role: AppRole | null;
  reason: "ok" | "missing_row" | "fetch_error";
};

async function fetchProfileRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRoleFetch> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { role: null, reason: "fetch_error" };
  }
  if (!data?.role) {
    return { role: null, reason: "missing_row" };
  }
  return { role: data.role, reason: "ok" };
}

function accountIncompleteRedirect(request: NextRequest) {
  const url = new URL("/auth/account-incomplete", request.url);
  url.searchParams.set("reason", "missing_profile");
  return NextResponse.redirect(url);
}

function profileLoadFailedRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/profile-load-failed", request.url));
}

/**
 * Session refresh + route RBAC. For rate limiting on public POST endpoints (prescreen, auth,
 * webhooks), use edge middleware limits, WAF, or a reverse proxy — see docs/SECURITY.md.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const db = supabase as unknown as SupabaseClient<Database>;
  let role: AppRole | null = null;
  let profileFetchReason: ProfileRoleFetch["reason"] = "ok";
  if (user) {
    let fetched = await fetchProfileRole(db, user.id);
    if (fetched.role === null && fetched.reason === "missing_row") {
      await supabase.rpc("ensure_own_profile");
      fetched = await fetchProfileRole(db, user.id);
    }
    role = fetched.role;
    profileFetchReason = fetched.reason;
  }
  const hasProfile = Boolean(user && role !== null);

  if (path === "/auth/account-incomplete") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (hasProfile) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return supabaseResponse;
  }

  if (path === "/auth/profile-load-failed") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (hasProfile) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return supabaseResponse;
  }

  /** Auth session without `profiles` row → portal pages redirect to /login while middleware sends back to /portal (infinite refresh). */
  if (user && !hasProfile) {
    if (
      path.startsWith("/portal") ||
      path.startsWith("/admin") ||
      path.startsWith("/doctor") ||
      path === "/login" ||
      path === "/signup" ||
      path === "/forgot-password"
    ) {
      if (profileFetchReason === "fetch_error") {
        return profileLoadFailedRedirect(request);
      }
      return accountIncompleteRedirect(request);
    }
    return supabaseResponse;
  }

  if (user && path === "/login") {
    let next = request.nextUrl.searchParams.get("next") ?? "/portal";
    if (!next.startsWith("/") || next.startsWith("//")) {
      next = "/portal";
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (user && (path === "/signup" || path === "/forgot-password")) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (path.startsWith("/portal")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      return NextResponse.redirect(login);
    }
  }

  if (path.startsWith("/admin")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      return NextResponse.redirect(login);
    }
    if (!canAccessAdminRoute(role)) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  if (path.startsWith("/doctor")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      return NextResponse.redirect(login);
    }
    if (!canAccessDoctorRoute(role)) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  return supabaseResponse;
}
