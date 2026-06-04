import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export type AuditLogInput = {
  /** User id when a person triggered the change; null for pure system/webhook automation. */
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
};

/**
 * Append-only audit row via service role. Never throws to callers.
 * Prefer `AUDIT_ACTION` from `./actions` for consistent `action` values.
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[audit] insert failed:", error.message);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit] insert exception:", e);
    }
  }
}
