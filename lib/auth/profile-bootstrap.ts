import "server-only";

import { SEEDED_TEST_ACCOUNT_ROLES } from "@/lib/auth/seeded-test-accounts";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Staging/local: if this Auth user matches a known seeded test email, upsert `profiles`
 * (and one `role_assignments` row) using the service role. Gated by env; no-op in production.
 */
export async function reconcileSeededTestProfileIfNeeded(
  userId: string,
  email: string | null | undefined,
): Promise<void> {
  if (process.env.ENABLE_SEEDED_PROFILE_RECONCILE !== "true") return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;

  const norm = email?.trim().toLowerCase();
  if (!norm) return;

  const role = SEEDED_TEST_ACCOUNT_ROLES.get(norm);
  if (!role) return;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: upErr } = await admin.from("profiles").upsert(
    { id: userId, email: norm, role, updated_at: now },
    { onConflict: "id" },
  );
  if (upErr) {
    console.error("[reconcileSeededTestProfileIfNeeded] profiles upsert:", upErr.message);
    return;
  }

  const { data: existing } = await admin
    .from("role_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { error: raErr } = await admin.from("role_assignments").insert({
    user_id: userId,
    role,
    granted_by: userId,
    reason: "ENABLE_SEEDED_PROFILE_RECONCILE bootstrap",
  });
  if (raErr) {
    console.warn("[reconcileSeededTestProfileIfNeeded] role_assignments:", raErr.message);
  }
}
