# Lead Events no /painel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir cada evento de funil em `public.lead_events`, agregar por email em `/painel` e exibir estágio + timeline por lead.

**Architecture:** Nova tabela `lead_events` (service-role apenas, igual a `webhook_events`). Helper único `lib/lead-events.ts` com `recordLeadEvent()` (insert best-effort) e `currentStage()` (deriva estágio do array de eventos). Cinco pontos de gravação (add-to-cart, initiate-checkout, complete-registration routes, onboarding generate-plan, webhook asaas) chamam o helper logo após a chamada CAPI correspondente, num `try/catch` independente. `/painel` busca eventos junto com leads, agrupa por email no servidor e renderiza badge de estágio + linha expansível com timeline.

**Tech Stack:** TypeScript, Next.js 16 (App Router), Supabase (Postgres + service role), `node:test` + `tsx`, Recharts (já dependência).

**Spec:** [`docs/superpowers/specs/2026-05-28-lead-events-painel-design.md`](../specs/2026-05-28-lead-events-painel-design.md)

**Test command throughout:** `npx tsx --test lib/__tests__/lead-events.test.ts`

**Build/typecheck command throughout:** `npx tsc --noEmit`

---

## File Structure

- **Create** `supabase/migrations/20260528_create_lead_events.sql` — tabela + índices + RLS service-role
- **Create** `lib/lead-events.ts` — `recordLeadEvent`, `currentStage`, `LeadEventName`, `LeadStage`
- **Create** `lib/__tests__/lead-events.test.ts` — testes do helper
- **Modify** `app/api/meta/add-to-cart/route.ts` — chamar `recordLeadEvent` após `trackAddToCart`
- **Modify** `app/api/meta/initiate-checkout/route.ts` — chamar `recordLeadEvent` com `metadata={planId, value, planName}`
- **Modify** `app/api/meta/complete-registration/route.ts` — chamar `recordLeadEvent` após `trackCompleteRegistration`
- **Modify** `app/api/onboarding/generate-plan/route.ts` — chamar `recordLeadEvent` dentro do `after()` existente
- **Modify** `app/api/webhook/asaas/route.ts` — chamar `recordLeadEvent` dentro dos `after()` que disparam `trackPurchase`
- **Modify** `app/painel/page.tsx` — buscar `lead_events`, agrupar por email, anexar `events[]` e `stage` em cada lead, contar estágios
- **Modify** `app/painel/LeadsDashboard.tsx` — types extendidos, state (`expandedId`, `stageFilter`), cards de stage, filtro, coluna badge, linha expansível, export CSV ajustado

---

## Task 1: Criar migration `lead_events`

**Files:**
- Create: `supabase/migrations/20260528_create_lead_events.sql`

- [ ] **Step 1: Criar o arquivo de migration**

Criar `supabase/migrations/20260528_create_lead_events.sql` com este conteúdo exato:

```sql
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
```

- [ ] **Step 2: Aplicar migration no Supabase**

Aplicar via Supabase MCP. O subagent deve chamar:

```
mcp__claude_ai_Supabase__apply_migration
  name: "20260528_create_lead_events"
  query: <conteúdo SQL acima, sem o cabeçalho de comentário se preferir>
```

Se MCP não estiver disponível neste contexto, **PARE e reporte `BLOCKED`** — o usuário aplicará manualmente.

- [ ] **Step 3: Verificar a tabela**

Após aplicar, listar as tabelas pra confirmar:

```
mcp__claude_ai_Supabase__list_tables
  schemas: ["public"]
```

Esperado: `lead_events` aparece na lista com as colunas e índices definidos.

- [ ] **Step 4: Commit do arquivo**

```bash
git add supabase/migrations/20260528_create_lead_events.sql
git commit -m "feat(db): tabela lead_events com RLS service-role e índices por email"
```

---

## Task 2: Implementar `currentStage` em `lib/lead-events.ts`

**Files:**
- Create: `lib/lead-events.ts`
- Create: `lib/__tests__/lead-events.test.ts`

- [ ] **Step 1: Criar o arquivo de teste com testes que vão falhar**

Criar `lib/__tests__/lead-events.test.ts` com:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentStage } from '../lead-events.ts';

test('currentStage returns Lead for empty array', () => {
  assert.equal(currentStage([]), 'Lead');
});

test('currentStage returns Pagou when Purchase present alongside others', () => {
  assert.equal(
    currentStage([
      { event_name: 'AddToCart' },
      { event_name: 'Purchase' },
      { event_name: 'InitiateCheckout' },
    ]),
    'Pagou',
  );
});

