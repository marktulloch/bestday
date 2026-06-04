"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertIntakeConsentComplete,
  assertMcPrescreenEligibleForFlow,
  assertPatientProfileExists,
} from "@/lib/appointment-flow/guards";
import { getActiveConsultationServiceById } from "@/lib/consultation-services/queries";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

export type SelectedConsultationService = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
};

/**
 * Persists the patient’s chosen consultation service after enforcing:
 * MC prescreen eligible, registration (`patient_profiles`), intake + consent + declaration,
 * and an active catalogue row.
 */
export async function selectConsultationServiceForBooking(
  serviceId: unknown,
): Promise<{ ok: true; service: SelectedConsultationService } | { ok: false; error: string }> {
  const idParse = uuid.safeParse(serviceId);
  if (!idParse.success) {
    return { ok: false, error: "Invalid consultation service." };
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return { ok: false, error: "You must be signed in." };
  }
  if (ctx.profile.role !== "customer") {
    return { ok: false, error: "Only patient accounts can select a consultation service." };
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

  const intakeGate = await assertIntakeConsentComplete(supabase, ctx.user.id);
  if (!intakeGate.ok) {
    return { ok: false, error: intakeGate.error };
  }

  const service = await getActiveConsultationServiceById(idParse.data);
  if (!service) {
    return { ok: false, error: "That consultation service is not available." };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await looseDb(supabase)
    .from("patient_profiles")
    .update({ selected_consultation_service_id: service.id, updated_at: now })
    .eq("user_id", ctx.user.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/booking");
  revalidatePath("/portal/checkout");
  revalidatePath("/portal/profile");

  return {
    ok: true,
    service: {
      id: service.id,
      name: service.name,
      price_cents: service.price_cents,
      currency: service.currency,
    },
  };
}
