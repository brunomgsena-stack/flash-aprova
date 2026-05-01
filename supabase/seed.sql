-- FlashAprova B2B — Seed data for local development / testing
-- Run manually in the Supabase Dashboard SQL editor.
-- Project: FlashAprova-App (mmevmdudywlqylxqsxfc)

-- ─── 1. School ─────────────────────────────────────────────────────────────────
INSERT INTO public.schools (id, name, slug, logo_url, primary_color)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Colégio Panteão',
  'panteao',
  NULL,
  '#10b981'
)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Classes ────────────────────────────────────────────────────────────────
INSERT INTO public.classes (id, school_id, name, year)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '3º Ano A', 2026),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '3º Ano B', 2026)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Set your user as director ──────────────────────────────────────────────
-- Replace <YOUR_USER_ID> with your actual auth.users UUID.
-- Find it in: Supabase Dashboard → Authentication → Users
-- UPDATE public.profiles
-- SET
--   role      = 'director',
--   school_id = 'aaaaaaaa-0000-0000-0000-000000000001',
--   class_id  = NULL
-- WHERE id = '<YOUR_USER_ID>';

-- ─── 4. Link student profiles to school + class ────────────────────────────────
-- Optionally link existing student profiles to the school for testing.
-- UPDATE public.profiles
-- SET
--   school_id = 'aaaaaaaa-0000-0000-0000-000000000001',
--   class_id  = 'bbbbbbbb-0000-0000-0000-000000000001'
-- WHERE id IN (
--   SELECT id FROM public.profiles
--   WHERE role = 'student'
--   ORDER BY id
--   LIMIT 3
-- );
