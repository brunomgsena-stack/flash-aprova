-- P0-4: webhook_events holds payment PII. Only the service role (webhook
-- handler) touches it. Enable RLS with NO policy for anon/authenticated
-- => clients get zero rows; service role bypasses RLS entirely.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;
