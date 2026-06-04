import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { getLatestMcPrescreeningResponseForUser } from "@/lib/mc-flow/prescreening-queries";
import { looseDb } from "@/lib/supabase/loose-client";

/** Matches `createClient()` from `@/lib/supabase/server` (SSR client generic arity differs from `SupabaseClient<Database>`). */
export type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type GuardFailure = { ok: false; error: string };
export type GuardOk = { ok: true };
export type GuardResult = GuardOk | GuardFailure;

export type ConsultationServiceSelectedResult =
  | { ok: true; selectedServiceId: string }
  | { ok: false; error: string };

/**
 * Step 1: latest medicinal-cannabis prescreen must exist and be eligible.
 * (If there is no row yet, the patient has not completed prescreening for this flow.)
 */
export async function assertMcPrescreenEligibleForFlow(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<GuardResult> {
  const mc = await getLatestMcPrescreeningResponseForUser(userId);
  if (!mc) {
    return { ok: false, error: "Complete pre-screening before continuing." };
  }
  if (!mc.eligible) {
    return { ok: false, error: "Pre-screening must be eligible to continue this journey." };
  }
  return { ok: true };
}

/** Step 2: `patient_profiles` row for the auth user. */
export async function assertPatientProfileExists(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<GuardResult> {
  const { data, error } = await supabase.from("patient_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (error || !data) {
    return { ok: false, error: "Complete patient registration (profile) before continuing." };
  }
  return { ok: true };
}

/** Step 3: intake with consent statement + declaration on file. */
export async function assertIntakeConsentComplete(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<GuardResult> {
  const { data, error } = await looseDb(supabase)
    .from("consultation_intake_forms")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_statement_accepted", true)
    .eq("declaration_accepted", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: "Submit the consultation intake with consent and declaration before continuing.",
    };
  }
  return { ok: true };
}

/** Step 4: a consultation service has been chosen on the profile. */
export async function assertConsultationServiceSelected(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<ConsultationServiceSelectedResult> {
  const { data, error } = await supabase
    .from("patient_profiles")
    .select("selected_consultation_service_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Patient profile not found." };
  }
  const row = data as { selected_consultation_service_id: string | null };
  if (!row.selected_consultation_service_id) {
    return { ok: false, error: "Select a consultation service before paying." };
  }
  return { ok: true, selectedServiceId: row.selected_consultation_service_id };
}

export type PaidAppointmentPaymentRow = {
  id: string;
  consultation_service_id: string;
  payment_status: string;
  booking_confirmed_at: string | null;
  external_booking_reference: string | null;
};

/** Latest paid appointment payment for the patient’s currently selected service (Step 5 complete). */
export async function getPaidAppointmentPaymentForSelectedService(
  supabase: AppSupabaseClient,
  userId: string,
  selectedServiceId: string,
): Promise<PaidAppointmentPaymentRow | null> {
  const { data, error } = await looseDb(supabase)
    .from("appointment_payments")
    .select("id, consultation_service_id, payment_status, booking_confirmed_at, external_booking_reference")
    .eq("user_id", userId)
    .eq("consultation_service_id", selectedServiceId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as PaidAppointmentPaymentRow;
}
