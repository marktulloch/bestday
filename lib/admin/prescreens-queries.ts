import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { PrescreenRow, PrescreenWorkflowStatus } from "@/lib/database.types";

export type PrescreenAdminListRow = Pick<
  PrescreenRow,
  | "id"
  | "created_at"
  | "workflow_status"
  | "user_id"
  | "lead_id"
  | "decision_summary_admin"
  | "version"
>;

export async function listPrescreensForAdmin(input: {
  queue?: "review" | null;
  workflow?: PrescreenWorkflowStatus | "all";
  searchId?: string | null;
  limit?: number;
}): Promise<PrescreenAdminListRow[]> {
  const limit = Math.min(input.limit ?? 120, 250);
  const supabase = await createClient();
  const db = looseDb(supabase);

  let q = db
    .from("prescreens")
    .select("id, created_at, workflow_status, user_id, lead_id, decision_summary_admin, version")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (input.queue === "review") {
    q = q.in("workflow_status", ["submitted", "needs_manual_review"]);
  } else if (input.workflow && input.workflow !== "all") {
    q = q.eq("workflow_status", input.workflow);
  }

  const search = input.searchId?.trim() ?? "";
  if (search.length > 0) {
    if (/^[0-9a-f-]{36}$/i.test(search)) {
      q = q.eq("id", search);
    } else {
      return [];
    }
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return data as PrescreenAdminListRow[];
}

export async function getPrescreenForAdmin(prescreenId: string): Promise<PrescreenRow | null> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const { data } = await db.from("prescreens").select("*").eq("id", prescreenId).maybeSingle();
  return (data as PrescreenRow | null) ?? null;
}
