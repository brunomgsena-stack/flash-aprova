-- P0-3: Curated catalog is read-only for clients. Writes happen only via
-- service role (seed script / admin importer), which bypasses RLS.

-- Drop all non-SELECT policies on content tables.
-- Names confirmed from pg_policies before applying:
--   cards   → "allow insert" (INSERT, anon)
--   decks   → "allow insert" (INSERT, anon)
--   subjects → "allow insert" (INSERT, anon)
-- No UPDATE or DELETE policies were present on any of these tables.

DROP POLICY IF EXISTS "allow insert" ON public.cards;
DROP POLICY IF EXISTS "allow insert" ON public.decks;
DROP POLICY IF EXISTS "allow insert" ON public.subjects;

-- Also drop any equivalently-permissive UPDATE/DELETE policies if present
-- (none found in inventory, included here for idempotency on future runs).
DROP POLICY IF EXISTS "allow update" ON public.cards;
DROP POLICY IF EXISTS "allow update" ON public.decks;
DROP POLICY IF EXISTS "allow update" ON public.subjects;
DROP POLICY IF EXISTS "allow delete" ON public.cards;
DROP POLICY IF EXISTS "allow delete" ON public.decks;
DROP POLICY IF EXISTS "allow delete" ON public.subjects;

-- SELECT policies ("leitura pública") are intentionally kept.
