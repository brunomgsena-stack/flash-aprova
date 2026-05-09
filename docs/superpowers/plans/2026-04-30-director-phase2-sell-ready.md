# Director Dashboard Phase 2 — Sell-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the B2B director dashboard production-ready for selling to schools: invite link flow for students to join a school/class, date-range filter, loading/empty/error states, and improved PDF print output.

**Architecture:** Invite codes are short-lived tokens in a new `invite_codes` table; a student navigates to `/join/[code]` which sets their `school_id` + `class_id`. The dashboard adds a period selector that uses URL search params (server-side re-fetch). Loading/empty states are added inline to `DirectorDashboard`. Print CSS is injected via `<style>` in the report modal.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, TypeScript, Framer Motion (already installed), `nanoid` (for token generation).

**Prerequisite:** Phase 1 plan must be complete (RPCs deployed, `lib/director-data.ts` exists).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260430_invite_codes.sql` | `invite_codes` table + RLS |
| Create | `app/api/director/invite/route.ts` | POST: generate invite code for a class |
| Create | `app/join/[code]/page.tsx` | Student join page: validates code → updates profile |
| Modify | `components/DirectorDashboard.tsx` | Loading/empty states + period filter selector |
| Modify | `app/director/page.tsx` | Read `period` from searchParams, pass to data lib |
| Modify | `lib/director-data.ts` | Accept optional `period` param, filter queries by date |

---

## Task 1: Invite Codes SQL Migration

**Files:**
- Create: `supabase/migrations/20260430_invite_codes.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Invite codes for B2B student onboarding.
-- A director creates a code for a specific class; students use /join/<code>
-- to link their profile to that school + class.

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id      uuid        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  code          text        NOT NULL UNIQUE,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  expires_at    timestamptz NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  max_uses      int         NOT NULL DEFAULT 100,
  uses          int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Directors can create invite codes for their own school
