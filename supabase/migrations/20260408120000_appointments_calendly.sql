-- Appointments (Calendly as scheduling UI; this table is system of record)

CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'booked',
  'rescheduled',
  'cancelled',
  'completed',
  'no_show'
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  prescreen_id UUID REFERENCES public.prescreens (id) ON DELETE SET NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  timezone TEXT,
  calendly_event_uri TEXT,
  calendly_invitee_uri TEXT,
  google_calendar_event_id TEXT,
  calendly_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'calendly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_calendly_event_uri_key UNIQUE (calendly_event_uri),
  CONSTRAINT appointments_calendly_invitee_uri_key UNIQUE (calendly_invitee_uri)
);

CREATE INDEX appointments_customer_idx ON public.appointments (customer_id);
CREATE INDEX appointments_user_idx ON public.appointments (user_id);
CREATE INDEX appointments_start_idx ON public.appointments (scheduled_start DESC);
CREATE INDEX appointments_status_idx ON public.appointments (status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_customer_or_staff"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = public.appointments.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

COMMENT ON TABLE public.appointments IS
  'Consultation bookings; populated primarily via Calendly webhooks (service role).';

COMMENT ON COLUMN public.appointments.google_calendar_event_id IS
  'External calendar event reference when Calendly exposes it (e.g. Google Meet / Calendar).';
