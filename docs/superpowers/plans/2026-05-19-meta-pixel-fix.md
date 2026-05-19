# Correção da Instalação do Meta Pixel — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar o código-base do Meta Pixel no browser com PageView em mudanças de rota (SPA) e deduplicação do `CompleteRegistration` com a CAPI já existente.

**Architecture:** Componente client único auto-gating (`MetaPixel`) montado no root layout via `next/script` (`afterInteractive`); helper puro de event ID compartilhado client/server; CSP ajustado para liberar os domínios do Meta. CAPI server-side já existe e não muda.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `next/script`, `next/navigation`.

**Observação sobre TDD:** O projeto não tem test runner configurado (sem `test` script, vitest ou jest). Não há como escrever testes unitários executáveis. A verificação de cada tarefa é feita por `tsc --noEmit` / `next lint` / `next build`, e a verificação de runtime (final) pelo Meta Test Events. Isso foi decidido e documentado no spec.

**Estratégia de subagentes (economia de tokens):** Tarefas mecânicas → **Haiku**. Tarefas com lógica → **Sonnet**. Verificação final → agente principal. Ordem de dependência: Tarefa 1 → (Tarefa 2, Tarefa 4); Tarefa 2 → Tarefa 3; (2,3,4) → Tarefa 5.

**Referência (spec):** `docs/superpowers/specs/2026-05-19-meta-pixel-fix-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `lib/meta-event-id.ts` | Função pura `deterministicEventId` (sem `node:crypto`), usável no client | Criar |
| `lib/meta-capi.ts` | Reexporta `deterministicEventId` do novo módulo | Modificar |
| `types/fbq.d.ts` | Tipagem global de `window.fbq` | Criar |
| `components/MetaPixel.tsx` | Injeta base do Pixel, dispara PageView por rota, auto-gating | Criar |
| `app/layout.tsx` | Monta `<Suspense><MetaPixel/></Suspense>` no `<body>` | Modificar |
| `next.config.ts` | Libera domínios Meta no CSP | Modificar |
| `app/login/page.tsx` | Dispara `CompleteRegistration` de browser deduplicado | Modificar |
| `.env.local` | `NEXT_PUBLIC_META_PIXEL_ID` real | Modificar |
| `.env.example` | Bloco META documentado | Modificar |

---

## Tarefa 1: Helper puro de event ID  — **[Haiku]**

**Files:**
- Create: `lib/meta-event-id.ts`
- Modify: `lib/meta-capi.ts:1-46`

- [ ] **Step 1: Criar o módulo puro**

Create `lib/meta-event-id.ts`:

```typescript
/**
 * ID de evento determinístico, compartilhado entre browser (Pixel) e
 * servidor (CAPI) para deduplicação no Meta. Módulo PURO — sem node:crypto —
 * portanto seguro para import em componentes client.
 */
export function deterministicEventId(eventName: string, key: string): string {
  return `${eventName}.${key}`;
}
```

- [ ] **Step 2: Reexportar de `lib/meta-capi.ts` (mantém imports server existentes)**

Em `lib/meta-capi.ts`, remova a definição local de `deterministicEventId` (linhas 44-46, o bloco abaixo):

```typescript
export function deterministicEventId(eventName: string, key: string): string {
  return `${eventName}.${key}`;
}
```

E adicione, logo após o import existente na linha 1 (`import { createHash } from 'node:crypto';`):

```typescript
export { deterministicEventId } from './meta-event-id';
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros (todos os imports server-side de `deterministicEventId` via `@/lib/meta-capi` continuam resolvendo).

- [ ] **Step 4: Commit**

```bash
git add lib/meta-event-id.ts lib/meta-capi.ts
git commit -m "refactor(meta): extrai deterministicEventId puro para uso client/server"
```

---

## Tarefa 2: Componente MetaPixel  — **[Sonnet]**

**Files:**
- Create: `types/fbq.d.ts`
- Create: `components/MetaPixel.tsx`

