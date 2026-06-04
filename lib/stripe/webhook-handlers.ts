import "server-only";

import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505");
}

/**
 * Claim this Stripe event once (idempotency). Returns false if already processed.
 * On downstream failure, the caller should delete this row so Stripe can retry.
 */
export async function claimStripeWebhookEvent(
  admin: Admin,
  event: Stripe.Event,
): Promise<{ claimed: boolean }> {
  const { error } = await admin.from("stripe_processed_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });
  if (error && isUniqueViolation(error)) {
    return { claimed: false };
  }
  if (error) {
    throw new Error(error.message);
  }
  return { claimed: true };
}

export async function releaseStripeWebhookEventClaim(admin: Admin, eventId: string): Promise<void> {
  await admin.from("stripe_processed_webhook_events").delete().eq("stripe_event_id", eventId);
}

function readAppointmentPaymentMeta(meta: Stripe.Metadata | null | undefined): {
  paymentId: string | null;
  userId: string | null;
} {
  const m = meta ?? {};
  const paymentId = typeof m.appointment_payment_id === "string" ? m.appointment_payment_id : null;
  const userId = typeof m.user_id === "string" ? m.user_id : null;
  return { paymentId, userId };
}

async function markPatientConsultationPaymentComplete(
  admin: Admin,
  userId: string,
  consultationServiceId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await admin
    .from("patient_profiles")
    .update({
      consultation_appointment_payment_completed_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("selected_consultation_service_id", consultationServiceId);
}

type PaymentRowSnapshot = {
  payment_status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  consultation_service_id: string;
};

export async function handleCheckoutSessionCompleted(
  admin: Admin,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const { paymentId, userId } = readAppointmentPaymentMeta(session.metadata);
  if (!paymentId || !userId) {
    return;
  }

  const pi = session.payment_intent;
  const paymentIntentId =
    typeof pi === "string" ? pi : pi && typeof pi === "object" && "id" in pi ? String(pi.id) : null;

  const { data: row, error: fetchErr } = await admin
    .from("appointment_payments")
    .select("payment_status, stripe_checkout_session_id, stripe_payment_intent_id, consultation_service_id")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }
  if (!row) {
    return;
  }

  const snap = row as PaymentRowSnapshot;
  const now = new Date().toISOString();

  if (snap.payment_status === "pending") {
    const { data: updated, error } = await admin
      .from("appointment_payments")
      .update({
        payment_status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId ?? snap.stripe_payment_intent_id,
        updated_at: now,
      })
      .eq("id", paymentId)
      .eq("user_id", userId)
      .eq("payment_status", "pending")
      .select("consultation_service_id");

    if (error) {
      throw new Error(error.message);
    }
    const u = updated?.[0] as { consultation_service_id: string } | undefined;
    if (u) {
      await markPatientConsultationPaymentComplete(admin, userId, u.consultation_service_id);
    }
    return;
  }

  if (snap.payment_status === "paid") {
    const patch: Record<string, string> = { updated_at: now };
    if (!snap.stripe_checkout_session_id) {
      patch.stripe_checkout_session_id = session.id;
    }
    if (paymentIntentId && !snap.stripe_payment_intent_id) {
      patch.stripe_payment_intent_id = paymentIntentId;
    }
    const hasStripePatch =
      "stripe_checkout_session_id" in patch || "stripe_payment_intent_id" in patch;
    if (hasStripePatch) {
      const { error } = await admin.from("appointment_payments").update(patch).eq("id", paymentId).eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
    }
  }
}

export async function handlePaymentIntentSucceeded(
  admin: Admin,
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const { paymentId, userId } = readAppointmentPaymentMeta(intent.metadata);
  if (!paymentId || !userId) {
    return;
  }

  const { data: row, error: fetchErr } = await admin
    .from("appointment_payments")
    .select("payment_status, stripe_checkout_session_id, stripe_payment_intent_id, consultation_service_id")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }
  if (!row) {
    return;
  }

  const snap = row as PaymentRowSnapshot;
  const now = new Date().toISOString();

  if (snap.payment_status === "pending") {
    const { data: updated, error } = await admin
      .from("appointment_payments")
      .update({
        payment_status: "paid",
        stripe_payment_intent_id: intent.id,
        updated_at: now,
      })
      .eq("id", paymentId)
      .eq("user_id", userId)
      .eq("payment_status", "pending")
      .select("consultation_service_id");

    if (error) {
      throw new Error(error.message);
    }
    const u = updated?.[0] as { consultation_service_id: string } | undefined;
    if (u) {
      await markPatientConsultationPaymentComplete(admin, userId, u.consultation_service_id);
    }
    return;
  }

  if (snap.payment_status === "paid" && !snap.stripe_payment_intent_id) {
    const { error } = await admin
      .from("appointment_payments")
      .update({
        stripe_payment_intent_id: intent.id,
        updated_at: now,
      })
      .eq("id", paymentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function handlePaymentIntentPaymentFailed(
  admin: Admin,
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const { paymentId, userId } = readAppointmentPaymentMeta(intent.metadata);
  if (!paymentId || !userId) {
    return;
  }

  const { error } = await admin
    .from("appointment_payments")
    .update({
      payment_status: "failed",
      stripe_payment_intent_id: intent.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("payment_status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}

export async function handleCheckoutSessionExpired(
  admin: Admin,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const { error } = await admin
    .from("appointment_payments")
    .update({
      payment_status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", session.id)
    .eq("payment_status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}
