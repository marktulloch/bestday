import "server-only";

import { hasAnyRole } from "@/lib/auth/rbac";
import { getAuthUser, getCurrentProfile } from "@/lib/auth/session";

export type AdminExportAuth =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/**
 * API routes: master/admin only (same bar as admin layout).
 */
export async function requireAdminExportAuth(): Promise<AdminExportAuth> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const profile = await getCurrentProfile();
  if (!profile || !hasAnyRole(profile.role, ["master", "admin"])) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: user.id };
}
