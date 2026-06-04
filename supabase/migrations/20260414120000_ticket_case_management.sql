-- Case management: ticket workflow, categories, assignment, threaded comments (internal vs external).

-- ---------------------------------------------------------------------------
-- Replace legacy ticket_status enum (open/pending/resolved/closed) with workflow states
-- ---------------------------------------------------------------------------

ALTER TABLE public.tickets ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.tickets
  ALTER COLUMN status TYPE text USING (status::text);

UPDATE public.tickets
SET status = CASE status
  WHEN 'open' THEN 'new'
  WHEN 'pending' THEN 'in_progress'
  ELSE status
END;

DROP TYPE public.ticket_status;

CREATE TYPE public.ticket_status AS ENUM (
  'new',
  'in_progress',
  'waiting_on_customer',
  'waiting_on_doctor',
  'resolved',
  'closed'
);

ALTER TABLE public.tickets
  ALTER COLUMN status TYPE public.ticket_status USING (status::public.ticket_status);

ALTER TABLE public.tickets
  ALTER COLUMN status SET DEFAULT 'new'::public.ticket_status;

-- ---------------------------------------------------------------------------
-- Category, assignment, purchase order link
-- ---------------------------------------------------------------------------

CREATE TYPE public.ticket_category AS ENUM (
  'prescreen_case',
  'booking_support',
  'doctor_followup',
  'order_issue',
  'delivery_issue',
  'customer_support',
  'compliance_review'
);

ALTER TABLE public.tickets
  ADD COLUMN category public.ticket_category NOT NULL DEFAULT 'prescreen_case';

UPDATE public.tickets
SET category = 'prescreen_case'
WHERE metadata->>'source' = 'prescreen_auto' OR prescreen_id IS NOT NULL;

ALTER TABLE public.tickets
  ADD COLUMN assigned_to_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD COLUMN purchase_order_id UUID REFERENCES public.purchase_orders (id) ON DELETE SET NULL;

-- One case per prescreen; multiple customer tickets may have prescreen_id NULL (NULLs do not conflict).
CREATE UNIQUE INDEX tickets_prescreen_id_unique ON public.tickets (prescreen_id);

CREATE INDEX tickets_assigned_to_user_idx ON public.tickets (assigned_to_user_id);
CREATE INDEX tickets_category_idx ON public.tickets (category);
CREATE INDEX tickets_customer_status_idx ON public.tickets (customer_id, status, updated_at DESC);
CREATE INDEX tickets_purchase_order_idx ON public.tickets (purchase_order_id);

-- ---------------------------------------------------------------------------
-- Comments: internal (staff-only) vs external (visible to customer)
-- ---------------------------------------------------------------------------

CREATE TYPE public.ticket_comment_visibility AS ENUM ('internal', 'external');

CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility public.ticket_comment_visibility NOT NULL DEFAULT 'external',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ticket_comments_body_nonempty CHECK (length(trim(body)) > 0)
);

CREATE INDEX ticket_comments_ticket_created_idx
  ON public.ticket_comments (ticket_id, created_at ASC);

COMMENT ON TABLE public.ticket_comments IS
  'Thread messages; visibility=internal is never shown to customers (RLS + app).';

-- Bump parent ticket updated_at when a comment is added (definer bypasses RLS on tickets).
CREATE OR REPLACE FUNCTION public.ticket_comment_touch_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_comment_touch
  AFTER INSERT ON public.ticket_comments
  FOR EACH ROW
  EXECUTE PROCEDURE public.ticket_comment_touch_parent();

-- ---------------------------------------------------------------------------
-- RLS: tickets
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "tickets_select_customer_or_staff" ON public.tickets;

CREATE POLICY "tickets_select_customer"
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
  );

CREATE POLICY "tickets_select_staff"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "tickets_insert_customer"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'customer'
    )
    AND customer_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = public.tickets.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND category IN (
      'booking_support'::public.ticket_category,
      'order_issue'::public.ticket_category,
      'delivery_issue'::public.ticket_category,
      'customer_support'::public.ticket_category
    )
    AND prescreen_id IS NULL
    AND lead_id IS NULL
  );

CREATE POLICY "tickets_insert_staff"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "tickets_update_staff"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: ticket_comments
-- ---------------------------------------------------------------------------

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_comments_select_customer"
  ON public.ticket_comments
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'external'::public.ticket_comment_visibility
    AND EXISTS (
      SELECT 1
      FROM public.tickets t
      JOIN public.customers c ON c.id = t.customer_id
      WHERE t.id = public.ticket_comments.ticket_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ticket_comments_select_staff"
  ON public.ticket_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
    AND EXISTS (
      SELECT 1 FROM public.tickets t WHERE t.id = public.ticket_comments.ticket_id
    )
  );

CREATE POLICY "ticket_comments_insert_customer"
  ON public.ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    visibility = 'external'::public.ticket_comment_visibility
    AND author_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'customer'
    )
    AND EXISTS (
      SELECT 1
      FROM public.tickets t
      JOIN public.customers c ON c.id = t.customer_id
      WHERE t.id = public.ticket_comments.ticket_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ticket_comments_insert_staff"
  ON public.ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
    AND EXISTS (
      SELECT 1 FROM public.tickets t WHERE t.id = public.ticket_comments.ticket_id
    )
  );

COMMENT ON TABLE public.tickets IS
  'Support and clinical ops cases; prescreen auto-creates prescreen_case; patients create limited categories.';
