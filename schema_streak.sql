-- ============================================================
-- FlashAprova – Migration: user_stats (Streak + Ofensiva)
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

create table if not exists public.user_stats (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  current_streak  integer     not null default 0,
  longest_streak  integer     not null default 0,
  last_study_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_stats enable row level security;

create policy "user_stats: leitura própria"
  on public.user_stats for select using (auth.uid() = user_id);

create policy "user_stats: inserção própria"
  on public.user_stats for insert with check (auth.uid() = user_id);

create policy "user_stats: atualização própria"
  on public.user_stats for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_user_stats_updated_at
  before update on public.user_stats
  for each row execute procedure public.set_updated_at();
