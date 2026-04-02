"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { trackPrescreenEventServer } from "@/lib/analytics/prescreen-events";
import type { PrescreenEligibility, TicketPriority } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePrescreenEligibility, outcomeToQueryParam } from "@/lib/prescreen/eligibility";
import {
  applyStep1ToPayload,
  buildPayloadAfterStep2,
  normalizePrescreenPayload,
} from "@/lib/prescreen/payload";
import {
  FUNNEL_COOKIE_MAX_AGE,
  FUNNEL_LEAD_COOKIE,
  FUNNEL_PRESCREEN_COOKIE,
} from "@/lib/portal/funnel-constants";
import { createClient } from "@/lib/supabase/server";

const boolish = z.preprocess(
  (v) => v === true || v === "on" || v === "true",
  z.boolean(),
);

const stepOneSchema = z
  .object({
    email: z.string().trim(),
    ageRange: z.string().min(1, "Please select an age range"),
    nzResident: boolish,
  })
  .refine(
    (d) => d.email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email),
    { path: ["email"], message: "Invalid email" },
  );

const stepTwoSchema = z.object({
  consultationReason: z.string().min(1, "Please select a consultation reason"),
  hasGP: boolish,
  consentConsultation: boolish.refine((v) => v === true, {
    message: "You must provide consent to continue",
  }),
});

/** Prefer matching lead by email; otherwise keep or create anonymous lead. */
async function resolveLeadId(
  admin: ReturnType<typeof createAdminClient>,
  emailNorm: string | null,
  currentLeadId: string | null,
): Promise<string | null> {
  const now = new Date().toISOString();

  if (emailNorm) {
    const { data: byEmail } = await admin
      .from("leads")
      .select("id")
      .eq("email", emailNorm)
      .maybeSingle();
    if (byEmail?.id) {
      await admin.from("leads").update({ updated_at: now }).eq("id", byEmail.id);
      return byEmail.id;
    }
  }

  if (currentLeadId) {
    if (emailNorm) {
      await admin
        .from("leads")
        .update({ email: emailNorm, updated_at: now })
        .eq("id", currentLeadId)
        .is("email", null);
    } else {
      await admin.from("leads").update({ updated_at: now }).eq("id", currentLeadId);
    }
    return currentLeadId;
  }

  if (emailNorm) {
    const { data: created, error } = await admin
      .from("leads")
      .insert({
        email: emailNorm,
        source: "prescreen",
        status: "new",
      })
      .select("id")
      .single();
    if (error || !created?.id) return null;
    return created.id;
  }

  const { data: anon, error } = await admin
    .from("leads")
    .insert({
      email: null,
      source: "prescreen_anon",
      status: "new",
    })
    .select("id")
    .single();
  if (error || !anon?.id) return null;
  return anon.id;
}

export type PrescreenStepOneInput = z.infer<typeof stepOneSchema>;
export type PrescreenStepTwoInput = z.infer<typeof stepTwoSchema>;

export async function submitPrescreenStepOne(input: PrescreenStepOneInput) {
  const parsed = stepOneSchema.safeParse(input);
  if (!parsed.success) {
    redirect("/prescreen?error=validation");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/prescreen?error=config");
  }

  const data = parsed.data;
  const emailNorm = data.email.length > 0 ? data.email.toLowerCase() : null;
  const admin = createAdminClient();
  const jar = await cookies();
  const existingPrescreenId = jar.get(FUNNEL_PRESCREEN_COOKIE)?.value ?? null;

  let prescreenId: string;
  let leadId: string | null = null;
  let version = 1;

  if (existingPrescreenId) {
    const { data: row, error: fetchErr } = await admin
      .from("prescreens")
      .select("id, payload, version, lead_id")
      .eq("id", existingPrescreenId)
      .maybeSingle();

    if (fetchErr || !row?.id) {
      jar.delete(FUNNEL_PRESCREEN_COOKIE);
      jar.delete(FUNNEL_LEAD_COOKIE);
      redirect("/prescreen?error=session");
    }

    leadId = await resolveLeadId(admin, emailNorm, row.lead_id ?? null);
    const payload = applyStep1ToPayload(row.payload as never, {
      email: emailNorm,
      ageRange: data.ageRange,
      nzResident: data.nzResident,
    });
    version = (row.version ?? 1) + 1;

    const { error: upErr } = await admin
      .from("prescreens")
      .update({
        lead_id: leadId,
        payload,
        version,
        eligibility: "pending",
      })
      .eq("id", row.id);

    if (upErr) {
      redirect("/prescreen?error=save");
    }
    prescreenId = row.id;
  } else {
    leadId = await resolveLeadId(admin, emailNorm, null);
    const payload = applyStep1ToPayload(undefined, {
      email: emailNorm,
      ageRange: data.ageRange,
      nzResident: data.nzResident,
    });

    const { data: created, error: insErr } = await admin
      .from("prescreens")
      .insert({
        lead_id: leadId,
        user_id: null,
        payload,
        eligibility: "pending",
        version: 1,
      })
      .select("id")
      .single();

    if (insErr || !created?.id) {
      redirect("/prescreen?error=save");
    }
    prescreenId = created.id;
  }

  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: FUNNEL_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
  jar.set(FUNNEL_PRESCREEN_COOKIE, prescreenId, cookieBase);
  if (leadId) {
    jar.set(FUNNEL_LEAD_COOKIE, leadId, cookieBase);
  }

  trackPrescreenEventServer("prescreen_step_one_saved", { prescreenId });
  redirect("/prescreen/details");
}

