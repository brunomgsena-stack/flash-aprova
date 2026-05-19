# Painel de Admin de Leads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/painel` protegida (senha única OU login admin) que lista os leads do `/quizz` com métricas, busca, export CSV e dados de conversão.

**Architecture:** Rota `/painel` fora de `/admin/*` com gate próprio (`lib/admin-panel-auth.ts`). Dados lidos server-side com service role (`createAdminClient`). Login por senha via route handler que seta cookie HMAC `httpOnly`. UI client-side com recharts e CSV gerado no browser. Não toca o middleware.

**Tech Stack:** Next.js 16 (App Router), Supabase (`@supabase/supabase-js`, service role), `crypto` (node), `@upstash/ratelimit` (já em uso via `lib/ratelimit`), recharts, Tailwind 4, framer-motion. Testes das funções puras via `node:test` + `tsx` (já é devDependency).

**Spec:** `docs/superpowers/specs/2026-05-19-admin-leads-panel-design.md`

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `lib/admin-panel-auth.ts` | `derivePanelToken`, `verifyPanelToken` (puras) + `hasPanelAccess` (server) |
| `lib/admin-panel-auth.test.ts` | Testes node:test das funções puras de token |
| `app/api/admin-panel/login/route.ts` | POST senha → rate-limit + constant-time + set cookie |
| `app/api/admin-panel/logout/route.ts` | POST → limpa cookie |
| `app/painel/page.tsx` | Server: gate + fetch service-role + render |
| `app/painel/PanelLogin.tsx` | Client: form de senha |
| `app/painel/LeadsDashboard.tsx` | Client: métricas, gráfico, tabela, busca, CSV, sair |
| `.env.example` | Adiciona `ADMIN_PANEL_PASSWORD` |

---

## Task 1: Funções puras de token (TDD)

**Files:**
- Create: `lib/admin-panel-auth.ts`
- Test: `lib/admin-panel-auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin-panel-auth.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivePanelToken, verifyPanelToken } from './admin-panel-auth.ts';

test('derivePanelToken is deterministic and hides the password', () => {
  const a = derivePanelToken('s3cret');
  const b = derivePanelToken('s3cret');
  assert.equal(a, b);
  assert.notEqual(a, 's3cret');
  assert.match(a, /^[a-f0-9]{64}$/); // hex sha256
});

test('derivePanelToken differs per password', () => {
  assert.notEqual(derivePanelToken('a'), derivePanelToken('b'));
});

test('verifyPanelToken true only for matching env password', () => {
  process.env.ADMIN_PANEL_PASSWORD = 's3cret';
  assert.equal(verifyPanelToken(derivePanelToken('s3cret')), true);
  assert.equal(verifyPanelToken(derivePanelToken('wrong')), false);
  assert.equal(verifyPanelToken(''), false);
  assert.equal(verifyPanelToken('not-hex'), false);
});

test('verifyPanelToken false when env password unset', () => {
  delete process.env.ADMIN_PANEL_PASSWORD;
  assert.equal(verifyPanelToken(derivePanelToken('s3cret')), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/admin-panel-auth.test.ts`
Expected: FAIL — `Cannot find module './admin-panel-auth.ts'` (ou export inexistente).

- [ ] **Step 3: Write minimal implementation**

Create `lib/admin-panel-auth.ts` with ONLY the pure functions for now:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_PAYLOAD = 'flashaprova-painel';

/**
 * Token determinístico derivado da senha (HMAC-SHA256, hex).
 * Não reversível para a senha — é o que vai no cookie.
 */
export function derivePanelToken(password: string): string {
  return createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
}

/**
 * Verifica, em tempo constante, se o valor do cookie corresponde ao token
 * derivado de ADMIN_PANEL_PASSWORD. Sem env setada → sempre false.
 */
