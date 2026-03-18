-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: essay_submissions
-- Histórico de redações corrigidas pela Norma (AiPro+)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.essay_submissions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  tema             text        not null,
  texto            text        not null,
  nota_total       int4        not null check (nota_total >= 0 and nota_total <= 1000),
  analise_completa jsonb       not null,  -- JSON completo da Norma: C1-C5, veredito, repertório
  created_at       timestamptz not null default now()
);

-- Índice para buscar histórico do aluno ordenado por data
create index if not exists essay_submissions_user_id_created_at_idx
  on public.essay_submissions (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.essay_submissions enable row level security;

-- Aluno só enxerga as próprias redações
create policy "Aluno lê suas próprias redações"
  on public.essay_submissions
  for select
  using (auth.uid() = user_id);

-- Aluno só insere com o próprio user_id
create policy "Aluno insere suas próprias redações"
  on public.essay_submissions
  for insert
  with check (auth.uid() = user_id);

-- Nenhum aluno pode alterar ou deletar correções (histórico imutável)
-- (sem policies de update/delete = bloqueado por padrão com RLS ativo)
