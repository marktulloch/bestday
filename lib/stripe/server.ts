import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Stripe SDK instance; reads `STRIPE_SECRET_KEY` from the environment (never hardcoded). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, { typescript: true });
  }
  return stripeClient;
}
