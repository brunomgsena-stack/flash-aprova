# Painel de Admin de Leads — Design

**Data:** 2026-05-19
**Branch:** security-hardening
**Status:** Aprovado para implementação

## Problema

Leads captados no fluxo `/quizz` (e na LP) são gravados na tabela `public.leads`
via `OnboardingFlow.tsx` (`supabase.from('leads').insert({ name, email, whatsapp })`,
fire-and-forget). Hoje só dá pra ver esses leads cavando no Supabase. Precisamos de
uma página de administrador, protegida, que mostre os leads de forma fácil + métricas
e dados de conversão.

## Contexto do código existente

- **Tabela `leads`:** `id, name, email, whatsapp, created_at`. RLS: `anon` pode
  inserir; só `service_role` pode ler (`schema_leads.sql`).
- **Auth admin existente:** `requireAdmin()` em `lib/auth.ts` — exige usuário logado
  com `profiles.role === 'admin'`. Usado por `/admin` e `/demo-admin`.
- **Middleware:** força login em tudo sob `/admin/*` (`isProtected` em `middleware.ts`).
  Por isso a página NÃO fica sob `/admin`.
- **Service role:** `createAdminClient()` em `lib/supabase/admin.ts` (bypassa RLS,
  só server-side).
- **Rate limit:** `getGeneralLimiter`, `getClientIp` em `lib/ratelimit.ts`.
- **Recharts** já é dependência (gráficos).
- Sem runner de teste configurado (`package.json` não tem script de teste / jest / vitest).

## Decisões (do brainstorming)

- **Proteção:** senha única (env) **OU** login admin existente — qualquer um libera.
- **Escopo:** lista de leads + métricas de leads + busca/ordenação + export CSV +
  usuários cadastrados/assinaturas (conversão).
- **Abordagem A escolhida:** rota separada `/painel` com gate próprio, fora de
  `/admin/*`, sem tocar o middleware (isola blast radius nesta branch de segurança).

## Arquitetura

### Rota

`/painel` — server component.

### Gate (`lib/admin-panel-auth.ts`)

`hasPanelAccess(): Promise<boolean>` retorna `true` se **qualquer** condição:

1. Usuário logado com `profiles.role === 'admin'` (mesma checagem do `requireAdmin`,
   sem o `redirect` — retorna boolean).
2. Cookie `painel_token` presente e válido.

Funções puras e isoladas (testáveis se um runner for adicionado depois):

- `derivePanelToken(password: string): string` — `HMAC-SHA256` da string fixa
  `"flashaprova-painel"` usando `password` como chave. (Token determinístico,
  não reversível para a senha; cookie nunca guarda a senha em texto.)
- `verifyPanelToken(cookieValue: string): boolean` — recomputa o token esperado a
  partir de `process.env.ADMIN_PANEL_PASSWORD` e compara em tempo constante
  (`crypto.timingSafeEqual`). Se `ADMIN_PANEL_PASSWORD` não estiver setada, retorna
  `false` (caminho de senha desabilitado, sem fallback inseguro).

### Login por senha

`app/api/admin-panel/login/route.ts` (POST `{ password: string }`):

1. Rate-limit por IP via `getGeneralLimiter` + `getClientIp`. Estourou → `429`
   com mensagem genérica.
2. Se `ADMIN_PANEL_PASSWORD` não setada → `401` genérico.
3. Compara `password` recebido com `ADMIN_PANEL_PASSWORD` via `crypto.timingSafeEqual`
   (normalizar comprimento antes pra não vazar tamanho).
4. Sucesso → seta cookie `painel_token = derivePanelToken(ADMIN_PANEL_PASSWORD)`,
   `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` 7 dias. Responde `200`.
5. Falha → `401` com mensagem genérica `"Acesso negado"` (não distingue senha
   inválida de rate-limit para evitar enumeração).

`app/api/admin-panel/logout/route.ts` (POST): limpa o cookie `painel_token`
(`Max-Age=0`), responde `200`.

### Fluxo da página (`app/painel/page.tsx`)

1. `await hasPanelAccess()`.
2. Sem acesso → renderiza `<PanelLogin />` (e nada de dados é buscado).
3. Com acesso → busca dados via `createAdminClient()` e renderiza
   `<LeadsDashboard data={...} />`.

## Dados (buscados no server, service role)

- **Leads:** `id, name, email, whatsapp, created_at`, `order by created_at desc`,
  `.limit(5000)` (hoje trivial; cap evita payload futuro absurdo).
