# Lead Events no /painel — Design

**Data:** 2026-05-28
**Status:** Design aprovado, aguardando review da spec escrita
**Contexto relacionado:**
- [`2026-05-19-admin-leads-panel-design.md`](./2026-05-19-admin-leads-panel-design.md) (painel atual)
- [`2026-05-28-meta-events-checkout-design.md`](./2026-05-28-meta-events-checkout-design.md) (AddToCart/InitiateCheckout)
- [`2026-05-17-meta-conversions-api-design.md`](./2026-05-17-meta-conversions-api-design.md) (CAPI base)

## Objetivo

Persistir cada evento de funil disparado para o Meta numa nova tabela `lead_events`, agrupar os eventos por email no `/painel`, e mostrar por lead: (a) estágio atual do funil como badge na tabela e (b) timeline detalhada quando a linha é expandida.

Hoje os eventos AddToCart, InitiateCheckout, CompleteRegistration, OnboardingCompleted e Purchase só viajam pro Pixel/CAPI e somem — não há registro local de "o que cada lead fez".

## Não-objetivos

- Não criar fonte de verdade alternativa pro Meta (continuamos enviando pra CAPI normalmente).
- Não fazer backfill dos eventos passados — só passamos a gravar a partir do deploy. Leads existentes começam com estágio `'Lead'` até interagirem novamente.
- Não alterar o gate de acesso ao `/painel` nem o layout principal — apenas adiciona coluna, expansão e filtro.

## Arquitetura

```
Cliente (Pixel) ───────────────►  Meta
       │
       └─► POST /api/meta/<route> ─► sendMetaEvent (CAPI) ──► Meta
                                  └─► recordLeadEvent() ────► supabase.lead_events

Webhook Asaas ─► trackPurchase (CAPI) ──► Meta
              └─► recordLeadEvent('Purchase') ──► supabase.lead_events

/painel page (server) ─► leads + lead_events (service_role)
                       └─► agrega por email → stage + timeline
                       └─► render no LeadsDashboard
```

A gravação na tabela é **paralela** à chamada de CAPI, **never blocking**, **try/catch** que engole. Mesmo padrão best-effort do tracking existente.

## Banco de dados

### Tabela `public.lead_events`

```sql
create table public.lead_events (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  event_name  text not null,          -- 'AddToCart' | 'InitiateCheckout' | 'CompleteRegistration' | 'OnboardingCompleted' | 'Purchase'
  occurred_at timestamptz not null default now(),
  metadata    jsonb,                  -- ex.: { planId, value, planName } para InitiateCheckout/Purchase
  created_at  timestamptz not null default now(),
  constraint lead_events_email_len  check (char_length(email) <= 320),
  constraint lead_events_email_shape check (position('@' in email) > 1),
  constraint lead_events_event_name_len check (char_length(event_name) <= 64)
);

create index lead_events_email_lower_idx
  on public.lead_events ((lower(email)), occurred_at desc);

create index lead_events_occurred_at_idx
  on public.lead_events (occurred_at desc);
```

### RLS

Idêntica a `webhook_events` — só `service_role` lê e escreve. Sem policies, sem GRANT pra `anon`/`authenticated`.

```sql
alter table public.lead_events enable row level security;
alter table public.lead_events force  row level security;
revoke all on public.lead_events from anon, authenticated;
```

### Migration

Arquivo: `supabase/migrations/20260528_create_lead_events.sql`.

Sem backfill. Eventos passados se perdem.

## Helper compartilhado