export async function submitPrescreenStepTwo(input: PrescreenStepTwoInput) {
  const parsed = stepTwoSchema.safeParse(input);
  if (!parsed.success) {
    redirect("/prescreen/details?error=validation");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/prescreen/details?error=config");
  }

  const jar = await cookies();
  const prescreenId = jar.get(FUNNEL_PRESCREEN_COOKIE)?.value;
  if (!prescreenId) {
    redirect("/prescreen?error=session");
  }

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("prescreens")
    .select("id, payload, version, lead_id")
    .eq("id", prescreenId)
    .maybeSingle();

  if (fetchErr || !row?.id) {
    redirect("/prescreen?error=session");
  }

  const payload = buildPayloadAfterStep2(row.payload as never, {
    consultationReason: parsed.data.consultationReason,
    hasGP: parsed.data.hasGP,
    consentConsultation: parsed.data.consentConsultation,
  });

  const normalized = normalizePrescreenPayload(payload);
  const step2 = normalized.step2;
  if (!step2) {
    redirect("/prescreen/details?error=validation");
  }

  const businessOutcome = computePrescreenEligibility({
    nzResident: normalized.step1.nzResident,
    consultationConsent: step2.consentConsultation,
    ageRange: normalized.step1.ageRange,
    consultationReason: step2.consultationReason,
  });
  const eligibility = businessOutcome as PrescreenEligibility;
  const nextVersion = (row.version ?? 1) + 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: upErr } = await admin
    .from("prescreens")
    .update({
      payload,
      eligibility,
      version: nextVersion,
      ...(user?.id ? { user_id: user.id } : {}),
    })
    .eq("id", row.id);

  if (upErr) {
    redirect("/prescreen/details?error=save");
  }

  let customerId: string | null = null;
  if (user?.id) {
    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    customerId = customer?.id ?? null;

    if (row.lead_id) {
      await admin
        .from("leads")
        .update({
          converted_user_id: user.id,
          ...(customerId ? { converted_customer_id: customerId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.lead_id)
        .is("converted_user_id", null);
    }
  }

  const emailLabel =
    normalized.step1.email && normalized.step1.email.length > 0
      ? normalized.step1.email
      : "Anonymous";

  const ticketPriority: TicketPriority = eligibility === "ineligible" ? "low" : "normal";

  const { data: existingTicket } = await admin
    .from("tickets")
    .select("id")
    .eq("prescreen_id", row.id)
    .maybeSingle();

  if (!existingTicket?.id) {
    const { error: ticketErr } = await admin.from("tickets").insert({
      prescreen_id: row.id,
      lead_id: row.lead_id,
      customer_id: customerId,
      created_by_user_id: user?.id ?? null,
      subject: `Pre-screen: ${emailLabel} (${eligibility})`,
      status: "open",
      priority: ticketPriority,
      metadata: {
        source: "prescreen_auto",
        eligibility,
        prescreen_id: row.id,
      },
    });

    if (ticketErr) {
      redirect("/prescreen/details?error=ticket");
    }
  }

  trackPrescreenEventServer("prescreen_step_two_saved", {
    prescreenId: row.id,
    eligibility,
  });

  const q = outcomeToQueryParam(businessOutcome);
  redirect(`/prescreen/complete?outcome=${q}`);
}
