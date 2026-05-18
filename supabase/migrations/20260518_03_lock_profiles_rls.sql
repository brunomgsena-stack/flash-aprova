-- P0-2: Users may edit their own profile EXCEPT privileged columns:
-- role, plan, plan_name, school_id, class_id, onboarding_completed,
-- first_session_completed. Those are written only by service role
-- (webhook grantPlan, generate-plan onboarding, the new /api/join).

-- 1. Revoke column UPDATE on privileged columns from app roles.
REVOKE UPDATE (
  role, plan, plan_name, school_id, class_id,
  onboarding_completed, first_session_completed
) ON public.profiles FROM anon, authenticated;

-- 2. Trigger guard (SECURITY INVOKER so current_user reflects calling role).
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Allowed writers:
  -- (a) service_role (webhook/onboarding admin client)
  -- (b) redeem_invite_code() RPC, which sets app.invite_redeem='on' for its transaction
  IF (NEW.role                       IS DISTINCT FROM OLD.role
      OR NEW.plan                    IS DISTINCT FROM OLD.plan
      OR NEW.plan_name               IS DISTINCT FROM OLD.plan_name
      OR NEW.school_id               IS DISTINCT FROM OLD.school_id
      OR NEW.class_id                IS DISTINCT FROM OLD.class_id
      OR NEW.onboarding_completed    IS DISTINCT FROM OLD.onboarding_completed
      OR NEW.first_session_completed IS DISTINCT FROM OLD.first_session_completed)
     AND current_user <> 'service_role'
     AND current_setting('app.invite_redeem', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'privileged profile columns cannot be changed from this role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_privileged ON public.profiles;
CREATE TRIGGER trg_guard_profiles_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged();
