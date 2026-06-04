import { createClient } from "@/lib/supabase/server";
import type { PrescreeningResponseRow } from "@/lib/database.types";

/** @deprecated prefer PrescreeningResponseRow from latest query */
export type McPrescreeningEligibilitySnapshot = Pick<PrescreeningResponseRow, "id" | "eligible" | "created_at">;

export async function getLatestMcPrescreeningResponseForUser(
  userId: string,
): Promise<PrescreeningResponseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescreening_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as PrescreeningResponseRow;
}
