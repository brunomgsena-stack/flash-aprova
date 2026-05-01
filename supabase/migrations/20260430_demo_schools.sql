-- supabase/migrations/20260430_demo_schools.sql

create table if not exists demo_schools (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  token           text not null default encode(gen_random_bytes(16), 'hex'),
  name            text not null,
  logo_url        text,
  primary_color   text not null default '#7C3AED',
  secondary_color text,
  tutor_name      text not null default 'Tutor IA',
  slogan          text,
  website_url     text,
  created_at      timestamptz not null default now()
);

alter table demo_schools enable row level security;

-- Leitura pública por slug (validação de token feita na aplicação)
create policy "demo_schools_public_read"
  on demo_schools for select
  using (true);

-- Escrita (insert, update, delete) apenas para usuários com role = 'admin'
create policy "demo_schools_admin_write"
  on demo_schools for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
