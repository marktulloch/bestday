-- Prescreen outcomes, anonymous leads, support tickets from prescreens

-- ---------------------------------------------------------------------------
-- Leads: allow anonymous pre-screen (email optional)
-- ---------------------------------------------------------------------------

ALTER TABLE public.leads
  ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX leads_email_lower_unique
  ON public.leads (lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN public.leads.email IS 'Nullable for anonymous prescreen; unique when present (case-insensitive).';

-- ---------------------------------------------------------------------------
-- Prescreen eligibility: booking-ready outcome
-- ---------------------------------------------------------------------------

ALTER TYPE public.prescreen_eligibility ADD VALUE IF NOT EXISTS 'eligible_for_booking';

-- ---------------------------------------------------------------------------
-- Tickets (cases) — created from prescreen for admin triage
-- ---------------------------------------------------------------------------

CREATE TYPE public.ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');

CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescreen_id UUID REFERENCES public.prescreens (id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads (id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tickets_prescreen_idx ON public.tickets (prescreen_id);
CREATE INDEX tickets_lead_idx ON public.tickets (lead_id);
CREATE INDEX tickets_status_idx ON public.tickets (status);
CREATE INDEX tickets_created_idx ON public.tickets (created_at DESC);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_customer_or_staff"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = public.tickets.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

COMMENT ON TABLE public.tickets IS 'Support / triage cases; prescreen submissions auto-create rows via service role.';
