# Meta Events no Checkout — AddToCart + InitiateCheckout

**Data:** 2026-05-28
**Status:** Design aprovado, aguardando review da spec escrita
**Contexto relacionado:** [`2026-05-17-meta-conversions-api-design.md`](./2026-05-17-meta-conversions-api-design.md)

## Objetivo

Adicionar dois eventos faltantes do funil de aquisição ao tracking do Meta (Pixel + Conversions API):

- **`AddToCart`** — quando o usuário entra em `/checkout`
- **`InitiateCheckout`** — quando o usuário clica em comprar um plano (antes do redirect pro Asaas)

Hoje só temos `PageView`, `CompleteRegistration` e `Purchase` (este último disparado server-side no webhook do Asaas). Sem AddToCart / InitiateCheckout, a campanha do Meta não tem sinais intermediários para otimização e o funil de relatórios fica com lacunas entre cadastro e compra.

## Não-objetivos

- Não criar cobrança via API Asaas — continuamos usando payment links hospedados.
- Não tratar eventos do tipo `ViewContent` (visualização de plano sem clique).
- Não tocar no fluxo de `CompleteRegistration` nem `Purchase`.

## Arquitetura

Mesmo padrão dual-channel já estabelecido para `CompleteRegistration`:

```
Client (CheckoutPage.tsx)
    ├─ Pixel:  window.fbq('track', <EventName>, customData, { eventID })
    └─ HTTP:   POST /api/meta/<event-route>  (best-effort, never blocking)
                    │
                    └─> trackXxx() em lib/meta-capi.ts → Meta Graph API
```

O mesmo `eventID` é enviado em ambos os canais (gerado deterministicamente em `meta-event-id.ts`) para que o Meta deduplique e conte como 1 evento por usuário.

### Fluxo AddToCart

```
/checkout monta (useEffect, guarded por useRef para StrictMode)
    ├─ Pixel:  fbq('track', 'AddToCart', { currency: 'BRL', content_ids, content_type }, { eventID })
    └─ fetch:  POST /api/meta/add-to-cart  body: { email? }
                    └─> trackAddToCart() → CAPI
```

### Fluxo InitiateCheckout

```
handleBuy(planId) clicado
    ├─ Pixel:  fbq('track', 'InitiateCheckout', { currency, value, content_name, content_ids, content_type, num_items }, { eventID })
    ├─ navigator.sendBeacon('/api/meta/initiate-checkout', JSON.stringify({ email, planId }))
    │     fallback: fetch(url, { method:'POST', body, keepalive: true })
    └─ window.location.href = asaasUrl   // redirect imediato pro Asaas
```

`sendBeacon` é mandatório aqui — a página é abandonada imediatamente após o clique. Um `fetch` normal seria cancelado pelo navegador.

## Componentes

### 1. `lib/meta-capi.ts` (modificação)

Adicionar duas funções públicas espelhando `trackPurchase` / `trackCompleteRegistration`:

```ts
export function trackAddToCart(p: BaseMatch & {
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'AddToCart',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'website',
    userData: { /* email, externalId, ip, ua, fbp, fbc */ },
    customData: {
      currency: 'BRL',
      content_ids: ['aceleracao', 'panteao_elite', 'black'],
      content_type: 'product',
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}

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
    userData: { /* idem */ },
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

### 2. `app/api/meta/add-to-cart/route.ts` (novo)

POST. Estrutura idêntica a `complete-registration/route.ts`:

- Body: `{ eventId: string, email?: string }` — **o cliente gera o eventId e envia**, garantindo igualdade com o Pixel para dedupe.
- Headers usados: `_fbp`/`_fbc` (cookies), `x-forwarded-for`, `user-agent`, `referer`
- Validação: `eventId` deve ser string não vazia ≤200 chars; caso contrário responde `{ok:true}` sem chamar Meta.
- Sempre responde `{ ok: true }`. Tracking não pode quebrar o front.

### 3. `app/api/meta/initiate-checkout/route.ts` (novo)

POST. Body: `{ eventId: string, email?: string, planId: 'aceleracao' | 'panteao_elite' | 'black' }`.

Mapa estático interno (espelha `app/api/webhook/asaas/route.ts`):

```ts
const PLAN_META: Record<string, { value: number; name: string }> = {
  aceleracao:    { value: 257, name: 'Protocolo Aceleração' },
  panteao_elite: { value: 327, name: 'Protocolo Pantéon Elite' },
  black:         { value: 997, name: 'Protocolo Black' },
};
```

Validação:
- `eventId` deve ser string não vazia ≤200 chars
- `planId` deve estar em `PLAN_META`
- Em ambos os casos de invalidação: responde `{ok:true}` sem chamar Meta.

Aceita request via `sendBeacon` (Content-Type: `application/json` ou `text/plain`; ambos parseados como JSON best-effort). EventId vem do cliente — route não regenera.

### 4. `app/checkout/CheckoutPage.tsx` (modificação)

**AddToCart no mount** — adicionado **dentro do `useEffect` existente** (linhas 485-495), após o parse de `flashAprovaOnboarding` e leitura do `?plan=`. Guard `useRef` para StrictMode double-mount em dev:

```ts
const addToCartFiredRef = useRef(false);

