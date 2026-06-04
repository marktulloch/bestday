-- Foundation: customers, leads, prescreens, role_assignments, RLS refinements
-- Apply after 20260403120000_phase1_profiles_audit.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'converted', 'closed');

CREATE TYPE public.customer_status AS ENUM ('draft', 'active', 'archived');

CREATE TYPE public.prescreen_eligibility AS ENUM (
  'pending',
  'eligible',
  'ineligible',
  'needs_review'
);

-- ---------------------------------------------------------------------------
-- Role assignment history (canonical role remains on profiles for fast RLS)
-- ---------------------------------------------------------------------------

CREATE TABLE public.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  reason TEXT
);

CREATE INDEX role_assignments_user_idx ON public.role_assignments (user_id, granted_at DESC);

ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_assignments_select_staff"
  ON public.role_assignments
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

COMMENT ON TABLE public.role_assignments IS
  'History of role grants; use set_user_role() for audited changes. Inserts via service role or SECURITY DEFINER only.';

-- ---------------------------------------------------------------------------
-- Customers (registered patients; 1:1 with auth user for portal accounts)
-- ---------------------------------------------------------------------------

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  status public.customer_status NOT NULL DEFAULT 'active',
  phone TEXT,
  region TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX customers_status_idx ON public.customers (status);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own_or_clinical_staff"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customers_update_own"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "customers_staff_update"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.customers IS 'NZ telehealth patient record linked to auth user.';

-- ---------------------------------------------------------------------------
-- Leads (pre-account funnel)
-- ---------------------------------------------------------------------------

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status public.lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  converted_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  converted_customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_email_idx ON public.leads (email);
CREATE INDEX leads_status_idx ON public.leads (status);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_mutate_admin"
  ON public.leads
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

COMMENT ON TABLE public.leads IS 'Marketing / prescreen leads. Anonymous capture uses service-role server actions.';

-- ---------------------------------------------------------------------------
-- Prescreens (structured questionnaire submissions)
-- ---------------------------------------------------------------------------

CREATE TABLE public.prescreens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads (id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  eligibility public.prescreen_eligibility NOT NULL DEFAULT 'pending',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prescreens_lead_idx ON public.prescreens (lead_id);
CREATE INDEX prescreens_user_idx ON public.prescreens (user_id);
CREATE INDEX prescreens_created_idx ON public.prescreens (created_at DESC);

ALTER TABLE public.prescreens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescreens_select_own_or_staff"
  ON public.prescreens
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "prescreens_insert_linked_user"
  ON public.prescreens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.prescreens IS 'Prescreen answers; public flows insert via service role with optional lead_id.';

-- ---------------------------------------------------------------------------
-- Auto-create customer row when a profile is created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_customer_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_create_customer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.ensure_customer_for_profile();

-- ---------------------------------------------------------------------------
-- Audited role changes (master only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id UUID,
  new_role public.app_role,
  change_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  granter_id UUID := auth.uid();
BEGIN
  IF granter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = granter_id AND role = 'master'
  ) THEN
    RAISE EXCEPTION 'Only master may assign roles';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user has no profile';
  END IF;

  INSERT INTO public.role_assignments (user_id, role, granted_by, reason)
  VALUES (target_user_id, new_role, granter_id, change_reason);

  UPDATE public.profiles
  SET role = new_role,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Backfill role_assignments for existing profiles (bootstrap history)
-- ---------------------------------------------------------------------------

INSERT INTO public.role_assignments (user_id, role, granted_by, reason)
SELECT
  p.id,
  p.role,
  p.id,
  'migration_backfill'
FROM public.profiles AS p
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_assignments ra WHERE ra.user_id = p.id
);

-- ---------------------------------------------------------------------------
-- Profiles RLS: replace select policy (doctors: profiles tied to a customer)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.profiles AS me
        WHERE me.id = (SELECT auth.uid()) AND me.role = 'doctor'
      )
      AND EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.user_id = public.profiles.id
      )
    )
  );

CREATE POLICY "profiles_master_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'master'
    )
  )
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Backfill customers for profiles created before this migration
-- ---------------------------------------------------------------------------

INSERT INTO public.customers (user_id)
SELECT p.id
FROM public.profiles AS p
ON CONFLICT (user_id) DO NOTHING;
