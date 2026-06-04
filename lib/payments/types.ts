/** Future: Stripe PaymentIntent, etc. */
export type PaymentProviderId = "placeholder" | "stripe";

export type PaymentPrepareResult =
  | { ok: true; provider: PaymentProviderId; clientSecret?: string; deferred: boolean }
  | { ok: false; message: string };

export type PaymentCaptureResult =
  | { ok: true; reference: string; provider: PaymentProviderId }
  | { ok: false; message: string };