Novo arquivo `lib/lead-events.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin';

export type LeadEventName =
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'CompleteRegistration'
  | 'OnboardingCompleted'
  | 'Purchase';

export async function recordLeadEvent(args: {
  email: string;
  eventName: LeadEventName;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  try {
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes('@') || email.length > 320) return;

    const admin = createAdminClient();
    await admin.from('lead_events').insert({
      email,
      event_name: args.eventName,
      occurred_at: (args.occurredAt ?? new Date()).toISOString(),
      metadata: args.metadata ?? null,
    });
  } catch (err) {
    console.error('[lead-events] insert falhou:', err instanceof Error ? err.message : String(err));
  }
}

// Estágio derivado a partir da lista de eventos do lead.
// Prioridade: do mais avançado pro menos avançado.
const STAGE_PRIORITY = [
  'Purchase',
  'InitiateCheckout',
  'AddToCart',
  'CompleteRegistration',
  'OnboardingCompleted',
] as const;

export type LeadStage =
  | 'Pagou'
  | 'Iniciou checkout'
  | 'Carrinho'
  | 'Cadastrou'
  | 'Onboarding'
  | 'Lead';

const STAGE_LABEL: Record<string, LeadStage> = {
  Purchase:             'Pagou',
  InitiateCheckout:     'Iniciou checkout',
  AddToCart:            'Carrinho',
  CompleteRegistration: 'Cadastrou',
  OnboardingCompleted:  'Onboarding',
};

export function currentStage(events: { event_name: string }[]): LeadStage {
  for (const name of STAGE_PRIORITY) {
    if (events.some(e => e.event_name === name)) return STAGE_LABEL[name];
  }
  return 'Lead';
}
```

## Pontos de gravação

| Evento                 | Arquivo                                                        | metadata                                       |
|------------------------|----------------------------------------------------------------|------------------------------------------------|
| `AddToCart`            | `app/api/meta/add-to-cart/route.ts`                            | `null`                                         |
| `InitiateCheckout`     | `app/api/meta/initiate-checkout/route.ts`                      | `{ planId, value, planName }`                  |
| `CompleteRegistration` | `app/api/meta/complete-registration/route.ts`                  | `null`                                         |
| `OnboardingCompleted`  | `app/api/onboarding/generate-plan/route.ts` (dentro do `after`)| `null`                                         |
| `Purchase`             | `app/api/webhook/asaas/route.ts`                               | `{ planId, planName, value, paymentId }`       |

Cada inserção fica **logo após** a chamada da função `trackXxx` correspondente, num `try/catch` **independente** do `try/catch` do CAPI (uma falha de gravação no banco não pode mascarar uma falha do CAPI e vice-versa). `recordLeadEvent` já engole erros internamente — o `try/catch` externo aqui é só defense in depth.

Para `AddToCart`, `CompleteRegistration` e `InitiateCheckout` a rota só grava se `email` está presente e válido (mesma checagem já existente). Quando vier vazio (caso anônimo), grava nada — não há lead pra associar.

Para `Purchase`, o webhook já resolve o email (`payment.externalReference` → `payment.customerEmail` → Asaas API). Reaproveitamos a variável `email` que já existe no fluxo.

## Página /painel

### Carregamento (`app/painel/page.tsx`)

Adicionar nova query após o carregamento de `leads`:

```ts
const { data: eventsRaw } = await supabase
  .from('lead_events')
  .select('id, email, event_name, occurred_at, metadata')
  .order('occurred_at', { ascending: false })
  .limit(20000);
```

Agrupar no servidor por `email.toLowerCase()` numa `Map<string, LeadEvent[]>` e anexar `events[]` + `stage` em cada `lead` antes de passar pro client.

### Tipo `PanelData` estendido

```ts
export type LeadEvent = {
  id: string;
  event_name: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  created_at: string;
  events: LeadEvent[];   // ordenados desc por occurred_at
  stage: LeadStage;       // derivado de events
};

export type PanelData = {
  leads: Lead[];
  metrics: { /* já existente */ };
  totalContas: number;
  assinaturasPagas: number;
  stageCounts: Record<LeadStage, number>;   // novo
};
```

### LeadsDashboard

Mudanças em `app/painel/LeadsDashboard.tsx`:

1. **Cards de métricas**: adicionar 1 linha de 6 cards menores com `stageCounts` (Pagou / Iniciou / Carrinho / Cadastrou / Onboarding / Só lead).
2. **Filtro de estágio**: dropdown `<select>` ao lado da busca. Default `'Todos'`. Filtra `filtered` pelo `stage`.
3. **Coluna nova "Estágio"** entre `WhatsApp` e `Data`. Badge colorido pela `LeadStage`:
   - `Pagou` — verde `#22c55e`
   - `Iniciou checkout` — âmbar `#f59e0b`
   - `Carrinho` — laranja `#f97316`
   - `Cadastrou` — azul `#3b82f6`
   - `Onboarding` — cyan `#06b6d4`
   - `Lead` — cinza `#6b7280`
4. **Linha expansível**: clicar na `<tr>` toggla expansão. Quando expandida, uma `<tr>` adicional logo abaixo ocupa todas as colunas (`colSpan`) e renderiza a timeline:
   ```
   ● Pagou — 28/05 14:32 — plano: aceleração, R$ 257
   ● Iniciou checkout — 28/05 14:30 — plano: aceleração
   ● Carrinho — 28/05 14:28
   ● Cadastrou — 25/05 10:11
   ● Onboarding — 25/05 10:08
   ● Lead capturado — 25/05 10:00
   ```
   Sem chamada server-side adicional — todos os eventos já vieram pré-carregados.
5. **Export CSV**: estende para incluir `stage` e a quantidade de eventos. Sem timeline detalhada (manter export simples).

### State client (LeadsDashboard)

- `expandedId: string | null` — lead aberto no momento (uma linha por vez).
- `stageFilter: LeadStage | 'Todos'`.

## Tratamento de erros

- **`recordLeadEvent` falha:** logamos e seguimos. Não afeta tracking Meta nem checkout. Tabela pode ficar com lacunas se o Supabase estiver fora — aceitável.
- **`/painel` query falha:** tratamos `eventsRaw = []`. Cada lead fica com `events: []` e `stage: 'Lead'`. UI continua funcionando.
- **Email mismatch:** evento com email que não existe em `leads` (ex: usuário logou direto sem passar pelo quizz). Esses eventos ficam órfãos. Por enquanto **não exibimos**. Documentado como follow-up.

## Testes

`lib/__tests__/lead-events.test.ts`:

1. `currentStage` retorna `'Pagou'` quando há Purchase + outros.
2. `currentStage` respeita prioridade quando há InitiateCheckout sem Purchase.
3. `currentStage` retorna `'Lead'` para array vazio.
4. `recordLeadEvent` ignora email inválido (sem `@`, vazio, ou > 320 chars) — silencioso, sem throw, sem insert. Mockar `createAdminClient`.

Não testar routes via integração HTTP (mesmo padrão do projeto).

## Migration & deploy

1. Criar `supabase/migrations/20260528_create_lead_events.sql` (CREATE TABLE + RLS + indices).
2. Aplicar via `supabase db push` ou MCP `apply_migration`.
3. Deploy do código.
4. Eventos novos passam a aparecer no painel imediatamente.

Sem feature flag — feature é puramente aditiva no schema (tabela nova) e aditiva na UI (sem quebra de contrato).

## Riscos

- **Volume**: cada visita a `/checkout` gera AddToCart. Se o tráfego subir muito, a tabela cresce. Mitigação futura: TTL via cron (`delete where occurred_at < now() - interval '180 days'`). Não bloqueia este design.
- **PII**: email armazenado em outra tabela. Já temos isso em `leads`, `profiles`, `webhook_events` — não é introdução nova, mas mais um lugar pra revogar em pedido de exclusão LGPD. Documentar como follow-up.
- **Race condition**: dois eventos quase simultâneos do mesmo lead. Inserts independentes, sem unique key — aceitável (e desejável, pois cada disparo é um evento real).

## Variáveis de ambiente

Nenhuma nova. Reusa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` já em `createAdminClient()`.

## Follow-ups (fora de escopo)

- Backfill retroativo de `Purchase` a partir de `webhook_events` e `OnboardingCompleted` a partir de `profiles.onboarding_completed`.
- Mostrar leads órfãos (email com eventos mas sem registro em `leads`) numa aba separada.
- TTL/limpeza automática de eventos antigos.
- Funnel chart (não só badges + timeline).
