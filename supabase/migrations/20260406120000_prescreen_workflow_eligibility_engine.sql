-- Eligibility engine: workflow status, reason codes, internal decision log, admin summary.
-- Replaces legacy prescreen_eligibility enum on prescreens.

-- ---------------------------------------------------------------------------
-- New workflow / eligibility status
-- ---------------------------------------------------------------------------

CREATE TYPE public.prescreen_workflow_status AS ENUM (
  'draft',
  'submitted',
  'eligible_for_booking',
  'needs_manual_review',
  'ineligible'
);

ALTER TABLE public.prescreens
  ADD COLUMN workflow_status public.prescreen_workflow_status,
  ADD COLUMN decision_reason_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN decision_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN decision_summary_admin TEXT;

COMMENT ON COLUMN public.prescreens.workflow_status IS
  'Lifecycle: draft (partial), submitted (optional manual use), then terminal outcomes from rules engine.';

COMMENT ON COLUMN public.prescreens.decision_reason_codes IS
  'Stable machine reason codes from the eligibility engine (staff/analytics).';

COMMENT ON COLUMN public.prescreens.decision_log IS
  'Ordered rule outcomes with messages; staff-only detail in product UI.';

COMMENT ON COLUMN public.prescreens.decision_summary_admin IS
  'Single-line triage summary for admin/doctor dashboards.';

-- ---------------------------------------------------------------------------
-- Backfill from legacy eligibility column
-- ---------------------------------------------------------------------------

UPDATE public.prescreens
SET workflow_status = CASE eligibility::text
  WHEN 'pending' THEN 'draft'::public.prescreen_workflow_status
  WHEN 'eligible' THEN 'eligible_for_booking'::public.prescreen_workflow_status
  WHEN 'eligible_for_booking' THEN 'eligible_for_booking'::public.prescreen_workflow_status
  WHEN 'ineligible' THEN 'ineligible'::public.prescreen_workflow_status
  WHEN 'needs_review' THEN 'needs_manual_review'::public.prescreen_workflow_status
  ELSE 'draft'::public.prescreen_workflow_status
END;

ALTER TABLE public.prescreens
  ALTER COLUMN workflow_status SET NOT NULL,
  ALTER COLUMN workflow_status SET DEFAULT 'draft'::public.prescreen_workflow_status;

ALTER TABLE public.prescreens
  DROP COLUMN eligibility;

DROP TYPE public.prescreen_eligibility;
