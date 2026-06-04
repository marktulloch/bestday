-- Stripe webhook idempotency (one row per Stripe event.id).
-- Patient profile marker when consultation prepayment completes.

CREATE TABLE public.stripe_processed_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_processed_webhook_events IS
  'Append-only Stripe webhook delivery log; prevents duplicate application of the same event.';

ALTER TABLE public.stripe_processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (webhook) touches this table.

ALTER TABLE public.patient_profiles
  ADD COLUMN consultation_appointment_payment_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.patient_profiles.consultation_appointment_payment_completed_at IS
  'Set when a matching consultation appointment prepayment succeeds (Stripe webhook).';

CREATE UNIQUE INDEX appointment_payments_stripe_checkout_session_unique
  ON public.appointment_payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
