-- ============================================================
-- FlashAprova – Schema v1.0
-- Plataforma de Memorização com SRS v2.2
-- ============================================================

-- Habilita extensão para geração de UUIDs
create extension if not exists "pgcrypto";


-- ============================================================
-- TABELA: subjects
-- Matérias (ex: Matemática, Português, História)
-- ============================================================
create table public.subjects (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  icon_url    text,
  color       text,                          -- cor hex, ex: '#7C3AED'
  created_at  timestamptz not null default now()
);

comment on table public.subjects is 'Matérias disponíveis na plataforma.';


-- ============================================================
-- TABELA: decks
-- Baralhos ligados a uma matéria
-- ============================================================
create table public.decks (
  id          uuid        primary key default gen_random_uuid(),
  subject_id  uuid        not null references public.subjects (id) on delete cascade,
  title       text        not null,
  created_at  timestamptz not null default now()
);

comment on table public.decks is 'Baralhos de cards, vinculados a uma matéria.';

create index idx_decks_subject_id on public.decks (subject_id);


-- ============================================================
-- TABELA: cards
-- Flashcards com pergunta e resposta
-- ============================================================
create table public.cards (
  id          uuid        primary key default gen_random_uuid(),
  deck_id     uuid        not null references public.decks (id) on delete cascade,
  question    text        not null,
  answer      text        not null,
  created_at  timestamptz not null default now()
);

comment on table public.cards is 'Flashcards com pergunta e resposta curados pelos especialistas.';

create index idx_cards_deck_id on public.cards (deck_id);


-- ============================================================
-- TABELA: user_progress
-- Progresso individual do usuário por card (SRS v2.2)
--
-- Algoritmo:  I = (I_prev × EF) × (0.85 ^ lapses)
--   EF  – Ease Factor: começa em 2.5
--          +0.15 quando o usuário responde "Fácil" (nota 4)
--          -0.20 quando o usuário responde "Difícil" (nota 2)
--   lapses – total de vezes que respondeu "1 – Errei"
--
-- history (JSONB) – array de revisões, ex:
--   [
--     { "reviewed_at": "2025-01-10T14:00:00Z", "rating": 3, "interval_days": 1 },
--     { "reviewed_at": "2025-01-13T09:30:00Z", "rating": 4, "interval_days": 4 }
--   ]
-- ============================================================
create table public.user_progress (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  card_id       uuid        not null references public.cards (id) on delete cascade,

  -- campos do algoritmo SRS
  ease_factor   numeric(4,2) not null default 2.50,  -- EF, mín 1.30
  lapses        integer      not null default 0,      -- total de "Errei"
  interval_days integer      not null default 0,      -- I_prev em dias
  next_review   date         not null default current_date, -- data da próxima revisão

  -- histórico completo de revisões
  history       jsonb        not null default '[]'::jsonb,

  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),

  -- cada usuário tem no máximo 1 registro por card
  unique (user_id, card_id)
);

comment on table public.user_progress        is 'Progresso de repetição espaçada de cada usuário por card (SRS v2.2).';
comment on column public.user_progress.ease_factor   is 'Fator de facilidade do algoritmo. Mínimo recomendado: 1.30.';
comment on column public.user_progress.lapses        is 'Total histórico de vezes que o usuário respondeu "1 – Errei".';
comment on column public.user_progress.interval_days is 'Intervalo em dias calculado na última revisão (I_prev).';
comment on column public.user_progress.next_review   is 'Data em que o card deve aparecer novamente para o usuário.';
comment on column public.user_progress.history       is 'Array JSONB com o log de cada revisão: reviewed_at, rating (1-4), interval_days.';

create index idx_user_progress_user_id    on public.user_progress (user_id);
create index idx_user_progress_next_review on public.user_progress (user_id, next_review);

-- Mantém updated_at sempre atualizado
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_progress_updated_at
  before update on public.user_progress
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- subjects e decks e cards são leitura pública (curadoria da plataforma)
alter table public.subjects     enable row level security;
alter table public.decks        enable row level security;
alter table public.cards        enable row level security;
alter table public.user_progress enable row level security;


-- ------------------------------------------------------------
-- subjects: todos leem, apenas service_role escreve
-- ------------------------------------------------------------
create policy "subjects: leitura pública"
  on public.subjects for select
  using (true);


-- ------------------------------------------------------------
-- decks: todos leem, apenas service_role escreve
-- ------------------------------------------------------------
create policy "decks: leitura pública"
  on public.decks for select
  using (true);


-- ------------------------------------------------------------
-- cards: todos leem, apenas service_role escreve
-- ------------------------------------------------------------
create policy "cards: leitura pública"
  on public.cards for select
  using (true);


-- ------------------------------------------------------------
-- user_progress: usuário lê e escreve apenas o próprio progresso
-- ------------------------------------------------------------
create policy "user_progress: leitura própria"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "user_progress: inserção própria"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "user_progress: atualização própria"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_progress: exclusão própria"
  on public.user_progress for delete
  using (auth.uid() = user_id);


-- ============================================================
-- Fim do schema FlashAprova v1.0
-- ============================================================
