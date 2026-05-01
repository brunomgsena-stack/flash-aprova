# Demo Personalizado por Escola — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistema de demos personalizados para prospecção B2B — formulário admin gera link `/demo/[slug]?token=TOKEN` com branding (logo, cores, nome do tutor) da escola prospectada aplicado ao DirectorDashboard.

**Architecture:** Server Component em `/demo/[slug]` busca config no Supabase, valida token, e renderiza `DirectorDashboard` com branding da escola. Formulário admin em `/demo-admin` (Client Component + auth guard) usa `/api/demo-extract` para extrair nome/logo/cor do site da escola automaticamente.

**Tech Stack:** Next.js 15 App Router (Server Components), Supabase (PostgreSQL + service_role key), `lib/auth.ts` (requireAdmin), TypeScript, Tailwind CSS, `@supabase/ssr` (server client)

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `supabase/migrations/20260430_demo_schools.sql` | CREATE | Tabela `demo_schools` com RLS |
| `app/api/demo-extract/route.ts` | CREATE | POST: recebe URL, extrai nome/logo/cor |
| `app/demo-admin/page.tsx` | CREATE | Server wrapper: auth guard via requireAdmin() |
| `app/demo-admin/DemoAdminClient.tsx` | CREATE | Client Component: formulário de criação + lista de demos |
| `app/demo/[slug]/page.tsx` | CREATE | Server Component: busca Supabase, valida token, renderiza demo |

**Não muda:** `components/DirectorDashboard.tsx`, `middleware.ts`, `lib/auth.ts`

---

## Task 1: Migration — Criar tabela `demo_schools`

**Files:**
- Create: `supabase/migrations/20260430_demo_schools.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260430_demo_schools.sql

create table if not exists demo_schools (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  token           text not null default encode(gen_random_bytes(16), 'hex'),
  name            text not null,
  logo_url        text,
  primary_color   text not null default '#7C3AED',
  secondary_color text,
  tutor_name      text not null default 'Tutor IA',
  slogan          text,
  website_url     text,
  created_at      timestamptz not null default now()
);

alter table demo_schools enable row level security;

-- Leitura pública por slug (validação de token feita na aplicação)
create policy "demo_schools_public_read"
  on demo_schools for select
  using (true);

-- Escrita apenas via service_role key (sem policy de insert/update/delete via anon/user)
```

- [ ] **Step 2: Aplicar a migration no Supabase**

Acesse o painel Supabase → SQL Editor → cole e execute o SQL acima.

Verificação: vá em Table Editor → procure a tabela `demo_schools`. Deve aparecer com as colunas listadas.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260430_demo_schools.sql
git commit -m "feat: add demo_schools migration for B2B demo system"
```

---

## Task 2: API Route — Extração automática de branding

**Files:**
- Create: `app/api/demo-extract/route.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// app/api/demo-extract/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawUrl: string = body?.url ?? '';

  if (!rawUrl) {
    return NextResponse.json({});
  }

  // Normaliza URL: garante que tem protocolo
  let url: string;
  try {
    url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    new URL(url); // valida
  } catch {
    return NextResponse.json({});
  }

  // Fetch com timeout de 5s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let html = '';
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    html = await res.text();
  } catch {
    return NextResponse.json({});
  } finally {
    clearTimeout(timeoutId);
  }

  const origin = new URL(url).origin;

  // Extrai nome: <title>
  const nameMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const name = nameMatch ? nameMatch[1].trim().split(/[\|\-–—]/)[0].trim() : undefined;

  // Extrai logo com prioridade: apple-touch-icon > og:image > shortcut icon > icon
  let logo_url: string | undefined;

  const appleTouchMatch = html.match(
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i
  ) ?? html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i
  );

  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  const iconMatch = html.match(
    /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i
  ) ?? html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i
  );

  const rawLogoUrl = appleTouchMatch?.[1] ?? ogImageMatch?.[1] ?? iconMatch?.[1];
  if (rawLogoUrl) {
    logo_url = rawLogoUrl.startsWith('http') ? rawLogoUrl : `${origin}${rawLogoUrl.startsWith('/') ? '' : '/'}${rawLogoUrl}`;
  }

  // Extrai cor: <meta name="theme-color" content="#...">
  const colorMatch = html.match(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i
  ) ?? html.match(
    /<meta[^>]+content=["'](#[0-9a-fA-F]{3,6})["'][^>]+name=["']theme-color["']/i
  );
  const primary_color = colorMatch?.[1];

  return NextResponse.json({
    name: name ?? undefined,
    logo_url,
    primary_color,
  });
}
```

- [ ] **Step 2: Verificar manualmente**

Com o servidor rodando (`npm run dev`), teste no terminal:

```bash
curl -X POST http://localhost:3000/api/demo-extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

