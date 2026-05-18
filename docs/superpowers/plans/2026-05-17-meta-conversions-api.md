# Meta Conversions API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe, centralized server-side utility that sends `Purchase`, `CompleteRegistration`, and `OnboardingCompleted` events to the Meta Conversions API, wired into the existing payment webhook, signup, and onboarding flows.

**Architecture:** A single `lib/meta-capi.ts` module (lazy config, never throws — mirrors `lib/mail.ts`) exposes pure helpers (SHA-256 hashing, user-data builder, deterministic event ids), a network dispatcher, and three typed event functions. Server routes call it via Next's `after()` so responses are never delayed; the client signup path calls a thin new API route.

**Tech Stack:** TypeScript, Next.js 16 (App Router, Node runtime), Node `crypto`, `fetch`, `node:test` + `tsx` for tests.

**Spec:** `docs/superpowers/specs/2026-05-17-meta-conversions-api-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/meta-capi.ts` | Core: config, hashing, user-data, event builder, dispatcher, 3 public track functions |
| `lib/__tests__/meta-capi.test.ts` | Unit tests for pure helpers + no-op config behavior |
| `app/api/meta/complete-registration/route.ts` | Client signup tracking endpoint |
| `app/api/webhook/asaas/route.ts` | (Modify) fire Purchase + conditional CompleteRegistration |
| `app/login/page.tsx` | (Modify) call tracking route after `signUp` |
| `app/api/onboarding/generate-plan/route.ts` | (Modify) fire `OnboardingCompleted` |
| `scripts/test-meta-capi.ts` | Manual Meta Test Events verification script |

Test command used throughout: `npx tsx --test lib/__tests__/meta-capi.test.ts`

---

## Task 1: Pure helpers — hashing, user-data, event id

**Files:**
- Create: `lib/meta-capi.ts`
- Test: `lib/__tests__/meta-capi.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/meta-capi.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { normalizeAndHash, buildUserData, deterministicEventId } from '../meta-capi.ts';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

test('normalizeAndHash trims, lowercases, sha256-hex', () => {
  assert.equal(normalizeAndHash('  Foo@Bar.COM '), sha('foo@bar.com'));
});

test('normalizeAndHash returns empty string for empty input', () => {
  assert.equal(normalizeAndHash('   '), '');
  assert.equal(normalizeAndHash(''), '');
});

test('buildUserData hashes em/ph/external_id as single-element arrays', () => {
  const ud = buildUserData({ email: 'A@B.com', phone: '+55 (11) 99999-1234', externalId: 'user-1' });
  assert.deepEqual(ud.em, [sha('a@b.com')]);
  assert.deepEqual(ud.ph, [sha('5511999991234')]);
  assert.deepEqual(ud.external_id, [sha('user-1')]);
});

test('buildUserData passes fbp/fbc/ip/ua raw and omits absent fields', () => {
  const ud = buildUserData({ fbp: 'fb.1.2.3', fbc: 'fb.1.4.5', clientIpAddress: '1.2.3.4', clientUserAgent: 'UA/1.0' });
  assert.equal(ud.fbp, 'fb.1.2.3');
  assert.equal(ud.fbc, 'fb.1.4.5');
  assert.equal(ud.client_ip_address, '1.2.3.4');
  assert.equal(ud.client_user_agent, 'UA/1.0');
  assert.equal(ud.em, undefined);
});

test('deterministicEventId is stable and varies by name/key', () => {
  assert.equal(deterministicEventId('Purchase', 'k1'), deterministicEventId('Purchase', 'k1'));
  assert.notEqual(deterministicEventId('Purchase', 'k1'), deterministicEventId('Purchase', 'k2'));
  assert.notEqual(deterministicEventId('Purchase', 'k1'), deterministicEventId('CompleteRegistration', 'k1'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: FAIL — cannot find module `../meta-capi.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/meta-capi.ts`:

```ts
import { createHash } from 'node:crypto';

export function normalizeAndHash(value: string): string {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return '';
  return createHash('sha256').update(v).digest('hex');
}

