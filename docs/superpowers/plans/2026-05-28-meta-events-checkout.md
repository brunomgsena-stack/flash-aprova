# Meta Events no Checkout (AddToCart + InitiateCheckout) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disparar `AddToCart` ao entrar em `/checkout` e `InitiateCheckout` ao clicar comprar, em ambos os canais (Pixel + Conversions API) com dedupe por `eventID` compartilhado.

**Architecture:** Mesmo padrão dual-channel já estabelecido em `CompleteRegistration`: cliente gera `eventId` determinístico, dispara `fbq('track', ...)` com esse `eventID`, e em paralelo faz POST best-effort para uma rota Next que chama `sendMetaEvent()` no servidor. Para `InitiateCheckout`, o POST usa `navigator.sendBeacon` (com fallback `fetch keepalive`) para sobreviver ao redirect imediato pro Asaas.

**Tech Stack:** TypeScript, Next.js 16 (App Router, Node runtime), Meta Pixel + Graph API v21.0, `node:test` + `tsx` para tests.

**Spec:** [`docs/superpowers/specs/2026-05-28-meta-events-checkout-design.md`](../specs/2026-05-28-meta-events-checkout-design.md)

**Test command throughout:** `npx tsx --test lib/__tests__/meta-capi.test.ts`

**Build/typecheck command throughout:** `npx tsc --noEmit`

---

## File Structure

- **Modify** `lib/meta-capi.ts` — adicionar `trackAddToCart()` e `trackInitiateCheckout()` espelhando `trackPurchase` / `trackCompleteRegistration`
- **Modify** `lib/__tests__/meta-capi.test.ts` — adicionar testes para as duas novas funções
- **Create** `app/api/meta/add-to-cart/route.ts` — POST handler, recebe `{ eventId, email? }` do cliente, dispara CAPI
- **Create** `app/api/meta/initiate-checkout/route.ts` — POST handler, recebe `{ eventId, email?, planId }`, mapeia `planId → {value, name}`, dispara CAPI
- **Modify** `app/checkout/CheckoutPage.tsx` — disparar AddToCart no `useEffect` existente + InitiateCheckout em `handleBuy` antes do redirect

---

## Task 1: Adicionar `trackAddToCart` em `lib/meta-capi.ts`

**Files:**
- Test: `lib/__tests__/meta-capi.test.ts`
- Modify: `lib/meta-capi.ts`

- [ ] **Step 1: Write the failing test**

Append at the end of `lib/__tests__/meta-capi.test.ts`:

