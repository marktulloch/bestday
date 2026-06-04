import { createClient } from "@/lib/supabase/server";
import type { PrescreenRow, PrescreeningResponseRow } from "@/lib/database.types";
import { formatMcPrescreeningResponseLines } from "@/lib/mc-flow/mc-prescreening-format";
import { getCustomerPrescreenSummary } from "@/lib/prescreen/eligibility";

export type PrescreenPortalSnapshot = Pick<
  PrescreenRow,
  "id" | "created_at" | "workflow_status" | "version"
>;

export type PrescreenStatusSummary = {
  record: PrescreenPortalSnapshot | null;
  /** Latest medicinal-cannabis questionnaire row (separate from legacy `prescreens`). */
  mcRecord: PrescreeningResponseRow | null;
  label: string;
  detail: string;
  answerLines: string[];
};

export async function getLatestPrescreenForUser(
  userId: string,
): Promise<PrescreenStatusSummary> {
  const supabase = await createClient();
  const [legacyRes, mcRes] = await Promise.all([
    supabase
      .from("prescreens")
      .select("id, created_at, workflow_status, version")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("prescreening_responses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const mcRecord = (mcRes.data as PrescreeningResponseRow | null) ?? null;
  const answerLines = mcRecord ? formatMcPrescreeningResponseLines(mcRecord) : [];

  const data = legacyRes.data;
  const legacyErr = legacyRes.error;

  if (!legacyErr && data) {
    const record = data as PrescreenPortalSnapshot;
    const copy = getCustomerPrescreenSummary(record.workflow_status);
    return {
      record,
      mcRecord,
      label: copy.label,
      detail: copy.detail,
      answerLines,
    };
  }

  if (mcRecord) {
    const label = mcRecord.eligible
      ? "Pre-screening complete"
      : "Pre-screening on file";
    const detail = mcRecord.eligible
      ? "Your questionnaire is on file and you meet our initial eligibility criteria."
      : mcRecord.ineligible_reason?.trim() ||
        "Based on your answers, our standard online booking path may not apply. Our team can help with next steps.";
    return {
      record: null,
      mcRecord,
      label,
      detail,
      answerLines,
    };
  }

  return {
    record: null,
    mcRecord: null,
    label: "Not started",
    detail: "Complete pre-screening to move forward with a consultation.",
    answerLines: [],
  };
}
