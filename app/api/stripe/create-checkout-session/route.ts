import { z } from "zod";

import {
  assertConsultationServiceSelected,
  assertIntakeConsentComplete,
  assertPatientProfileExists,
} from "@/lib/appointment-flow/guards";
import { getLatestMcPrescreeningResponseForUser } from "@/lib/mc-flow/prescreening-queries";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import { getStripe } from "@/lib/stripe/server";
import { assertAppRedirectUrl, getSiteOrigin } from "@/lib/stripe/redirect-urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  consultation_service_id: z.string().uuid(),
  appointment_booking_reference: z.string().trim().max(500).optional().nullable(),
  success_url: z.string().min(1).max(4000),
  cancel_url: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return Response.json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)." }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
    return Response.json(
      { error: "Stripe is not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)." },
      { status: 503 },
    );
  }

  const siteOrigin = getSiteOrigin();
  if (!siteOrigin) {
    return Response.json({ error: "NEXT_PUBLIC_SITE_URL is not configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    assertAppRedirectUrl(parsed.data.success_url, siteOrigin);
    assertAppRedirectUrl(parsed.data.cancel_url, siteOrigin);
  } catch {
    return Response.json(
      {
        error:
          "success_url and cancel_url must be valid URLs on the same origin as NEXT_PUBLIC_SITE_URL.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return Response.json({ error: "You must be signed in." }, { status: 401 });
  }

  const mc = await getLatestMcPrescreeningResponseForUser(user.id);
  if (!mc?.eligible) {
    return Response.json(
      { error: "You must complete pre-screening as eligible before paying for an appointment." },
      { status: 403 },
    );
  }

  const profGate = await assertPatientProfileExists(supabase, user.id);
  if (!profGate.ok) {
    return Response.json({ error: profGate.error }, { status: 403 });
  }

  const intakeGate = await assertIntakeConsentComplete(supabase, user.id);
  if (!intakeGate.ok) {
    return Response.json({ error: intakeGate.error }, { status: 403 });
  }

  const selectedGate = await assertConsultationServiceSelected(supabase, user.id);
  if (!selectedGate.ok) {
    return Response.json({ error: selectedGate.error }, { status: 403 });
  }
  if (selectedGate.selectedServiceId !== parsed.data.consultation_service_id) {
    return Response.json(
      {
        error:
          "The consultation service in checkout must match the one selected on your profile. Update your selection first.",
      },
      { status: 400 },
    );
  }

  const { data: service, error: serviceErr } = await looseDb(supabase)
    .from("consultation_services")
    .select("id, name, price_cents, currency, active")
    .eq("id", parsed.data.consultation_service_id)
    .eq("active", true)
    .maybeSingle();

  if (serviceErr || !service) {
    return Response.json({ error: "Consultation service not found or inactive." }, { status: 400 });
  }

  const svc = service as {
    id: string;
    name: string;
    price_cents: number;
    currency: string;
    active: boolean;
  };

  if (!svc.active || svc.price_cents < 0) {
    return Response.json({ error: "Consultation service not available." }, { status: 400 });
  }

  const currency = (svc.currency || "NZD").toLowerCase();
  if (currency !== "nzd") {
    return Response.json({ error: "Only NZD checkout is supported for this flow." }, { status: 400 });
  }

  const { data: payment, error: payInsErr } = await looseDb(supabase)
    .from("appointment_payments")
    .insert({
      user_id: user.id,
      consultation_service_id: svc.id,
      amount_cents: svc.price_cents,
      currency: "NZD",
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (payInsErr || !payment?.id) {
    return Response.json(
      { error: payInsErr?.message ?? "Could not create payment record." },
      { status: 500 },
    );
  }

  const paymentId = payment.id as string;

  const metadata: Record<string, string> = {
    user_id: user.id,
    consultation_service_id: svc.id,
    appointment_payment_id: paymentId,
  };
  const bookingRef = parsed.data.appointment_booking_reference?.trim();
  if (bookingRef) {
    metadata.appointment_booking_reference = bookingRef;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: parsed.data.success_url,
      cancel_url: parsed.data.cancel_url,
      client_reference_id: paymentId,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: svc.price_cents,
            product_data: {
              name: svc.name,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
      },
    });

    if (!session.url) {
      await looseDb(supabase).from("appointment_payments").delete().eq("id", paymentId);
      return Response.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    const { error: updErr } = await looseDb(supabase)
      .from("appointment_payments")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("user_id", user.id);

    if (updErr) {
      await looseDb(supabase).from("appointment_payments").delete().eq("id", paymentId);
      return Response.json({ error: "Could not link Checkout session to payment." }, { status: 500 });
    }

    return Response.json({ checkout_url: session.url });
  } catch (e) {
    await looseDb(supabase).from("appointment_payments").delete().eq("id", paymentId);
    console.error("[stripe create-checkout-session]", e);
    return Response.json({ error: "Could not create Stripe Checkout session." }, { status: 502 });
  }
}

export async function GET() {
  return new Response(null, { status: 405 });
}