```typescript
import { trackAddToCart } from '../meta-capi.ts';

test('trackAddToCart resolves without throwing (no env)', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const res = await trackAddToCart({
    email: 'a@b.com',
    eventId: 'AddToCart.a@b.com',
  });
  assert.equal(typeof res.ok, 'boolean');
  assert.equal(res.ok, false);
});

test('buildEvent for AddToCart includes content_ids and no value', () => {
  const ev = buildEvent({
    eventName: 'AddToCart',
    eventId: 'AddToCart.test',
    actionSource: 'website',
    userData: { email: 'a@b.com' },
    customData: {
      currency: 'BRL',
      content_ids: ['aceleracao', 'panteao_elite', 'black'],
      content_type: 'product',
    },
    eventTime: 1700000000,
  });
  assert.equal(ev.event_name, 'AddToCart');
  assert.equal(ev.custom_data?.currency, 'BRL');
  assert.deepEqual(ev.custom_data?.content_ids, ['aceleracao', 'panteao_elite', 'black']);
  assert.equal(ev.custom_data?.content_type, 'product');
  assert.equal('value' in (ev.custom_data ?? {}), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: FAIL with "has no exported member 'trackAddToCart'" or runtime error on `trackAddToCart is not a function`.

- [ ] **Step 3: Implement `trackAddToCart` in `lib/meta-capi.ts`**

Add at the end of `lib/meta-capi.ts` (after `trackOnboardingCompleted`):

```typescript
export function trackAddToCart(p: BaseMatch & {
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'AddToCart',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    customData: {
      currency: 'BRL',
      content_ids: ['aceleracao', 'panteao_elite', 'black'],
      content_type: 'product',
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — all existing tests + 2 new ones.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/meta-capi.ts lib/__tests__/meta-capi.test.ts
git commit -m "feat(meta-capi): adiciona trackAddToCart com content_ids dos 3 planos"
```

---

## Task 2: Adicionar `trackInitiateCheckout` em `lib/meta-capi.ts`

**Files:**
- Test: `lib/__tests__/meta-capi.test.ts`
- Modify: `lib/meta-capi.ts`

- [ ] **Step 1: Write the failing test**

Append at the end of `lib/__tests__/meta-capi.test.ts`:

```typescript
import { trackInitiateCheckout } from '../meta-capi.ts';

test('trackInitiateCheckout resolves without throwing (no env)', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const res = await trackInitiateCheckout({
    email: 'a@b.com',
    eventId: 'InitiateCheckout.aceleracao.a@b.com',
    value: 257,
    planId: 'aceleracao',
    planName: 'Protocolo Aceleração',
  });
  assert.equal(typeof res.ok, 'boolean');
  assert.equal(res.ok, false);
});

test('buildEvent for InitiateCheckout includes value, content_name and num_items', () => {
  const ev = buildEvent({
    eventName: 'InitiateCheckout',
    eventId: 'InitiateCheckout.panteao_elite.x',
    actionSource: 'website',
    userData: { email: 'a@b.com' },
    customData: {
      currency: 'BRL',
      value: 327,
      content_name: 'Protocolo Pantéon Elite',
      content_ids: ['panteao_elite'],
      content_type: 'product',
      num_items: 1,
    },
    eventTime: 1700000000,
  });
  assert.equal(ev.event_name, 'InitiateCheckout');
  assert.equal(ev.custom_data?.value, 327);
  assert.equal(ev.custom_data?.content_name, 'Protocolo Pantéon Elite');
  assert.deepEqual(ev.custom_data?.content_ids, ['panteao_elite']);
  assert.equal(ev.custom_data?.num_items, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: FAIL — `trackInitiateCheckout` not exported.

- [ ] **Step 3: Implement `trackInitiateCheckout` in `lib/meta-capi.ts`**

Add at the end of `lib/meta-capi.ts` (after `trackAddToCart`):

```typescript
export function trackInitiateCheckout(p: BaseMatch & {
  eventId: string;
  value: number;
  planId: string;
  planName: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'InitiateCheckout',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    customData: {
      currency: 'BRL',
      value: p.value,
      content_name: p.planName,
      content_ids: [p.planId],
      content_type: 'product',
      num_items: 1,
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/meta-capi.ts lib/__tests__/meta-capi.test.ts
git commit -m "feat(meta-capi): adiciona trackInitiateCheckout com value e content_name por plano"
```

---

## Task 3: Criar rota `POST /api/meta/add-to-cart`

**Files:**
- Create: `app/api/meta/add-to-cart/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/meta/add-to-cart/route.ts` with exactly this content:

```typescript
/**
 * POST /api/meta/add-to-cart
 *
 * Chamado pelo client ao montar /checkout.
 * Dispara o evento AddToCart na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o checkout.
 *
 * Body: { eventId: string, email?: string }
 * O eventId é gerado no cliente e reaproveitado aqui para garantir dedupe Pixel/CAPI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackAddToCart } from '@/lib/meta-capi';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { eventId?: unknown; email?: unknown }
      | null;

    const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : '';
    if (!eventId || eventId.length > 200) {
      return NextResponse.json({ ok: true });
    }

    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    const email = rawEmail && rawEmail.length <= 320 && rawEmail.includes('@')
      ? rawEmail
      : undefined;

    const cookies = req.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

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
  } catch (err) {
    console.error('[meta-capi] add-to-cart route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors related to the new file.

- [ ] **Step 4: Commit**

```bash
git add app/api/meta/add-to-cart/route.ts
git commit -m "feat(api): rota /api/meta/add-to-cart para CAPI server-side"
```

---

## Task 4: Criar rota `POST /api/meta/initiate-checkout`

**Files:**
- Create: `app/api/meta/initiate-checkout/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/meta/initiate-checkout/route.ts` with exactly this content:

```typescript
/**
 * POST /api/meta/initiate-checkout
 *
 * Chamado pelo client ao clicar comprar, antes do redirect pro Asaas.
 * Aceita request via navigator.sendBeacon (Content-Type pode ser text/plain
 * ou application/json — parsing é tolerante).
 * Dispara o evento InitiateCheckout na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o checkout.
 *
 * Body: { eventId: string, email?: string, planId: 'aceleracao' | 'panteao_elite' | 'black' }
 * O eventId é gerado no cliente e reaproveitado aqui para garantir dedupe Pixel/CAPI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackInitiateCheckout } from '@/lib/meta-capi';

export const runtime = 'nodejs';

const PLAN_META: Record<string, { value: number; name: string }> = {
  aceleracao:    { value: 257, name: 'Protocolo Aceleração' },
  panteao_elite: { value: 327, name: 'Protocolo Pantéon Elite' },
  black:         { value: 997, name: 'Protocolo Black' },
};

export async function POST(req: NextRequest) {
  try {
    // sendBeacon pode mandar como text/plain — parse tolerante.
    const raw = await req.text().catch(() => '');
    let body: { eventId?: unknown; email?: unknown; planId?: unknown } | null = null;
    try {
      body = raw ? (JSON.parse(raw) as typeof body) : null;
    } catch {
      body = null;
    }

    const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : '';
    const planId  = typeof body?.planId  === 'string' ? body.planId.trim()  : '';

    if (!eventId || eventId.length > 200 || !PLAN_META[planId]) {
      return NextResponse.json({ ok: true });
    }

    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    const email = rawEmail && rawEmail.length <= 320 && rawEmail.includes('@')
      ? rawEmail
      : undefined;

    const cookies = req.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

    const meta = PLAN_META[planId];
    await trackInitiateCheckout({
      email,
      eventId,
      planId,
      planName: meta.name,
      value: meta.value,
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });
  } catch (err) {
    console.error('[meta-capi] initiate-checkout route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors related to the new file.

- [ ] **Step 4: Commit**

```bash
git add app/api/meta/initiate-checkout/route.ts
git commit -m "feat(api): rota /api/meta/initiate-checkout para CAPI server-side"
```

---

## Task 5: Disparar AddToCart no `useEffect` de `CheckoutPage.tsx`

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

**Context:** o componente já tem um `useEffect` no mount (linhas 485-495) que lê `flashAprovaOnboarding` do localStorage e `?plan=` da URL. Vamos estender esse mesmo effect (não criar outro) para disparar AddToCart depois do parse, com guard `useRef` para o StrictMode double-mount.

- [ ] **Step 1: Adicionar import do `deterministicEventId`**

Em `app/checkout/CheckoutPage.tsx`, localizar a linha 7:

```typescript
import { REELS } from '@/lib/reels-data';
```

Adicionar **logo abaixo**:

```typescript
import { deterministicEventId } from '@/lib/meta-event-id';
```

- [ ] **Step 2: Adicionar `useRef` guard no componente**

Em `app/checkout/CheckoutPage.tsx`, dentro de `CheckoutPage`, localizar (perto da linha 478-483):

```typescript
export default function CheckoutPage() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [buying, setBuying] = useState<PlanId | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  // planId pré-selecionado via URL (?plan=aceleracao ou ?plan=panteao_elite)
  const [urlPlan, setUrlPlan] = useState<PlanId | null>(null);
```

Adicionar **logo após** `const [urlPlan, ...]`:

```typescript
  const addToCartFiredRef = useRef(false);
```

> Nota: `useRef` já está importado na linha 3, não precisa modificar imports.

- [ ] **Step 3: Estender o `useEffect` existente para disparar AddToCart**

Em `app/checkout/CheckoutPage.tsx`, localizar o bloco completo (linhas 485-495):

```typescript
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flashAprovaOnboarding');
      if (raw) setData(JSON.parse(raw) as OnboardingData);
    } catch { /* ignore */ }

    // Lê o plano da URL: /checkout?plan=aceleracao
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') as PlanId | null;
    if (plan === 'aceleracao' || plan === 'panteao_elite' || plan === 'black') setUrlPlan(plan);
  }, []);
```

Substituir pelo bloco abaixo (mesma lógica + AddToCart no final):

```typescript
  useEffect(() => {
    let parsed: OnboardingData | null = null;
    try {
      const raw = localStorage.getItem('flashAprovaOnboarding');
      if (raw) {
        parsed = JSON.parse(raw) as OnboardingData;
        setData(parsed);
      }
    } catch { /* ignore */ }

    // Lê o plano da URL: /checkout?plan=aceleracao
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') as PlanId | null;
    if (plan === 'aceleracao' || plan === 'panteao_elite' || plan === 'black') setUrlPlan(plan);

    // Tracking AddToCart — best-effort, nunca bloqueia.
    if (addToCartFiredRef.current) return;
    addToCartFiredRef.current = true;

    const email = parsed?.email?.trim().toLowerCase();
    const eventId = deterministicEventId('AddToCart', email || `anon-${Date.now()}`);

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        currency: 'BRL',
        content_ids: ['aceleracao', 'panteao_elite', 'black'],
        content_type: 'product',
      }, { eventID: eventId });
    }

    fetch('/api/meta/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, email: email || undefined }),
    }).catch(() => {});
  }, []);
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: no errors related to the modified file.

