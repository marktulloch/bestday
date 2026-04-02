import { createClient } from "@/lib/supabase/server";
import type { PrescreenEligibility, PrescreenRow } from "@/lib/database.types";

export type PrescreenStatusSummary = {
  record: PrescreenRow | null;
  label: string;
  detail: string;
};

function eligibilityCopy(status: PrescreenEligibility): { label: string; detail: string } {
  switch (status) {
    case "eligible":
    case "eligible_for_booking":
      return {
        label: "Eligible to book",
        detail: "You can proceed to schedule a consultation when booking opens.",
      };
    case "ineligible":
      return {
        label: "Not eligible online",
        detail: "Our team may contact you if follow-up is appropriate.",
      };
    case "needs_review":
      return {
        label: "Under review",
        detail: "A clinician or administrator is reviewing your pre-screen.",
      };
    default:
      return {
        label: "In progress",
        detail: "We are processing your pre-screening information.",
      };
  }
}

export async function getLatestPrescreenForUser(
  userId: string,
): Promise<PrescreenStatusSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescreens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      record: null,
      label: "Not started",
      detail: "Complete pre-screening to move forward with a consultation.",
    };
  }

  const record = data as PrescreenRow;
  const copy = eligibilityCopy(record.eligibility);
  return {
    record,
    label: copy.label,
    detail: copy.detail,
  };
}