export interface UserDataInput {
  email?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface MetaUserData {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export function buildUserData(input: UserDataInput): MetaUserData {
  const ud: MetaUserData = {};
  if (input.email) ud.em = [normalizeAndHash(input.email)];
  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '');
    if (digits) ud.ph = [normalizeAndHash(digits)];
  }
  if (input.externalId) ud.external_id = [normalizeAndHash(input.externalId)];
  if (input.fbp) ud.fbp = input.fbp;
  if (input.fbc) ud.fbc = input.fbc;
  if (input.clientIpAddress) ud.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) ud.client_user_agent = input.clientUserAgent;
  return ud;
}

export function deterministicEventId(eventName: string, key: string): string {
  return `${eventName}.${key}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/meta-capi.ts lib/__tests__/meta-capi.test.ts
git commit -m "feat(meta-capi): pure hashing/user-data/event-id helpers"
```

---

## Task 2: Event builder, dispatcher, and public track functions

**Files:**
- Modify: `lib/meta-capi.ts`
- Test: `lib/__tests__/meta-capi.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/meta-capi.test.ts`:

```ts
import { buildEvent, sendMetaEvent, trackPurchase } from '../meta-capi.ts';

test('buildEvent assembles a Meta event with hashed user_data', () => {
  const ev = buildEvent({
    eventName: 'Purchase',
    eventId: 'asaas_pay_1',
    actionSource: 'system_generated',
    userData: { email: 'a@b.com', externalId: 'u1' },
    customData: { currency: 'BRL', value: 97, content_name: 'Protocolo Básico' },
    eventTime: 1700000000,
  });
  assert.equal(ev.event_name, 'Purchase');
  assert.equal(ev.event_time, 1700000000);
  assert.equal(ev.event_id, 'asaas_pay_1');
  assert.equal(ev.action_source, 'system_generated');
  assert.ok(Array.isArray(ev.user_data.em));
  assert.deepEqual(ev.custom_data, { currency: 'BRL', value: 97, content_name: 'Protocolo Básico' });
  assert.equal('event_source_url' in ev, false);
});

test('sendMetaEvent is a safe no-op when env vars are missing', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const ev = buildEvent({
    eventName: 'Purchase', eventId: 'x', actionSource: 'system_generated',
    userData: { email: 'a@b.com' }, eventTime: 1700000000,
  });
  const res = await sendMetaEvent(ev);
  assert.deepEqual(res, { ok: false, status: 0 });
});

test('trackPurchase resolves to a result object without throwing (no env)', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const res = await trackPurchase({
    email: 'a@b.com', externalId: 'u1', value: 97, currency: 'BRL',
    planName: 'Protocolo Básico', eventId: 'asaas_pay_1',
  });
  assert.equal(typeof res.ok, 'boolean');
  assert.equal(res.ok, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: FAIL — `buildEvent`/`sendMetaEvent`/`trackPurchase` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `lib/meta-capi.ts`:

```ts
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';

interface MetaConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
}

let _warned = false;
function getConfig(): MetaConfig | null {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    if (!_warned) {
      console.warn('[meta-capi] META_PIXEL_ID/META_ACCESS_TOKEN ausentes — eventos desativados.');
      _warned = true;
    }
    return null;
  }
  return { pixelId, accessToken, testEventCode: process.env.META_TEST_EVENT_CODE };
}

export type ActionSource = 'website' | 'system_generated';

export interface MetaEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: ActionSource;
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: Record<string, unknown>;
}

export function buildEvent(params: {
  eventName: string;
  eventId: string;
  actionSource: ActionSource;
  userData: UserDataInput;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string;
  eventTime?: number;
}): MetaEvent {
  const ev: MetaEvent = {
    event_name: params.eventName,
    event_time: params.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: params.actionSource,
    user_data: buildUserData(params.userData),
  };
  if (params.eventSourceUrl) ev.event_source_url = params.eventSourceUrl;
  if (params.customData) ev.custom_data = params.customData;
  return ev;
}