- [ ] **Step 6: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): dispara AddToCart (Pixel + CAPI) ao montar /checkout"
```

---

## Task 6: Disparar InitiateCheckout em `handleBuy` antes do redirect

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

**Context:** `handleBuy` (linhas 497-507) hoje só monta a URL do Asaas e faz `window.location.href = url`. Vamos disparar InitiateCheckout (Pixel + sendBeacon) **antes** do redirect.

- [ ] **Step 1: Adicionar mapa de metadados dos planos**

Em `app/checkout/CheckoutPage.tsx`, localizar logo após `const ASAAS_LINKS` (linhas 465-469):

```typescript
const ASAAS_LINKS: Record<PlanId, string> = {
  aceleracao:    'https://www.asaas.com/c/5eavmb23sffhvvni',
  panteao_elite: 'https://www.asaas.com/c/cahneqkzx0cn05yh',
  black:         'https://www.asaas.com/c/REPLACE_ME_BLACK', // TODO: substituir pelo link real do Asaas do Protocolo Black
};
```

Adicionar **logo abaixo** desse bloco:

```typescript
const PLAN_META: Record<PlanId, { value: number; name: string }> = {
  aceleracao:    { value: 257, name: 'Protocolo Aceleração' },
  panteao_elite: { value: 327, name: 'Protocolo Pantéon Elite' },
  black:         { value: 997, name: 'Protocolo Black' },
};
```

- [ ] **Step 2: Substituir o corpo de `handleBuy`**

Em `app/checkout/CheckoutPage.tsx`, localizar (linhas 497-507):

```typescript
  const handleBuy = useCallback((planId: PlanId) => {
    if (buying) return;

    setBuying(planId);

    const email = data?.email || emailInput.trim().toLowerCase();
    const url = email && email.includes('@')
      ? `${ASAAS_LINKS[planId]}?email=${encodeURIComponent(email)}`
      : ASAAS_LINKS[planId];
    window.location.href = url;
  }, [buying, data, emailInput]);
