-- P1-7: tighten EXECUTE on SECURITY DEFINER functions.
-- handle_new_user: trigger-only; no direct call from any role.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM anon, authenticated, public;
-- complete_onboarding: called by authenticated users via serverClient.rpc().
REVOKE EXECUTE ON FUNCTION public.complete_onboarding()       FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.complete_onboarding()       TO authenticated;
-- is_director_of_school: boolean RLS helper; must remain callable by authenticated.
REVOKE EXECUTE ON FUNCTION public.is_director_of_school(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.is_director_of_school(uuid) TO authenticated;

-- P1-11: pin search_path on SECURITY DEFINER functions to prevent search_path injection.
-- complete_onboarding has no search_path set; pin to empty string.
ALTER FUNCTION public.complete_onboarding()       SET search_path = '';
-- handle_new_user and is_director_of_school have search_path=public (mutable); pin to empty.
ALTER FUNCTION public.handle_new_user()           SET search_path = '';
ALTER FUNCTION public.is_director_of_school(uuid) SET search_path = '';
-- set_updated_at is not SECURITY DEFINER but has no search_path set; pin defensively.
ALTER FUNCTION public.set_updated_at()            SET search_path = '';
