-- Patient purchase orders (separate from clinical customer_orders / product lines).
-- Draft order acts as cart; one draft per customer.

CREATE TYPE public.purchase_order_status AS ENUM (
  'draft',
  'awaiting_payment',
  'paid',
  'awaiting_fulfilment',
  'packed',
  'dispatched',
  'delivered',
  'cancelled'
);

-- Mirrors portal product access: active product + eligible and/or approved for this customer.
CREATE OR REPLACE FUNCTION public.customer_can_order_product(p_customer_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = p_product_id
      AND p.catalogue_status = 'active'
      AND p.portal_visibility <> 'none'::public.product_portal_visibility
      AND (
        (
          p.portal_visibility IN (
            'eligible_only'::public.product_portal_visibility,
            'eligible_or_approved'::public.product_portal_visibility
          )
          AND EXISTS (
            SELECT 1
            FROM public.customers c
            JOIN public.prescreens ps ON ps.user_id = c.user_id
            WHERE c.id = p_customer_id
              AND ps.workflow_status = 'eligible_for_booking'::public.prescreen_workflow_status
          )
        )
        OR (
          p.portal_visibility IN (
            'approved_only'::public.product_portal_visibility,
            'eligible_or_approved'::public.product_portal_visibility
          )
          AND EXISTS (
            SELECT 1
            FROM public.customer_product_approvals a
            WHERE a.customer_id = p_customer_id
              AND a.product_id = p_product_id
              AND a.status = 'approved'::public.customer_product_approval_status
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.customer_can_order_product(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_can_order_product(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.customer_can_order_product(uuid, uuid) IS
  'Whether this customer may add the product to a draft purchase order (same rules as portal catalogue).';

CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  status public.purchase_order_status NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'NZD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  delivery_recipient_name TEXT,
  delivery_line1 TEXT,
  delivery_line2 TEXT,
  delivery_city TEXT,
  delivery_region TEXT,
  delivery_postal_code TEXT,
  delivery_country TEXT NOT NULL DEFAULT 'NZ',
  payment_provider TEXT NOT NULL DEFAULT 'placeholder',
  payment_reference TEXT,
  payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  placed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_orders_totals_non_negative CHECK (subtotal_cents >= 0 AND total_cents >= 0)
);

CREATE UNIQUE INDEX purchase_orders_one_draft_per_customer
  ON public.purchase_orders (customer_id)
  WHERE status = 'draft'::public.purchase_order_status;

CREATE INDEX purchase_orders_customer_status_idx
  ON public.purchase_orders (customer_id, status, created_at DESC);

CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_order_items_qty_positive CHECK (quantity > 0),
  CONSTRAINT purchase_order_items_prices_non_negative CHECK (unit_price_cents >= 0 AND line_total_cents >= 0),
  UNIQUE (purchase_order_id, product_id)
);

CREATE INDEX purchase_order_items_order_idx ON public.purchase_order_items (purchase_order_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Orders: customers see own; admin/master see all
CREATE POLICY "purchase_orders_select_customer"
  ON public.purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "purchase_orders_select_admin"
  ON public.purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "purchase_orders_insert_customer"
  ON public.purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'customer'
    )
    AND EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'draft'::public.purchase_order_status
  );

CREATE POLICY "purchase_orders_update_customer_draft"
  ON public.purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'draft'::public.purchase_order_status
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'draft'::public.purchase_order_status
  );

CREATE POLICY "purchase_orders_customer_submit_draft"
  ON public.purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'draft'::public.purchase_order_status
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'awaiting_payment'::public.purchase_order_status
  );

CREATE POLICY "purchase_orders_customer_pay_placeholder"
  ON public.purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'awaiting_payment'::public.purchase_order_status
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'paid'::public.purchase_order_status
  );

CREATE POLICY "purchase_orders_customer_cancel_awaiting"
  ON public.purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'awaiting_payment'::public.purchase_order_status
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'cancelled'::public.purchase_order_status
  );

CREATE POLICY "purchase_orders_update_admin"
  ON public.purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "purchase_orders_delete_customer_draft"
  ON public.purchase_orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = purchase_orders.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    AND status = 'draft'::public.purchase_order_status
  );

-- Line items
CREATE POLICY "purchase_order_items_select"
  ON public.purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.purchase_orders po
      JOIN public.customers c ON c.id = po.customer_id
      WHERE po.id = purchase_order_items.purchase_order_id
        AND (
          c.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.profiles me
            WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
          )
        )
    )
  );

CREATE POLICY "purchase_order_items_mutate_customer_draft"
  ON public.purchase_order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.purchase_orders po
      JOIN public.customers c ON c.id = po.customer_id
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.status = 'draft'::public.purchase_order_status
        AND c.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.purchase_orders po
      JOIN public.customers c ON c.id = po.customer_id
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.status = 'draft'::public.purchase_order_status
        AND c.user_id = (SELECT auth.uid())
    )
    AND public.customer_can_order_product(
      (SELECT customer_id FROM public.purchase_orders WHERE id = purchase_order_id),
      product_id
    )
  );

CREATE POLICY "purchase_order_items_mutate_admin"
  ON public.purchase_order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.purchase_orders IS 'Patient checkout orders; draft = cart.';
COMMENT ON TABLE public.purchase_order_items IS 'Line items with price snapshot at add-to-cart time.';
