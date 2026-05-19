# Correção da Instalação do Meta Pixel (browser-side) — Design

**Data:** 2026-05-19
**Branch atual:** security-hardening
**Pixel ID:** `1629796538077252`
**Dataset/CAPI:** `FlashAprovaAPIConversoes` (já implementado server-side)

## Problema

O Gerenciador de Eventos do Meta acusa "Nenhuma atividade recebida" e "Nenhum
site encontrado". Investigação confirmou que **o código-base do Meta Pixel
(`fbq`) não está instalado em lugar nenhum** — `app/layout.tsx` não tem nenhum
script. Consequências:

1. Zero atividade de browser chega ao Events Manager → "Nenhum site encontrado".
2. Os eventos CAPI existentes (`lib/meta-capi.ts`) também ficam sem os cookies
   `_fbp`/`_fbc`, pois esses cookies só são criados pelo script do Pixel no
   browser → match quality degradada.
3. **Causa-raiz secundária:** o `next.config.ts` aplica um Content-Security-Policy
   restritivo que **não permite** `https://connect.facebook.net` (origem do
   `fbevents.js`) nem `https://www.facebook.com` (endpoint do ping `tr?id=`).
   Mesmo instalando o Pixel, ele falharia silenciosamente sem ajustar o CSP.

A Conversions API (CAPI) já está completa: `lib/meta-capi.ts` com hashing,
event IDs determinísticos, `Purchase`/`CompleteRegistration`/`OnboardingCompleted`,
a rota `/api/meta/complete-registration` e testes. O item "Preparo para CAPI"
do pedido **já está atendido server-side** — não há trabalho de CAPI nova.

## Decisões (confirmadas com o usuário)

- **Escopo de disparo:** somente rotas públicas/marketing. O Pixel NÃO carrega
  dentro da área autenticada: prefixos `/dashboard`, `/director`, `/admin`,
  `/demo-admin`.
- **Config do ID:** variável de ambiente pública `NEXT_PUBLIC_META_PIXEL_ID`,
  espelhando o `META_PIXEL_ID` do servidor.
- **Eventos:** código-base + `PageView` em toda mudança de rota (SPA) +
  deduplicação do evento de browser `CompleteRegistration` com a CAPI existente
  via event ID determinístico compartilhado.

## Arquitetura (Abordagem 1 — componente único auto-gating no root layout)

### Componentes / arquivos

1. **`lib/meta-event-id.ts`** (novo)
   - Extrai a função pura `deterministicEventId(eventName, key)` →
     `` `${eventName}.${key}` ``. Sem `node:crypto`, segura para uso no client.
   - **`lib/meta-capi.ts`** passa a reexportar `deterministicEventId` deste
     módulo (mantém compatibilidade — todos os imports server-side existentes
     continuam funcionando sem alteração).

2. **`components/MetaPixel.tsx`** (novo, `'use client'`)
   - Injeta o código-base via `next/script` com `strategy="afterInteractive"`
     (não bloqueia renderização).
   - O snippet inline executa **apenas `fbq('init', PIXEL_ID)`** — **sem**
     `fbq('track','PageView')` inicial (evita PageView duplicado no load).
   - Um `useEffect` com dependências de `usePathname()` + `useSearchParams()`
     dispara `fbq('track','PageView')` em **todo** carregamento, incluindo o
     primeiro render e cada mudança de rota client-side (SPA routing).
   - `<noscript>` com `<img>` de fallback para `https://www.facebook.com/tr?...`.
   - **Auto-gating:** se `usePathname()` começar com qualquer prefixo de
     `EXCLUDED_PREFIXES = ['/dashboard','/director','/admin','/demo-admin']`,
     o componente não inicializa o Pixel nem renderiza o script.
   - **No-op seguro:** se `NEXT_PUBLIC_META_PIXEL_ID` estiver ausente, não
     renderiza nada (sem erro em build/preview sem env).
   - Declaração de tipo para `window.fbq` (arquivo `types/fbq.d.ts` ou inline
     no componente) para satisfazer o TypeScript.

