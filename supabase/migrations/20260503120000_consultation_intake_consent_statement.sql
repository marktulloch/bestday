-- Separate consent statement from declaration on consultation intake.

ALTER TABLE public.consultation_intake_forms
  ADD COLUMN consent_statement_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN consent_statement_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.consultation_intake_forms.consent_statement_accepted IS
  'Patient consent to clinical intake processing; required before submission.';
