# FlashAprova — Manual de Arquitetura Sênior

> Documento de referência técnica gerado em 25/03/2026.
> Fiel ao código em produção na branch `main`.

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Fluxo de Autenticação](#5-fluxo-de-autenticação)
6. [Banco de Dados — ERD e RLS](#6-banco-de-dados--erd-e-rls)
7. [Integração de Pagamento — AbacatePay](#7-integração-de-pagamento--abacatepay)
8. [Rotas de API](#8-rotas-de-api)
9. [Lógica de IA — Tutores e Norma](#9-lógica-de-ia--tutores-e-norma)
10. [Algoritmo SRS](#10-algoritmo-srs)
11. [Sistema de Domínio e Progresso](#11-sistema-de-domínio-e-progresso)
12. [Design System e Tokens Visuais](#12-design-system-e-tokens-visuais)
13. [Segurança — Decisões e Implementações](#13-segurança--decisões-e-implementações)
14. [Scripts e Ferramentas de Desenvolvimento](#14-scripts-e-ferramentas-de-desenvolvimento)

---

## 1. Visão Geral do Produto

**FlashAprova** é um SaaS educacional brasileiro focado em preparação para o ENEM. O produto implementa **Spaced Repetition System (SRS)** combinado com **Inteligência Artificial** para maximizar a retenção de conteúdo do aluno até o dia da prova.

### Proposta de Valor

- **5.700+ flashcards táticos** gerados e validados por IA, cobrindo as seis grandes áreas do ENEM
- **SRS automático**: algoritmo de revisão espaçada que agenda cada card no momento exato antes de ser esquecido
- **Tutores IA Especialistas**: 12 personas de IA com prompts profundos por disciplina + vector stores de referência
- **Norma — Corretora de Redação**: agent de IA que avalia redações pelas 5 Competências oficiais do INEP (0–1000 pontos)
- **Dashboard de BI**: Radar de domínio por área, heatmap de consistência, gráfico de evolução semanal

### Modelo de Negócio

| Plano | Acesso | Identificador |
|-------|--------|--------------|
| Flash (gratuito) | Flashcards básicos, dashboard básico | `flash` |
| AiPro+ (pago, R$ 67,90) | Tutores IA, Norma, Arsenal completo | `proai_plus` |

O pagamento é feito via PIX sem necessidade de conta prévia — o funil de vendas cria a conta automaticamente após confirmação do pagamento.

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Versão | Papel |
|--------|-----------|--------|-------|
| Framework | Next.js | `^16.1.6` | App Router, SSR, API Routes, Middleware |
| Runtime | React | `^19.2.4` | UI e componentes client-side |
| Banco de dados | Supabase (PostgreSQL) | `^2.99.1` | Auth, banco relacional, RLS, Storage |
| Auth SDK | `@supabase/ssr` | `^0.9.0` | Autenticação server-side com cookies |
| IA — LLM | OpenAI (`gpt-4o-mini`) | via fetch/SDK | Tutores (Responses API) e avaliação simples |
| IA — Agents | `@openai/agents` | `^0.7.2` | Norma (corretora de redação com agent loop) |
| Pagamentos | AbacatePay | REST v1 | PIX one-time, webhook de confirmação |
| CSS | Tailwind CSS | `^4.2.1` | Utility-first + tokens custom |
| Gráficos | Recharts | `^3.8.0` | Charts no dashboard (Radar, Area, Bar) |
| Math | KaTeX | `^0.16.38` | Renderização de LaTeX nos flashcards |
| TypeScript | TypeScript | `^5.9.3` | Tipagem em todo o projeto |
| Runtime scripts | tsx | `^4.21.0` | Execução de scripts de seed |

---

## 3. Estrutura de Pastas

```
app-flashcards/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: fonte, metadados globais
│   ├── page.tsx                  # Raiz "/" → renderiza LandingPage ou redireciona (middleware)
│   ├── globals.css               # Tokens CSS, animações (fade-up, cta-pulse, orb-drift)
│   ├── LandingPage.tsx           # Landing page completa (client component)
│   │
│   ├── login/
│   │   └── page.tsx              # Formulário de login/cadastro com Supabase Auth
│   │
│   ├── onboarding/
│   │   ├── page.tsx              # Entrada do onboarding (server component)
│   │   └── OnboardingFlow.tsx    # Wizard multi-etapas: diagnóstico de retenção
│   │
│   ├── checkout/
│   │   ├── page.tsx              # Página de upgrade AiPro+
│   │   └── CheckoutPage.tsx      # UI de checkout: coleta email/nome, chama /api/checkout
│   │
│   ├── subscription/
│   │   └── page.tsx              # Página de assinatura/upgrade para usuários logados
│   │
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard principal (server component)
│   │   ├── SubjectsWithDomain.tsx # Grid de matérias com nível de domínio calculado
│   │   ├── SubjectCard.tsx       # Card de matéria individual
│   │   ├── PantheonInsights.tsx  # Widget "Insights do Panteão" com FlashTutor IA
│   │   ├── PerformanceMetrics.tsx # Métricas de performance com gráficos
│   │   ├── ChartsRow.tsx         # Linha de charts (Radar + Area)
│   │   ├── AccountStatusCard.tsx # Card do status do plano atual
│   │   ├── DynamicStatus.tsx     # Status dinâmico de streak e progresso
│   │   ├── UserMenu.tsx          # Menu dropdown do usuário autenticado
│   │   ├── LogoutButton.tsx      # Botão de logout
│   │   ├── StreakBadge.tsx       # Badge de streak de dias consecutivos
│   │   │
│   │   ├── charts/
│   │   │   ├── MasteryRadarChart.tsx  # Recharts: radar de domínio por área
│   │   │   └── RetentionAreaChart.tsx # Recharts: gráfico de área de retenção
│   │   │
│   │   ├── subject/[subjectId]/
│   │   │   ├── page.tsx          # Página da matéria (lista de módulos e decks)
│   │   │   ├── ModuleAccordion.tsx # Acordeon de módulos
│   │   │   └── DeckCard.tsx      # Card de deck individual
│   │   │
│   │   ├── deck/[deckId]/pre-study/
│   │   │   ├── page.tsx          # Pré-estudo: info do deck + tutor IA
│   │   │   └── DeckContent.tsx   # Conteúdo do pré-estudo
│   │   │
│   │   └── content/redacao/
│   │       ├── page.tsx          # Página de redação (server component + plan check)
│   │       └── RedacaoClient.tsx # Editor de redação + histórico de correções
│   │
│   ├── study/
│   │   ├── [deckId]/
│   │   │   └── page.tsx          # Estudo de deck: SRS flip-card, 4-point rating
│   │   └── turbo/
│   │       └── page.tsx          # Modo Turbo: fila global de revisões do dia
│   │
│   ├── admin/
│   │   ├── page.tsx              # Server Component: checa profiles.role === 'admin'
│   │   └── AdminImporter.tsx     # Client Component: importador CSV de flashcards
│   │
│   └── api/
│       ├── checkout/
│       │   └── route.ts          # POST /api/checkout → cria cobrança AbacatePay
│       ├── webhooks/abacate/
│       │   └── route.ts          # POST /api/webhooks/abacate → processa pagamento PIX
│       ├── chat/
│       │   ├── tutor/
│       │   │   └── route.ts      # POST /api/chat/tutor → chat com Tutor IA (AiPro+)
│       │   └── redacao/
│       │       └── route.ts      # POST /api/chat/redacao → correção Norma (AiPro+)
│       └── ai/
│           └── grade-essay/
│               └── route.ts      # POST /api/ai/grade-essay → avaliação rápida (AiPro+)
│
├── components/
│   ├── AnkiComparison.tsx        # Tabela comparativa FlashAprova vs Anki (landing)
│   ├── AiProUpgradeModal.tsx     # Modal de upgrade para features AiPro+
│   └── redacao/
│       ├── EvolucaoChart.tsx     # Gráfico de evolução de notas de redação
│       └── HistoricoList.tsx     # Lista de redações corrigidas anteriores
│
├── lib/
│   ├── supabaseClient.ts         # Browser client (createBrowserClient)
│   ├── supabase/server.ts        # Server client factory (createServerClient + cookies)
│   ├── plan.ts                   # fetchUserPlan: lê plano do DB com verificação de expiração
│   ├── streak.ts                 # fetchUserStats / updateStreak: lógica de streak diário
│   ├── domain.ts                 # calcDomain / buildDomainMap: algoritmo de nível de domínio
│   ├── categories.ts             # getCategoryInfo: mapeamento regex de áreas do ENEM
│   ├── iconMap.ts                # Mapa de ícones por matéria
│   ├── tutor-config.ts           # Source of truth: 12 tutores + FlashTutor (prompts, patterns)
│   ├── tutor-engine.ts           # Re-export shim de tutor-config (backward compat)
│   ├── tutor-prompts.ts          # Re-export shim deprecado (backward compat)
│   └── agents/
│       └── norma.ts              # Agent Norma: @openai/agents SDK + 5 Competências ENEM
│
├── supabase/
│   └── migrations/
│       ├── 20260318_create_essays_table.sql       # Tabela essay_submissions + RLS
│       └── 20260325_create_webhook_events_table.sql # Tabela webhook_events + UNIQUE constraint
│
├── scripts/
│   └── seed.ts                   # Script de seed do banco (executado com tsx)
│
├── middleware.ts                 # Auth middleware: protege rotas, refresha sessão
├── next.config.ts                # Security headers HTTP para todas as rotas
├── tailwind.config.*             # Config Tailwind (v4 via postcss)
├── tsconfig.json                 # TypeScript strict mode
├── .gitignore                    # Inclui .env.local (secrets nunca commitados)
└── package.json                  # Scripts: dev, build, start, seed
```

---

## 4. Variáveis de Ambiente

Arquivo: `.env.local` (nunca commitado — está no `.gitignore`)

| Variável | Exposição | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública (client) | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública (client) | JWT anon — sujeito a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privada (server only)** | Bypassa RLS — usado no webhook |
| `OPENAI_API_KEY` | **Privada (server only)** | Chave OpenAI para tutores e Norma |
| `OPENAI_VECTOR_STORE_ID` | **Privada (server only)** | Vector store fallback global |
| `ABACATEPAY_API_KEY` | **Privada (server only)** | Chave de criação de cobranças |
| `ABACATEPAY_WEBHOOK_SECRET` | **Privada (server only)** | Segredo de validação do webhook |
| `NEXT_PUBLIC_URL` | Pública | URL base de produção (ex: `https://flashaprova.com.br`) |

> **Por disciplina:** Cada tutor pode ter um vector store próprio via `${TUTOR_ENVKEY}_VECTOR_STORE_ID` (ex: `HISTORIA_VECTOR_STORE_ID`). Se não configurado, usa o `OPENAI_VECTOR_STORE_ID` como fallback.

---

## 5. Fluxo de Autenticação

### 5.1 Middleware (`middleware.ts`)

O middleware é executado **em todo request** (exceto assets estáticos) pelo Edge Runtime do Next.js:

```
Request → middleware.ts
  └─ createServerClient (lê/escreve cookies de sessão)
  └─ supabase.auth.getUser()   ← validação server-side real (não confia só no cookie)
  └─ pathname check:
      ├─ Protegidas (/dashboard, /admin, /study, /subscription) + sem user → redirect /login
      ├─ /login ou / + com user → redirect /dashboard
      └─ Caso contrário → NextResponse.next() com cookies atualizados
```

**Rotas protegidas pelo middleware:**
- `/dashboard/*`
- `/admin/*`
- `/study/*`
- `/subscription/*`

**Rotas públicas** (sem autenticação necessária):
- `/` (landing page)
- `/login`
- `/onboarding`
- `/checkout`
- `/api/*` (autenticação verificada dentro de cada handler)

### 5.2 Dois Clientes Supabase

| Cliente | Arquivo | Quando usar |
|---------|---------|-------------|
| Browser | `lib/supabaseClient.ts` | Client Components — operações do usuário autenticado |
| Server | `lib/supabase/server.ts` | Server Components, API Routes, Middleware |

O client server usa `@supabase/ssr` com `cookies()` do Next.js para ler/escrever a sessão JWT via cookie HTTP-only.

### 5.3 Verificação de Role Admin

A rota `/admin` tem dupla proteção:

1. **Middleware**: bloqueia usuários não autenticados (redirect `/login`)
2. **Server Component** (`app/admin/page.tsx`): verifica `profiles.role === 'admin'` no banco

```typescript
// app/admin/page.tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle();

if (profile?.role !== 'admin') {
  redirect('/dashboard?error=unauthorized');
}
```

### 5.4 Verificação de Plano nas APIs

Todas as rotas AiPro+ chamam `fetchUserPlan(user.id)` antes de processar:

```typescript
// lib/plan.ts — lógica completa
const plan = rawPlan;
if (expiresAt && expiresAt < now) {
  return { plan: 'flash', expiresAt, daysLeft: 0 }; // plano expirado rebaixado
}
```

---

## 6. Banco de Dados — ERD e RLS

O banco é PostgreSQL gerenciado pelo Supabase. A seguir, todas as tabelas conhecidas com seus campos e políticas de Row Level Security.

### 6.1 `auth.users` (gerenciada pelo Supabase)

Tabela nativa do Supabase Auth. Campos relevantes para o FlashAprova:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK — referenciado por todas as tabelas |
| `email` | `text` | Email único do usuário |
| `created_at` | `timestamptz` | Data de criação da conta |

### 6.2 `profiles`

Perfil estendido do usuário (criado manualmente ou via trigger).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | FK → `auth.users.id` |
| `role` | `text` | `'admin'` ou `null` — controla acesso ao painel admin |

**RLS:** Cada usuário lê/edita apenas o próprio perfil.

### 6.3 `user_stats`

Gamificação e status do plano do usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | `uuid` | PK / FK → `auth.users.id` |
| `plan` | `text` | `'flash'` ou `'proai_plus'` |
| `plan_expires_at` | `timestamptz` | Data de expiração do plano (null = sem expiração) |
| `current_streak` | `int4` | Dias consecutivos de estudo |
| `longest_streak` | `int4` | Maior streak histórico |
| `last_study_date` | `date` | Última data em que estudou (YYYY-MM-DD) |

**Operação de upsert:** `lib/streak.ts` usa `upsert({ onConflict: 'user_id' })` — idempotente por dia.

**Lógica de streak** (`lib/streak.ts`):
```
last_study_date === yesterday → newStreak = current + 1
last_study_date !== yesterday → newStreak = 1 (reset)
last_study_date === today    → no-op (já contabilizado)
```

### 6.4 `subjects`

Matérias do ENEM.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `title` | `text` | Ex: `'Física'`, `'Biologia'` |
| `category` | `text` | Ex: `'Ciências da Natureza'`, `'Matemática'` |

**Categorias ENEM** (resolvidas via regex em `lib/categories.ts`):
- `Ciências da Natureza e suas Tecnologias`
- `Ciências Humanas e Sociais Aplicadas`
- `Matemática e suas Tecnologias`
- `Linguagens, Códigos e suas Tecnologias`
- `Redação Flash+`

### 6.5 `modules`

Módulos dentro de cada matéria (agrupam decks).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `title` | `text` | Ex: `'Mecânica Clássica'` |
| `subject_id` | `uuid` | FK → `subjects.id` |

### 6.6 `decks`

Baralhos de flashcards dentro de um módulo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `title` | `text` | Nome do deck |
| `subject_id` | `uuid` | FK → `subjects.id` |
| `module_id` | `uuid` | FK → `modules.id` |
| `summary_markdown` | `text` | Resumo do conteúdo do deck (Markdown) |
| `mnemonics` | `text` | Dicas mnemônicas do deck |

### 6.7 `cards`

Flashcards individuais.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `deck_id` | `uuid` | FK → `decks.id` |
| `question` | `text` | Pergunta do card (suporta LaTeX com `$...$`) |
| `answer` | `text` | Resposta do card (suporta LaTeX com `$...$`) |

### 6.8 `user_progress`

Progresso SRS por usuário × card.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `card_id` | `uuid` | FK → `cards.id` |
| `interval_days` | `int4` | Intervalo atual de revisão em dias |
| `ease_factor` | `float4` | Fator de facilidade (SM-2, default 2.5) |
| `due_date` | `date` | Data da próxima revisão agendada |
| `repetitions` | `int4` | Número de repetições bem-sucedidas |

**RLS:** `auth.uid() = user_id` em todas as políticas — cada usuário só acessa seu próprio progresso.

### 6.9 `essay_submissions`

Histórico de redações corrigidas pela Norma.

Migração: `supabase/migrations/20260318_create_essays_table.sql`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK (gen_random_uuid) |
| `user_id` | `uuid` | FK → `auth.users.id` ON DELETE CASCADE |
| `tema` | `text` | Tema da redação |
| `texto` | `text` | Texto completo enviado pelo aluno |
| `nota_total` | `int4` | Soma das 5 competências (0–1000), CHECK enforced |
| `analise_completa` | `jsonb` | JSON estruturado completo da Norma (c1–c5, veredito, etc.) |
| `created_at` | `timestamptz` | Timestamp de criação |

**Índice:** `(user_id, created_at DESC)` para busca eficiente do histórico.

**RLS:**
```sql
-- Aluno lê apenas as próprias redações
CREATE POLICY "Aluno lê suas próprias redações"
  ON essay_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Aluno insere apenas com o próprio user_id
CREATE POLICY "Aluno insere suas próprias redações"
  ON essay_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE e DELETE: bloqueados (histórico imutável)
```

### 6.10 `webhook_events`

Tabela de idempotência para o webhook AbacatePay.

Migração: `supabase/migrations/20260325_create_webhook_events_table.sql`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `uuid` | PK (gen_random_uuid) |
| `event_id` | `text` | ID único da cobrança AbacatePay — **UNIQUE** |
| `processed_at` | `timestamptz` | Timestamp de processamento |
| `payload` | `jsonb` | Payload bruto recebido do webhook |

**Constraint:** `UNIQUE (event_id)` — tentativa de inserção duplicada retorna `error.code === '23505'`.

**RLS:** Habilitado **sem nenhuma policy** → bloqueado para anon key e JWTs de usuário. Acessível apenas pelo `service_role` key (admin client no backend).

---

## 7. Integração de Pagamento — AbacatePay

O FlashAprova usa AbacatePay para cobranças PIX one-time. O fluxo é **serverless**: o checkout cria uma cobrança, o AbacatePay redireciona o usuário após pagamento, e o webhook confirma de forma assíncrona.

### 7.1 Fluxo Completo

```
[Usuário na CheckoutPage]
    │
    ▼
POST /api/checkout  { email, name? }
    │
    ├─ Valida email (regex)
    ├─ Chama AbacatePay API: POST /billing/create
    │    ├─ frequency: ONE_TIME
    │    ├─ methods: [PIX]
    │    ├─ externalId: email  ← transporta o email até o webhook
    │    ├─ price: 6790 centavos (R$ 67,90)
    │    └─ returnUrl / completionUrl → /dashboard
    │
    └─ Retorna { url } → frontend redireciona para página PIX
    │
    ▼
[Usuário paga no ambiente AbacatePay]
    │
    ▼
POST /api/webhooks/abacate  (header: x-webhook-secret)
    │
    ├─ 1. Valida segredo (timingSafeEqual)
    ├─ 2. Parse do payload AbacatePayload
    ├─ 3. Extrai status, email, name de payload flat ou nested (data.*)
    ├─ 4. Ignora se status ∉ { PAID, CONFIRMED }
    ├─ 5. IDEMPOTÊNCIA: tenta INSERT em webhook_events
    │    └─ Se error.code === '23505' → já processado → retorna 200 sem ação
    ├─ 6. Busca user por email em auth.users (findUserIdByEmail)
    │    ├─ SE EXISTE: grantProPlan(userId)
    │    │    └─ upsert user_stats: plan=proai_plus, expires=now+365d
    │    └─ SE NÃO EXISTE: inviteUserByEmail
    │         ├─ Cria conta + envia email de acesso com link
    │         ├─ grantProPlan(newUserId)
    │         └─ Fallback: se invite falhar, busca usuário criado no race-condition
    │
    └─ Retorna { received: true, action: 'plan_updated' | 'user_created' | ... }
```

### 7.2 Garantia de Idempotência

O campo `payload.data?.id ?? payload.id` é o ID único da cobrança fornecido pelo AbacatePay. A lógica de proteção:

```typescript
const { error: insertError } = await adminClient
  .from('webhook_events')
  .insert({ event_id: eventId, payload });

if (insertError?.code === '23505') {
  // Evento já processado — retorna sem ação
  return NextResponse.json({ received: true, action: 'already_processed' });
}
```

Isso garante que **reenvios do webhook** (comum em integrações de pagamento) não resultem em duplicação de planos ou criação de múltiplas contas.

### 7.3 Segurança do Webhook

A validação usa `timingSafeEqual` do módulo nativo `crypto` (Node.js) para evitar timing attacks:

```typescript
import { timingSafeEqual } from 'crypto';

const secretOk = !!secret && secret.length === expectedSecret.length &&
  timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));
```

Comparação string simples (`secret !== expected`) permite ataques de timing que revelam o segredo byte-a-byte. `timingSafeEqual` garante tempo constante.

### 7.4 `findUserIdByEmail` — Limitação Conhecida

A função varre a tabela `auth.users` paginada (1000 por página) para encontrar um usuário por email. Comportamento adequado para MVP mas que deve ser substituído por uma **RPC function** do Supabase quando a base de usuários ultrapassar 10k:

```sql
-- Solução futura:
CREATE OR REPLACE FUNCTION find_user_by_email(target_email text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE email = target_email LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 8. Rotas de API

Todas as rotas estão em `app/api/` com `export const runtime = 'nodejs'`.

---

### `POST /api/checkout`

**Arquivo:** `app/api/checkout/route.ts`
**Auth:** Não requerida — funil de vendas sem login prévio
**Rate limit:** Não implementado (pendente)

**Request body:**
```typescript
{
  email: string;   // obrigatório, validado por regex
  name?: string;   // opcional, default: parte local do email
}
```

**Response (200):**
```typescript
{ url: string }  // link de pagamento PIX do AbacatePay
```

**Responses de erro:**
| Status | Condição |
|--------|----------|
| 400 | Payload JSON inválido |
| 422 | Email não passa no regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| 500 | `ABACATEPAY_API_KEY` não configurada |
| 502 | AbacatePay indisponível ou retornou erro |

---

### `POST /api/webhooks/abacate`

**Arquivo:** `app/api/webhooks/abacate/route.ts`
**Auth:** Header `x-webhook-secret` validado com `timingSafeEqual`
**Admin Client:** Usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS)

**Headers requeridos:**
```
x-webhook-secret: <ABACATEPAY_WEBHOOK_SECRET>
Content-Type: application/json
```

**Payload (AbacatePayload):**
```typescript
{
  id?:         string;        // ID único da cobrança (chave de idempotência)
  event?:      string;
  status?:     string;        // 'PAID' | 'CONFIRMED' | outros
  externalId?: string;        // email setado no checkout
  customer?: { email?: string; name?: string; };
  data?: {                    // estrutura nested (formato alternativo)
    id?: string;
    status?: string;
    externalId?: string;
    customer?: { email?: string; name?: string; };
  };
}
```

**Respostas possíveis:**
| Status | `action` | Condição |
|--------|----------|----------|
| 200 | `ignored` | Status ∉ `{PAID, CONFIRMED}` |
| 200 | `already_processed` | `event_id` já existe em `webhook_events` |
| 200 | `plan_updated` | Usuário existente teve plano atualizado |
| 200 | `plan_updated_fallback` | Race condition resolvido (invite falhou, user encontrado) |
| 200 | `user_created` | Novo usuário criado + convite enviado |
| 400 | — | Email não encontrado no payload |
| 401 | — | Segredo inválido |
| 500 | — | Env não configurada ou falha no Supabase |

---

### `POST /api/chat/tutor`

**Arquivo:** `app/api/chat/tutor/route.ts`
**Auth:** `supabase.auth.getUser()` — 401 se não autenticado
**Plan check:** `fetchUserPlan(user.id)` — 403 se não for `proai_plus`
**Model:** `gpt-4o-mini` via OpenAI Responses API
**Rate limit:** Não implementado (pendente)

**Request body:**
```typescript
{
  message:              string;           // mensagem do usuário (obrigatório)
  tutor_id?:            string;           // ex: 'dr-chronos' (prioridade máxima)
  subject_title?:       string;           // ex: 'Física' (fallback se não tiver tutor_id)
  deck_title?:          string;           // ex: 'Mecânica Clássica' (injetado no 1º turno)
  previous_response_id?: string;         // ID da resposta anterior (mantém contexto)
}
```

**Resolução do tutor** (ordem de prioridade):
1. `tutor_id` → `getTutorById(tutorId)`
2. `subject_title` → `getTutorBySubject(subjectTitle)` (regex match)
3. `deck_title` → `getTutorBySubject(deckTitle)` (regex match)

**Injeção de contexto no 1º turno:**
```
[Contexto: O aluno está estudando o deck "${deckTitle}"]. Mensagem: ${userMessage}
```

**Response (200):**
```typescript
{
  text:                 string;  // resposta formatada do tutor (Markdown)
  previous_response_id: string;  // ID para continuidade da conversa
}
```

---

### `POST /api/chat/redacao`

**Arquivo:** `app/api/chat/redacao/route.ts`
**Auth:** `supabase.auth.getUser()` — 401 se não autenticado
**Plan check:** `fetchUserPlan(user.id)` — 403 se não for `proai_plus`
**Engine:** Agent Norma via `@openai/agents` SDK
**Persiste:** Salva em `essay_submissions` após correção

**Request body:**
```typescript
{
  tema:  string;  // tema da redação (obrigatório)
  texto: string;  // texto do aluno, mínimo 10 palavras
}
```

**Response (200):** `NormaResult` (ver seção 9.2)

---

### `POST /api/ai/grade-essay`

**Arquivo:** `app/api/ai/grade-essay/route.ts`
**Auth:** `supabase.auth.getUser()` — 401 se não autenticado
**Plan check:** `fetchUserPlan(user.id)` — 403 se não for `proai_plus`
**Engine:** OpenAI Chat Completions direto (sem agent loop, mais rápido)
**Model:** `gpt-4o-mini`, `temperature: 0.3`, `max_tokens: 1200`
**Persiste:** Tenta salvar em `essay_submissions` (não-bloqueante em caso de falha)

**Request body:**
```typescript
{
  tema:  string;  // tema da redação
  texto: string;  // texto do aluno, mínimo 10 palavras
}
```

**Diferença em relação a `/api/chat/redacao`:**
`/api/chat/redacao` usa o Agent Norma com `@openai/agents` (suporta file_search e multi-step reasoning). `/api/ai/grade-essay` faz uma chamada direta mais simples ao `chat/completions`. A rota de redação é preferida para avaliações completas.

---

## 9. Lógica de IA — Tutores e Norma

### 9.1 Sistema de Tutores (`lib/tutor-config.ts`)

O arquivo é o **único source of truth** para todos os tutores. Cada entrada da array `TUTORS` define:

```typescript
interface TutorConfig {
  id:           string;       // 'dr-chronos', 'mestre-pi', etc.
  name:         string;       // "Dr. Chronos"
  title:        string;       // '"O Arquiteto do Tempo"'
  specialty:    string;       // exibido na UI
  tagline:      string;       // subtítulo de apresentação
  avatar_url:   string;       // DiceBear Lorelei SVG com seed único
  patterns:     RegExp[];     // padrões para match de subject title
  envKey:       string;       // chave do vector store (ex: 'HISTORIA')
  prompt:       string;       // system prompt completo (gerado por buildPrompt)
  opening:      string;       // 1ª mensagem do chat com {deck} interpolado
  isStrategist?: boolean;     // true = FlashTutor (sem subject)
}
```

**Os 12 Tutores Especialistas:**

| ID | Nome | Especialidade | Padrão de Match |
|----|------|--------------|----------------|
| `dr-chronos` | Dr. Chronos | História / C. Humanas | `/hist/i`, `/ci[eê]ncias.?humanas/i` |
| `dr-atlas` | Dr. Atlas | Geografia | `/geo/i` |
| `dr-bio` | Dr. Bio | Biologia | `/biol/i` |
| `mestre-newton` | Mestre Newton | Física | `/f[ií]sic/i` |
| `prof-atomo` | Prof. Átomo | Química | `/qu[ií]m/i` |
| `mestre-pi` | Mestre Pi | Matemática | `/matem/i` |
| `prof-sintaxe` | Prof. Sintaxe | Língua Portuguesa | `/portugu/i`, `/l[ií]ngua/i` |
| `prof-norma` | Prof. Norma | Redação | `/reda[çc]/i` |
| `mestra-agora` | Mestra Ágora | Filosofia | `/filosof/i` |
| `dr-socios` | Dr. Socios | Sociologia | `/sociol/i` |
| `prof-davinci` | Prof. Da Vinci | Artes | `/arte/i` |
| `prof-machado` | Prof. Machado | Literatura | `/liter/i` |

**FlashTutor (Estrategista):** Tutor adicional sem subject — consultor de performance global que analisa o radar de domínio e recomenda os especialistas do Panteão. Acessado via `getFlashTutor()`.

**Construção dos Prompts (`buildPrompt`):**

Todo prompt é montado com 4 camadas injetadas automaticamente:

```
1. Persona: "Você é o [Nome], [Título] do FlashAprova AiPro+..."
2. Emojis temáticos: âncoras visuais por disciplina
3. buildPersonalityRules: 4 regras (REACT → VARY → ANALOGIZE → METÁFORAS)
4. SCANNABLE_RULES: 7 regras obrigatórias de formatação (template, títulos, espaçamento)
```

**Scannable Learning Format** (injetado em todos os tutores):
```
### [Título Afirmativo com Emoji]

[EMOJI] **Rótulo**: Frase curta (≤15 palavras).

[EMOJI] **Rótulo**: Frase curta.

➡️ **Conclusão**: Frase conclusiva.

Encerramento técnico (sem perguntas).
```

**Vector Stores:**
Cada tutor resolve seu vector store via `getVectorStoreId(tutor)`:
```typescript
const specific = process.env[`${tutor.envKey}_VECTOR_STORE_ID`];
return specific ?? process.env.OPENAI_VECTOR_STORE_ID ?? null;
```
Se não houver vector store, o tutor funciona sem `file_search` (apenas no conhecimento do modelo).

**Continuidade de Conversa:**
A API usa `previous_response_id` da OpenAI Responses API para manter o contexto sem reenviar o histórico completo a cada turno.

### 9.2 Agente Norma (`lib/agents/norma.ts`)

Norma é um `Agent` do `@openai/agents` SDK. Usa `gpt-4o-mini` com `fileSearchTool` apontando para o vector store de referências do ENEM.

**Tipos de saída:**
```typescript
type CompetenciaResult = {
  nota:     number;   // 0–200 por competência
  nivel:    string;   // 'Excelente' | 'Bom' | 'Regular' | 'Insuficiente' | 'Ausente'
  feedback: string;   // análise específica com referências ao texto do aluno
};

type NormaResult = {
  nota_total:          number;   // c1+c2+c3+c4+c5 (0–1000) — recalculado pelo código
  competencias: {
    c1: CompetenciaResult;  // Domínio da norma culta
    c2: CompetenciaResult;  // Compreensão da proposta
    c3: CompetenciaResult;  // Seleção e organização de informações
    c4: CompetenciaResult;  // Mecanismos linguísticos
    c5: CompetenciaResult;  // Proposta de intervenção
  };
  veredito:            string;   // 2–3 parágrafos de diagnóstico geral
  pontos_fortes:       string[];
  pontos_melhoria:     string[];
  sugestao_repertorio: string[]; // 2 alusões históricas/filosóficas
};
```

**As 5 Competências ENEM:**
| # | Nome | Peso | Critério Principal |
|---|------|------|--------------------|
| C1 | Domínio da norma culta | 0–200 | Ortografia, morfossintaxe, concordância |
| C2 | Compreensão da proposta | 0–200 | Adequação ao tema, tipo textual |
| C3 | Seleção e organização | 0–200 | Qualidade dos argumentos e repertório |
| C4 | Mecanismos linguísticos | 0–200 | Coesão, conectivos, progressão textual |
| C5 | Proposta de intervenção | 0–200 | 5 elementos: Agente+Ação+Modo+Finalidade+Detalhe |

**Proteção anti-alucinação:**
```typescript
// Recalcula nota_total pelo código mesmo após o JSON do modelo
const c = parsed.competencias;
parsed.nota_total = c.c1.nota + c.c2.nota + c.c3.nota + c.c4.nota + c.c5.nota;
```

**Singleton lazy:** O agente é instanciado uma única vez e reutilizado entre requests:
```typescript
let _normaAgent: Agent | null = null;
function getNormaAgent(): Agent {
  if (!_normaAgent) _normaAgent = buildNormaAgent();
  return _normaAgent;
}
```

---

## 10. Algoritmo SRS

O FlashAprova implementa uma variante do **SM-2** (SuperMemo 2) adaptado para o contexto do ENEM.

### 10.1 Rating de 4 Pontos

No momento de revisar um card, o usuário escolhe:

| Rating | Significado | Ação no SM-2 |
|--------|-------------|-------------|
| 1 — Errei | Não lembrou | Reset: interval=1, repetitions=0 |
| 2 — Difícil | Lembrou com esforço | Interval = max(1, interval×0.8), ease−0.15 |
| 3 — Bom | Lembrou bem | Interval = interval × ease_factor |
| 4 — Fácil | Lembrou sem esforço | Interval = interval × ease_factor × 1.3, ease+0.15 |

### 10.2 Campos no Banco

```sql
user_progress.interval_days   -- dias até a próxima revisão
user_progress.ease_factor      -- fator de facilidade (default 2.5, min ~1.3)
user_progress.due_date         -- date da próxima revisão
user_progress.repetitions      -- contador de revisões bem-sucedidas
```

### 10.3 Modo Turbo (`app/study/turbo/page.tsx`)

O modo Turbo agrega **todos os cards com `due_date <= today`** de todas as matérias numa única fila de revisão. Ideal para sessões rápidas de manutenção diária.

---

## 11. Sistema de Domínio e Progresso

### 11.1 `calcDomain` (`lib/domain.ts`)

O nível de domínio de uma matéria é calculado com:

```
score = avg_interval_days × √(coverage)
```

onde `coverage = cards_estudados / total_cards_da_matéria`.

| Score | Nível | Label | Cor |
|-------|-------|-------|-----|
| 0 (coverage=0) | 0 | Não iniciado | `#334155` |
| < 1.5 | 1 | Iniciante | `#64748b` |
| < 5 | 2 | Aprendendo | `#3b82f6` |
| < 12 | 3 | Consolidando | `#f97316` |
| < 25 | 4 | Dominando | `#00e5ff` |
| ≥ 25 | 5 | Mestre | `#00ff80` |

A penalidade via `√(coverage)` garante que não é possível atingir nível 5 estudando apenas uma fração dos cards.

### 11.2 `buildDomainMap`

Constrói o mapa `subjectId → DomainLevel` a partir dos dados brutos do Supabase:

```typescript
buildDomainMap(allCards: CardRow[], progress: ProgressRow[]): Map<string, DomainLevel>
```

Usado no dashboard para renderizar o Radar Chart e os SubjectCards.

### 11.3 Categorias ENEM (`lib/categories.ts`)

Resolve nomes de categorias do banco (que podem ter variações de grafia) para metadados canônicos via regex:

```typescript
getCategoryInfo('Ciências da Natureza e suas Tecnologias')
// → { displayName: '...', short: 'Natureza', color: '#7C3AED', icon: '🔬' }
```

---

## 12. Design System e Tokens Visuais

### 12.1 Paleta Principal (`app/LandingPage.tsx`)

| Token | Valor | Uso |
|-------|-------|-----|
| `NEON` | `#00FF73` | Verde Neon — cor primária, CTAs, destaques positivos |
| `VIOLET` | `#7C3AED` | Roxo Elétrico — identidade de marca, glow de cards |
| `ORANGE` | `#FF8A00` | Laranja Vibrante — "esquecer", dor, urgência |
| `GREEN` | `#22c55e` | Verde secundário — Biologia, stat de 24h |
| `CARD_BG` | `rgba(255,255,255,0.04)` | Glassmorphism sobre Grafite |
| `CARD_BG2` | `rgba(255,255,255,0.05)` | Glassmorphism ligeiramente mais opaco |

### 12.2 Background Global

```css
/* globals.css */
body {
  background-color: #121212;  /* Grafite Escuro Profundo */
}

/* Grid overlay via LandingPage.tsx */
backgroundImage: `
  linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)
`
backgroundSize: '48px 48px'
```

### 12.3 Efeito Neon Roxo nos Cards

Todos os cards da landing usam glow violet sutil:
```css
box-shadow: 0 0 20px rgba(124,58,237,0.10), 0 0 0 1px rgba(124,58,237,0.06)
```

### 12.4 Animações CSS (`globals.css`)

| Classe | Keyframe | Uso |
|--------|----------|-----|
| `.cta-pulse` | `cta-pulse` | Botão CTA principal: pulsa em verde neon (#00FF73) |
| `.fade-up` / `.fade-up-d1..d4` | `fade-up` | Elementos do Hero aparecem escalonados |
| `.orb-a` / `.orb-b` | `orb-drift-a/b` | Orbs ambiente flutuam lentamente |
| `.pulse-glow-violet` | `pulse-violet` | Bordas pulsantes roxo nos cards do dashboard |
| `.pulse-glow-green` | `pulse-green` | Bordas pulsantes verde neon |
| `.shimmer-card` | `shimmer-slide` | Efeito shimmer nos cards de checkout |
| `.cursor-blink` | `blink` | Cursor de texto piscante |
| `.overlay-in` / `.card-in` | `overlay-in` / `card-in` | Modais e cards entrando na tela |

---

## 13. Segurança — Decisões e Implementações

### 13.1 Security Headers HTTP (`next.config.ts`)

Aplicados em todas as rotas (`source: '/(.*)'`):

| Header | Valor | Proteção |
|--------|-------|----------|
| `X-Content-Type-Options` | `nosniff` | Evita MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking via iframe |
| `X-XSS-Protection` | `1; mode=block` | XSS filter legacy browsers |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita vazamento de URL |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Desabilita APIs de hardware |

### 13.2 Row Level Security (RLS)

| Tabela | Política | Acesso |
|--------|----------|--------|
| `user_progress` | `auth.uid() = user_id` | Isolamento total por usuário |
| `user_stats` | `auth.uid() = user_id` | Isolamento total por usuário |
| `essay_submissions` | `auth.uid() = user_id` | SELECT e INSERT apenas próprios |
| `webhook_events` | Sem policies | Bloqueado para todos — só service_role |
| `profiles` | `auth.uid() = id` | Usuário lê/edita apenas próprio perfil |

### 13.3 Timing-Safe Comparison no Webhook

```typescript
import { timingSafeEqual } from 'crypto';

const secretOk = !!secret && secret.length === expectedSecret.length &&
  timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));
```

### 13.4 Separação de Clientes Supabase

- **Anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): exposta ao frontend, sujeita a RLS.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`): usada **apenas** no webhook handler server-side. Bypassa RLS. Nunca enviada ao browser.

### 13.5 Proteção de Rotas em Camadas

```
Camada 1: middleware.ts       → Bloqueia requests não autenticados
Camada 2: Server Components   → Verifica role (admin), verifica plan
Camada 3: API Routes          → Re-verifica auth + plan antes de processar
```

Nenhuma route confia exclusivamente no middleware — cada handler valida o usuário independentemente.

---

## 14. Scripts e Ferramentas de Desenvolvimento

### 14.1 Scripts `package.json`

| Script | Comando | Uso |
|--------|---------|-----|
| `dev` | `next dev` | Servidor de desenvolvimento local |
| `build` | `next build` | Build de produção (verifica TypeScript) |
| `start` | `next start` | Servidor de produção local |
| `seed` | `tsx --env-file=.env.local scripts/seed.ts` | Popula o banco com dados iniciais |

### 14.2 Migrations Supabase

```bash
# Aplicar migrations no projeto Supabase
supabase db push

# Ou via painel SQL Editor: cole o conteúdo da migration diretamente
```

**Ordem de aplicação:**
1. `20260318_create_essays_table.sql` — cria `essay_submissions` com RLS
2. `20260325_create_webhook_events_table.sql` — cria `webhook_events` com UNIQUE constraint

### 14.3 Adicionando um Novo Tutor

Para adicionar um novo especialista ao Panteão, apenas adicione um objeto à array `TUTORS` em `lib/tutor-config.ts`:

```typescript
{
  id:         'prof-novo',
  name:       'Prof. Novo',
  title:      '"O Mestre do Tema"',
  specialty:  'Especialidade',
  tagline:    'Tagline descritiva.',
  avatar_url: `${BASE}?seed=ProfNovo&${BG}`,
  patterns:   [/palavra-chave/i],
  envKey:     'NOVO',   // busca process.env.NOVO_VECTOR_STORE_ID
  opening:    `🎯 Prof. Novo aqui. **"{deck}"** — vamos dominar isso.`,
  prompt: buildPrompt(
    'Prof. Novo', '"O Mestre do Tema"', 'Especialidade',
    'Missão em uma frase.',
    '🎯 emoji1 · 📌 emoji2',
    ['Reação 1', 'Reação 2'],
    ['Metáfora 1', 'Metáfora 2'],
    ['Analogia 1', 'Analogia 2'],
    'Exemplo de resposta perfeita aqui...',
  ),
},
```

Nenhum outro arquivo precisa ser alterado. O roteamento, a UI e a API resolvem o tutor automaticamente por regex match no título da matéria.

---

*Documento mantido por [Bruno M. Sena](https://github.com/brunomgsena-stack). Última atualização: 25/03/2026.*