```

Substituir pelo bloco abaixo:

```typescript
  const handleBuy = useCallback((planId: PlanId) => {
    if (buying) return;

    setBuying(planId);

    const email = (data?.email || emailInput.trim().toLowerCase()).trim();
    const hasEmail = !!email && email.includes('@');
    const url = hasEmail
      ? `${ASAAS_LINKS[planId]}?email=${encodeURIComponent(email)}`
      : ASAAS_LINKS[planId];

    // Tracking InitiateCheckout — best-effort, antes do redirect.
    try {
      const meta = PLAN_META[planId];
      const eventId = deterministicEventId(
        'InitiateCheckout',
        `${planId}.${hasEmail ? email : 'anon'}`,
      );

      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', {
          currency: 'BRL',
          value: meta.value,
          content_name: meta.name,
          content_ids: [planId],
          content_type: 'product',
          num_items: 1,
        }, { eventID: eventId });
      }

      const payload = JSON.stringify({
        eventId,
        email: hasEmail ? email : undefined,
        planId,
      });
      const blob = new Blob([payload], { type: 'application/json' });
      const beaconOk =
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/api/meta/initiate-checkout', blob);

      if (!beaconOk) {
        fetch('/api/meta/initiate-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch { /* tracking nunca bloqueia */ }

    window.location.href = url;
  }, [buying, data, emailInput]);
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: no errors related to the modified file.

