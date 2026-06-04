-- Consultation appointment types (service catalogue) + patient selection for booking/payment.

CREATE TABLE public.consultation_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NZD',
  active BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consultation_services_price_cents_non_negative CHECK (price_cents >= 0)
);

CREATE INDEX consultation_services_active_idx
  ON public.consultation_services (active, name)
  WHERE active = true;

COMMENT ON TABLE public.consultation_services IS
  'Bookable consultation types; Stripe IDs optional until products exist in Stripe.';

ALTER TABLE public.consultation_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_services_select_active_public"
  ON public.consultation_services
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "consultation_services_select_all_staff"
  ON public.consultation_services
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

CREATE POLICY "consultation_services_mutate_staff"
  ON public.consultation_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

-- Persist chosen service on the patient profile (one active choice for checkout/booking flows).
ALTER TABLE public.patient_profiles
  ADD COLUMN selected_consultation_service_id UUID REFERENCES public.consultation_services (id) ON DELETE SET NULL;

CREATE INDEX patient_profiles_selected_service_idx
  ON public.patient_profiles (selected_consultation_service_id)
  WHERE selected_consultation_service_id IS NOT NULL;

COMMENT ON COLUMN public.patient_profiles.selected_consultation_service_id IS
  'Patient-selected consultation service for payment/booking; must pass server-side gates.';

-- Seed catalogue (Stripe IDs added later).
INSERT INTO public.consultation_services (name, description, price_cents, currency, active)
VALUES
  ('Initial Consultation', NULL, 4900, 'NZD', true),
  ('Follow Up Consultation', NULL, 4900, 'NZD', true),
  ('Existing Medical Cannabis Patient Consultation', NULL, 4900, 'NZD', true),
  ('Senior Concession Consultation', NULL, 4900, 'NZD', true);