- **Métricas (computadas no servidor a partir dos leads carregados):**
  - `total`
  - `hoje` (created_at >= meia-noite local de hoje)
  - `ultimos7d`, `ultimos30d`
  - `porDia`: array dos últimos 30 dias `{ dia: 'YYYY-MM-DD', count }` (zeros
    preenchidos para dias sem lead) — alimenta um bar chart `recharts`.
- **Usuários cadastrados / conversão:**
  - `totalContas`: `count` de `profiles` (`head: true, count: 'exact'`).
  - `assinaturasPagas`: best-effort — `count` de `profiles` onde
    `plan not in ('flash','aceleracao')`. Há ambiguidade no schema entre
    `profiles.plan` e `user_stats.plan`; a implementação tenta `profiles.plan`
    de forma defensiva e, se a query falhar (coluna ausente), trata como `0`
    sem quebrar a página.
  - Conversão exibida como números lado a lado (`total leads` × `totalContas`).
    **Sem** matching por email lead→conta (`profiles` não guarda email; vem de
    `auth.users`) — YAGNI.

## Componentes

| Unidade | Tipo | Responsabilidade | Depende de |
|---|---|---|---|
| `lib/admin-panel-auth.ts` | server | `hasPanelAccess`, `derivePanelToken`, `verifyPanelToken` | `crypto`, `lib/supabase/server`, `next/headers` |
| `app/api/admin-panel/login/route.ts` | route | valida senha (constant-time), rate-limit, seta cookie | `lib/admin-panel-auth`, `lib/ratelimit` |
| `app/api/admin-panel/logout/route.ts` | route | limpa cookie | — |
| `app/painel/page.tsx` | server | gate + fetch service-role + render | `lib/admin-panel-auth`, `lib/supabase/admin` |
| `app/painel/PanelLogin.tsx` | client | form de senha → POST `/api/admin-panel/login`, erro genérico, reload em sucesso | — |
| `app/painel/LeadsDashboard.tsx` | client | cards de métricas, bar chart 30d, tabela com busca + ordenação por data, export CSV client-side, botão "Sair" (POST logout) | `recharts` |

CSV gerado no client a partir dos dados já carregados (Blob + download) — nenhuma
rota de export, nenhuma exposição nova. Colunas: `name,email,whatsapp,created_at`.

## Segurança

- Senha só em `ADMIN_PANEL_PASSWORD` (adicionar ao `.env.example`).
- Cookie guarda só HMAC (`derivePanelToken`), nunca a senha.
- Comparação constant-time (`crypto.timingSafeEqual`) no login e no `verifyPanelToken`.
- Rate-limit no login (reusa `getGeneralLimiter`).
- Cookie `httpOnly` + `Secure` + `SameSite=Lax`, expiração 7 dias.
- Sem `ADMIN_PANEL_PASSWORD` → caminho de senha desabilitado (só login admin),
  sem fallback inseguro.
- `createAdminClient()` só no server; client recebe apenas campos de lead
  necessários, nunca a service key.
- `/painel` fora de `/admin/*` → não altera a lógica de auth do middleware.

## Tratamento de erros

- Senha errada / rate-limit → mensagem genérica `"Acesso negado"` (sem distinguir,
  evita enumeração).
- Falha de query Supabase → página renderiza com aviso e seções vazias/zeradas,
  não quebra. `500` apenas se o gate em si falhar.

## Testes

Sem runner configurado no projeto. Para não introduzir infra fora de escopo:

- Funções de token/HMAC em `lib/admin-panel-auth.ts` ficam puras e isoladas
  (prontas para teste se um runner for adicionado depois).
- **Roteiro de verificação manual:**
  1. Sem cookie e sem login → `/painel` mostra o form de senha.
  2. Senha errada → "Acesso negado", sem dashboard.
  3. Senha certa → dashboard com leads e métricas.
  4. Admin logado (`profiles.role='admin'`) → entra direto, sem pedir senha.
  5. Logout → volta ao form.
  6. Export CSV → arquivo abre no Excel/Sheets com as 4 colunas.
  7. `ADMIN_PANEL_PASSWORD` ausente → form rejeita qualquer senha; admin logado
     ainda entra.

## Fora de escopo (YAGNI)

- Matching/atribuição lead→conta por email.
- Edição/exclusão de leads pela UI.
- Distinção de origem do lead (LP vs `/quizz`) — mesma tabela, sem coluna de origem.
- Paginação real (cap de 5000 cobre o volume atual).
- Infra de testes automatizados.
