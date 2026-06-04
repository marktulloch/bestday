-- Profile 360: customer documents, customer notification read, doctor read on purchase orders / fulfilment

-- ---------------------------------------------------------------------------
-- Customer documents (metadata + links; files live in storage or Drive)
-- ---------------------------------------------------------------------------

CREATE TABLE public.customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'link',
  external_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  uploaded_by_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX customer_documents_customer_idx
  ON public.customer_documents (customer_id, created_at DESC);

ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_documents_select"
  ON public.customer_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = customer_documents.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customer_documents_insert_staff"
  ON public.customer_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
    AND uploaded_by_user_id = (SELECT auth.uid())
  );

CREATE POLICY "customer_documents_update_staff"
  ON public.customer_documents
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

CREATE POLICY "customer_documents_delete_staff"
  ON public.customer_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.customer_documents IS
  'Patient file references; Best Day DB is system of record. Binary content in Supabase Storage or external URLs.';

-- ---------------------------------------------------------------------------
-- Notifications: patients can read their own delivery log (summary in portal)
-- ---------------------------------------------------------------------------

CREATE POLICY "notifications_select_customer_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.user_id = (SELECT auth.uid())
        AND (
          notifications.user_id = (SELECT auth.uid())
          OR notifications.customer_id = c.id
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Doctors: read purchase orders / lines / fulfilment for clinical context
-- ---------------------------------------------------------------------------

CREATE POLICY "purchase_orders_select_doctor"
  ON public.purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'doctor'
    )
  );

CREATE POLICY "purchase_order_items_select_doctor"
  ON public.purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'doctor'
    )
  );

CREATE POLICY "purchase_order_fulfilment_select_doctor"
  ON public.purchase_order_fulfilment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'doctor'
    )
  );
