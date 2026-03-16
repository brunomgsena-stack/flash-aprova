-- ─── Add subscription columns to user_stats ──────────────────────────────────

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS plan            text        NOT NULL DEFAULT 'flash'
    CHECK (plan IN ('flash', 'proai_plus')),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- ─── Seed: set all existing rows to 'flash' ───────────────────────────────────
UPDATE public.user_stats SET plan = 'flash' WHERE plan IS NULL;

-- ─── (Optional) Promote a user to ProAI+ for testing ─────────────────────────
-- UPDATE public.user_stats
--   SET plan = 'proai_plus',
--       plan_expires_at = now() + interval '30 days'
-- WHERE user_id = '<paste-your-user-id-here>';
