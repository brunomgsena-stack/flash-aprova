-- ─── 1. Create modules table ──────────────────────────────────────────────────

create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  order_index integer not null default 0
);

alter table public.modules enable row level security;

create policy "Public modules are viewable by everyone"
  on public.modules for select using (true);

-- ─── 2. Add module_id to decks ────────────────────────────────────────────────

alter table public.decks
  add column if not exists module_id uuid references public.modules(id) on delete set null;

-- ─── 3. Insert Biology modules ────────────────────────────────────────────────
-- Replace the subject_id below with the actual UUID of "Biologia" in your DB.
-- To find it: SELECT id FROM subjects WHERE title ILIKE '%biolog%';

do $$
declare
  bio_id uuid;
begin
  select id into bio_id from public.subjects where title ilike '%biolog%' limit 1;

  if bio_id is null then
    raise notice 'Biologia subject not found – skipping module insert';
    return;
  end if;

  insert into public.modules (title, subject_id, order_index) values
    ('ECOLOGIA',                bio_id, 1),
    ('FISIOLOGIA HUMANA',       bio_id, 2),
    ('CITOLOGIA & BIOENERGÉTICA', bio_id, 3),
    ('GENÉTICA & BIOTECNOLOGIA', bio_id, 4),
    ('EVOLUÇÃO',                bio_id, 5),
    ('BOTÂNICA',                bio_id, 6),
    ('ZOOLOGIA',                bio_id, 7),
    ('MICROBIOLOGIA',           bio_id, 8)
  on conflict do nothing;
end $$;

-- ─── 4. (Optional) Link existing Biologia decks to their modules ──────────────
-- Run this manually in Supabase SQL editor after the inserts above.
-- Example:
--   UPDATE decks SET module_id = (SELECT id FROM modules WHERE title = 'ECOLOGIA')
--   WHERE subject_id = '<bio_id>' AND title ILIKE '%ecolog%';