export function verifyPanelToken(cookieValue: string): boolean {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) return false;
  if (!/^[a-f0-9]{64}$/.test(cookieValue)) return false;
  const expected = derivePanelToken(password);
  const a = Buffer.from(cookieValue, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/admin-panel-auth.test.ts`
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/admin-panel-auth.ts lib/admin-panel-auth.test.ts
git commit -m "feat(painel): pure token derive/verify for admin panel auth"
```

---

## Task 2: `hasPanelAccess` (gate server-side)

**Files:**
- Modify: `lib/admin-panel-auth.ts` (append)

Sem teste automatizado (depende de `next/headers` e Supabase server — fora do alcance do node:test isolado). Verificação manual coberta nas Tasks 4–6.

- [ ] **Step 1: Append `hasPanelAccess` to `lib/admin-panel-auth.ts`**

Add these imports at the top (junto aos existentes) e a função ao final do arquivo:

```ts
import { cookies } from 'next/headers';
import { createClient } from './supabase/server';

export const PANEL_COOKIE = 'painel_token';

/**
 * Libera o painel se: (1) usuário logado com profiles.role === 'admin', OU
 * (2) cookie painel_token válido. Não redireciona — retorna boolean.
 */
export async function hasPanelAccess(): Promise<boolean> {
  // (2) Cookie de senha
  const cookieStore = await cookies();
  const token = cookieStore.get(PANEL_COOKIE)?.value;
  if (token && verifyPanelToken(token)) return true;

  // (1) Login admin existente
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Verify the token tests still pass (no regression)**

Run: `npx tsx --test lib/admin-panel-auth.test.ts`
Expected: PASS — 4 tests still passing (imports de next/headers não são exercitados pelos testes puros).

> Se o `tsx --test` falhar ao resolver `next/headers` durante a importação do módulo, mover `hasPanelAccess` para um arquivo separado `lib/admin-panel-gate.ts` e re-rodar os testes. Caso contrário, manter como está.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: Sem erros novos relacionados a `lib/admin-panel-auth.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/admin-panel-auth.ts
git commit -m "feat(painel): hasPanelAccess gate (admin login OR password cookie)"
```

---

## Task 3: Rotas de login/logout

**Files:**
- Create: `app/api/admin-panel/login/route.ts`
- Create: `app/api/admin-panel/logout/route.ts`
- Modify: `.env.example`

Rate-limit (API confirmada em `lib/ratelimit.ts`): `getGeneralLimiter(): Ratelimit`
(não-nulo) e `getClientIp(request)` aceita o `NextRequest` (usa `headers.get`).
Uso: `const { success } = await getGeneralLimiter().limit(identifier)`.

- [ ] **Step 1: Create `app/api/admin-panel/login/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getGeneralLimiter, getClientIp } from '@/lib/ratelimit';
import { derivePanelToken, PANEL_COOKIE } from '@/lib/admin-panel-auth';

