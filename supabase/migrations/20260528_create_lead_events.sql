-- Lead events: registro de cada evento de funil (AddToCart, InitiateCheckout,
-- CompleteRegistration, OnboardingCompleted, Purchase) associado a um email.
-- Service-role only (mesmo padrão de webhook_events) — clientes não acessam.

create table public.lead_events (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  event_name  text not null,
  occurred_at timestamptz not null default now(),
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  constraint lead_events_email_len       check (char_length(email) <= 320),
  constraint lead_events_email_shape     check (position('@' in email) > 1),
  constraint lead_events_event_name_len  check (char_length(event_name) <= 64)
);

create index lead_events_email_lower_idx
  on public.lead_events ((lower(email)), occurred_at desc);

create index lead_events_occurred_at_idx
  on public.lead_events (occurred_at desc);

-- RLS: tabela tem PII (email). Apenas service_role acessa. Sem policies pra
-- anon/authenticated => clientes recebem 0 linhas.
alter table public.lead_events enable row level security;
alter table public.lead_events force  row level security;
revoke all on public.lead_events from anon, authenticated;
