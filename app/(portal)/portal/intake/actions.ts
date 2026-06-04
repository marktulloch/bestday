"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/lib/auth/session";
import { assertMcPrescreenEligibleForFlow, assertPatientProfileExists } from "@/lib/appointment-flow/guards";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import { consultationIntakeSubmissionSchema } from "@/lib/validation/consultation-intake";

function zodIssuesToMessage(err: { issues: readonly { message: string }[] }): string {
  return err.issues.map((i) => i.message).filter(Boolean).join(" ");
}

export async function submitConsultationIntakeForm(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "Not signed in" };
  if (ctx.profile.role !== "customer") {
    return { ok: false, error: "Only patients can submit this form." };
  }

  const supabase = await createClient();

  const pre = await assertMcPrescreenEligibleForFlow(supabase, ctx.user.id);
  if (!pre.ok) {
    return { ok: false, error: pre.error };
  }

  const reg = await assertPatientProfileExists(supabase, ctx.user.id);
  if (!reg.ok) {
    return { ok: false, error: reg.error };
  }

  const parsed = consultationIntakeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodIssuesToMessage(parsed.error) };
  }

  const now = new Date().toISOString();
  const d = parsed.data;

  const { data: inserted, error } = await looseDb(supabase)
    .from("consultation_intake_forms")
    .insert({
      user_id: ctx.user.id,
      nhi_number: d.nhi_number ?? null,
      height_cm: d.height_cm ?? null,
      weight_kg: d.weight_kg ?? null,
      gp_name: d.gp_name,
      gp_practice_name: d.gp_practice_name,
      gp_practice_email: d.gp_practice_email,
      gp_practice_phone: d.gp_practice_phone,
      primary_reason: d.primary_reason,
      symptom_duration: d.symptom_duration,
      severity_score: d.severity_score,
      treatment_goals: d.treatment_goals,
      previous_unsuccessful_medications: d.previous_unsuccessful_medications ?? null,
      medical_history: d.medical_history as Json,
      medication_screening: d.medication_screening as Json,
      general_allergies: d.general_allergies ?? null,
      current_medications_supplements: d.current_medications_supplements ?? null,
      occupation_risks: d.occupation_risks as Json,
      previous_cannabis_use: d.previous_cannabis_use ?? null,
      previous_cannabis_details: d.previous_cannabis_details ?? null,
      consent_statement_accepted: true,
      consent_statement_accepted_at: now,
      declaration_accepted: true,
      declaration_accepted_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    return { ok: false, error: error?.message ?? "Could not save intake form." };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/profile");
  return { ok: true, id: inserted.id };
}
