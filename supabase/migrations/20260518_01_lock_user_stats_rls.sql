-- P0-1: Users may update their streak fields but NOT plan / plan_expires_at.
-- Plan is written only by the service role (Asaas webhook -> grantPlan()).
-- Strategy: column-level privilege revoke + a trigger that rejects plan
-- changes coming from non-service roles (defense in depth).

-- 1. Revoke direct column UPDATE on the billing columns from app roles.
-- Note: superseded by 20260518_02_lock_user_stats_column_grants.sql which
-- does a full revoke + selective re-grant; kept here for documentation.
REVOKE UPDATE (plan, plan_expires_at) ON public.user_stats FROM anon, authenticated;

-- 2. Trigger guard (SECURITY INVOKER so current_user reflects the calling role).
--    Blocks plan changes from any role except service_role.
CREATE OR REPLACE FUNCTION public.guard_user_stats_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at)
     AND current_user <> 'service_role'
  THEN
    RAISE EXCEPTION 'plan changes are not allowed from this role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_stats_plan ON public.user_stats;
CREATE TRIGGER trg_guard_user_stats_plan
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_stats_plan();