Resultado esperado: JSON com `name` e/ou `logo_url`. Pode não ter `primary_color` (Google não usa theme-color), mas não deve retornar erro.

Teste com URL inválida:
```bash
curl -X POST http://localhost:3000/api/demo-extract \
  -H "Content-Type: application/json" \
  -d '{"url": "nao-existe-mesmo"}'
```

Resultado esperado: `{}`

- [ ] **Step 3: Commit**

```bash
git add app/api/demo-extract/route.ts
git commit -m "feat: add demo-extract API route for automatic school branding extraction"
```

---

## Task 3: Formulário Admin — Client Component

**Files:**
- Create: `app/demo-admin/DemoAdminClient.tsx`

O Client Component faz: (a) extração via `/api/demo-extract`, (b) criação via Supabase client, (c) listagem e exclusão de demos, (d) cópia do link.

- [ ] **Step 1: Criar o arquivo**

```typescript
// app/demo-admin/DemoAdminClient.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type DemoSchool = {
  id: string;
  slug: string;
  token: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  tutor_name: string;
  slogan: string | null;
  website_url: string | null;
  created_at: string;
};

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function DemoAdminClient() {
  const supabase = createClient();

  const [demos, setDemos]           = useState<DemoSchool[]>([]);
  const [loading, setLoading]       = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);

  const [websiteUrl,      setWebsiteUrl]      = useState('');
  const [name,            setName]            = useState('');
  const [logoUrl,         setLogoUrl]         = useState('');
  const [primaryColor,    setPrimaryColor]    = useState('#7C3AED');
  const [secondaryColor,  setSecondaryColor]  = useState('');
  const [tutorName,       setTutorName]       = useState('Tutor IA');
  const [slogan,          setSlogan]          = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('demo_schools')
      .select('*')
      .order('created_at', { ascending: false });
    setDemos(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);

  async function handleExtract() {
    if (!websiteUrl) return;
    setExtracting(true);
    try {
      const res = await fetch('/api/demo-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (data.name)          setName(data.name);
      if (data.logo_url)      setLogoUrl(data.logo_url);
      if (data.primary_color) setPrimaryColor(data.primary_color);
    } catch {
      // silencia erros — o vendedor preenche manualmente
    }
    setExtracting(false);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Nome da escola é obrigatório.' });
      return;
    }
    setSaving(true);

    const baseSlug = slugify(name);
    // Tenta o slug base; se já existir, adiciona sufixo numérico
    const { data: existing } = await supabase
      .from('demo_schools')
      .select('slug')
      .like('slug', `${baseSlug}%`);

    let slug = baseSlug;
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${existing.length + 1}`;
    }

    const { data, error } = await supabase
      .from('demo_schools')
      .insert({
        slug,
        name:            name.trim(),
        logo_url:        logoUrl.trim() || null,
        primary_color:   primaryColor,
        secondary_color: secondaryColor.trim() || null,
        tutor_name:      tutorName.trim() || 'Tutor IA',
        slogan:          slogan.trim() || null,
        website_url:     websiteUrl.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      setMessage({ type: 'error', text: 'Erro ao criar demo. Tente novamente.' });
      setSaving(false);
      return;
    }

    // Limpa formulário
    setWebsiteUrl(''); setName(''); setLogoUrl('');
    setPrimaryColor('#7C3AED'); setSecondaryColor('');
    setTutorName('Tutor IA'); setSlogan('');

    setMessage({ type: 'success', text: `Demo criado! Link copiado abaixo.` });
    await fetchDemos();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este demo?')) return;
    await supabase.from('demo_schools').delete().eq('id', id);
    await fetchDemos();
  }

  function demoLink(demo: DemoSchool): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://flashaprova.com.br';
    return `${base}/demo/${demo.slug}?token=${demo.token}`;
  }

  async function handleCopy(demo: DemoSchool) {
    await navigator.clipboard.writeText(demoLink(demo));
    setCopied(demo.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--fa-bg)] text-[var(--fa-text)] p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Demos — Prospecção B2B</h1>

      {/* Formulário de criação */}
      <section className="bg-[var(--fa-card)] border border-[var(--fa-border)] rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Criar novo demo</h2>

        {message && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        {/* URL + Extrair */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="https://siteescola.com.br"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !websiteUrl}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {extracting ? 'Extraindo...' : 'Extrair'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Nome da escola *</label>
            <input
              type="text"
              placeholder="Colégio Elite"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          {/* Nome do Tutor */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Nome do Tutor IA</label>
            <input
              type="text"
              placeholder="Elite AI"
              value={tutorName}
              onChange={e => setTutorName(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          {/* Logo URL */}
          <div className="md:col-span-2">
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">URL da logo</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="https://siteescola.com.br/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="preview" className="h-8 w-8 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </div>
          </div>

          {/* Cor primária */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Cor primária</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-[var(--fa-border)] bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Cor secundária */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Cor secundária (opcional)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor || '#10b981'}
                onChange={e => setSecondaryColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-[var(--fa-border)] bg-transparent"
              />
              <input
                type="text"
                placeholder="#10b981"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Slogan */}
          <div className="md:col-span-2">
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Slogan (opcional)</label>
            <input
              type="text"
              placeholder="Preparando campeões desde 1995"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="mt-6 w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 font-medium text-sm transition-colors"
        >
          {saving ? 'Criando...' : 'Criar Demo'}
        </button>
      </section>

      {/* Lista de demos */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Demos criados</h2>
        {loading ? (
          <p className="text-[var(--fa-text-2)] text-sm">Carregando...</p>
        ) : demos.length === 0 ? (
          <p className="text-[var(--fa-text-2)] text-sm">Nenhum demo criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {demos.map(demo => (
              <div
                key={demo.id}
                className="bg-[var(--fa-card)] border border-[var(--fa-border)] rounded-xl p-4 flex items-center gap-4"
              >
                {demo.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={demo.logo_url} alt={demo.name} className="h-8 w-8 object-contain rounded flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: demo.primary_color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{demo.name}</p>
                  <p className="text-xs text-[var(--fa-text-2)] truncate">{demoLink(demo)}</p>
                </div>
                <button
                  onClick={() => handleCopy(demo)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors flex-shrink-0"
                >
                  {copied === demo.id ? 'Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={() => handleDelete(demo.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors flex-shrink-0"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

O arquivo usa `createClient` do Supabase client-side. Verifique se o path de import está correto:
```bash
ls /Users/brunomatheus/app-flashcards/lib/supabase/
```
Deve existir um arquivo `client.ts` (ou `client.tsx`). Se o nome for diferente, ajuste o import.

- [ ] **Step 3: Commit**

```bash
git add app/demo-admin/DemoAdminClient.tsx
git commit -m "feat: add DemoAdminClient form for creating personalized school demos"
```

---

## Task 4: Página Admin — Server Wrapper com Auth Guard

**Files:**
- Create: `app/demo-admin/page.tsx`

- [ ] **Step 1: Criar o arquivo**

```typescript
// app/demo-admin/page.tsx
import { requireAdmin } from '@/lib/auth';
import DemoAdminClient from './DemoAdminClient';

export const metadata = {
  title: 'Demo Admin — FlashAprova',
};

export default async function DemoAdminPage() {
  await requireAdmin(); // redireciona para /dashboard?error=unauthorized se não for admin
  return <DemoAdminClient />;
}
```

- [ ] **Step 2: Verificar proteção**

Com o servidor rodando, acesse `/demo-admin` sem estar logado — deve redirecionar para `/login`.

Acesse com um usuário que não é admin — deve redirecionar para `/dashboard?error=unauthorized`.

Acesse com um usuário admin (role = 'admin' na tabela `profiles`) — deve exibir o formulário.

- [ ] **Step 3: Commit**

```bash
git add app/demo-admin/page.tsx
git commit -m "feat: add demo-admin page with requireAdmin guard"
```

---

## Task 5: Rota Pública do Demo

**Files:**
- Create: `app/demo/[slug]/page.tsx`

Esta é a peça central: Server Component que valida token e renderiza o dashboard com branding da escola.

- [ ] **Step 1: Verificar o import path do Supabase server client**

```bash
ls /Users/brunomatheus/app-flashcards/lib/supabase/
```

Deve existir `server.ts` (exporta `createClient`). O import usado será `@/lib/supabase/server`.

- [ ] **Step 2: Criar o arquivo**

```typescript
// app/demo/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server';
import DirectorDashboard, {
  type DirectorDashboardData,
} from '@/components/DirectorDashboard';

// Mock data realista — dados ilustrativos que parecem reais
const DEMO_MOCK_DATA: Omit<DirectorDashboardData, 'school'> = {
  engagement_pct:   87,
  memory_score:     74,
  students_at_risk: 12,
  top_subject:      'Biologia (Citologia)',
  critical_subject: 'História (Brasil Colônia)',
  radar: [
    { area: 'Natureza',   value: 79 },
    { area: 'Humanas',    value: 61 },
    { area: 'Linguagens', value: 83 },
    { area: 'Matemática', value: 66 },
  ],
  critical_subjects: [
    { name: 'Estequiometria',     retention: 22 },
    { name: 'Brasil Colônia',     retention: 31 },
    { name: 'Funções do 2º Grau', retention: 38 },
    { name: 'Geopolítica Mundial',retention: 44 },
    { name: 'Genética Mendeliana',retention: 49 },
  ],
  classes: [
    {
      id: '1',
      name: '3º Ano A',
      student_count: 45,
      retention_avg: 82,
      radar: [
        { area: 'Natureza',   value: 85 },
        { area: 'Humanas',    value: 70 },
        { area: 'Linguagens', value: 88 },
        { area: 'Matemática', value: 75 },
      ],
      students: [
        {
          id: 's1', name: 'Ana Beatriz Costa',
          retention: 91, engagement: 95,
          study_hours: [14, 15, 16, 19, 20, 21, 14, 15],
          forgetting_curve: [
            { day: 'Seg', retention: 98 }, { day: 'Ter', retention: 88 },
            { day: 'Qua', retention: 79 }, { day: 'Qui', retention: 85 },
            { day: 'Sex', retention: 90 }, { day: 'Sáb', retention: 93 },
            { day: 'Dom', retention: 91 },
          ],
        },
        {
          id: 's2', name: 'Carlos Eduardo Lima',
          retention: 73, engagement: 68,
          study_hours: [22, 23, 0, 1, 2, 23, 0, 22, 1],
          forgetting_curve: [
            { day: 'Seg', retention: 80 }, { day: 'Ter', retention: 70 },
            { day: 'Qua', retention: 55 }, { day: 'Qui', retention: 60 },
            { day: 'Sex', retention: 52 }, { day: 'Sáb', retention: 65 },
            { day: 'Dom', retention: 73 },
          ],
        },
        {
          id: 's3', name: 'Fernanda Oliveira',
          retention: 38, engagement: 42,
          study_hours: [23, 0, 1, 2, 3, 23, 0, 1, 2],
          forgetting_curve: [
            { day: 'Seg', retention: 65 }, { day: 'Ter', retention: 55 },
            { day: 'Qua', retention: 40 }, { day: 'Qui', retention: 30 },
            { day: 'Sex', retention: 25 }, { day: 'Sáb', retention: 32 },
            { day: 'Dom', retention: 38 },
          ],
        },
        {
          id: 's4', name: 'Rafael Santos Melo',
          retention: 85, engagement: 88,
          study_hours: [8, 9, 14, 15, 16, 20, 8, 14],
          forgetting_curve: [
            { day: 'Seg', retention: 90 }, { day: 'Ter', retention: 85 },
            { day: 'Qua', retention: 82 }, { day: 'Qui', retention: 88 },
            { day: 'Sex', retention: 86 }, { day: 'Sáb', retention: 87 },
            { day: 'Dom', retention: 85 },
          ],
        },
      ],
    },
    {
      id: '2',
      name: '3º Ano B',
      student_count: 42,
      retention_avg: 68,
      radar: [
        { area: 'Natureza',   value: 72 },
        { area: 'Humanas',    value: 55 },
        { area: 'Linguagens', value: 78 },
        { area: 'Matemática', value: 58 },
      ],
      students: [
        {
          id: 's5', name: 'Mariana Ferreira',
          retention: 62, engagement: 71,
          study_hours: [18, 19, 20, 18, 19, 20, 18],
          forgetting_curve: [
            { day: 'Seg', retention: 75 }, { day: 'Ter', retention: 68 },
            { day: 'Qua', retention: 60 }, { day: 'Qui', retention: 65 },
            { day: 'Sex', retention: 63 }, { day: 'Sáb', retention: 62 },
            { day: 'Dom', retention: 62 },
          ],
        },
        {
          id: 's6', name: 'Lucas Mendes',
          retention: 29, engagement: 33,
          study_hours: [23, 0, 23, 0, 1, 23],
          forgetting_curve: [
            { day: 'Seg', retention: 50 }, { day: 'Ter', retention: 40 },
            { day: 'Qua', retention: 30 }, { day: 'Qui', retention: 25 },
            { day: 'Sex', retention: 20 }, { day: 'Sáb', retention: 28 },
            { day: 'Dom', retention: 29 },
          ],
        },
      ],
    },
  ],
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('demo_schools')
    .select('name')
    .eq('slug', slug)
    .maybeSingle();

  return {
    title: data?.name ? `Painel ${data.name} — FlashAprova` : 'Demo — FlashAprova',
  };
}

function NotAvailable() {
  return (
    <div className="min-h-screen bg-[var(--fa-bg)] flex items-center justify-center text-[var(--fa-text)]">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-semibold mb-2">Demo não disponível</h1>
        <p className="text-[var(--fa-text-2)] text-sm">O link pode ter expirado ou estar incorreto.</p>
      </div>
    </div>
  );
}

export default async function DemoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) return <NotAvailable />;

  const supabase = await createClient();
  const { data: school } = await supabase
    .from('demo_schools')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!school || school.token !== token) return <NotAvailable />;

  const data: DirectorDashboardData = {
    ...DEMO_MOCK_DATA,
    school: {
      name:          school.name,
      logo_url:      school.logo_url ?? undefined,
      primary_color: school.primary_color,
    },
  };

  return <DirectorDashboard data={data} />;
}
```

- [ ] **Step 3: Verificar que `DirectorDashboard` exporta os tipos necessários**

```bash
grep -n "export interface\|export type\|export default" /Users/brunomatheus/app-flashcards/components/DirectorDashboard.tsx | head -20
```

Deve mostrar `export interface DirectorDashboardData` e `export default function DirectorDashboard`. Se os tipos não estiverem exportados, adicione `export` antes de cada interface que o arquivo usa.

- [ ] **Step 4: Verificar se os tipos de `Student`, `ClassRoom`, `CriticalSubject` precisam ser importados**

O objeto `DEMO_MOCK_DATA` precisa bater com o tipo `DirectorDashboardData`. O TypeScript vai indicar erros se as interfaces não estiverem exportadas. Se necessário, exporte-as em `DirectorDashboard.tsx`:

```typescript
// Em components/DirectorDashboard.tsx — adicione export nas interfaces existentes:
export interface Student { ... }
export interface ClassRoom { ... }
export interface CriticalSubject { ... }
// School e DirectorDashboardData já devem ter export
```

- [ ] **Step 5: Testar o fluxo completo**

1. Acesse `/demo-admin` como admin
2. Cole a URL de um site (ex: `https://google.com`) → clique "Extrair"
3. Ajuste nome para "Colégio Teste" e cor se necessário → clique "Criar Demo"
4. Copie o link gerado
5. Abra o link em aba anônima — deve exibir o DirectorDashboard com "Colégio Teste" no header
6. Remova o `?token=...` da URL — deve exibir "Demo não disponível"
7. Use um token errado — deve exibir "Demo não disponível"

- [ ] **Step 6: Commit**

```bash
git add app/demo/[slug]/page.tsx
git commit -m "feat: add public demo route with token validation and school branding"
```

---

## Task 6: Exportar tipos do DirectorDashboard (se necessário)

**Files:**
- Modify: `components/DirectorDashboard.tsx` (apenas se os tipos não estiverem exportados)

- [ ] **Step 1: Verificar exports atuais**

```bash
grep -n "^export\|^interface\|^type " /Users/brunomatheus/app-flashcards/components/DirectorDashboard.tsx | head -30
```

Se `School`, `Student`, `ClassRoom`, `CriticalSubject`, `DirectorDashboardData` já têm `export` → esta task está completa, pule para o commit final.

- [ ] **Step 2: Adicionar exports se necessário**

Se qualquer interface não tem `export`, adicione. Exemplo:

```typescript
// Antes:
interface Student {

// Depois:
export interface Student {
```

Faça isso para: `School`, `Student`, `ClassRoom`, `CriticalSubject`, `DirectorDashboardData`.

- [ ] **Step 3: Verificar que o build compila**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -30
```

Sem erros de tipo relacionados ao demo.

- [ ] **Step 4: Commit (apenas se houve mudanças)**

```bash
git add components/DirectorDashboard.tsx
git commit -m "fix: export DirectorDashboard types for use in demo route"
```

---

## Task 7: Verificação final e commit de encerramento

- [ ] **Step 1: Build de produção limpo**

```bash
cd /Users/brunomatheus/app-flashcards && npm run build 2>&1 | tail -20
```

Esperado: sem erros. Pode ter warnings de imagens com `<img>` sem `next/image` (aceitável neste contexto de admin interno).

- [ ] **Step 2: Checklist funcional**

- [ ] `/demo-admin` redireciona para `/login` se não logado
- [ ] `/demo-admin` redireciona para `/dashboard?error=unauthorized` se não for admin
- [ ] `/demo-admin` exibe formulário para admin
- [ ] Extração de URL preenche campos automaticamente
- [ ] Criação salva no Supabase e exibe link copiável
- [ ] Link `/demo/[slug]?token=TOKEN` exibe dashboard com branding da escola
- [ ] Link sem token exibe "Demo não disponível"
- [ ] Link com token errado exibe "Demo não disponível"
- [ ] Excluir remove o demo da lista

- [ ] **Step 3: Commit final de verificação**

```bash
git add -A
git status
# Confirme que não há arquivos sensíveis (.env, etc)
git commit -m "feat: complete B2B demo personalization system

- /demo/[slug]?token=TOKEN: public demo with school branding
- /demo-admin: admin form with auto-extraction from school website
- /api/demo-extract: extracts name/logo/color from any URL
- demo_schools table in Supabase with RLS"
```