- [ ] **Step 5: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): dispara InitiateCheckout (Pixel + sendBeacon CAPI) em handleBuy"
```

---

## Task 7: Verificação final integrada

**Files:** nenhum modificado nesta task.

- [ ] **Step 1: Re-rodar todos os testes**

Run: `npx tsx --test lib/__tests__/meta-capi.test.ts`
Expected: PASS — todos os testes existentes + 4 novos verdes.

- [ ] **Step 2: Typecheck final**

Run: `npx tsc --noEmit`
Expected: no errors em todo o projeto.

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build conclui com sucesso. Verificar no output que as duas novas rotas aparecem listadas:
- `ƒ /api/meta/add-to-cart`
- `ƒ /api/meta/initiate-checkout`

- [ ] **Step 4: Smoke test manual no dev server**

Run: `npm run dev`

Em outro terminal:
```bash
# AddToCart route — eventId válido, sem email
curl -X POST http://localhost:3000/api/meta/add-to-cart \
  -H 'Content-Type: application/json' \
  -d '{"eventId":"AddToCart.test123"}'
# Expected: {"ok":true}

# AddToCart route — eventId vazio (deve responder ok sem chamar Meta)
curl -X POST http://localhost:3000/api/meta/add-to-cart \
  -H 'Content-Type: application/json' \
  -d '{}'
# Expected: {"ok":true}

# InitiateCheckout route — payload válido
curl -X POST http://localhost:3000/api/meta/initiate-checkout \
  -H 'Content-Type: application/json' \
  -d '{"eventId":"InitiateCheckout.aceleracao.x","email":"a@b.com","planId":"aceleracao"}'
# Expected: {"ok":true}

# InitiateCheckout route — planId inválido (deve responder ok sem chamar Meta)
curl -X POST http://localhost:3000/api/meta/initiate-checkout \
  -H 'Content-Type: application/json' \
  -d '{"eventId":"x","email":"a@b.com","planId":"unknown"}'
# Expected: {"ok":true}
```

> Se `META_PIXEL_ID`/`META_ACCESS_TOKEN` não estiverem configurados localmente, é esperado ver o aviso `[meta-capi] META_PIXEL_ID/META_ACCESS_TOKEN ausentes` no console — comportamento correto.

- [ ] **Step 5: Smoke test do client em browser**

Abrir `http://localhost:3000/checkout?plan=aceleracao` no Chrome:
1. Abrir DevTools → Network → filtrar por "meta".
2. Confirmar que ao carregar a página aparece um POST para `/api/meta/add-to-cart` com status 200.
3. Clicar no botão de compra do plano "Aceleração".
4. **Antes** do redirect pro Asaas, verificar no Network que aparece um request `ping` (sendBeacon) para `/api/meta/initiate-checkout`.
5. No tab Console verificar que não há erros relacionados a tracking.

> Se houver bloqueio de ad-blocker, os requests podem aparecer como cancelados — isso é client-side, comportamento esperado fora do nosso controle. O que importa é não haver erros não-tratados.

- [ ] **Step 6: Commit final (se houve algum ajuste durante a verificação)**

Se algum dos passos acima exigiu correção, commitar separadamente. Caso contrário, **não criar commit vazio.**

---

## Definition of Done

- [x] `trackAddToCart` e `trackInitiateCheckout` exportados e testados em `lib/meta-capi.ts`
- [x] Rotas `/api/meta/add-to-cart` e `/api/meta/initiate-checkout` criadas, respondendo `{ok:true}` mesmo com input inválido
- [x] `app/checkout/CheckoutPage.tsx` dispara AddToCart (Pixel + CAPI) no mount e InitiateCheckout (Pixel + sendBeacon CAPI) em `handleBuy` antes do redirect
- [x] `npx tsx --test lib/__tests__/meta-capi.test.ts` passa
- [x] `npx tsc --noEmit` sem erros
- [x] `npm run build` conclui com sucesso
- [x] Smoke test manual (curl + browser) confirma flow end-to-end