CREATE POLICY "director_insert_invite_code"
  ON public.invite_codes FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND school_id = (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Directors can read their own school's codes
CREATE POLICY "director_read_invite_codes"
  ON public.invite_codes FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Any authenticated user can read a single code by exact match (for /join/[code])
-- This is restricted to the specific code value so students can't enumerate codes
CREATE POLICY "student_read_single_invite_code"
  ON public.invite_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Apply migration**

```bash
# Supabase CLI
npx supabase db push

# OR paste in Supabase Dashboard SQL editor for project mmevmdudywlqylxqsxfc
```

- [ ] **Step 3: Verify table exists**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'invite_codes' ORDER BY ordinal_position;
```
Expected: 9 columns (id, school_id, class_id, code, created_by, expires_at, max_uses, uses, created_at).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260430_invite_codes.sql
git commit -m "feat(director): add invite_codes table for B2B student onboarding"
```

---

## Task 2: Invite Code API Route

**Files:**
- Create: `app/api/director/invite/route.ts`

- [ ] **Step 1: Install `nanoid`**

```bash
npm install nanoid
```

- [ ] **Step 2: Create `app/api/director/invite/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/director/invite
// Body: { class_id: string }
// Returns: { code: string, join_url: string, expires_at: string }
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'director' || !profile.school_id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Parse body
  let body: { class_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.class_id) {
    return NextResponse.json({ error: 'class_id é obrigatório' }, { status: 400 });
  }

  // Verify class belongs to director's school
  const admin = createAdminClient();
  const { data: cls } = await admin
    .from('classes')
    .select('id')
    .eq('id', body.class_id)
    .eq('school_id', profile.school_id)
    .maybeSingle();

  if (!cls) {
    return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
  }

  // Generate unique 8-char alphanumeric code
  const code = nanoid(8).toUpperCase();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin.from('invite_codes').insert({
    school_id:  profile.school_id,
    class_id:   body.class_id,
    code,
    created_by: user.id,
    expires_at: expiresAt,
    max_uses:   100,
  });

  if (error) {
    console.error('[invite] insert error:', error.message);
    return NextResponse.json({ error: 'Erro ao gerar código' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  return NextResponse.json({
    code,
    join_url:   `${baseUrl}/join/${code}`,
    expires_at: expiresAt,
  });
}
```

- [ ] **Step 3: Add `NEXT_PUBLIC_APP_URL` to `.env.local`**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Test with curl**

Start the dev server (`npm run dev`), then:
```bash
# Replace <COOKIE> with the session cookie from browser devtools → Application → Cookies → sb-*
curl -X POST http://localhost:3000/api/director/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: <YOUR_SESSION_COOKIE>" \
  -d '{"class_id":"bbbbbbbb-0000-0000-0000-000000000001"}'
```
Expected response:
```json
{
  "code": "ABCD1234",
  "join_url": "http://localhost:3000/join/ABCD1234",
  "expires_at": "2026-05-30T..."
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/director/invite/route.ts package.json package-lock.json
git commit -m "feat(director): add invite code generation API"
```

---

## Task 3: Student Join Page

**Files:**
- Create: `app/join/[code]/page.tsx`

- [ ] **Step 1: Create `app/join/[code]/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

type Status = 'loading' | 'joining' | 'success' | 'error';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function join() {
      // 1. Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Save code in sessionStorage and redirect to login
        sessionStorage.setItem('pendingJoinCode', code);
        router.replace(`/login?next=/join/${code}`);
        return;
      }

      setStatus('joining');

      // 2. Validate invite code
      const { data: invite, error: inviteErr } = await supabase
        .from('invite_codes')
        .select('id, school_id, class_id, expires_at, max_uses, uses')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (inviteErr || !invite) {
        setStatus('error');
        setMessage('Código inválido ou expirado.');
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setStatus('error');
        setMessage('Este convite expirou.');
        return;
      }

      if (invite.uses >= invite.max_uses) {
        setStatus('error');
        setMessage('Este convite atingiu o limite de usos.');
        return;
      }

      // 3. Update student's profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          school_id: invite.school_id,
          class_id:  invite.class_id,
        })
        .eq('id', user.id);

      if (updateErr) {
        setStatus('error');
        setMessage('Erro ao vincular à turma. Tente novamente.');
        return;
      }

      // 4. Increment uses counter (best-effort, not critical)
      await supabase
        .from('invite_codes')
        .update({ uses: invite.uses + 1 })
        .eq('id', invite.id);

      setStatus('success');
      setTimeout(() => router.replace('/dashboard'), 2500);
    }

    join();
  }, [code, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0c0c14' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm"
      >
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/60">Verificando convite...</p>
          </>
        )}

        {status === 'joining' && (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/60">Entrando na turma...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}
            >
              ✓
            </div>
            <p className="text-white font-bold text-lg mb-1">Bem-vindo à turma!</p>
            <p className="text-white/40 text-sm">Redirecionando para o dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}
            >
              ✕
            </div>
            <p className="text-white font-bold text-lg mb-1">Convite inválido</p>
            <p className="text-white/40 text-sm">{message}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Add `/join` to middleware — public route (no login required to land there)**

In `middleware.ts`, the `/join` route must NOT be in `isProtected`. Verify line 39: `/join` is not listed. No change needed if `/join` is not in the array.

The page handles unauthenticated users by redirecting to `/login` itself.

- [ ] **Step 3: Test manually**

1. Generate a code using the API from Task 2.
2. Open `http://localhost:3000/join/<CODE>` in incognito (not logged in).
3. Expected: redirected to `/login?next=/join/<CODE>`.
4. Log in, then navigate to `http://localhost:3000/join/<CODE>`.
5. Expected: success screen → redirected to `/dashboard`.
6. Check Supabase: `SELECT school_id, class_id FROM profiles WHERE id = '<YOUR_ID>'`.
   Expected: both fields populated.

- [ ] **Step 4: Commit**

```bash
git add app/join/
git commit -m "feat(director): student join page for invite codes"
```

---

## Task 4: Loading and Empty States in DirectorDashboard

**Files:**
- Modify: `components/DirectorDashboard.tsx`

The component currently has no loading state (assumes data is always present). Add a `isLoading` prop and handle the case where `classes` array is empty.

- [ ] **Step 1: Add `isLoading` prop to the main component signature**

In `DirectorDashboard.tsx`, find line 630:
```typescript
export default function DirectorDashboard({ data = MOCK_DATA }: { data?: DirectorDashboardData }) {
```
Change to:
```typescript
export default function DirectorDashboard({
  data = MOCK_DATA,
  isLoading = false,
}: {
  data?: DirectorDashboardData;
  isLoading?: boolean;
}) {
```

- [ ] **Step 2: Add loading skeleton at the top of the component return**

After the opening `<div className="min-h-screen ...">` and `{/* Grid overlay */}` div (around line 679), add:

```typescript
      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(12,12,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-white/50 text-sm">Carregando dados da escola...</p>
          </div>
        </div>
      )}
```

- [ ] **Step 3: Add empty state in the school view when there are no classes**

In the escola view section (around line 858, inside the `{view === 'escola' && ...}` block), after the GapAnalysis component, add an empty classes section guard:

Find the classes rendering code inside `{/* Classes table — clicável */}` (around line 859). Just after the `<div className="space-y-4">` opening tag, add a conditional before `{classes.map(...)}`:

```typescript
                    {classes.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-white/30 text-sm">
                          Nenhuma turma cadastrada ainda.
                        </p>
                        <p className="text-white/20 text-xs mt-1">
                          Crie turmas e convide alunos para começar.
                        </p>
                      </div>
                    ) : (
                      classes.map((cls, i) => {
                        /* ... existing map code ... */
                      })
                    )}
```

- [ ] **Step 4: Add empty state for student list inside a class**

In the turma view (around line 1027, inside `{selectedClass.students.map(...)}`), wrap with:

```typescript
                    {selectedClass.students.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-white/30 text-sm">Nenhum aluno nesta turma ainda.</p>
                        <p className="text-white/20 text-xs mt-1">
                          Compartilhe o link de convite da turma.
                        </p>
                      </div>
                    ) : (
                      selectedClass.students.map((student, i) => {
                        /* ... existing map code ... */
                      })
                    )}
```

- [ ] **Step 5: Verify empty states render**

Temporarily set `classes: []` in `MOCK_DATA` at the top of `DirectorDashboard.tsx` and navigate to `/director` to confirm the empty state renders, then revert.

- [ ] **Step 6: Commit**

```bash
git add components/DirectorDashboard.tsx
git commit -m "feat(director): add loading overlay + empty states for classes and students"
```

---

## Task 5: Period Filter — URL Search Params

**Files:**
- Modify: `components/DirectorDashboard.tsx`
- Modify: `app/director/page.tsx`
- Modify: `lib/director-data.ts`

- [ ] **Step 1: Add period type and filter UI to `DirectorDashboard.tsx`**

At the top of the file (after existing imports), add:
```typescript
import { useRouter, useSearchParams } from 'next/navigation';
```

Add a new type near the top:
```typescript
export type DashboardPeriod = '7d' | '30d' | '90d';
```

Add `period` and `onPeriodChange` to the component props:
```typescript
export default function DirectorDashboard({
  data = MOCK_DATA,
  isLoading = false,
  period = '7d',
}: {
  data?: DirectorDashboardData;
  isLoading?: boolean;
  period?: DashboardPeriod;
}) {
```

Inside the component, add this after the `primaryRgb` declaration:
```typescript
  const router = useRouter();

  function handlePeriodChange(newPeriod: DashboardPeriod) {
    router.push(`/director?period=${newPeriod}`);
  }
```

- [ ] **Step 2: Add period selector to the header (escola view only)**

In the header section (around line 744, the `<div className="ml-auto ...">` that shows "Ano Letivo 2026"), replace it with:

```typescript
          <div className="ml-auto hidden sm:flex items-center gap-2 flex-shrink-0">
            {(['7d', '30d', '90d'] as DashboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={period === p ? {
                  background: `rgba(${primaryRgb},0.15)`,
                  border:     `1px solid rgba(${primaryRgb},0.4)`,
                  color:      school.primary_color,
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border:     '1px solid rgba(255,255,255,0.1)',
                  color:      'rgba(255,255,255,0.4)',
                }}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
```

- [ ] **Step 3: Update `lib/director-data.ts` to accept a `days` param**

Add a `days` parameter to `getDirectorDashboardData`:
```typescript
export async function getDirectorDashboardData(
  directorUserId: string,
  days: 7 | 30 | 90 = 7,
): Promise<DirectorDashboardData | null> {
```

Update the RPC call to pass the interval:
```typescript
  const [schoolResult, statsResult] = await Promise.all([
    supabase
      .from('schools')
      .select('name, logo_url, primary_color')
      .eq('id', schoolId)
      .maybeSingle(),
    supabase.rpc('get_director_school_stats', {
      p_school_id:  schoolId,
      p_days:       days,       // <-- new param
    }),
  ]);
```

Update the SQL migration — add `p_days int DEFAULT 7` to `get_director_school_stats` and replace all `INTERVAL '7 days'` with `(p_days || ' days')::interval`:

```sql
CREATE OR REPLACE FUNCTION get_director_school_stats(p_school_id uuid, p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  -- (same body as Phase 1 plan, but replace every INTERVAL '7 days'
  --  with  (p_days || ' days')::interval )
```

Create a new migration for this update:

```sql
-- supabase/migrations/20260430_director_rpcs_period.sql
CREATE OR REPLACE FUNCTION get_director_school_stats(p_school_id uuid, p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total  int;
  v_active int;
  v_interval interval;
BEGIN
  v_interval := (p_days || ' days')::interval;

  SELECT COUNT(*)::int INTO v_total
  FROM profiles WHERE school_id = p_school_id;

  SELECT COUNT(DISTINCT up.user_id)::int INTO v_active
  FROM user_progress up
  JOIN profiles p ON p.id = up.user_id
  WHERE p.school_id = p_school_id
    AND up.updated_at >= NOW() - v_interval;

  RETURN jsonb_build_object(
    'engagement_pct', CASE WHEN v_total > 0
      THEN ROUND(v_active * 100.0 / v_total)::int ELSE 0 END,
    'memory_score', (
      SELECT COALESCE(ROUND(AVG(LEAST(100, GREATEST(0,
        (up.ease_factor - 1.3) / 1.2 * 100))))::int, 0)
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
    ),
    'students_at_risk', (
      SELECT COUNT(DISTINCT p.id)::int FROM profiles p
      WHERE p.school_id = p_school_id
        AND EXISTS (SELECT 1 FROM user_progress up2 WHERE up2.user_id = p.id)
        AND NOT EXISTS (
          SELECT 1 FROM user_progress up3
          WHERE up3.user_id = p.id AND up3.updated_at >= NOW() - v_interval
        )
    ),
    'radar', (
      SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'area', CASE s.category
            WHEN 'CIÊNCIAS DA NATUREZA'          THEN 'Natureza'
            WHEN 'CIÊNCIAS HUMANAS'              THEN 'Humanas'
            WHEN 'LINGUAGENS E CÓDIGOS'          THEN 'Linguagens'
            WHEN 'MATEMÁTICA E SUAS TECNOLOGIAS' THEN 'Matemática'
            ELSE s.category END,
          'value', ROUND(AVG(LEAST(100, GREATEST(0,
            (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS area_row
        FROM user_progress up
        JOIN profiles p ON p.id = up.user_id
        JOIN cards c    ON c.id = up.card_id
        JOIN decks d    ON d.id = c.deck_id
        JOIN subjects s ON s.id = d.subject_id
        WHERE p.school_id = p_school_id
          AND up.updated_at >= NOW() - v_interval
        GROUP BY s.category
      ) sub
    ),
    'critical_subjects', (
      SELECT COALESCE(jsonb_agg(cs_row ORDER BY cs_row->>'retention'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'name',      d.title,
          'retention', ROUND(AVG(LEAST(100, GREATEST(0,
            (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS cs_row
        FROM user_progress up
        JOIN profiles p ON p.id = up.user_id
        JOIN cards c    ON c.id = up.card_id
        JOIN decks d    ON d.id = c.deck_id
        WHERE p.school_id = p_school_id
          AND up.updated_at >= NOW() - v_interval
        GROUP BY d.id, d.title
        ORDER BY AVG(up.ease_factor) ASC
        LIMIT 5
      ) sub
    ),
    'top_subject', (
      SELECT d.title FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
      GROUP BY d.id, d.title ORDER BY AVG(up.ease_factor) DESC LIMIT 1
    ),
    'critical_subject', (
      SELECT d.title FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
      GROUP BY d.id, d.title ORDER BY AVG(up.ease_factor) ASC LIMIT 1
    )
  );
END;
$$;
```

Apply with `npx supabase db push` or paste in SQL editor.

- [ ] **Step 4: Update `app/director/page.tsx` to read period from URL**

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';
import DirectorDashboard, { type DashboardPeriod } from '@/components/DirectorDashboard';

export const metadata = { title: 'Painel do Diretor — FlashAprova' };

export default async function DirectorPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const rawPeriod = params.period;
  const period: DashboardPeriod =
    rawPeriod === '30d' ? '30d' : rawPeriod === '90d' ? '90d' : '7d';
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await getDirectorDashboardData(user.id, days);

  if (!data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center"
        style={{ background: '#0c0c14' }}
      >
        <p className="text-white/60 text-lg font-semibold">Escola não configurada</p>
        <p className="text-white/30 text-sm max-w-xs">
          Sua conta de diretor ainda não está vinculada a uma escola.
          Entre em contato com o suporte FlashAprova.
        </p>
      </div>
    );
  }

  return <DirectorDashboard data={data} period={period} />;
}
```

- [ ] **Step 5: Verify filter works**

1. Navigate to `/director` — default 7-day view loads.
2. Click "30 dias" — URL changes to `/director?period=30d`, page re-fetches.
3. Click "90 dias" — URL changes to `/director?period=90d`.

- [ ] **Step 6: Commit**

```bash
git add components/DirectorDashboard.tsx app/director/page.tsx lib/director-data.ts \
        supabase/migrations/20260430_director_rpcs_period.sql
