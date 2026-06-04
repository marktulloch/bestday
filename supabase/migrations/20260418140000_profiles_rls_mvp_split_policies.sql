-- MVP-safe profiles RLS: split permissive SELECT policies so "read own row" never touches
-- other tables or recursive profile scans. Staff/doctor rules use SECURITY DEFINER helpers only.
--
-- Root issues addressed:
-- 1) Original policies used EXISTS (SELECT ... FROM profiles ...) on profiles → infinite recursion.
-- 2) Single combined OR policy could still evaluate doctor branch involving EXISTS on customers;
--    customers RLS references profiles again → recursion while resolving profile visibility.
-- 3) role_assignments_select_staff used EXISTS (SELECT ... FROM profiles) → same risk when combined
--    with strict profile policies.

CREATE OR REPLACE FUNCTION public.app_requester_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.app_requester_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_requester_role() TO authenticated;

COMMENT ON FUNCTION public.app_requester_role() IS
  'Caller''s app_role from profiles; SECURITY DEFINER read bypasses RLS (no recursion).';

-- True if this user_id has a portal customer row (patient). Used so doctors can read patient
-- profiles without a customers-table subquery under customers RLS (which references profiles).
CREATE OR REPLACE FUNCTION public.profile_user_has_customer(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers AS c
    WHERE c.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.profile_user_has_customer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_user_has_customer(uuid) TO authenticated;

COMMENT ON FUNCTION public.profile_user_has_customer(uuid) IS
  'RLS helper: whether p_user_id has a customers row; bypasses customers RLS.';

-- ---------------------------------------------------------------------------
-- profiles: drop every historical policy name, then minimal set
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_doctor_for_customers" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_master_update" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_select_staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.app_requester_role() IN ('master', 'admin'));

CREATE POLICY "profiles_select_doctor_if_patient"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.app_requester_role() = 'doctor'
    AND public.profile_user_has_customer(id)
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_master"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.app_requester_role() = 'master')
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- role_assignments: staff read without querying profiles inside the policy
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "role_assignments_select_staff" ON public.role_assignments;

CREATE POLICY "role_assignments_select_staff"
  ON public.role_assignments
  FOR SELECT
  TO authenticated
  USING (public.app_requester_role() IN ('master', 'admin'));
