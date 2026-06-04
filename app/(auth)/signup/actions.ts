"use server";

import { cookies } from "next/headers";

import { BD_MC_PRESCREEN_STATUS_COOKIE } from "@/lib/mc-flow/cookies";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PatientSignupRegistration } from "@/lib/validation/patient-registration";
import { patientSignupRegistrationSchema } from "@/lib/validation/patient-registration";

function zodIssuesToMessage(err: { issues: readonly { message: string }[] }): string {
  return err.issues.map((i) => i.message).filter(Boolean).join(" ");
}

/**
 * Creates auth user + `patient_profiles` (no MC cookie checks). Used by signup and by
 * combined pre-screen + registration.
 */
export async function createPatientAccountFromRegistration(
  data: PatientSignupRegistration,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const email = data.email.trim().toLowerCase();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: `${data.firstName} ${data.lastName}`.trim(),
    },
  });

  if (error || !created.user) {
    return { ok: false, error: error?.message ?? "Could not create your account." };
  }

  const uid = created.user.id;
  const now = new Date().toISOString();
  const preferred = data.preferredName?.trim();

  const { error: profileErr } = await admin.from("patient_profiles").insert({
    user_id: uid,
    first_name: data.firstName,
    preferred_name: preferred && preferred.length > 0 ? preferred : null,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    email,
    mobile: data.mobile.trim(),
    terms_accepted: true,
    terms_accepted_at: now,
    privacy_policy_accepted: true,
    privacy_policy_accepted_at: now,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(uid);
    return { ok: false, error: profileErr.message };
  }

  await admin
    .from("profiles")
    .update({
      full_name: `${data.firstName} ${data.lastName}`.trim(),
      email,
    })
    .eq("id", uid);

  return { ok: true, userId: uid };
}

/**
 * Creates auth user + `patient_profiles` after server-side validation.
 * Blocked when the MC prescreen cookie indicates an ineligible outcome.
 */
export async function signUpPatientValidated(
  input: unknown,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const jar = await cookies();
  if (jar.get(BD_MC_PRESCREEN_STATUS_COOKIE)?.value === "ineligible") {
    return { ok: false, error: MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE };
  }

  const parsed = patientSignupRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodIssuesToMessage(parsed.error) };
  }

  return createPatientAccountFromRegistration(parsed.data);
}