export async function sendMetaEvent(event: MetaEvent): Promise<{ ok: boolean; status: number }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, status: 0 };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.accessToken)}`;
  const body: Record<string, unknown> = { data: [event] };
  if (cfg.testEventCode) body.test_event_code = cfg.testEventCode;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[meta-capi] ${event.event_name} HTTP ${res.status}: ${text}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error(`[meta-capi] ${event.event_name} falhou:`, err instanceof Error ? err.message : String(err));
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

interface BaseMatch {
  email?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
}

export function trackPurchase(p: BaseMatch & {
  value: number;
  currency: string;
  planName: string;
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'Purchase',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'system_generated',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    customData: { currency: p.currency, value: p.value, content_name: p.planName },
    eventSourceUrl: p.eventSourceUrl,
  }));
}

export function trackCompleteRegistration(p: BaseMatch & {
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'CompleteRegistration',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}

export function trackOnboardingCompleted(p: BaseMatch & { eventId: string }) {
  return sendMetaEvent(buildEvent({
    eventName: 'OnboardingCompleted',
    eventId: p.eventId,
    actionSource: 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — all 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/meta-capi.ts lib/__tests__/meta-capi.test.ts
git commit -m "feat(meta-capi): event builder, safe dispatcher, track functions"
```

---

## Task 3: Client signup tracking route

**Files:**
- Create: `app/api/meta/complete-registration/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/meta/complete-registration/route.ts`:

```ts
/**
 * POST /api/meta/complete-registration
 *
 * Chamado pelo client logo após supabase.auth.signUp bem-sucedido.
 * Dispara o evento CompleteRegistration na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackCompleteRegistration, deterministicEventId } from '@/lib/meta-capi';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email || email.length > 320 || !email.includes('@')) {
      return NextResponse.json({ ok: true });
    }

    const cookies = req.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

    await trackCompleteRegistration({
      email,
      eventId: deterministicEventId('CompleteRegistration', email),
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });
  } catch (err) {
    console.error('[meta-capi] complete-registration route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npx tsc --noEmit` then `npx next lint --file app/api/meta/complete-registration/route.ts`
Expected: No errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add app/api/meta/complete-registration/route.ts
git commit -m "feat(meta-capi): client signup CompleteRegistration endpoint"
```

---

## Task 4: Wire Purchase + CompleteRegistration into the Asaas webhook

**Files:**
- Modify: `app/api/webhook/asaas/route.ts`

Context: the existing handler returns `{ received: true, action: ... }`. We add value extraction and dispatch tracking after the plan is granted, using Next's `after()` so the webhook response is not delayed.

- [ ] **Step 1: Add imports**

At the top of `app/api/webhook/asaas/route.ts`, add `after` to the `next/server` import and import the tracking helpers. Change:

```ts
import { NextRequest, NextResponse } from 'next/server';
```

to:

```ts
import { NextRequest, NextResponse, after } from 'next/server';
import { trackPurchase, trackCompleteRegistration } from '@/lib/meta-capi';
```

- [ ] **Step 2: Extract `payment.value`**

Find this block:

```ts
  const customerEmail = (payment.customerEmail as string | undefined) ?? null;
```

Add immediately after it:

```ts
  const rawValue      = payment.value;
  const paymentValue  =
    typeof rawValue === 'number' ? rawValue
    : typeof rawValue === 'string' && rawValue.trim() !== '' && isFinite(Number(rawValue)) ? Number(rawValue)
    : null;
```

- [ ] **Step 3: Fire tracking for the existing-user branch**

Find the existing-user success block:

```ts
      return NextResponse.json({ received: true, action: 'plan_updated', plan: plan.slug, userId: existingId });
```

Immediately BEFORE that `return`, insert:

```ts
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

- [ ] **Step 4: Fire tracking for the new/fallback-user branch**

Find the new-user success block:

```ts
    const action = isRaceConditionFallback ? 'plan_updated_fallback' : 'user_created';
    return NextResponse.json({ received: true, action, plan: plan.slug, userId: newUserId });
```

Immediately BEFORE that `return`, insert:

