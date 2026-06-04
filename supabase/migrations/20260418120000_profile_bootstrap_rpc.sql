-- Allow authenticated users to create their own missing `profiles` row (same as signup trigger).
-- Fixes users created before `handle_new_user` existed, without using the service role in the browser.

CREATE OR REPLACE FUNCTION public.ensure_own_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  SELECT u.id, u.email, 'customer'::public.app_role
  FROM auth.users AS u
  WHERE u.id = (SELECT auth.uid())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_own_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_own_profile() TO authenticated;

COMMENT ON FUNCTION public.ensure_own_profile() IS
  'Idempotent: inserts public.profiles for auth.uid() when missing. Does not elevate roles.';
