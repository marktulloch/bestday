-- Stripe Checkout tracking for paid consultation appointments.

CREATE TABLE public.appointment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  consultation_service_id UUID NOT NULL REFERENCES public.consultation_services (id) ON DELETE RESTRICT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NZD',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointment_payments_amount_cents_non_negative CHECK (amount_cents >= 0)
);

CREATE INDEX appointment_payments_user_created_idx
  ON public.appointment_payments (user_id, created_at DESC);

CREATE INDEX appointment_payments_stripe_session_idx
  ON public.appointment_payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON TABLE public.appointment_payments IS
  'Consultation prepayment via Stripe Checkout; updated by webhooks and staff tools.';

CREATE OR REPLACE FUNCTION public.set_appointment_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER appointment_payments_touch_updated_at
  BEFORE UPDATE ON public.appointment_payments
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_appointment_payments_updated_at();

ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_payments_select_own"
  ON public.appointment_payments
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "appointment_payments_select_staff"
  ON public.appointment_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "appointment_payments_insert_own"
  ON public.appointment_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "appointment_payments_update_own"
  ON public.appointment_payments
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
