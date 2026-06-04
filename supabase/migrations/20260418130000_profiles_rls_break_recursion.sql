-- Break RLS recursion on public.profiles: policies that used
--   EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() ...)
-- re-enter profiles RLS and can raise "infinite recursion detected in policy for relation profiles",
-- which surfaces to the app as a PostgREST error (account-incomplete?reason=db_error).

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
  'Returns app_role for auth.uid() without triggering profiles RLS (avoids recursive policy checks).';

-- Replace self-referential SELECT policies with one policy using the helper.
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_doctor_for_customers" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.app_requester_role() IN ('master', 'admin')
    OR (
      public.app_requester_role() = 'doctor'
      AND EXISTS (
        SELECT 1
        FROM public.customers AS c
        WHERE c.user_id = public.profiles.id
      )
    )
  );

-- Master updates: avoid EXISTS (SELECT FROM profiles) in USING.
DROP POLICY IF EXISTS "profiles_master_update" ON public.profiles;

CREATE POLICY "profiles_master_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.app_requester_role() = 'master')
  WITH CHECK (true);
