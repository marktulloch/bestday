-- Align prescreening_responses SELECT with prescreens: doctors may read patient questionnaires.

DROP POLICY IF EXISTS "prescreening_responses_select_own_or_admin" ON public.prescreening_responses;

CREATE POLICY "prescreening_responses_select_own_or_staff"
  ON public.prescreening_responses
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
