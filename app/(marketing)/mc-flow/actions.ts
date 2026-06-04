"use server";

import { cookies } from "next/headers";

import { createPatientAccountFromRegistration } from "@/app/(auth)/signup/actions";
import { BD_MC_PRESCREEN_STATUS_COOKIE } from "@/lib/mc-flow/cookies";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { mapPrescreeningPostgrestError } from "@/lib/mc-flow/prescreen-db-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAgeAtLeastFromIsoDate } from "@/lib/validation/dates";
import { mcPrescreenWithRegistrationSchema } from "@/lib/validation/mc-prescreen-with-registration";
import { mcPrescreeningSubmissionSchema } from "@/lib/validation/mc-prescreening";
import { patientSignupRegistrationSchema } from "@/lib/validation/patient-registration";

function zodIssuesToMessage(err: { issues: readonly { message: string }[] }): string {
  return err.issues.map((i) => i.message).filter(Boolean).join(" ");
}

async function setMcPrescreenStatusCookie(eligible: boolean): Promise<void> {
  const jar = await cookies();
  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
  jar.set(BD_MC_PRESCREEN_STATUS_COOKIE, eligible ? "eligible" : "ineligible", cookieBase);
}

export async function submitMcPrescreeningResponse(
  input: unknown,
): Promise<
  | { ok: true; eligible: boolean; id: string; message?: string }
  | { ok: false; error: string }
> {
  const parsed = mcPrescreeningSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodIssuesToMessage(parsed.error) };
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* env missing in some contexts */
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Server configuration error." };
  }

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("prescreening_responses")
    .insert({
      user_id: userId,
      age_20_or_above: parsed.data.age_20_or_above,
      previously_attempted_treatment: parsed.data.previously_attempted_treatment,
      pregnant_breastfeeding_or_trying: parsed.data.pregnant_breastfeeding_or_trying,
      allergic_cannabinoids_coconut_salicylates: parsed.data.allergic_cannabinoids_coconut_salicylates,
      psychosis_schizophrenia_bipolar_history: parsed.data.psychosis_schizophrenia_bipolar_history,
      contraindicated_medications: parsed.data.contraindicated_medications,
    })
    .select("id, eligible")
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: mapPrescreeningPostgrestError(error?.message ?? "Failed to save prescreening response."),
    };
  }

  await setMcPrescreenStatusCookie(inserted.eligible);

  if (!inserted.eligible) {
    return {
      ok: true,
      eligible: false,
      id: inserted.id,
      message: MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE,
    };
  }
  return { ok: true, eligible: true, id: inserted.id };
}

/**
 * Anonymous visitor: save clinical pre-screen first; only if eligible, create auth + patient profile
 * and link `prescreening_responses.user_id`.
 */
export async function submitMcPrescreenWithRegistration(
  input: unknown,
): Promise<
  | { ok: true; eligible: true; id: string }
  | { ok: true; eligible: false; id: string; message?: string }
  | { ok: false; error: string }
> {
  const parsed = mcPrescreenWithRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodIssuesToMessage(parsed.error) };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Server configuration error." };
  }

  const {
    previously_attempted_treatment,
    pregnant_breastfeeding_or_trying,
    allergic_cannabinoids_coconut_salicylates,
    psychosis_schizophrenia_bipolar_history,
    contraindicated_medications,
    ...regRest
  } = parsed.data;

  const registration = patientSignupRegistrationSchema.parse(regRest);
  const age20 = isAgeAtLeastFromIsoDate(registration.dateOfBirth, 20);

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("prescreening_responses")
    .insert({
      user_id: null,
      age_20_or_above: age20,
      previously_attempted_treatment,
      pregnant_breastfeeding_or_trying,
      allergic_cannabinoids_coconut_salicylates,
      psychosis_schizophrenia_bipolar_history,
      contraindicated_medications,
    })
    .select("id, eligible")
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: mapPrescreeningPostgrestError(error?.message ?? "Failed to save prescreening response."),
    };
  }

  if (!inserted.eligible) {
    await setMcPrescreenStatusCookie(false);
    return {
      ok: true,
      eligible: false,
      id: inserted.id,
      message: MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE,
    };
  }

  await setMcPrescreenStatusCookie(true);

  const created = await createPatientAccountFromRegistration(registration);
  if (!created.ok) {
    await admin.from("prescreening_responses").delete().eq("id", inserted.id);
    (await cookies()).delete(BD_MC_PRESCREEN_STATUS_COOKIE);
    return { ok: false, error: created.error };
  }

  const { error: linkErr } = await admin
    .from("prescreening_responses")
    .update({ user_id: created.userId })
    .eq("id", inserted.id);

  if (linkErr) {
    await admin.from("prescreening_responses").delete().eq("id", inserted.id);
    await admin.auth.admin.deleteUser(created.userId);
    (await cookies()).delete(BD_MC_PRESCREEN_STATUS_COOKIE);
    return { ok: false, error: mapPrescreeningPostgrestError(linkErr.message) };
  }

  return { ok: true, eligible: true, id: inserted.id };
}