3. **`app/layout.tsx`** (editar)
   - Renderiza `<Suspense><MetaPixel /></Suspense>` dentro do `<body>`.
   - O `<Suspense>` é obrigatório porque `useSearchParams()` no App Router do
     Next 16 exige um boundary de Suspense (senão a rota inteira vira CSR).

4. **`next.config.ts`** (editar — correção do CSP, causa-raiz secundária)
   - `script-src`: adicionar `https://connect.facebook.net`.
   - `img-src`: adicionar `https://www.facebook.com`.
   - `connect-src`: adicionar `https://www.facebook.com`.
   - Demais diretivas e o restante do CSP permanecem inalterados.

5. **`app/login/page.tsx`** (editar)
   - Após `supabase.auth.signUp` bem-sucedido, além do `fetch` já existente
     para `/api/meta/complete-registration`, disparar o evento de browser:
     `fbq('track','CompleteRegistration',{},{ eventID: deterministicEventId('CompleteRegistration', email) })`.
   - Guarda `typeof window.fbq === 'function'`. `/login` é rota pública, então
     o Pixel estará presente. O `eventID` idêntico ao usado pela CAPI
     (`CompleteRegistration.<email>`) garante a deduplicação no Meta.

6. **`.env.local`** e **`.env.example`** (editar)
   - Adicionar `NEXT_PUBLIC_META_PIXEL_ID=1629796538077252` ao `.env.local`.
   - Adicionar a entrada correspondente (sem valor real) ao `.env.example`.

### Fluxo de dados

- Load inicial em rota pública → `next/script` carrega `fbevents.js` de
  `connect.facebook.net` → snippet faz `fbq('init', ID)` → effect dispara
  primeiro `PageView`.
- Navegação SPA (mudança de `pathname`/`searchParams`) → effect re-dispara
  `fbq('track','PageView')`.
- Signup em `/login` → browser dispara `CompleteRegistration` (eventID
  determinístico) **e** a CAPI dispara o mesmo evento (mesmo eventID via
  `/api/meta/complete-registration`) → Meta deduplica.
- Navegação para `/dashboard` (ou outro prefixo excluído) → `MetaPixel`
  retorna `null`, nenhum script é injetado, nenhum PageView é disparado.

### Tratamento de erros / edge cases

- Env ausente → componente é no-op silencioso.
- `window.fbq` indefinido no momento do signup → guarda evita exceção; a CAPI
  ainda cobre o evento.
- Sem test runner no projeto (não há `test` script, vitest ou jest) → sem
  testes unitários novos. Verificação por typecheck + build + Test Events.

## Verificação

- `npx tsc --noEmit` — sem erros de tipo.
- `npx next lint` — sem novos erros de lint.
- `npx next build` — build passa (atenção a boundary de Suspense).
- Runtime: Meta Events Manager → "Testar eventos" (`META_TEST_EVENT_CODE=TEST24610`)
  + Meta Pixel Helper, confirmando ping `tr?id=1629796538077252` no load e em
  cada mudança de rota; confirmar ausência de ping dentro de `/dashboard`.

## Estratégia de dispatch de subagentes (economia de tokens)

Trabalho mecânico/isolado → **Haiku**. Lógica que exige cuidado → **Sonnet**.
Verificação final consolidada pelo agente principal.

| Tarefa | Arquivos | Modelo | Depende de |
|--------|----------|--------|------------|
| A. Extrair event-id puro + reexport | `lib/meta-event-id.ts`, `lib/meta-capi.ts` | Haiku | — |
| B. Componente MetaPixel | `components/MetaPixel.tsx`, `types/fbq.d.ts` | Sonnet | A |
| C. Wiring layout + CSP + env | `app/layout.tsx`, `next.config.ts`, `.env.local`, `.env.example` | Haiku | B |
| D. Dedup no signup | `app/login/page.tsx` | Sonnet | A |
| E. Verificação | tsc / lint / build | Agente principal | B, C, D |

Ordem de dependência: A → (B, D); B → C; (B,C,D) → E.
A e (parte de) C/D podem ser paralelizadas após A.

O detalhamento operacional do dispatch será formalizado no plano de
implementação (skill `writing-plans`).
