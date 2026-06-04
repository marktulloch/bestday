-- Medicinal cannabis prescreening + patient profile + consultation intake (Best Day Telehealth).
-- Eligibility on prescreening_responses is enforced in a trigger (clients cannot override).

-- ---------------------------------------------------------------------------
-- prescreening_responses
-- ---------------------------------------------------------------------------

CREATE TABLE public.prescreening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  age_20_or_above BOOLEAN NOT NULL,
  previously_attempted_treatment BOOLEAN NOT NULL,
  pregnant_breastfeeding_or_trying BOOLEAN NOT NULL,
  allergic_cannabinoids_coconut_salicylates BOOLEAN NOT NULL,
  psychosis_schizophrenia_bipolar_history BOOLEAN NOT NULL,
  contraindicated_medications TEXT[] NOT NULL DEFAULT '{}'::text[],
  eligible BOOLEAN NOT NULL DEFAULT false,
  ineligible_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prescreening_responses_user_id_idx ON public.prescreening_responses (user_id);
CREATE INDEX prescreening_responses_created_at_idx ON public.prescreening_responses (created_at DESC);

COMMENT ON TABLE public.prescreening_responses IS
  'Structured MC prescreen answers; eligible/ineligible_reason set by trigger from clinical rules.';

CREATE OR REPLACE FUNCTION public.apply_prescreening_response_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  med TEXT;
  has_forbidden BOOLEAN := false;
BEGIN
  NEW.contraindicated_medications := coalesce(NEW.contraindicated_medications, '{}'::text[]);

  FOREACH med IN ARRAY NEW.contraindicated_medications
  LOOP
    IF lower(trim(med)) IN (
      'clozapine',
      'risperidone',
      'olanzapine',
      'haloperidol',
      'quetiapine_over_50mg'
    ) THEN
      has_forbidden := true;
      EXIT;
    END IF;
  END LOOP;

  NEW.ineligible_reason := NULL;

  IF NOT NEW.age_20_or_above THEN
    NEW.ineligible_reason := 'age_under_20';
  ELSIF NEW.pregnant_breastfeeding_or_trying THEN
    NEW.ineligible_reason := 'pregnant_breastfeeding_or_trying';
  ELSIF NEW.allergic_cannabinoids_coconut_salicylates THEN
    NEW.ineligible_reason := 'allergic_cannabinoids_coconut_salicylates';
  ELSIF NEW.psychosis_schizophrenia_bipolar_history THEN
    NEW.ineligible_reason := 'psychosis_schizophrenia_bipolar_history';
  ELSIF has_forbidden THEN
    NEW.ineligible_reason := 'contraindicated_medication';
  END IF;

  NEW.eligible := NEW.ineligible_reason IS NULL AND NEW.age_20_or_above;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prescreening_responses_set_eligibility
  BEFORE INSERT OR UPDATE
  ON public.prescreening_responses
  FOR EACH ROW
  EXECUTE PROCEDURE public.apply_prescreening_response_eligibility();

ALTER TABLE public.prescreening_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescreening_responses_select_own_or_admin"
  ON public.prescreening_responses
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "prescreening_responses_insert_own"
  ON public.prescreening_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "prescreening_responses_update_own"
  ON public.prescreening_responses
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- patient_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  preferred_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_policy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT patient_profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX patient_profiles_user_id_idx ON public.patient_profiles (user_id);

COMMENT ON TABLE public.patient_profiles IS
  'Registered patient demographics and consent timestamps; one row per auth user.';

CREATE OR REPLACE FUNCTION public.set_patient_profiles_updated_at()
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

CREATE TRIGGER patient_profiles_touch_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_patient_profiles_updated_at();

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_profiles_select_own_or_admin"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "patient_profiles_insert_own"
  ON public.patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "patient_profiles_update_own"
  ON public.patient_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- consultation_intake_forms
-- ---------------------------------------------------------------------------

CREATE TABLE public.consultation_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  nhi_number TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  gp_name TEXT NOT NULL,
  gp_practice_name TEXT NOT NULL,
  gp_practice_email TEXT NOT NULL,
  gp_practice_phone TEXT NOT NULL,
  primary_reason TEXT NOT NULL,
  symptom_duration TEXT NOT NULL,
  severity_score INTEGER,
  treatment_goals TEXT NOT NULL,
  previous_unsuccessful_medications TEXT,
  medical_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  medication_screening JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_allergies TEXT,
  current_medications_supplements TEXT,
  occupation_risks JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_cannabis_use BOOLEAN,
  previous_cannabis_details TEXT,
  declaration_accepted BOOLEAN NOT NULL DEFAULT false,
  declaration_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consultation_intake_forms_severity_score_range
    CHECK (severity_score IS NULL OR (severity_score >= 0 AND severity_score <= 10))
);

CREATE INDEX consultation_intake_forms_user_id_idx ON public.consultation_intake_forms (user_id);
CREATE INDEX consultation_intake_forms_created_at_idx ON public.consultation_intake_forms (created_at DESC);

COMMENT ON TABLE public.consultation_intake_forms IS
  'Clinical consultation intake (GP details, symptoms, meds, declarations).';

CREATE OR REPLACE FUNCTION public.set_consultation_intake_forms_updated_at()
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

CREATE TRIGGER consultation_intake_forms_touch_updated_at
  BEFORE UPDATE ON public.consultation_intake_forms
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_consultation_intake_forms_updated_at();

ALTER TABLE public.consultation_intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_intake_forms_select_own_or_admin"
  ON public.consultation_intake_forms
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "consultation_intake_forms_insert_own"
  ON public.consultation_intake_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "consultation_intake_forms_update_own"
  ON public.consultation_intake_forms
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
