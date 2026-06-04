import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import type { AppRole } from "@/lib/auth/roles";

import { createClient } from "@/lib/supabase/server";

/**
 * Calls `public.set_user_role` (master-only). Writes `role_assignments` in SQL
 * and an `audit_logs` row via the service role (see logAuditEvent).
 */
export async function setUserRole(
  targetUserId: string,
  newRole: AppRole,
  changeReason?: string,
): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: beforeRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();
  const fromRole = (beforeRow as { role: AppRole } | null)?.role ?? null;

  const payload: Record<string, unknown> = {
    target_user_id: targetUserId,
    new_role: newRole,
  };
  if (changeReason !== undefined && changeReason !== "") {
    payload.change_reason = changeReason;
  }

  const client = supabase as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
  };

  const { error } = await client.rpc("set_user_role", payload);
  if (error) {
    return { error: new Error(error.message) };
  }

  await logAuditEvent({
    actorId: user?.id ?? null,
    action: AUDIT_ACTION.role_changed,
    entityType: "profile",
    entityId: targetUserId,
    metadata: {
      from_role: fromRole,
      to_role: newRole,
      reason: changeReason ?? null,
    },
  });

  return { error: null };
}
