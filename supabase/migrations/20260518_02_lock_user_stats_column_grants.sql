-- P0-1 (supplement): The REVOKE UPDATE (col) approach cannot override table-level grants.
-- Revoke table-level UPDATE entirely, then re-grant only the safe streak/study columns.
-- plan and plan_expires_at are intentionally excluded — service role bypasses RLS entirely.

REVOKE UPDATE ON public.user_stats FROM anon, authenticated;

GRANT UPDATE (current_streak, longest_streak, last_study_date, updated_at)
  ON public.user_stats TO authenticated;