**Depende de:** Tarefa 1.

- [ ] **Step 1: Tipagem global de `window.fbq`**

Create `types/fbq.d.ts`:

```typescript
export {};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}
```

- [ ] **Step 2: Criar o componente**

Create `components/MetaPixel.tsx`:

```tsx
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Prefixos de área autenticada onde o Pixel NÃO deve carregar nem rastrear. */
const EXCLUDED_PREFIXES = ['/dashboard', '/director', '/admin', '/demo-admin'];

function isExcluded(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

/**
 * Código-base do Meta Pixel + PageView em cada navegação (SPA).
 * Auto-gating: só atua em rotas públicas/marketing. No-op se o env
 * NEXT_PUBLIC_META_PIXEL_ID estiver ausente.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const excluded = isExcluded(pathname);

  useEffect(() => {
    if (excluded) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    window.fbq('track', 'PageView');
  }, [pathname, searchParams, excluded]);

  if (!PIXEL_ID || excluded) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
```

Notas de design (não escrever no arquivo):
- O snippet NÃO chama `fbq('track','PageView')` — o `useEffect` cuida de TODOS os PageViews, inclusive o primeiro render. Isso evita duplicação no load.
- Hooks são chamados sempre antes de qualquer `return` (ordem estável).

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros (`window.fbq` resolvido via `types/fbq.d.ts`).

- [ ] **Step 4: Commit**

```bash
git add types/fbq.d.ts components/MetaPixel.tsx
git commit -m "feat(meta): componente MetaPixel com PageView SPA e auto-gating"
```

---

## Tarefa 3: Wiring no layout + CSP + envs  — **[Haiku]**

**Files:**
- Modify: `app/layout.tsx`
- Modify: `next.config.ts:14-30`
- Modify: `.env.local`
- Modify: `.env.example`

**Depende de:** Tarefa 2.

- [ ] **Step 1: Montar `<MetaPixel/>` no layout**

Em `app/layout.tsx`, adicione aos imports do topo (após `import { ThemeProvider } ...`):

```typescript
import { Suspense } from 'react';
import MetaPixel from '@/components/MetaPixel';
```

E substitua o `<body>` atual:

```tsx
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
```

por:

```tsx
      <body>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
```

(O `<Suspense>` é obrigatório: `useSearchParams()` no App Router do Next 16 exige boundary, senão a rota inteira vira CSR.)

- [ ] **Step 2: Liberar domínios Meta no CSP**

Em `next.config.ts`, dentro do array da diretiva `Content-Security-Policy` (linhas ~17-26), faça exatamente estas três substituições:

`script-src`: de
```
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
```
para
```
      `script-src 'self' 'unsafe-inline' https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ''}`,
```

`img-src`: de
```
      "img-src 'self' data: blob:",
```
para
```
      "img-src 'self' data: blob: https://www.facebook.com",
```

`connect-src`: de
```
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com",
```
para
```
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://www.facebook.com",
```

- [ ] **Step 3: Adicionar env real em `.env.local`**

Em `.env.local`, logo após a linha `META_PIXEL_ID=1629796538077252` (linha 36), adicione:

```
# Pixel ID exposto ao browser (mesmo valor do META_PIXEL_ID)
NEXT_PUBLIC_META_PIXEL_ID=1629796538077252
```

- [ ] **Step 4: Documentar no `.env.example`**

Em `.env.example`, antes da seção `# ------ Config Opcional ------`, adicione:

```
# ------ Meta Pixel / Conversions API ------
META_PIXEL_ID=000000000000000
META_ACCESS_TOKEN=EAAxxxxxxxx
META_TEST_EVENT_CODE=TESTxxxxx
# Mesmo valor de META_PIXEL_ID, exposto ao browser para o Pixel client-side
NEXT_PUBLIC_META_PIXEL_ID=000000000000000
```

- [ ] **Step 5: Verificar build**

