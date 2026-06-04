import { redirect } from "next/navigation";

import type { AppRole } from "@/lib/auth/roles";
import { hasAnyRole } from "@/lib/auth/rbac";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

type GuardOptions = {
  /** Where to send unauthenticated users */
  loginPath?: string;
  /** Where to send authenticated users who fail the role check */
  forbiddenRedirect?: string;
};

/** True when browser + server Supabase clients can be constructed. */
export function isSupabasePublicConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Ensures a Supabase session exists (App Router server).
 * Middleware already protects most routes; this hardens layouts against drift.
 */
export async function requireAuth(options?: GuardOptions): Promise<void> {
  if (!isSupabasePublicConfigured()) return;

  const loginPath = options?.loginPath ?? "/login";
  const user = await getAuthUser();
  if (!user) {
    redirect(loginPath);
  }
}

/**
 * Ensures the current user has one of the allowed roles.
 */
export async function requireRoles(
  allowed: readonly AppRole[],
  options?: GuardOptions,
): Promise<void> {
  if (!isSupabasePublicConfigured()) return;

  const loginPath = options?.loginPath ?? "/login";
  const forbiddenRedirect = options?.forbiddenRedirect ?? "/portal";

  const user = await getAuthUser();
  if (!user) {
    redirect(loginPath);
  }

  const profile = await getCurrentProfile();
  if (!profile || !hasAnyRole(profile.role, allowed)) {
    redirect(forbiddenRedirect);
  }
}
