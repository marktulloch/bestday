import { redirect } from "next/navigation";

import type { AppRole } from "@/lib/auth/roles";
import { canAccessAdminRoute } from "@/lib/auth/rbac";
import { requireRoles } from "@/lib/auth/guards-server";
import { getAuthContext } from "@/lib/auth/session";

/**
 * Doctor workspace: clinical staff only (not patients). Master-level tools stay under /admin.
 */
export async function requireDoctorWorkspace(options?: {
  loginPath?: string;
  forbiddenRedirect?: string;
}): Promise<{ userId: string; role: AppRole; displayName: string | null }> {
  await requireRoles(["doctor", "admin", "master"], {
    loginPath: options?.loginPath,
    forbiddenRedirect: options?.forbiddenRedirect ?? "/portal",
  });

  const ctx = await getAuthContext();
  if (!ctx) {
    redirect(options?.loginPath ?? "/login");
  }

  return {
    userId: ctx.user.id,
    role: ctx.profile.role,
    displayName: ctx.profile.full_name ?? ctx.profile.email ?? null,
  };
}

export function canSeeAdminNav(role: AppRole): boolean {
  return canAccessAdminRoute(role);
}
