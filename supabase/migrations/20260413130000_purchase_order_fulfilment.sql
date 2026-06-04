-- Operational delivery / fulfilment data per purchase order (1:1).
-- Order workflow stays on purchase_orders.status; delivery_status tracks parcel-level progress for MVP + future courier APIs.

CREATE TYPE public.purchase_delivery_status AS ENUM (
  'pending',
  'awaiting_pickup',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception'
);

CREATE TABLE public.purchase_order_fulfilment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL UNIQUE REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
  courier TEXT,
  tracking_number TEXT,
  fulfilment_notes TEXT,
  dispatched_at TIMESTAMPTZ,
  delivery_status public.purchase_delivery_status NOT NULL DEFAULT 'pending',
  courier_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchase_order_fulfilment_delivery_status_idx
  ON public.purchase_order_fulfilment (delivery_status, updated_at DESC);

COMMENT ON TABLE public.purchase_order_fulfilment IS
  'Shipping and tracking; courier_metadata reserved for future carrier API ids and webhook payloads.';
COMMENT ON COLUMN public.purchase_order_fulfilment.courier_metadata IS
  'Integration payload (e.g. carrier shipment id, label URL). Not shown in patient UI by default.';

-- Create fulfilment row when a draft order is submitted (leaves draft).
CREATE OR REPLACE FUNCTION public.ensure_purchase_order_fulfilment_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'draft'::public.purchase_order_status
     AND NEW.status IS DISTINCT FROM 'draft'::public.purchase_order_status THEN
    INSERT INTO public.purchase_order_fulfilment (purchase_order_id)
    VALUES (NEW.id)
    ON CONFLICT (purchase_order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_purchase_order_fulfilment
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.ensure_purchase_order_fulfilment_row();

INSERT INTO public.purchase_order_fulfilment (purchase_order_id)
SELECT id FROM public.purchase_orders WHERE status <> 'draft'::public.purchase_order_status
ON CONFLICT (purchase_order_id) DO NOTHING;

ALTER TABLE public.purchase_order_fulfilment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_order_fulfilment_select_customer"
  ON public.purchase_order_fulfilment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.purchase_orders po
      JOIN public.customers c ON c.id = po.customer_id
      WHERE po.id = purchase_order_fulfilment.purchase_order_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "purchase_order_fulfilment_select_admin"
  ON public.purchase_order_fulfilment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "purchase_order_fulfilment_insert_admin"
  ON public.purchase_order_fulfilment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );

CREATE POLICY "purchase_order_fulfilment_update_admin"
  ON public.purchase_order_fulfilment
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

CREATE POLICY "purchase_order_fulfilment_delete_admin"
  ON public.purchase_order_fulfilment
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (SELECT auth.uid()) AND me.role IN ('master', 'admin')
    )
  );
