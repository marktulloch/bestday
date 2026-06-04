import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentRow,
  ConsultationNoteRow,
  ConsultationRecommendationRow,
  CustomerOrderRow,
  CustomerRow,
  PrescreenRow,
  PrescreeningResponseRow,
  ProfileRow,
  TicketRow,
} from "@/lib/database.types";
import { formatMcPrescreeningResponseLines } from "@/lib/mc-flow/mc-prescreening-format";
import { getCustomerPrescreenSummary } from "@/lib/prescreen/eligibility";
import { formatDecisionLogForAdmin, parseDecisionLogFromDb } from "@/lib/prescreen/eligibility/admin-format";

export type DoctorPatientDetail = {
  customer: CustomerRow;
  profile: Pick<ProfileRow, "id" | "email" | "full_name"> | null;
  assignedToMe: boolean;
  prescreens: PrescreenRow[];
  prescreenSummaries: { id: string; workflow_status: string; label: string; detail: string }[];
  appointments: AppointmentRow[];
  tickets: TicketRow[];
  orders: CustomerOrderRow[];
  notes: ConsultationNoteRow[];
  recommendations: ConsultationRecommendationRow[];
  eligibilityExtras: {
    decision_summary_admin: string | null;
    reason_codes: string[];
    decision_log_lines: string[];
  }[];
  mcPrescreeningResponses: PrescreeningResponseRow[];
  mcPrescreeningAnswerLines: string[][];
};

export async function getDoctorPatientDetail(
  customerId: string,
  doctorUserId: string,
): Promise<DoctorPatientDetail | null> {
  const supabase = await createClient();

  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (cErr || !customer) return null;

  const c = customer as CustomerRow;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", c.user_id)
    .maybeSingle();

  const [{ data: prescreens }, { data: mcPrescreenRows }] = await Promise.all([
    supabase
      .from("prescreens")
      .select("*")
      .eq("user_id", c.user_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("prescreening_responses")
      .select("*")
      .eq("user_id", c.user_id)
      .order("created_at", { ascending: false }),
  ]);

  const ps = (prescreens ?? []) as PrescreenRow[];
  const mcPrescreeningResponses = (mcPrescreenRows ?? []) as PrescreeningResponseRow[];
  const mcPrescreeningAnswerLines = mcPrescreeningResponses.map((row) =>
    formatMcPrescreeningResponseLines(row),
  );

  const prescreenSummaries = ps.map((row) => {
    const copy = getCustomerPrescreenSummary(row.workflow_status);
    return {
      id: row.id,
      workflow_status: row.workflow_status,
      label: copy.label,
      detail: copy.detail,
    };
  });

  const eligibilityExtras = ps.map((row) => ({
    decision_summary_admin: row.decision_summary_admin,
    reason_codes: row.decision_reason_codes ?? [],
    decision_log_lines: formatDecisionLogForAdmin(parseDecisionLogFromDb(row.decision_log)),
  }));

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .or(`customer_id.eq.${customerId},user_id.eq.${c.user_id}`)
    .order("start_time", { ascending: false });

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("customer_orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("consultation_notes")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const { data: recommendations } = await supabase
    .from("consultation_recommendations")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const { data: assignRow } = await supabase
    .from("doctor_patient_assignments")
    .select("customer_id")
    .eq("doctor_user_id", doctorUserId)
    .eq("customer_id", customerId)
    .maybeSingle();

  return {
    customer: c,
    profile: profile as Pick<ProfileRow, "id" | "email" | "full_name"> | null,
    assignedToMe: Boolean(assignRow),
    prescreens: ps,
    prescreenSummaries,
    appointments: (appointments ?? []) as AppointmentRow[],
    tickets: (tickets ?? []) as TicketRow[],
    orders: (orders ?? []) as CustomerOrderRow[],
    notes: (notes ?? []) as ConsultationNoteRow[],
    recommendations: (recommendations ?? []) as ConsultationRecommendationRow[],
    eligibilityExtras,
    mcPrescreeningResponses,
    mcPrescreeningAnswerLines,
  };
}