const DENIED = { error: 'Acesso negado' };

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  // Rate-limit por IP (mesmo padrão do middleware.ts)
  const ip = getClientIp(req);
  const { success } = await getGeneralLimiter().limit(`painel-login:${ip}`);
  if (!success) return NextResponse.json(DENIED, { status: 429 });

  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) return NextResponse.json(DENIED, { status: 401 });

  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json(DENIED, { status: 401 });
  }

  if (!safeEqual(password, expected)) {
    return NextResponse.json(DENIED, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, derivePanelToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
```

- [ ] **Step 2: Create `app/api/admin-panel/logout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { PANEL_COOKIE } from '@/lib/admin-panel-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
```

- [ ] **Step 3: Add env var to `.env.example`**

Append a new section (após o bloco de Config Opcional):

```
# ------ Painel de Leads (Admin) ------
# Senha única para acessar /painel sem precisar de conta admin logada.
# Se vazio, só admins logados (profiles.role='admin') acessam o painel.
ADMIN_PANEL_PASSWORD=troque-esta-senha
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: Sem erros nas duas rotas novas.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin-panel/login/route.ts app/api/admin-panel/logout/route.ts .env.example
git commit -m "feat(painel): login (constant-time + rate-limit) and logout routes"
```

---

## Task 4: Página server + fetch de dados

**Files:**
- Create: `app/painel/page.tsx`

Esta task cria a página com o gate e o fetch, mas renderiza placeholders simples
para os componentes client (criados nas Tasks 5–6). Isso mantém a task isolada e
testável manualmente (gate funciona; dados chegam).

- [ ] **Step 1: Create `app/painel/page.tsx`**

```tsx
import { hasPanelAccess } from '@/lib/admin-panel-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import PanelLogin from './PanelLogin';
import LeadsDashboard, { type Lead, type PanelData } from './LeadsDashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel de Leads — FlashAprova' };

function buildPanelData(leads: Lead[], totalContas: number, assinaturasPagas: number): PanelData {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d7 = now.getTime() - 7 * 864e5;
  const d30 = now.getTime() - 30 * 864e5;

  let hoje = 0, ultimos7d = 0, ultimos30d = 0;
  const porDiaMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5);
    porDiaMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const l of leads) {
    const t = new Date(l.created_at).getTime();
    if (t >= startOfToday) hoje++;
    if (t >= d7) ultimos7d++;
    if (t >= d30) ultimos30d++;
    const key = new Date(l.created_at).toISOString().slice(0, 10);
    if (porDiaMap.has(key)) porDiaMap.set(key, (porDiaMap.get(key) ?? 0) + 1);
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

  const { count: totalContas } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // best-effort: coluna plan pode não existir / divergir do schema
  let assinaturasPagas = 0;
  try {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('plan', 'in', '("flash","aceleracao")');
    assinaturasPagas = count ?? 0;
  } catch {
    assinaturasPagas = 0;
  }

  const data = buildPanelData(
    (leadsRaw ?? []) as Lead[],
    totalContas ?? 0,
    assinaturasPagas,
  );

  return <LeadsDashboard data={data} />;
}
```

- [ ] **Step 2: Create temporary stub components so the page compiles**

Create `app/painel/PanelLogin.tsx`:

```tsx
'use client';
export default function PanelLogin() {
  return <div style={{ padding: 40, color: '#fff', background: '#08040f', minHeight: '100vh' }}>PanelLogin stub</div>;
}
```

Create `app/painel/LeadsDashboard.tsx`:

```tsx
'use client';

export type Lead = { id: string; name: string; email: string; whatsapp: string; created_at: string };
export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
};

