import { createClient } from "@/lib/supabase/server";
import type { PrescreenRow } from "@/lib/database.types";

export type PrescreenStaffRow = Pick<
  PrescreenRow,
  | "id"
  | "created_at"
  | "workflow_status"
  | "decision_reason_codes"
  | "decision_log"
  | "decision_summary_admin"
  | "user_id"
  | "lead_id"
  | "version"
>;

export async function getRecentPrescreensForStaff(
  limit = 25,
): Promise<PrescreenStaffRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescreens")
    .select(
      "id, created_at, workflow_status, decision_reason_codes, decision_summary_admin, decision_log, user_id, lead_id, version",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PrescreenStaffRow[];
}