git commit -m "feat(director): add period filter (7d/30d/90d) to dashboard"
```

---

## Task 6: Improve PDF Print Output

**Files:**
- Modify: `components/DirectorDashboard.tsx` (ReportModal component, ~line 341)

The existing `window.print()` works but the dark background makes prints unreadable. Add print-specific CSS via a `<style>` tag injected in the modal.

- [ ] **Step 1: Add print styles inside the ReportModal component**

Inside the `ReportModal` component (around line 357, just inside the `motion.div` that has `background: '#0f1520'`), add as the first child:

```typescript
        {/* Print-only CSS: white background, black text */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #report-modal, #report-modal * { visibility: visible !important; }
            #report-modal {
              position: fixed !important;
              top: 0 !important; left: 0 !important;
              width: 100vw !important; height: auto !important;
              background: #fff !important;
              color: #111 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            #report-modal p, #report-modal span, #report-modal h2 {
              color: #111 !important;
            }
            #report-modal [style*="rgba"] {
              background: #f5f5f5 !important;
              border-color: #ddd !important;
            }
            .recharts-wrapper { break-inside: avoid; }
            button { display: none !important; }
          }
        `}</style>
```

- [ ] **Step 2: Add `id="report-modal"` to the inner modal div**

Find the inner `motion.div` with `className="w-full max-w-lg ..."` (around line 366) and add `id="report-modal"`:

```typescript
        <motion.div
          id="report-modal"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          ...
```

- [ ] **Step 3: Test print output**

1. Navigate to a student's dossiê.
2. Click "Gerar Relatório para Pais".
3. In the modal, click "Imprimir".
4. Expected: print preview shows white background with readable dark text.

- [ ] **Step 4: Commit**

```bash
git add components/DirectorDashboard.tsx
git commit -m "feat(director): improve PDF print styles for parent reports"
```

---

## Verification Checklist

- [ ] Director can generate invite code via `POST /api/director/invite`
- [ ] Student navigating to `/join/<CODE>` gets their profile linked to school + class
- [ ] Dashboard shows loading overlay when `isLoading={true}`
- [ ] Empty state shows when `classes: []`
- [ ] Period filter buttons appear in header; clicking changes URL and re-fetches data
- [ ] Print modal produces readable white-background output
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run build` completes successfully