export default function LeadsDashboard({ data }: { data: PanelData }) {
  return <pre style={{ padding: 40, color: '#0f0', background: '#000', minHeight: '100vh' }}>{JSON.stringify(data.metrics, null, 2)}</pre>;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: Sem erros em `app/painel/`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Garantir `ADMIN_PANEL_PASSWORD` setada em `.env.local`.
- Visitar `/painel` deslogado e sem cookie → vê "PanelLogin stub".
- Setar cookie manualmente não é trivial; validação completa do gate fica na Task 5.
- Confirmar que a build não quebrou: `Expected: página responde 200`.

- [ ] **Step 5: Commit**

```bash
git add app/painel/page.tsx app/painel/PanelLogin.tsx app/painel/LeadsDashboard.tsx
git commit -m "feat(painel): server page with gate + service-role data fetch (stub UI)"
```

---

## Task 5: `PanelLogin` (form de senha real)

**Files:**
- Modify: `app/painel/PanelLogin.tsx` (substitui o stub)

- [ ] **Step 1: Replace `app/painel/PanelLogin.tsx` with the real form**

```tsx
'use client';

import { useState } from 'react';

const VIOLET = '#7C3AED';
const CYAN = '#06b6d4';
const RED = '#ef4444';
const MONO = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

export default function PanelLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-panel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError('Acesso negado');
    } catch {
      setError('Acesso negado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08040f', padding: 24 }}>
      <form onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 380, background: 'rgba(6,3,18,0.84)', border: `1px solid ${VIOLET}50`, borderRadius: 24, padding: 36 }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: `${CYAN}cc`, marginBottom: 8 }}>
          {'> [ ACESSO RESTRITO ]'}
        </p>
        <h1 style={{ fontFamily: MONO, color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 20 }}>
          Painel de Leads
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="senha"
          autoComplete="current-password"
          required
          style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${VIOLET}40`, color: '#fff', fontFamily: MONO, outline: 'none', marginBottom: 14 }}
        />
        {error && <p style={{ color: RED, fontFamily: MONO, fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 16, borderRadius: 12, border: `1.5px solid ${VIOLET}90`,
            background: `linear-gradient(135deg, ${VIOLET}, #5b21b6)`, color: '#fff', fontFamily: MONO,
            fontWeight: 900, letterSpacing: '0.12em', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? '[ VERIFICANDO... ]' : '[ ENTRAR ]'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 3: Manual verification (spec roteiro 1–5)**

Run `npm run dev` com `ADMIN_PANEL_PASSWORD=teste123` em `.env.local`:
- `/painel` sem cookie → mostra form. ✅ esperado.
- Senha errada → "Acesso negado", continua no form. ✅
- Senha `teste123` → reload, agora mostra o dashboard (stub JSON da Task 4). ✅
- Logado como admin (`profiles.role='admin'`) sem cookie → entra direto. ✅
- `POST /api/admin-panel/logout` (ou botão na Task 6) → volta ao form. ✅

- [ ] **Step 4: Commit**

```bash
git add app/painel/PanelLogin.tsx
git commit -m "feat(painel): real password login form"
```

---

## Task 6: `LeadsDashboard` (UI final)

**Files:**
- Modify: `app/painel/LeadsDashboard.tsx` (substitui o stub, mantém os mesmos types exportados)

Manter EXATAMENTE os exports de tipo `Lead` e `PanelData` da Task 4 (a page importa deles).

- [ ] **Step 1: Replace `app/painel/LeadsDashboard.tsx` with the full dashboard**

```tsx
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

const VIOLET = '#7C3AED';
const CYAN = '#06b6d4';
const MONO = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function fmtPhone(d: string) {
  const n = (d || '').replace(/\D/g, '');
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return d;
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'rgba(6,3,18,0.7)', border: `1px solid ${VIOLET}35`, borderRadius: 16, padding: 20 }}>
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: `${CYAN}aa`, marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 900, color: '#fff' }}>{value}</p>
    </div>
  );
}

export default function LeadsDashboard({ data }: { data: PanelData }) {
  const { leads, metrics, totalContas, assinaturasPagas } = data;
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);

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

  function exportCsv() {
    const head = ['name', 'email', 'whatsapp', 'created_at'];
    const rows = filtered.map((l) =>
      [l.name, l.email, l.whatsapp, l.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','));
    const csv = [head.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch('/api/admin-panel/logout', { method: 'POST' });
    window.location.reload();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08040f', color: '#fff', padding: '32px clamp(16px,4vw,48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: MONO, fontWeight: 900, fontSize: 24 }}>Painel de Leads</h1>
        <button onClick={logout}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', background: 'transparent',
            border: `1px solid ${VIOLET}60`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        <Card label="TOTAL LEADS" value={metrics.total} />
        <Card label="HOJE" value={metrics.hoje} />
        <Card label="ÚLTIMOS 7 DIAS" value={metrics.ultimos7d} />
        <Card label="ÚLTIMOS 30 DIAS" value={metrics.ultimos30d} />
        <Card label="CONTAS CRIADAS" value={totalContas} />
        <Card label="ASSINATURAS PAGAS" value={assinaturasPagas} />
      </div>

      <div style={{ background: 'rgba(6,3,18,0.7)', border: `1px solid ${VIOLET}35`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: `${CYAN}aa`, marginBottom: 12 }}>CAPTAÇÃO — ÚLTIMOS 30 DIAS</p>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={metrics.porDia}>
              <XAxis dataKey="dia" hide />
              <Tooltip
                contentStyle={{ background: '#08040f', border: `1px solid ${VIOLET}`, fontFamily: MONO, fontSize: 12 }}
                labelStyle={{ color: CYAN }} />
              <Bar dataKey="count" fill={VIOLET} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="buscar nome / email / telefone"
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${VIOLET}40`, color: '#fff', fontFamily: MONO, outline: 'none' }}
        />
        <button onClick={() => setAsc((v) => !v)}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', background: 'transparent',
            border: `1px solid ${VIOLET}60`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
          Data {asc ? '↑ antigos' : '↓ recentes'}
        </button>
        <button onClick={exportCsv}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', fontWeight: 900,
            background: `linear-gradient(135deg, ${VIOLET}, #5b21b6)`, border: `1px solid ${VIOLET}90`,
            borderRadius: 10, padding: '10px 18px', cursor: 'pointer' }}>
          ⬇ Exportar CSV ({filtered.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: `1px solid ${VIOLET}30`, borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(124,58,237,0.12)' }}>
              {['Nome', 'E-mail', 'WhatsApp', 'Data'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: `${CYAN}cc`, fontSize: 11, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '12px 16px' }}>{l.name}</td>
                <td style={{ padding: '12px 16px', color: CYAN }}>{l.email}</td>
                <td style={{ padding: '12px 16px' }}>{fmtPhone(l.whatsapp)}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{fmtDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: Sem erros novos em `app/painel/`.

- [ ] **Step 4: Manual verification (spec roteiro completo)**

Run `npm run dev`, `ADMIN_PANEL_PASSWORD` setada, com pelo menos 1 lead na tabela:
1. Sem cookie → form de senha. ✅
2. Senha errada → "Acesso negado". ✅
3. Senha certa → dashboard com cards, gráfico 30d e tabela populada. ✅
4. Admin logado → entra direto. ✅
5. Busca filtra a tabela; toggle de data reordena. ✅
6. "Exportar CSV" baixa arquivo que abre no Excel/Sheets com 4 colunas e acentos OK (BOM). ✅
7. "Sair" → volta ao form. ✅
8. Remover `ADMIN_PANEL_PASSWORD`, reiniciar dev → form rejeita qualquer senha; admin logado ainda entra. ✅

- [ ] **Step 5: Commit**

```bash
git add app/painel/LeadsDashboard.tsx
git commit -m "feat(painel): leads dashboard — metrics, chart, search, CSV export"
```

---

## Task 7: Verificação final e cleanup

- [ ] **Step 1: Full typecheck + lint + token tests**

```bash
npx tsc --noEmit
npm run lint
npx tsx --test lib/admin-panel-auth.test.ts
```
Expected: tudo verde; 4 testes de token passando.

- [ ] **Step 2: Production build sanity**

Run: `npm run build`
Expected: build conclui sem erro; `/painel` aparece como rota dinâmica.

- [ ] **Step 3: Confirmar que o middleware não foi tocado**

Run: `git diff main -- middleware.ts`
Expected: vazio (nenhuma alteração no middleware).

- [ ] **Step 4: Commit final (se houver ajustes pendentes)**

```bash
git add -A
git commit -m "chore(painel): final verification (typecheck, lint, build, tests)"
```

---

## Self-Review (preenchido)

**Spec coverage:**
- Gate (admin OU senha) → Tasks 1, 2 ✅
- Login constant-time + rate-limit + cookie HMAC httpOnly → Task 3 ✅
- Logout → Task 3 ✅
- `.env.example` `ADMIN_PANEL_PASSWORD` → Task 3 ✅
- Página server + fetch service-role + métricas + best-effort assinaturas → Task 4 ✅
- Form de senha + erro genérico → Task 5 ✅
- Métricas, gráfico 30d, busca, ordenação, CSV client-side, sair → Task 6 ✅
- Sem senha → só admin logado → Tasks 1/3 (verificado em 6 step 4.8) ✅
- Não tocar middleware → Task 7 step 3 ✅
- Testes das funções puras (node:test/tsx) + roteiro manual → Tasks 1, 5, 6 ✅

**Placeholder scan:** sem TBD/TODO; todo passo de código tem código completo.

**Type consistency:** `Lead` e `PanelData` definidos na Task 4 e reusados idênticos
nas Tasks 4/6; `PANEL_COOKIE`, `derivePanelToken`, `verifyPanelToken`,
`hasPanelAccess` consistentes entre Tasks 1–4. `getGeneralLimiter()`/`getClientIp`
confirmados em `lib/ratelimit.ts` e usados conforme a API real.
