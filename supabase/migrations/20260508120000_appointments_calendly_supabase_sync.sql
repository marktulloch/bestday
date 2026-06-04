-- Calendly → Supabase: appointments as dashboard source of truth (schema + RLS)

-- New Calendly / invitee fields
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS calendly_event_type_uri text,
  ADD COLUMN IF NOT EXISTS calendly_event_type_name text,
  ADD COLUMN IF NOT EXISTS invitee_email text,
  ADD COLUMN IF NOT EXISTS invitee_name text,
  ADD COLUMN IF NOT EXISTS location_type text,
  ADD COLUMN IF NOT EXISTS location_join_url text,
  ADD COLUMN IF NOT EXISTS rescheduled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rescheduled_from_uri text,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Backfill invitee_email before NOT NULL
UPDATE public.appointments a
SET invitee_email = lower(trim(p.email))
FROM public.profiles p
WHERE a.user_id IS NOT NULL
  AND a.user_id = p.id
  AND p.email IS NOT NULL
  AND (a.invitee_email IS NULL OR trim(a.invitee_email) = '');

UPDATE public.appointments
SET invitee_email = lower(trim((calendly_metadata)::jsonb->'payload'->>'email'))
WHERE (invitee_email IS NULL OR trim(invitee_email) = '')
  AND nullif(trim((calendly_metadata)::jsonb->'payload'->>'email'), '') IS NOT NULL;

UPDATE public.appointments
SET invitee_email = 'unlinked@calendly.placeholder'
WHERE invitee_email IS NULL OR trim(invitee_email) = '';

ALTER TABLE public.appointments
  ALTER COLUMN invitee_email SET NOT NULL;

-- Rename columns to match Calendly sync contract
ALTER TABLE public.appointments RENAME COLUMN scheduled_start TO start_time;
ALTER TABLE public.appointments RENAME COLUMN scheduled_end TO end_time;
ALTER TABLE public.appointments RENAME COLUMN calendly_metadata TO raw_payload;

-- Allow cancel-only webhook rows without a scheduled time
ALTER TABLE public.appointments ALTER COLUMN start_time DROP NOT NULL;

-- Status: text with "scheduled" as default (replace enum)
ALTER TABLE public.appointments ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.appointments
  ALTER COLUMN status TYPE text
  USING (
    CASE status::text
      WHEN 'pending' THEN 'scheduled'
      WHEN 'booked' THEN 'scheduled'
      ELSE status::text
    END
  );

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'scheduled';

DROP TYPE IF EXISTS public.appointment_status;

-- Drop per-event URI uniqueness so multiple invitees can share a pooled link pattern when needed
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_calendly_event_uri_key;

-- Recreate invitee URI as the webhook upsert key (PostgreSQL allows multiple NULLs in UNIQUE columns)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_calendly_invitee_uri_key;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_calendly_invitee_uri_key UNIQUE (calendly_invitee_uri);

-- user_id: cascade delete with auth user
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Extra lookup indexes (user/status/start already indexed from initial migration)
CREATE INDEX IF NOT EXISTS appointments_invitee_email_idx ON public.appointments (invitee_email);
CREATE INDEX IF NOT EXISTS appointments_calendly_event_uri_idx ON public.appointments (calendly_event_uri);

-- RLS: customers read own rows only; staff read via role; writes via service role only
DROP POLICY IF EXISTS "appointments_select_customer_or_staff" ON public.appointments;

CREATE POLICY "appointments_select_own_user"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "appointments_select_staff"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

COMMENT ON COLUMN public.appointments.invitee_email IS
  'Invitee email from Calendly (lowercased at ingest).';

COMMENT ON COLUMN public.appointments.raw_payload IS
  'Sanitized Calendly webhook payload JSON (never log clinical questionnaire content here).';