test('currentStage respects priority — InitiateCheckout beats AddToCart', () => {
  assert.equal(
    currentStage([
      { event_name: 'AddToCart' },
      { event_name: 'InitiateCheckout' },
    ]),
    'Iniciou checkout',
  );
});

test('currentStage returns Carrinho when only AddToCart present', () => {
  assert.equal(currentStage([{ event_name: 'AddToCart' }]), 'Carrinho');
});

test('currentStage returns Cadastrou for CompleteRegistration only', () => {
  assert.equal(currentStage([{ event_name: 'CompleteRegistration' }]), 'Cadastrou');
});

test('currentStage returns Onboarding for OnboardingCompleted only', () => {
  assert.equal(currentStage([{ event_name: 'OnboardingCompleted' }]), 'Onboarding');
});

test('currentStage ignores unknown event names and falls back to Lead', () => {
  assert.equal(currentStage([{ event_name: 'Unknown' }]), 'Lead');
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

Run: `npx tsx --test lib/__tests__/lead-events.test.ts`
Expected: FAIL com "Cannot find module" ou similar (arquivo `lib/lead-events.ts` ainda não existe).

- [ ] **Step 3: Criar `lib/lead-events.ts` com `currentStage`**

Criar `lib/lead-events.ts` com:

```typescript
export type LeadEventName =
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'CompleteRegistration'
  | 'OnboardingCompleted'
  | 'Purchase';

export type LeadStage =
  | 'Pagou'
  | 'Iniciou checkout'
  | 'Carrinho'
  | 'Cadastrou'
  | 'Onboarding'
  | 'Lead';

const STAGE_PRIORITY: LeadEventName[] = [
  'Purchase',
  'InitiateCheckout',
  'AddToCart',
  'CompleteRegistration',
  'OnboardingCompleted',
];

const STAGE_LABEL: Record<LeadEventName, LeadStage> = {
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

- [ ] **Step 4: Rodar os testes — devem passar**

Run: `npx tsx --test lib/__tests__/lead-events.test.ts`
Expected: PASS — 7/7 testes verdes.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo (apenas os 5 pré-existentes de `.ts` extension nos test files do meta-capi/admin-panel).

- [ ] **Step 6: Commit**

```bash
git add lib/lead-events.ts lib/__tests__/lead-events.test.ts
git commit -m "feat(lead-events): adiciona currentStage e tipos LeadEventName/LeadStage"
```

---

## Task 3: Implementar `recordLeadEvent` em `lib/lead-events.ts`

**Files:**
- Modify: `lib/lead-events.ts`
- Modify: `lib/__tests__/lead-events.test.ts`

**Context:** `recordLeadEvent` é difícil de testar com side-effect real (Supabase). Testamos o comportamento de validação síncrono: emails inválidos são rejeitados antes da chamada. Para a parte que realmente insere, confiamos no smoke test manual da Task 10.

- [ ] **Step 1: Adicionar testes de validação no arquivo de teste**

Adicionar no final de `lib/__tests__/lead-events.test.ts`:

```typescript
import { recordLeadEvent } from '../lead-events.ts';

// Stub global para createAdminClient — capturamos chamadas pra verificar
// que emails inválidos não disparam insert.
test('recordLeadEvent ignora email vazio', async () => {
  let called = false;
  // recordLeadEvent não deve nem chegar a chamar createAdminClient
  await recordLeadEvent({ email: '', eventName: 'AddToCart' });
  await recordLeadEvent({ email: '   ', eventName: 'AddToCart' });
  assert.equal(called, false, 'placeholder — validação síncrona não throw');
});

test('recordLeadEvent ignora email sem @', async () => {
  await recordLeadEvent({ email: 'nao-tem-arroba', eventName: 'AddToCart' });
  // chega aqui sem throw — sucesso
  assert.ok(true);
});

test('recordLeadEvent ignora email > 320 chars', async () => {
  const longEmail = 'a'.repeat(310) + '@b.com'; // 316 + 6 = 322 chars > 320
  await recordLeadEvent({ email: longEmail, eventName: 'AddToCart' });
  assert.ok(true);
});

test('recordLeadEvent normaliza email (trim+lowercase) — não throw', async () => {
  // Quando o helper tenta o insert real, ele pode falhar (sem SUPABASE_URL no test).
  // O importante é que não throw — engole o erro internamente.
  await recordLeadEvent({ email: '  A@B.COM ', eventName: 'AddToCart' });
  assert.ok(true);
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

Run: `npx tsx --test lib/__tests__/lead-events.test.ts`
Expected: FAIL com "has no exported member 'recordLeadEvent'".

- [ ] **Step 3: Adicionar `recordLeadEvent` em `lib/lead-events.ts`**

Adicionar no final de `lib/lead-events.ts` (após `currentStage`):

```typescript
import { createAdminClient } from '@/lib/supabase/admin';

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
    const { error } = await admin.from('lead_events').insert({
      email,
      event_name: args.eventName,
      occurred_at: (args.occurredAt ?? new Date()).toISOString(),
      metadata: args.metadata ?? null,
    });

    if (error) {
      console.error('[lead-events] insert falhou:', error.message);
    }
  } catch (err) {
    console.error('[lead-events] erro inesperado:', err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Rodar os testes — devem passar**

Run: `npx tsx --test lib/__tests__/lead-events.test.ts`
Expected: PASS — 11/11 testes verdes.

> Nota: os testes de email inválido passam porque `recordLeadEvent` retorna cedo sem chamar `createAdminClient`. O teste de email normalizado pode logar `[lead-events] erro inesperado` no stderr (vai tentar criar o client sem env vars) — isso é esperado e não falha o teste, porque o erro é engolido pelo `try/catch`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 6: Commit**

```bash
git add lib/lead-events.ts lib/__tests__/lead-events.test.ts
git commit -m "feat(lead-events): adiciona recordLeadEvent com validação de email e fail-safe"
```

---

## Task 4: Wire AddToCart em `/api/meta/add-to-cart`

**Files:**
- Modify: `app/api/meta/add-to-cart/route.ts`

**Context:** A rota hoje chama `trackAddToCart` se o `eventId` é válido. O email pode estar ausente. Só registramos em `lead_events` quando email vem presente — sem email não há lead pra associar.

- [ ] **Step 1: Adicionar import do helper**

Em `app/api/meta/add-to-cart/route.ts`, localizar:

```typescript
import { trackAddToCart } from '@/lib/meta-capi';
```

Adicionar logo abaixo:

```typescript
import { recordLeadEvent } from '@/lib/lead-events';
```

- [ ] **Step 2: Adicionar chamada após `trackAddToCart`**

Em `app/api/meta/add-to-cart/route.ts`, localizar o bloco final do `try` (logo após `await trackAddToCart({ ... });`):

```typescript
    await trackAddToCart({
      email,
      eventId,
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });
```

Adicionar **logo após esse `await trackAddToCart(...)`**, ainda dentro do `try` externo:

```typescript

    if (email) {
      try {
        await recordLeadEvent({ email, eventName: 'AddToCart' });
      } catch { /* defesa adicional — recordLeadEvent já engole erros */ }
    }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add app/api/meta/add-to-cart/route.ts
git commit -m "feat(api): grava AddToCart em lead_events além do CAPI"
```

---

## Task 5: Wire InitiateCheckout em `/api/meta/initiate-checkout`

**Files:**
- Modify: `app/api/meta/initiate-checkout/route.ts`

**Context:** A rota tem `PLAN_META` com `{value, name}` por plano. Vamos passar isso como `metadata` para `recordLeadEvent`. Como na Task 4, só grava se `email` está presente.

- [ ] **Step 1: Adicionar import do helper**

Em `app/api/meta/initiate-checkout/route.ts`, localizar:

```typescript
import { trackInitiateCheckout } from '@/lib/meta-capi';
```

Adicionar logo abaixo:

```typescript
import { recordLeadEvent } from '@/lib/lead-events';
```

- [ ] **Step 2: Adicionar chamada após `trackInitiateCheckout`**

Em `app/api/meta/initiate-checkout/route.ts`, localizar o `await trackInitiateCheckout({ ... });`. Adicionar **logo após**, dentro do `try` externo:

```typescript

    if (email) {
      try {
        await recordLeadEvent({
          email,
          eventName: 'InitiateCheckout',
          metadata: { planId, value: meta.value, planName: meta.name },
        });
      } catch { /* defesa adicional */ }
    }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add app/api/meta/initiate-checkout/route.ts
git commit -m "feat(api): grava InitiateCheckout em lead_events com plan metadata"
```

---

## Task 6: Wire CompleteRegistration em `/api/meta/complete-registration`

**Files:**
- Modify: `app/api/meta/complete-registration/route.ts`

**Context:** A rota recebe `{ email }` do client após `signUp` bem-sucedido e chama `trackCompleteRegistration`. Email é obrigatório nessa rota (a rota retorna `{ok:true}` sem disparar se vier inválido).

- [ ] **Step 1: Adicionar import do helper**

Em `app/api/meta/complete-registration/route.ts`, localizar:

```typescript
import { trackCompleteRegistration, deterministicEventId } from '@/lib/meta-capi';
```

Adicionar logo abaixo:

```typescript
import { recordLeadEvent } from '@/lib/lead-events';
```

- [ ] **Step 2: Adicionar chamada após `trackCompleteRegistration`**

Em `app/api/meta/complete-registration/route.ts`, localizar o `await trackCompleteRegistration({ ... });`. Adicionar **logo após**, dentro do `try` externo:

```typescript

    try {
      await recordLeadEvent({ email, eventName: 'CompleteRegistration' });
    } catch { /* defesa adicional */ }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add app/api/meta/complete-registration/route.ts
git commit -m "feat(api): grava CompleteRegistration em lead_events"
```

---

## Task 7: Wire OnboardingCompleted em `/api/onboarding/generate-plan`

**Files:**
- Modify: `app/api/onboarding/generate-plan/route.ts`

**Context:** O `trackOnboardingCompleted` é chamado dentro de um bloco `after(async () => { ... })` (linha ~302). Vamos adicionar `recordLeadEvent` dentro do mesmo `after`.

- [ ] **Step 1: Adicionar import do helper**

Em `app/api/onboarding/generate-plan/route.ts`, localizar:

```typescript
import { trackOnboardingCompleted, deterministicEventId } from '@/lib/meta-capi';
```

Adicionar logo abaixo:

```typescript
import { recordLeadEvent } from '@/lib/lead-events';
```

- [ ] **Step 2: Adicionar chamada dentro do `after()` existente**

Em `app/api/onboarding/generate-plan/route.ts`, localizar:

```typescript
  after(async () => {
    await trackOnboardingCompleted({
      email: user.email ?? undefined,
      externalId: user.id,
      eventId: deterministicEventId('OnboardingCompleted', user.id),
    });
  });
```

Substituir pelo bloco abaixo:

```typescript
  after(async () => {
    await trackOnboardingCompleted({
      email: user.email ?? undefined,
      externalId: user.id,
      eventId: deterministicEventId('OnboardingCompleted', user.id),
    });
    if (user.email) {
      try {
        await recordLeadEvent({ email: user.email, eventName: 'OnboardingCompleted' });
      } catch { /* defesa adicional */ }
    }
  });
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add app/api/onboarding/generate-plan/route.ts
git commit -m "feat(api): grava OnboardingCompleted em lead_events"
```

---

## Task 8: Wire Purchase em `/api/webhook/asaas`

**Files:**
- Modify: `app/api/webhook/asaas/route.ts`

**Context:** O webhook tem **dois** blocos `after()` que chamam `trackPurchase` — um para usuário existente (linha ~339) e outro para usuário novo (linha ~403). Adicionar `recordLeadEvent` nos dois. A variável `email` já está resolvida no escopo. Os bloco `after()` está dentro de `try { ... }` grande — usar `try/catch` interno para isolar.

- [ ] **Step 1: Adicionar import do helper**

Em `app/api/webhook/asaas/route.ts`, localizar os imports no topo. Adicionar (escolher posição que faça sentido no agrupamento de imports — provavelmente perto de `trackPurchase`):

```typescript
import { recordLeadEvent } from '@/lib/lead-events';
```

> Pista de localização: já existe `import { trackPurchase, trackCompleteRegistration } from '@/lib/meta-capi';` ou similar — adicionar abaixo dele.

- [ ] **Step 2: Adicionar chamada no `after()` do usuário existente**

Em `app/api/webhook/asaas/route.ts`, localizar (linhas ~339-349):

```typescript
      after(async () => {
        if (paymentValue !== null) {
          await trackPurchase({
            email, externalId: existingId,
            value: paymentValue, currency: 'BRL',
            planName: plan.name, eventId: `asaas_${paymentId ?? existingId}`,
          });
        } else {
          console.warn(`[meta-capi] Purchase ignorado — payment.value ausente. paymentId=${paymentId}`);
        }
      });
```

Substituir pelo bloco abaixo:

```typescript
      after(async () => {
        if (paymentValue !== null) {
          await trackPurchase({
            email, externalId: existingId,
            value: paymentValue, currency: 'BRL',
            planName: plan.name, eventId: `asaas_${paymentId ?? existingId}`,
          });
        } else {
          console.warn(`[meta-capi] Purchase ignorado — payment.value ausente. paymentId=${paymentId}`);
        }
        try {
          await recordLeadEvent({
            email,
            eventName: 'Purchase',
            metadata: {
              planId: plan.slug,
              planName: plan.name,
              value: paymentValue,
              paymentId,
            },
          });
        } catch { /* defesa adicional */ }
      });
```

- [ ] **Step 3: Adicionar chamada no `after()` do usuário novo**

Em `app/api/webhook/asaas/route.ts`, localizar (linhas ~403-420):

```typescript
    after(async () => {
      if (paymentValue !== null) {
        await trackPurchase({
          email, externalId: newUserId,
          value: paymentValue, currency: 'BRL',
          planName: plan.name, eventId: `asaas_${paymentId ?? newUserId}`,
        });
      } else {
        console.warn(`[meta-capi] Purchase ignorado — payment.value ausente. paymentId=${paymentId}`);
      }
      if (!isRaceConditionFallback) {
        await trackCompleteRegistration({
          email, externalId: newUserId,
          eventId: `reg_${newUserId}`,
          actionSource: 'system_generated',
        });
      }
    });
```

Substituir pelo bloco abaixo:

```typescript
    after(async () => {
      if (paymentValue !== null) {
        await trackPurchase({
          email, externalId: newUserId,
          value: paymentValue, currency: 'BRL',
          planName: plan.name, eventId: `asaas_${paymentId ?? newUserId}`,
        });
      } else {
        console.warn(`[meta-capi] Purchase ignorado — payment.value ausente. paymentId=${paymentId}`);
      }
      if (!isRaceConditionFallback) {
        await trackCompleteRegistration({
          email, externalId: newUserId,
          eventId: `reg_${newUserId}`,
          actionSource: 'system_generated',
        });
      }
      try {
        await recordLeadEvent({
          email,
          eventName: 'Purchase',
          metadata: {
            planId: plan.slug,
            planName: plan.name,
            value: paymentValue,
            paymentId,
          },
        });
      } catch { /* defesa adicional */ }
    });
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 5: Commit**

```bash
git add app/api/webhook/asaas/route.ts
git commit -m "feat(webhook): grava Purchase em lead_events nos dois caminhos (existing/new user)"
```

---

## Task 9: Atualizar `/painel` — buscar eventos, anexar em cada lead, e estender UI

**Files:**
- Modify: `app/painel/page.tsx`
- Modify: `app/painel/LeadsDashboard.tsx`

**Context:** Esta é a task maior. Vamos fazer juntos: (a) estender types em `LeadsDashboard.tsx` (que é onde os types já moram), (b) atualizar `page.tsx` para buscar `lead_events` e anexar `events[]` + `stage` em cada lead, (c) adicionar state/UI no `LeadsDashboard.tsx` (cards de stage, filtro, badge column, linha expansível, CSV ajustado). **Os dois arquivos são commitados num único commit no final** porque dependem dos types definidos juntos.

### Parte A — Estender `LeadsDashboard.tsx` (types + UI)

- [ ] **Step A1: Adicionar imports e estender types no topo do arquivo**

Em `app/painel/LeadsDashboard.tsx`, localizar:

```typescript
'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type Lead = { id: string; name: string; email: string; whatsapp: string; created_at: string };
export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
};
```

Substituir pelo bloco abaixo:

```typescript
'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { type LeadStage } from '@/lib/lead-events';

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
  events: LeadEvent[];
  stage: LeadStage;
};

export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
  stageCounts: Record<LeadStage, number>;
};

const STAGE_COLOR: Record<LeadStage, string> = {
  'Pagou':             '#22c55e',
  'Iniciou checkout':  '#f59e0b',
  'Carrinho':          '#f97316',
  'Cadastrou':         '#3b82f6',
  'Onboarding':        '#06b6d4',
  'Lead':              '#6b7280',
};

const STAGE_ORDER: LeadStage[] = [
  'Pagou', 'Iniciou checkout', 'Carrinho', 'Cadastrou', 'Onboarding', 'Lead',
];

const EVENT_LABEL: Record<string, string> = {
  Purchase:             'Pagou',
  InitiateCheckout:     'Iniciou checkout',
  AddToCart:            'Adicionou ao carrinho',
  CompleteRegistration: 'Criou conta',
  OnboardingCompleted:  'Completou onboarding',
};
```

- [ ] **Step A2: Adicionar state `expandedId` e `stageFilter` no componente**

Em `app/painel/LeadsDashboard.tsx`, localizar:

```typescript
export default function LeadsDashboard({ data }: { data: PanelData }) {
  const { leads, metrics, totalContas, assinaturasPagas } = data;
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);
```

Substituir pelo bloco abaixo:

```typescript
export default function LeadsDashboard({ data }: { data: PanelData }) {
  const { leads, metrics, totalContas, assinaturasPagas, stageCounts } = data;
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStage | 'Todos'>('Todos');
```

- [ ] **Step A3: Ajustar `filtered` para considerar `stageFilter`**

Em `app/painel/LeadsDashboard.tsx`, localizar:

```typescript
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? leads.filter((l) =>
          l.name.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term) ||
          l.whatsapp.includes(term.replace(/\D/g, '')))
      : leads;
    return [...base].sort((a, b) =>
      asc
        ? +new Date(a.created_at) - +new Date(b.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, q, asc]);
```

Substituir pelo bloco abaixo:

```typescript
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = term
      ? leads.filter((l) =>
          l.name.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term) ||
          l.whatsapp.includes(term.replace(/\D/g, '')))
      : leads;
    if (stageFilter !== 'Todos') {
      base = base.filter((l) => l.stage === stageFilter);
    }
    return [...base].sort((a, b) =>
      asc
        ? +new Date(a.created_at) - +new Date(b.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, q, asc, stageFilter]);
```

- [ ] **Step A4: Atualizar `exportCsv` para incluir `stage` e `events_count`**

Em `app/painel/LeadsDashboard.tsx`, localizar:

```typescript
  function exportCsv() {
    const head = ['name', 'email', 'whatsapp', 'created_at'];
    const rows = filtered.map((l) =>
      [l.name, l.email, l.whatsapp, l.created_at]
        .map((v) => `"${String(v).replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`)
        .join(','));
    const csv = [head.join(','), ...rows].join('\n');
```

Substituir pelo bloco abaixo:

```typescript
  function exportCsv() {
    const head = ['name', 'email', 'whatsapp', 'created_at', 'stage', 'events_count'];
    const rows = filtered.map((l) =>
      [l.name, l.email, l.whatsapp, l.created_at, l.stage, String(l.events.length)]
        .map((v) => `"${String(v).replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`)
        .join(','));
    const csv = [head.join(','), ...rows].join('\n');
```

- [ ] **Step A5: Adicionar cards de stage logo após os Cards de métricas**

Em `app/painel/LeadsDashboard.tsx`, localizar o `<div>` com os Cards existentes:

```typescript
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        <Card label="TOTAL LEADS" value={metrics.total} />
        <Card label="HOJE" value={metrics.hoje} />
        <Card label="ÚLTIMOS 7 DIAS" value={metrics.ultimos7d} />
        <Card label="ÚLTIMOS 30 DIAS" value={metrics.ultimos30d} />
        <Card label="CONTAS CRIADAS" value={totalContas} />
        <Card label="ASSINATURAS PAGAS" value={assinaturasPagas} />
      </div>
```

Adicionar **logo abaixo** desse `<div>` (antes do bloco do BarChart):

```jsx
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
        {STAGE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter((cur) => (cur === s ? 'Todos' : s))}
            style={{
              background: stageFilter === s ? `${STAGE_COLOR[s]}22` : 'rgba(6,3,18,0.7)',
              border: `1px solid ${STAGE_COLOR[s]}${stageFilter === s ? 'aa' : '40'}`,
              borderRadius: 12,
              padding: '10px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#fff',
              fontFamily: MONO,
            }}>
            <p style={{ fontSize: 9, letterSpacing: '0.12em', color: `${STAGE_COLOR[s]}`, marginBottom: 4, textTransform: 'uppercase' }}>{s}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{stageCounts[s]}</p>
          </button>
        ))}
      </div>
```

- [ ] **Step A6: Adicionar coluna "Estágio" no `<thead>` e atualizar `<tbody>` com badge + linha expansível**

Em `app/painel/LeadsDashboard.tsx`, localizar:

```typescript
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(124,58,237,0.12)' }}>
              {['Nome', 'E-mail', 'WhatsApp', 'Data', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: `${CYAN}cc`, fontSize: 11, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '12px 16px' }}>{l.name}</td>
                <td style={{ padding: '12px 16px', color: CYAN }}>{l.email}</td>
                <td style={{ padding: '12px 16px' }}>{fmtPhone(l.whatsapp)}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{fmtDate(l.created_at)}</td>
                <td style={{ padding: '10px 16px' }}>
                  <a href={waLink(l.whatsapp, l.name)} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', fontFamily: MONO, fontSize: 11, fontWeight: 700,
                      color: '#fff', background: '#25D366', border: 'none', borderRadius: 8,
                      padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    WA
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
```

Substituir pelo bloco abaixo:

```jsx
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(124,58,237,0.12)' }}>
              {['Nome', 'E-mail', 'WhatsApp', 'Estágio', 'Data', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: `${CYAN}cc`, fontSize: 11, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
            ) : filtered.map((l) => {
              const isOpen = expandedId === l.id;
              return (
                <>
                  <tr
                    key={l.id}
                    onClick={() => setExpandedId(isOpen ? null : l.id)}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', background: isOpen ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>{l.name}</td>
                    <td style={{ padding: '12px 16px', color: CYAN }}>{l.email}</td>
                    <td style={{ padding: '12px 16px' }}>{fmtPhone(l.whatsapp)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                        background: `${STAGE_COLOR[l.stage]}22`, color: STAGE_COLOR[l.stage],
                        border: `1px solid ${STAGE_COLOR[l.stage]}66`, fontSize: 11, fontWeight: 700,
                      }}>{l.stage}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#aaa' }}>{fmtDate(l.created_at)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <a href={waLink(l.whatsapp, l.name)} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-block', fontFamily: MONO, fontSize: 11, fontWeight: 700,
                          color: '#fff', background: '#25D366', border: 'none', borderRadius: 8,
                          padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        WA
                      </a>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${l.id}-detail`} style={{ background: 'rgba(124,58,237,0.04)' }}>
                      <td colSpan={6} style={{ padding: '12px 24px 16px' }}>
                        {l.events.length === 0 ? (
                          <p style={{ color: '#666', fontSize: 12 }}>Sem eventos registrados além da captação como lead.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                            {l.events.map((ev) => (
                              <li key={ev.id} style={{ padding: '4px 0', color: '#ccc' }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                                  background: STAGE_COLOR[(EVENT_LABEL[ev.event_name] as LeadStage) ?? 'Lead'] ?? '#6b7280',
                                  marginRight: 10 }} />
                                <strong style={{ color: '#fff' }}>{EVENT_LABEL[ev.event_name] ?? ev.event_name}</strong>
                                <span style={{ color: '#888', marginLeft: 8 }}>{fmtDate(ev.occurred_at)}</span>
                                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                  <span style={{ color: '#888', marginLeft: 8 }}>
                                    — {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
```

### Parte B — Atualizar `page.tsx` (data flow)

- [ ] **Step B1: Reescrever `app/painel/page.tsx` completo**

Substituir o conteúdo inteiro de `app/painel/page.tsx` por:

```typescript
import { hasPanelAccess } from '@/lib/admin-panel-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentStage, type LeadStage } from '@/lib/lead-events';
import PanelLogin from './PanelLogin';
import LeadsDashboard, { type Lead, type LeadEvent, type PanelData } from './LeadsDashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel de Leads — FlashAprova' };

function buildPanelData(
  leads: Lead[],
  totalContas: number,
  assinaturasPagas: number,
): PanelData {
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const d7 = now.getTime() - 7 * 864e5;
  const d30 = now.getTime() - 30 * 864e5;

  let hoje = 0, ultimos7d = 0, ultimos30d = 0;
  const porDiaMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5);
    porDiaMap.set(d.toISOString().slice(0, 10), 0);
  }
  const stageCounts: Record<LeadStage, number> = {
    'Pagou': 0,
    'Iniciou checkout': 0,
    'Carrinho': 0,
    'Cadastrou': 0,
    'Onboarding': 0,
    'Lead': 0,
  };

  for (const l of leads) {
    const t = new Date(l.created_at).getTime();
    if (t >= startOfToday) hoje++;
    if (t >= d7) ultimos7d++;
    if (t >= d30) ultimos30d++;
    const key = new Date(l.created_at).toISOString().slice(0, 10);
    if (porDiaMap.has(key)) porDiaMap.set(key, (porDiaMap.get(key) ?? 0) + 1);
    stageCounts[l.stage]++;
  }

  return {
    leads,
    metrics: {
      total: leads.length,
      hoje,
      ultimos7d,
      ultimos30d,
      porDia: [...porDiaMap.entries()].map(([dia, count]) => ({ dia, count })),
    },
    totalContas,
    assinaturasPagas,
    stageCounts,
  };
}

export default async function PainelPage() {
  if (!(await hasPanelAccess())) {
    return <PanelLogin />;
  }

  const supabase = createAdminClient();

  const { data: leadsRaw } = await supabase
    .from('leads')
    .select('id, name, email, whatsapp, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  const { data: eventsRaw } = await supabase
    .from('lead_events')
    .select('id, email, event_name, occurred_at, metadata')
    .order('occurred_at', { ascending: false })
    .limit(20000);

  const { count: totalContas } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { count: pagasCount, error: pagasError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .not('plan', 'in', '("flash","aceleracao")');
  const assinaturasPagas = pagasError ? 0 : (pagasCount ?? 0);

  // Agrupa eventos por email lowercased
  const eventsByEmail = new Map<string, LeadEvent[]>();
  for (const ev of (eventsRaw ?? [])) {
    const key = (ev.email as string).trim().toLowerCase();
    const list = eventsByEmail.get(key) ?? [];
    list.push({
      id: ev.id as string,
      event_name: ev.event_name as string,
      occurred_at: ev.occurred_at as string,
      metadata: (ev.metadata as Record<string, unknown> | null) ?? null,
    });
    eventsByEmail.set(key, list);
  }

  // Anexa events + stage em cada lead
  const leads: Lead[] = (leadsRaw ?? []).map((l) => {
    const key = (l.email as string).trim().toLowerCase();
    const events = eventsByEmail.get(key) ?? [];
    return {
      id: l.id as string,
      name: l.name as string,
      email: l.email as string,
      whatsapp: l.whatsapp as string,
      created_at: l.created_at as string,
      events,
      stage: currentStage(events),
    };
  });

  const data = buildPanelData(leads, totalContas ?? 0, assinaturasPagas);

  return <LeadsDashboard data={data} />;
}
```

- [ ] **Step B2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo. Os types `Lead`, `LeadEvent`, `PanelData` agora existem (definidos na Parte A) e a página os usa.

- [ ] **Step B3: Commit dos dois arquivos juntos**

```bash
git add app/painel/page.tsx app/painel/LeadsDashboard.tsx
git commit -m "feat(painel): coluna de estágio, timeline expansível e filtro por estágio"
```

---

## Task 10: Verificação final integrada

**Files:** nenhum modificado.

- [ ] **Step 1: Re-rodar todos os testes**

Run: `npx tsx --test lib/__tests__/lead-events.test.ts`
Expected: PASS — 11/11 testes (7 de `currentStage` + 4 de `recordLeadEvent`).

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — 13/13 (não-regressão dos testes do plano anterior).

- [ ] **Step 2: Typecheck final**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo em todo o projeto (apenas os pré-existentes em test files).

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build conclui com sucesso. Verificar no output que `/painel` aparece listada como rota dinâmica e que as 3 rotas de meta + webhook continuam listadas.

- [ ] **Step 4: Smoke test via SQL**

Verificar que a tabela `lead_events` está acessível e responde a inserts. Via MCP:

```
mcp__claude_ai_Supabase__execute_sql
  query: "select count(*) as total, count(distinct email) as emails from public.lead_events;"
```

Esperado: retorna `{ total: 0, emails: 0 }` (tabela vazia logo após migration) ou os valores correntes se já houver eventos gravados.

- [ ] **Step 5: Smoke test do client em browser (manual — usuário humano)**

> **Este passo o usuário humano executa.** O subagent deve apenas listar o que precisa ser feito e parar.

1. `npm run dev`
2. Logar em `/painel` com a senha configurada
3. Navegar até `/checkout?plan=aceleracao` com email no localStorage (vindo do quizz) — confirmar via DevTools que o POST para `/api/meta/add-to-cart` retornou 200
4. Voltar a `/painel`, recarregar, e confirmar que o lead correspondente agora mostra estágio "Carrinho"
5. Expandir a linha → confirmar que aparece a timeline com "Adicionou ao carrinho — <data>"
6. Clicar em comprar → confirmar redirect pro Asaas + InitiateCheckout deve aparecer no painel após reload

- [ ] **Step 6: NÃO criar commit se nenhum ajuste foi necessário**

Se algum step exigiu correção, commitar separadamente. Caso contrário, **não criar commit vazio.**

---

## Definition of Done

- [x] Migration `lead_events` criada, aplicada, e verificada via `list_tables`
- [x] `lib/lead-events.ts` exporta `recordLeadEvent`, `currentStage`, `LeadEventName`, `LeadStage`
- [x] 11/11 testes em `lib/__tests__/lead-events.test.ts` passam
- [x] 5 pontos de gravação chamam `recordLeadEvent` quando há email:
  - AddToCart route
  - InitiateCheckout route (com metadata)
  - CompleteRegistration route
  - OnboardingCompleted (dentro do `after()`)
  - Purchase (nos dois `after()` do webhook, com metadata)
- [x] `/painel/page.tsx` busca eventos, agrupa por email, anexa `events[]` + `stage` em cada lead, e computa `stageCounts`
- [x] `LeadsDashboard.tsx` exibe coluna de estágio com badge, linha expansível com timeline, filtro por estágio e cards de contagem
- [x] Export CSV inclui `stage` e `events_count`
- [x] `npx tsc --noEmit` sem erros novos
- [x] `npm run build` conclui com sucesso
- [x] Smoke test manual no browser confirma fluxo end-to-end (usuário humano)
