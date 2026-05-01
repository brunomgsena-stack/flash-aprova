# Demo Personalizado por Escola — Design Spec

**Data:** 2026-04-30
**Objetivo:** Sistema de demos personalizados para prospecção B2B de escolas, onde cada escola recebe um link com seu branding (logo, cores, nome do tutor) aplicado ao DirectorDashboard.

---

## Contexto

O `DirectorDashboard` já existe e já aceita `data: DirectorDashboardData` como prop, incluindo `school.primary_color` que já estiilza toda a UI. A base está pronta — precisamos só da camada de configuração por escola, da rota pública e do formulário de criação.

---

## Arquitetura

### Abordagem: SSR com Supabase

`/demo/[slug]` é uma Server Component que:
1. Busca config no Supabase por `slug`
2. Valida `token` da query string
3. Renderiza `<DirectorDashboard data={...} />` com branding da escola

Sem estado client-side extra, sem API intermediária para o render.

---

## Banco de Dados

### Tabela `demo_schools`

```sql
create table demo_schools (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  token           text not null default encode(gen_random_bytes(16), 'hex'),
  name            text not null,
  logo_url        text,
  primary_color   text not null default '#7C3AED',
  secondary_color text,
  tutor_name      text default 'Tutor IA',
  slogan          text,
  website_url     text,
  created_at      timestamptz default now()
);

alter table demo_schools enable row level security;

-- Acesso público por slug (validação de token feita na aplicação)
create policy "public_read" on demo_schools
  for select using (true);

-- Escrita apenas via service_role (API route usa service key)
```

**Geração do slug:** automática a partir do nome da escola (ex: "Colégio Elite" → `colegio-elite`), com sufixo numérico se já existir.

**Token:** 32 chars hex gerados pelo Supabase (`gen_random_bytes`), retornados uma vez na criação e incluídos no link gerado.

---

## Rotas e Arquivos

```
app/
  demo/
    [slug]/
      page.tsx          — Server Component: busca Supabase, valida token, renderiza demo

  demo-admin/
    page.tsx            — Formulário admin (requer isAdminId)

app/api/
  demo-extract/
    route.ts            — POST { url } → { name, logo_url, primary_color }

supabase/migrations/
  20260430_demo_schools.sql
```

---

## Rota `/demo/[slug]?token=TOKEN`

**Server Component (`app/demo/[slug]/page.tsx`):**

1. Lê `slug` dos params e `token` dos searchParams
2. Query: `select * from demo_schools where slug = $slug`
3. Se não encontrar ou token não bater → renderiza página "Demo não disponível" (sem expor detalhes)
4. Monta `DirectorDashboardData`:
   - `school.name`, `school.logo_url`, `school.primary_color` vêm do banco
   - Métricas (`engagement_pct`, `memory_score`, etc.) e turmas/alunos são mock fixo (dados ilustrativos realistas)
   - `top_subject`, `critical_subject` também mock
5. Renderiza `<DirectorDashboard data={data} />`

**Metadata dinâmica:**
```ts
export async function generateMetadata({ params }) {
  // busca nome da escola
  return { title: `Painel ${school.name} — FlashAprova` }
}
```

**Middleware:** `/demo` não entra em rotas protegidas. Nenhuma exigência de login.

---

## Formulário Admin (`/demo-admin`)

**Proteção:** middleware verifica `isAdminId(user.id)`. Se não for admin → redirect `/dashboard`.

### UI — Criar novo demo

1. Campo **URL do site** + botão "Extrair" → chama `/api/demo-extract`
2. Campos pré-preenchidos (editáveis):
   - Nome da escola (text)
   - URL da logo (text + preview da imagem)
   - Cor primária (color picker + hex input)
   - Cor secundária (color picker + hex input, opcional)
   - Nome do Tutor IA (text, ex: "Elite AI")
   - Slogan (text, opcional)
3. Botão "Criar Demo" → POST para Supabase → exibe link copiável:
   ```
   flashaprova.com.br/demo/colegio-elite?token=abc123...
   ```

### UI — Demos existentes

Tabela com colunas: Nome · Slug · Link (botão copiar) · Criado em · Excluir

---

## API de Extração (`/api/demo-extract`)

**Método:** POST
**Body:** `{ url: string }`
**Retorno:** `{ name?: string, logo_url?: string, primary_color?: string }`

**Lógica:**
1. Fetch do HTML com timeout 5s e User-Agent de browser
2. Parseia HTML com regex:
   - `<title>` → `name`
   - `<link rel="icon" ...>`, `<link rel="apple-touch-icon" ...>`, `<meta property="og:image" ...>` → `logo_url` (prioridade: apple-touch > og:image > icon)
   - `<meta name="theme-color" content="#...">` → `primary_color`
3. Normaliza URLs relativas para absolutas
4. Falhas (timeout, bloqueio, parse error) → retorna `{}` sem erro, formulário fica em branco para preenchimento manual

**Sem dependências externas** — só fetch + regex. Sem bibliotecas de scraping ou color extraction para manter simplicidade.

---

## Fluxo de Venda

```
Vendedor acessa /demo-admin
  → cola URL da escola
  → clica "Extrair" (2s)
  → revisa/ajusta campos
  → clica "Criar Demo"
  → copia link: flashaprova.com.br/demo/colegio-elite?token=...
  → manda no WhatsApp/email da escola

Diretor da escola clica no link
  → vê dashboard com logo e cores da própria escola
  → "FlashAprova com o branding de vocês já pronto"
```

---

## O que NÃO muda

- `DirectorDashboard.tsx` não precisa de alteração — já aceita `data` como prop e já usa `primary_color`
- Nenhuma rota existente é afetada
- O middleware atual não precisa de mudanças para `/demo` (já é permissivo para rotas não listadas)
- Apenas `/demo-admin` precisa entrar na proteção de admin no middleware

---

## Fora do Escopo

- Upload de logo (apenas URL por enquanto)
- Extração de cores do logo via processamento de imagem (overengineering)
- Analytics de visualizações do demo
- Expiração automática de demos
- Personalização dos dados mock (turmas, alunos, métricas) por escola
