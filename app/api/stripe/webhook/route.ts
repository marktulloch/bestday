import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import {
  claimStripeWebhookEvent,
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handlePaymentIntentPaymentFailed,
  handlePaymentIntentSucceeded,
  releaseStripeWebhookEventClaim,
} from "@/lib/stripe/webhook-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhooks: verifies `STRIPE_WEBHOOK_SECRET`, processes at most once per `event.id`
 * (see `stripe_processed_webhook_events`).
 */
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return Response.json({ error: "STRIPE_SECRET_KEY is not configured." }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { claimed } = await claimStripeWebhookEvent(admin, event);
  if (!claimed) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(admin, event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(admin, event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentPaymentFailed(admin, event.data.object as Stripe.PaymentIntent);
        break;
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(admin, event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (e) {
    await releaseStripeWebhookEventClaim(admin, event.id);
    console.error("[stripe webhook]", event.type, e);
    return Response.json({ error: "handler_failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

export async function GET() {
  return new Response(null, { status: 405 });
}
