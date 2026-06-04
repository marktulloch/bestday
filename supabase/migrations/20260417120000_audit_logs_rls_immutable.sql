-- Audit logs: master read access + immutability (append-only)

-- ---------------------------------------------------------------------------
-- Masters can review the application audit trail (JWT + RLS).
-- Inserts remain via service role from server code (logAuditEvent).
-- ---------------------------------------------------------------------------

CREATE POLICY "audit_logs_select_master"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role = 'master'
    )
  );

COMMENT ON POLICY "audit_logs_select_master" ON public.audit_logs IS
  'Operational security review; keep master roster small.';

-- ---------------------------------------------------------------------------
-- Block UPDATE/DELETE on audit rows (including accidental service-role misuse).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_audit_logs_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_audit_logs_mutation();
