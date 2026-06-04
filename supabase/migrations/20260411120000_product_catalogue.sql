-- Product catalogue: categories, products, per-customer approvals, optional order line FK.
-- RLS: staff see all products; public education rows for anon; portal rows for customers by eligibility/approval.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.product_catalogue_status AS ENUM ('draft', 'active', 'archived');

CREATE TYPE public.product_portal_visibility AS ENUM (
  'none',
  'eligible_only',
  'approved_only',
  'eligible_or_approved'
);

CREATE TYPE public.customer_product_approval_status AS ENUM ('pending', 'approved', 'revoked');

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX product_categories_active_sort_idx
  ON public.product_categories (is_active, sort_order, name);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_select"
  ON public.product_categories
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "product_categories_mutate_admin"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.product_categories IS 'Catalogue grouping; inactive categories hidden from non-staff.';

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories (id) ON DELETE SET NULL,
  sku TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  dosage_form TEXT,
  strength TEXT,
  usage_instructions TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NZD',
  catalogue_status public.product_catalogue_status NOT NULL DEFAULT 'draft',
  requires_doctor_approval BOOLEAN NOT NULL DEFAULT false,
  public_education BOOLEAN NOT NULL DEFAULT false,
  portal_visibility public.product_portal_visibility NOT NULL DEFAULT 'none',
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_price_cents_non_negative CHECK (price_cents >= 0)
);

CREATE INDEX products_catalogue_status_idx ON public.products (catalogue_status);
CREATE INDEX products_category_idx ON public.products (category_id);
CREATE INDEX products_portal_idx ON public.products (portal_visibility, catalogue_status)
  WHERE catalogue_status = 'active';

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_staff"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "products_select_public_education"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    catalogue_status = 'active'
    AND public_education IS TRUE
  );

-- products_select_customer_portal is created after customer_product_approvals (see below).

CREATE POLICY "products_mutate_admin"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin')
    )
  );

COMMENT ON TABLE public.products IS
  'Cannabis care catalogue; extend metadata/stock for inventory and fulfilment.';
COMMENT ON COLUMN public.products.requires_doctor_approval IS
  'Informational flag for UX and workflows; portal access still governed by portal_visibility and approvals.';
COMMENT ON COLUMN public.products.metadata IS 'Extension point for variants, fulfilment SKUs, tax flags, etc.';

-- ---------------------------------------------------------------------------
-- Per-customer product access (doctor-approved catalogue)
-- ---------------------------------------------------------------------------

CREATE TABLE public.customer_product_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  status public.customer_product_approval_status NOT NULL DEFAULT 'pending',
  approved_by_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX customer_product_approvals_customer_idx
  ON public.customer_product_approvals (customer_id, status);
CREATE INDEX customer_product_approvals_product_idx
  ON public.customer_product_approvals (product_id);

ALTER TABLE public.customer_product_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_product_approvals_select"
  ON public.customer_product_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_product_approvals.customer_id
        AND c.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customer_product_approvals_insert_clinical"
  ON public.customer_product_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

CREATE POLICY "customer_product_approvals_update_clinical"
  ON public.customer_product_approvals
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

-- Depends on customer_product_approvals — must run after that table exists.
CREATE POLICY "products_select_customer_portal"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role = 'customer'
    )
    AND catalogue_status = 'active'
    AND portal_visibility <> 'none'::public.product_portal_visibility
    AND (
      (
        portal_visibility IN (
          'eligible_only'::public.product_portal_visibility,
          'eligible_or_approved'::public.product_portal_visibility
        )
        AND EXISTS (
          SELECT 1
          FROM public.customers c
          JOIN public.prescreens p ON p.user_id = c.user_id
          WHERE c.user_id = (SELECT auth.uid())
            AND p.workflow_status = 'eligible_for_booking'::public.prescreen_workflow_status
        )
      )
      OR (
        portal_visibility IN (
          'approved_only'::public.product_portal_visibility,
          'eligible_or_approved'::public.product_portal_visibility
        )
        AND EXISTS (
          SELECT 1
          FROM public.customer_product_approvals a
          JOIN public.customers c ON c.id = a.customer_id
          WHERE c.user_id = (SELECT auth.uid())
            AND a.product_id = products.id
            AND a.status = 'approved'::public.customer_product_approval_status
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Optional link from customer_orders → products (fulfilment)
-- ---------------------------------------------------------------------------

ALTER TABLE public.customer_orders
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customer_orders_product_idx ON public.customer_orders (product_id);
