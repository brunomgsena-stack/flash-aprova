-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: webhook_events
-- Garante idempotência do webhook AbacatePay.
-- Cada event_id só pode ser processado uma vez (UNIQUE constraint).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.webhook_events (
  id           uuid        primary key default gen_random_uuid(),
  event_id     text        not null,
  processed_at timestamptz not null default now(),
  payload      jsonb,

  constraint webhook_events_event_id_key unique (event_id)
);

-- Índice explícito para buscas por event_id (o UNIQUE já cria um, mas explicitamos)
create index if not exists webhook_events_event_id_idx
  on public.webhook_events (event_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- A tabela é acessada apenas pelo service role (admin client).
-- Nenhum usuário autenticado deve ler ou escrever diretamente.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.webhook_events enable row level security;

-- Sem policies = nenhum usuário via anon key ou JWT pode acessar.
-- O service role bypassa RLS por definição — acesso garantido apenas no backend.