useEffect(() => {
  // ... código existente: lê localStorage, lê URL params ...

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

**InitiateCheckout em `handleBuy`** — entre `setBuying(planId)` e o `window.location.href`:

```ts
const PLAN_META = { /* mesmo mapa */ };
const meta = PLAN_META[planId];
const eventId = deterministicEventId('InitiateCheckout', `${planId}.${email || 'anon'}`);

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

const payload = JSON.stringify({ eventId, email, planId });
try {
  const blob = new Blob([payload], { type: 'application/json' });
  if (!navigator.sendBeacon('/api/meta/initiate-checkout', blob)) {
    fetch('/api/meta/initiate-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
} catch { /* ignora */ }

window.location.href = url;
```

## Fluxo de dados

| Evento             | Trigger                  | Email garantido? | Value enviado? | EventId key (gerado no cliente)          |
|--------------------|--------------------------|------------------|----------------|------------------------------------------|
| AddToCart          | `useEffect` em /checkout | Não              | Não            | `email \|\| anon-${Date.now()}`          |
| InitiateCheckout   | handleBuy(planId)        | Best-effort      | Sim (por plano)| `${planId}.${email \|\| 'anon'}`         |

O eventId é **gerado uma vez no cliente** e enviado tanto pro Pixel (`{ eventID }`) quanto pro CAPI (no body do POST). A rota CAPI usa o eventId verbatim, sem regenerar — garante que ambos os canais usem o mesmo identificador para dedupe no Meta.

## Tratamento de erros

- **Tracking sempre best-effort.** Nenhuma chamada bloqueia ou pode levantar exceção visível ao usuário. Padrão estabelecido em `lib/meta-capi.ts` (timeout 3s, retorna `{ok:false}` em vez de throw).
- **Env vars ausentes (`META_PIXEL_ID` / `META_ACCESS_TOKEN`):** `sendMetaEvent` já é no-op silencioso. Routes seguem respondendo `{ok:true}`.
- **Erro de rede no Pixel:** `fbq` é assíncrono interno; não há throw que escape do `track()`.
- **StrictMode double-mount:** `useRef` guard evita AddToCart duplicado em dev.
- **Beacon falha (Safari sem permissão, payload >64KB):** fallback `fetch keepalive`. Payload aqui é <100 bytes, então 64KB nunca é atingido.

## Testes

Estender `lib/__tests__/meta-capi.test.ts`:

1. **`trackAddToCart` constrói evento corretamente** — verifica `event_name='AddToCart'`, `custom_data.currency='BRL'`, `custom_data.content_ids` contém os 3 planos, `content_type='product'`, sem `value`.
2. **`trackInitiateCheckout` constrói evento com value+plano** — para cada um dos 3 planos: verifica `event_name='InitiateCheckout'`, `value` correto, `content_name` correto, `content_ids: [planId]`, `num_items: 1`.
3. **`deterministicEventId` segue padrão `EventName.key`** — sanity check para `AddToCart` e `InitiateCheckout`.
4. **`sendMetaEvent` no-op quando env ausente** — não-regressão, mesmo padrão dos testes existentes.

Não vamos testar as routes HTTP via integração (segue padrão da `complete-registration/route.ts`, que também não tem teste de rota).

## Verificação manual pós-deploy

- Abrir Meta Events Manager → Test Events com `META_TEST_EVENT_CODE` configurado em ambiente de staging.
- Navegar `/checkout` → confirmar AddToCart (browser+server, dedupe pela `eventID`).
- Clicar comprar → confirmar InitiateCheckout antes do redirect.
- Verificar no DevTools que `sendBeacon` retornou `true` e que o request aparece como "ping" no Network tab.

## Variáveis de ambiente

Nenhuma nova. Reusa as existentes: `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` (só em não-produção), `META_GRAPH_VERSION` (default `v21.0`).

## Riscos

- **Plano "black" ainda com link placeholder** (`REPLACE_ME_BLACK` em `CheckoutPage.tsx:468`). Tracking funcionará mas o usuário não chega ao Asaas. Não é problema deste design — fora de escopo.
- **Match quality do AddToCart anônimo:** sem email + sem fbp = baixa qualidade. Aceitável; Meta tolera e ainda usa pra modelagem de audiência.
- **Spam de eventos em /checkout:** se um usuário revisitar /checkout múltiplas vezes, dispara múltiplos AddToCart. Aceitável — comportamento padrão e esperado pelo Meta.
