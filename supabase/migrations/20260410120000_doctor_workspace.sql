-- Doctor workspace: assignments, consultation notes, recommendations, product orders
-- Audit continues via application → audit_logs (service role).

-- ---------------------------------------------------------------------------
-- Doctors can read profiles of users who have a customer record (patient context)
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_doctor_for_customers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role = 'doctor'
    )
    AND EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.user_id = public.profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- Doctor ↔ patient assignment (optional "my patients" list)
-- ---------------------------------------------------------------------------

CREATE TABLE public.doctor_patient_assignments (
  doctor_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (doctor_user_id, customer_id)
);

CREATE INDEX doctor_patient_assignments_customer_idx ON public.doctor_patient_assignments (customer_id);

ALTER TABLE public.doctor_patient_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_assign_select"
  ON public.doctor_patient_assignments
  FOR SELECT
  TO authenticated
  USING (
    doctor_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "doctor_assign_insert"
  ON public.doctor_patient_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      doctor_user_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.profiles me
        WHERE me.id = (SELECT auth.uid()) AND me.role IN ('doctor', 'master', 'admin')
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "doctor_assign_delete"
  ON public.doctor_patient_assignments
  FOR DELETE
  TO authenticated
  USING (
    doctor_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.doctor_patient_assignments IS
  'Optional "my patients" list; all customers remain visible to clinical staff under customers RLS.';

-- ---------------------------------------------------------------------------
-- Consultation notes
-- ---------------------------------------------------------------------------

CREATE TABLE public.consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments (id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX consultation_notes_customer_idx ON public.consultation_notes (customer_id, created_at DESC);

ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_notes_select_clinical"
  ON public.consultation_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "consultation_notes_insert_clinical"
  ON public.consultation_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

-- ---------------------------------------------------------------------------
-- Treatment recommendations / outcomes
-- ---------------------------------------------------------------------------

CREATE TYPE public.consultation_recommendation_outcome AS ENUM (
  'follow_up',
  'monitoring',
  'refer_external',
  'care_complete',
  'other'
);

CREATE TABLE public.consultation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  outcome public.consultation_recommendation_outcome NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX consultation_recommendations_customer_idx
  ON public.consultation_recommendations (customer_id, created_at DESC);

ALTER TABLE public.consultation_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_recommendations_select_clinical"
  ON public.consultation_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "consultation_recommendations_insert_clinical"
  ON public.consultation_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

-- ---------------------------------------------------------------------------
-- Product / order lines (doctor approval workflow)
-- ---------------------------------------------------------------------------

CREATE TYPE public.customer_order_status AS ENUM (
  'pending_review',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TABLE public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  status public.customer_order_status NOT NULL DEFAULT 'pending_review',
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_by_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX customer_orders_customer_idx ON public.customer_orders (customer_id, created_at DESC);
CREATE INDEX customer_orders_status_idx ON public.customer_orders (status);

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_orders_select_clinical"
  ON public.customer_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customer_orders_insert_clinical"
  ON public.customer_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customer_orders_update_clinical"
  ON public.customer_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

COMMENT ON TABLE public.customer_orders IS
  'Product lines pending doctor approval; portal can surface approved items later.';