Run: `npx next build`
Expected: build conclui sem erro; sem aviso de `useSearchParams() should be wrapped in a suspense boundary`.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx next.config.ts .env.example
git commit -m "feat(meta): monta MetaPixel no layout, libera CSP e documenta env"
```

(Nota: `.env.local` não é versionado — não entra no `git add`.)

---

## Tarefa 4: Deduplicação no signup  — **[Sonnet]**

**Files:**
- Modify: `app/login/page.tsx:1-6` e `:137-145`

**Depende de:** Tarefa 1.

- [ ] **Step 1: Importar o helper**

Em `app/login/page.tsx`, após a linha `import { supabase } from '@/lib/supabaseClient';`, adicione:

```typescript
import { deterministicEventId } from '@/lib/meta-event-id';
```

- [ ] **Step 2: Disparar evento de browser deduplicado**

No `handleSubmit`, no ramo `else` (signup), localize o bloco existente:

```typescript
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      // Tracking best-effort — nunca bloqueia nem quebra o fluxo de cadastro.
      fetch('/api/meta/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
```

e substitua por:

```typescript
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      // Tracking best-effort — nunca bloqueia nem quebra o fluxo de cadastro.
      const eventId = deterministicEventId('CompleteRegistration', email);
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration', {}, { eventID: eventId });
      }
      fetch('/api/meta/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
```

(O `eventID` idêntico ao usado pela CAPI em `/api/meta/complete-registration` — `CompleteRegistration.<email>` — garante a deduplicação no Meta. A tipagem de `window.fbq` vem de `types/fbq.d.ts`, criado na Tarefa 2.)

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(meta): dispara CompleteRegistration de browser deduplicado com a CAPI"
```

---

## Tarefa 5: Verificação consolidada  — **[Agente principal]**

**Depende de:** Tarefas 2, 3, 4.

- [ ] **Step 1: Typecheck + lint + build**

Run:
```bash
npx tsc --noEmit && npx next lint && npx next build
```
Expected: tudo passa, sem novos erros nem avisos de Suspense.

- [ ] **Step 2: Verificação de runtime (manual, documentar resultado)**

`npm run dev`, e no browser:
- Abrir `/` (landing) → Meta Pixel Helper deve detectar o Pixel `1629796538077252`; aba Network deve mostrar `https://www.facebook.com/tr?id=1629796538077252&ev=PageView`.
- Navegar `/` → `/login` (SPA) → confirmar **novo** ping `PageView` na navegação.
- Fazer um signup de teste em `/login` → confirmar ping `CompleteRegistration` com `eid=CompleteRegistration.<email>`.
- Navegar para `/dashboard` (logado) → confirmar que **nenhum** ping é disparado (auto-gating).
- Meta Events Manager → "Testar eventos" (`META_TEST_EVENT_CODE=TEST24610`) → confirmar recebimento de PageView e dedup do CompleteRegistration (browser + servidor contam como 1).

- [ ] **Step 3: Commit final (se houver ajustes)**

```bash
git add -A && git commit -m "chore(meta): verificação da instalação do Pixel"
```

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Pixel base instalado → Tarefa 2 + 3 ✔
- PageView SPA (usePathname/useSearchParams) → Tarefa 2 ✔
- Config via NEXT_PUBLIC_META_PIXEL_ID → Tarefa 3 ✔
- Gating só rotas públicas → Tarefa 2 (`EXCLUDED_PREFIXES`) ✔
- Dedup CompleteRegistration com CAPI → Tarefa 1 + 4 ✔
- Causa-raiz CSP → Tarefa 3 Step 2 ✔
- CAPI server-side: sem mudança (já completa) ✔
- Verificação sem test runner → Tarefa 5 ✔

**Placeholder scan:** nenhum TBD/TODO; todo passo tem código/comando concreto.

**Consistência de tipos:** `deterministicEventId(eventName, key)` idêntico em Tarefas 1/4; `window.fbq` definido na Tarefa 2 e usado na Tarefa 4; `EXCLUDED_PREFIXES` único na Tarefa 2.