```ts
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

- [ ] **Step 5: Verify type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/webhook/asaas/route.ts
git commit -m "feat(meta-capi): fire Purchase + CompleteRegistration from Asaas webhook"
```

---

## Task 5: Call the tracking route after client signup

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Add the tracking call**

In `app/login/page.tsx`, find the signup success branch:

```ts
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      setLoading(false);
```

Replace it with:

```ts
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      // Tracking best-effort — nunca bloqueia nem quebra o fluxo de cadastro.
      fetch('/api/meta/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      setLoading(false);
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(meta-capi): track CompleteRegistration on client signup"
```

---

## Task 6: Fire OnboardingCompleted from generate-plan

**Files:**
- Modify: `app/api/onboarding/generate-plan/route.ts`

- [ ] **Step 1: Add imports**

In `app/api/onboarding/generate-plan/route.ts`, change:

```ts
import { NextRequest, NextResponse } from 'next/server';
```

to:

```ts
import { NextRequest, NextResponse, after } from 'next/server';
import { trackOnboardingCompleted, deterministicEventId } from '@/lib/meta-capi';
```

- [ ] **Step 2: Dispatch the event before the final return**

Find the end of `handlePost`:

```ts
  return NextResponse.json({ ok: true, plan });
}
```

Replace it with:

```ts
  after(async () => {
    await trackOnboardingCompleted({
      email: user.email ?? undefined,
      externalId: user.id,
      eventId: deterministicEventId('OnboardingCompleted', user.id),
    });
  });

  return NextResponse.json({ ok: true, plan });
}
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit`
Expected: No errors. (`user` is in scope from the auth block earlier in `handlePost`.)

- [ ] **Step 4: Commit**

```bash
git add app/api/onboarding/generate-plan/route.ts
git commit -m "feat(meta-capi): fire OnboardingCompleted from generate-plan"
```

---

## Task 7: Manual Test Events verification script

**Files:**
- Create: `scripts/test-meta-capi.ts`

- [ ] **Step 1: Write the script**

Create `scripts/test-meta-capi.ts`:

```ts
/**
 * Verificação manual da Conversions API.
 *
 * Requer no ambiente: META_PIXEL_ID, META_ACCESS_TOKEN e
 * META_TEST_EVENT_CODE (pegue o código em Eventos de Teste no
 * Gerenciador de Eventos da Meta).
 *
 * Uso: npx tsx scripts/test-meta-capi.ts
 */
import { trackPurchase, trackCompleteRegistration } from '../lib/meta-capi.ts';

async function main() {
  if (!process.env.META_TEST_EVENT_CODE) {
    console.error('Defina META_TEST_EVENT_CODE para validar em Eventos de Teste.');
    process.exit(1);
  }

  const reg = await trackCompleteRegistration({
    email: 'teste+capi@flashaprova.app',
    externalId: 'test-user-1',
    eventId: 'test_reg_1',
    actionSource: 'website',
  });
  console.log('CompleteRegistration ->', reg);

  const pur = await trackPurchase({
    email: 'teste+capi@flashaprova.app',
    externalId: 'test-user-1',
    value: 97,
    currency: 'BRL',
    planName: 'Protocolo Básico',
    eventId: 'test_pur_1',
  });
  console.log('Purchase ->', pur);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Smoke-run without env (must not throw)**

Run: `npx tsx scripts/test-meta-capi.ts`
Expected: Exits with the `META_TEST_EVENT_CODE` message and code 1 (no crash, no stack trace). With env set, it prints two `{ ok: true, status: 200 }`-style results and events appear in Meta's Test Events tool.

- [ ] **Step 3: Commit**

```bash
git add scripts/test-meta-capi.ts
git commit -m "chore(meta-capi): manual Test Events verification script"
```

---

## Final Verification

- [ ] Run full test suite: `npx tsx --test lib/__tests__/meta-capi.test.ts` — all pass.
- [ ] Run `npx tsc --noEmit` — no errors.
- [ ] Confirm `git log --oneline` shows the 7 task commits.
- [ ] Confirm no `meta-capi` code path can throw to a caller (dispatcher try/catch, routes always return `{ ok: true }` / their normal response).
