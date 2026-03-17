-- ── Leads table ─────────────────────────────────────────────────────────────
-- Stores leads from the landing page onboarding flow (step 1 of 3)

CREATE TABLE IF NOT EXISTS public.leads (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  email       text        NOT NULL,
  whatsapp    text        NOT NULL,         -- digits only, stored without mask
  created_at  timestamptz DEFAULT now()     NOT NULL
);

-- Index for email lookups (dedup, CRM queries)
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

-- RLS: allow anonymous inserts (landing page visitors are not logged in)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_insert_anon"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role / admin can read leads
CREATE POLICY "leads_select_service"
  ON public.leads
  FOR SELECT
  TO service_role
  USING (true);
