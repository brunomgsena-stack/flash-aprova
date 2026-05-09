# Director Dashboard Phase 1 — Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded MOCK_DATA in DirectorDashboard with real Supabase data, add role-based auth guard for `/director`, and expose a seed SQL snippet for local testing.

**Architecture:** A SECURITY DEFINER SQL function aggregates school/class metrics from `user_progress` + `profiles`; a TypeScript lib function (`lib/director-data.ts`) calls those RPCs and assembles the data into `DirectorDashboardData`; the director page (server component) fetches and passes data as props.

**Tech Stack:** Next.js 15 App Router (server components), Supabase PostgreSQL (PL/pgSQL RPCs), TypeScript, `@supabase/supabase-js` service-role client.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `middleware.ts` | Add `/director` to protected routes + role=director guard |
| Create | `supabase/migrations/20260430_director_rpcs.sql` | Two SECURITY DEFINER RPCs: school stats + class radar |
| Create | `lib/supabase/admin.ts` | Service-role Supabase client for server-side admin ops |
| Create | `lib/director-data.ts` | Fetches + assembles `DirectorDashboardData` |
| Modify | `app/director/page.tsx` | Async server component: auth check + data fetch + props pass |

---

## Task 1: Middleware — Protect `/director` + Role Guard

**Files:**
- Modify: `middleware.ts:39`

- [ ] **Step 1: Add `/director` to the protected routes array**

In `middleware.ts`, line 39, change:
```typescript
const isProtected = ['/dashboard', '/admin', '/study', '/welcome'].some((p) =>
  pathname.startsWith(p),
);
```
to:
```typescript
const isProtected = ['/dashboard', '/admin', '/study', '/welcome', '/director'].some((p) =>
  pathname.startsWith(p),
);
```

- [ ] **Step 2: Extend the profile SELECT to include `role`**

In `middleware.ts`, line 65, change:
```typescript
const { data: profile, error: profileErr } = await supabase
  .from('profiles')
  .select('onboarding_completed, first_session_completed', { count: 'exact' })
  .eq('id', user.id)
  .maybeSingle();
```
to:
```typescript
const { data: profile, error: profileErr } = await supabase
  .from('profiles')
  .select('onboarding_completed, first_session_completed, role', { count: 'exact' })
  .eq('id', user.id)
  .maybeSingle();
```

- [ ] **Step 3: Add role guard after existing redirect logic (after line 101)**

After the block ending at `}` on line 101 (`if (onboardingDone && !firstSessionDone && pathname.startsWith('/dashboard'))`), add:

```typescript
    // Director role guard
    if (pathname.startsWith('/director') && profile?.role !== 'director') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
```

- [ ] **Step 4: Verify manually**

Start dev server and navigate to `/director` while logged in as a non-director user.
Expected: redirected to `/dashboard`.

Navigate to `/director` while logged out.
Expected: redirected to `/login`.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts
git commit -m "feat(director): protect /director route — require role=director"
```

---

## Task 2: SQL Migration — RPCs

**Files:**
- Create: `supabase/migrations/20260430_director_rpcs.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Migration: director RPCs
-- Two SECURITY DEFINER functions for the director dashboard.
-- Uses service-role context (bypass RLS) when called from lib/director-data.ts.

-- ─── RPC 1: School-level aggregate stats ─────────────────────────────────────
-- Returns engagement_pct, memory_score, students_at_risk, radar, critical_subjects,
-- top_subject, critical_subject for a given school_id.
--
-- Retention formula: (ease_factor - 1.3) / 1.2 * 100 → normalized 0-100.
-- ease_factor min ≈ 1.3 (very hard card), typical max ≈ 2.5 (easy card).

CREATE OR REPLACE FUNCTION get_director_school_stats(p_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total  int;
  v_active int;
BEGIN
  -- Total students enrolled in this school
  SELECT COUNT(*)::int INTO v_total
  FROM profiles
  WHERE school_id = p_school_id;

  -- Students who reviewed at least one card in the last 7 days
  SELECT COUNT(DISTINCT up.user_id)::int INTO v_active
  FROM user_progress up
  JOIN profiles p ON p.id = up.user_id
  WHERE p.school_id = p_school_id
    AND up.updated_at >= NOW() - INTERVAL '7 days';

  RETURN jsonb_build_object(

    -- Engagement: % of enrolled students active in last 7 days
    'engagement_pct', CASE WHEN v_total > 0
      THEN ROUND(v_active * 100.0 / v_total)::int
      ELSE 0
    END,

    -- Memory score: average normalized ease_factor across all school progress records
    'memory_score', (
      SELECT COALESCE(
        ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int,
        0
      )
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.school_id = p_school_id
    ),

    -- Students at risk: have progress records but no activity in last 7 days
    'students_at_risk', (
      SELECT COUNT(DISTINCT p.id)::int
      FROM profiles p
      WHERE p.school_id = p_school_id
        AND EXISTS (
          SELECT 1 FROM user_progress up2 WHERE up2.user_id = p.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_progress up3
          WHERE up3.user_id = p.id
            AND up3.updated_at >= NOW() - INTERVAL '7 days'
        )
    ),

    -- Radar: avg retention per ENEM area
    'radar', (
      SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'area', CASE s.category
            WHEN 'CIÊNCIAS DA NATUREZA'          THEN 'Natureza'
            WHEN 'CIÊNCIAS HUMANAS'              THEN 'Humanas'
            WHEN 'LINGUAGENS E CÓDIGOS'          THEN 'Linguagens'
            WHEN 'MATEMÁTICA E SUAS TECNOLOGIAS' THEN 'Matemática'
            ELSE s.category
          END,
          'value', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS area_row
        FROM user_progress up
        JOIN profiles p  ON p.id   = up.user_id
        JOIN cards c     ON c.id   = up.card_id
        JOIN decks d     ON d.id   = c.deck_id
        JOIN subjects s  ON s.id   = d.subject_id
        WHERE p.school_id = p_school_id
        GROUP BY s.category
      ) sub
    ),

    -- Critical subjects: top 5 decks with lowest average retention
    'critical_subjects', (
      SELECT COALESCE(jsonb_agg(cs_row ORDER BY cs_row->>'retention'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'name',      d.title,
          'retention', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS cs_row
        FROM user_progress up
        JOIN profiles p ON p.id = up.user_id
        JOIN cards c    ON c.id = up.card_id
        JOIN decks d    ON d.id = c.deck_id
        WHERE p.school_id = p_school_id
        GROUP BY d.id, d.title
        ORDER BY AVG(up.ease_factor) ASC
        LIMIT 5
      ) sub
    ),

    -- Top subject: deck with highest avg retention
    'top_subject', (
      SELECT d.title
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
      GROUP BY d.id, d.title
      ORDER BY AVG(up.ease_factor) DESC
      LIMIT 1
    ),

    -- Critical subject: deck with lowest avg retention
    'critical_subject', (
      SELECT d.title
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
      GROUP BY d.id, d.title
      ORDER BY AVG(up.ease_factor) ASC
      LIMIT 1
    )
  );
END;
$$;

-- ─── RPC 2: Class-level radar ──────────────────────────────────────────────────
-- Returns radar data (ENEM areas) for a single class, used when drilling into a turma.

CREATE OR REPLACE FUNCTION get_class_radar(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'area', CASE s.category
          WHEN 'CIÊNCIAS DA NATUREZA'          THEN 'Natureza'
          WHEN 'CIÊNCIAS HUMANAS'              THEN 'Humanas'
          WHEN 'LINGUAGENS E CÓDIGOS'          THEN 'Linguagens'
          WHEN 'MATEMÁTICA E SUAS TECNOLOGIAS' THEN 'Matemática'
          ELSE s.category
        END,
        'value', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
      ) AS area_row
      FROM user_progress up
      JOIN profiles p  ON p.id  = up.user_id
      JOIN cards c     ON c.id  = up.card_id
      JOIN decks d     ON d.id  = c.deck_id
      JOIN subjects s  ON s.id  = d.subject_id
      WHERE p.class_id = p_class_id
      GROUP BY s.category
    ) sub
  );
END;
$$;
```

- [ ] **Step 2: Apply the migration to your Supabase project**

```bash
# Option A — Supabase CLI (if linked)
npx supabase db push

# Option B — Supabase Dashboard SQL editor
# Copy the file contents and run in the SQL editor for project mmevmdudywlqylxqsxfc
```

- [ ] **Step 3: Verify RPCs exist**

In the Supabase SQL editor, run:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_director_school_stats', 'get_class_radar');
```
Expected: 2 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260430_director_rpcs.sql
git commit -m "feat(director): add school stats + class radar RPCs"
```

---

## Task 3: Admin Client Helper

**Files:**
- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`**

Get the service role key from:
Supabase Dashboard → Project `FlashAprova-App` → Settings → API → `service_role` key (secret).

Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Never commit this key. It bypasses all RLS.**

- [ ] **Step 2: Create `lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client.
 * Bypasses RLS — use only in server-side code (lib/, app/api/, server components).
 * Never import in client components or expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

- [ ] **Step 3: Verify `SUPABASE_SERVICE_ROLE_KEY` is accessible**

In the terminal (dev server must be off):
```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log(!!process.env.SUPABASE_SERVICE_ROLE_KEY)"
```
Expected output: `true`

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "feat(director): add service-role Supabase admin client"
```

---

## Task 4: Data Fetching Library

**Files:**
- Create: `lib/director-data.ts`

This module fetches all data needed by `DirectorDashboardData`. It uses the admin client (service role) so RLS is bypassed — security is enforced upstream by middleware.

- [ ] **Step 1: Create `lib/director-data.ts`**

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  DirectorDashboardData,
  ClassRoom,
  Student,
} from '@/components/DirectorDashboard';

// ─── Types matching Supabase rows ─────────────────────────────────────────────

interface HistoryEntry {
  reviewed_at: string; // ISO 8601
  rating: number;      // 1-4
  interval_days: number;
}

interface ProgressRow {
  ease_factor: number;
  updated_at: string;
  history: HistoryEntry[] | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalizes ease_factor (1.3–2.5+) to a 0–100 retention score. */
function normalizeEaseFactor(ef: number): number {
  return Math.min(100, Math.max(0, Math.round(((ef - 1.3) / 1.2) * 100)));
}

/** Portuguese day abbreviations indexed by JS getDay() (0=Sun). */
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Builds a Student record from raw profile + user_progress rows. */
function buildStudent(
  id: string,
  fullName: string | null,
  progressRows: ProgressRow[],
): Student {
  // ── Retention: avg normalized ease_factor ──────────────────────────────────
  const retention =
    progressRows.length > 0
      ? Math.round(
          progressRows.reduce((sum, p) => sum + normalizeEaseFactor(p.ease_factor), 0) /
            progressRows.length,
        )
      : 0;

  // Flatten all history entries into a single array
  const allHistory: HistoryEntry[] = progressRows.flatMap(
    (p) => p.history ?? [],
  );

  // ── Engagement: active days in last 7 days → 0-100 ────────────────────────
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const activeDays = new Set<string>();
  for (const entry of allHistory) {
    if (new Date(entry.reviewed_at).getTime() >= sevenDaysAgo) {
      activeDays.add(entry.reviewed_at.substring(0, 10)); // YYYY-MM-DD
    }
  }
  const engagement = Math.round((activeDays.size / 7) * 100);

  // ── Study hours: hour-of-day for each session in last 14 days ─────────────
  const fourteenDaysAgo = Date.now() - 14 * 86_400_000;
  const study_hours: number[] = [];
  for (const entry of allHistory) {
    if (new Date(entry.reviewed_at).getTime() >= fourteenDaysAgo) {
      // Use local Brazil time offset (UTC-3) so hours look natural
      const utcHour = new Date(entry.reviewed_at).getUTCHours();
      const brHour = (utcHour - 3 + 24) % 24;
      study_hours.push(brHour);
    }
  }

  // ── Forgetting curve: avg rating per day for last 7 days ──────────────────
  // rating 1-4 → retention 25/50/75/100 (i.e. rating * 25)
  const forgetting_curve = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayKey = d.toISOString().substring(0, 10);

    const dayRatings = allHistory
      .filter((e) => e.reviewed_at.substring(0, 10) === dayKey)
      .map((e) => e.rating);

    const retentionValue =
      dayRatings.length > 0
        ? Math.round(
            (dayRatings.reduce((sum, r) => sum + r, 0) / dayRatings.length) * 25,
          )
        : null; // null → no data that day

    return {
      day: DAY_LABELS[d.getDay()],
      retention: retentionValue ?? 50, // fallback 50 = neutral when no data
    };
  });

  return {
    id,
    name: fullName ?? 'Aluno',
    retention,
    engagement,
    study_hours,
    forgetting_curve,
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fetches complete DirectorDashboardData for a director user.
 * Returns null if the user is not a director or has no school configured.
 */
export async function getDirectorDashboardData(
  directorUserId: string,
): Promise<DirectorDashboardData | null> {
  const supabase = createAdminClient();

  // 1. Get director's school_id + role
  const { data: directorProfile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', directorUserId)
    .maybeSingle();

  if (
    !directorProfile ||
    directorProfile.role !== 'director' ||
    !directorProfile.school_id
  ) {
    return null;
  }

  const schoolId = directorProfile.school_id as string;

  // 2. Fetch school info + school stats in parallel
  const [schoolResult, statsResult] = await Promise.all([
    supabase
      .from('schools')
      .select('name, logo_url, primary_color')
      .eq('id', schoolId)
      .maybeSingle(),
    supabase.rpc('get_director_school_stats', { p_school_id: schoolId }),
  ]);

  if (!schoolResult.data) return null;

  const school = schoolResult.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (statsResult.data ?? {}) as Record<string, any>;

  // 3. Fetch classes
  const { data: classesRaw } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name');

  // 4. Build class data with students
  const classes: ClassRoom[] = await Promise.all(
    (classesRaw ?? []).map(async (cls) => {
      // Students in this class
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('class_id', cls.id);

      // Radar for the class + all student progress in parallel
      const [radarResult, ...progressResults] = await Promise.all([
        supabase.rpc('get_class_radar', { p_class_id: cls.id }),
        ...(studentProfiles ?? []).map((sp) =>
          supabase
            .from('user_progress')
            .select('ease_factor, updated_at, history')
            .eq('user_id', sp.id),
        ),
      ]);

      const students: Student[] = (studentProfiles ?? []).map((sp, idx) => {
        const progress = (progressResults[idx].data ?? []) as ProgressRow[];
        return buildStudent(sp.id, sp.full_name, progress);
      });

      const retention_avg =
        students.length > 0
          ? Math.round(
              students.reduce((sum, s) => sum + s.retention, 0) / students.length,
            )
          : 0;

      return {
        id: cls.id,
        name: cls.name,
        student_count: students.length,
        retention_avg,
        radar: radarResult.data ?? [],
        students,
      };
    }),
  );

  return {
    school: {
      name: school.name,
      logo_url: school.logo_url ?? undefined,
      primary_color: school.primary_color ?? '#10b981',
    },
    engagement_pct: stats.engagement_pct ?? 0,
    memory_score:   stats.memory_score   ?? 0,
    students_at_risk: stats.students_at_risk ?? 0,
    top_subject:    stats.top_subject    ?? undefined,
    critical_subject: stats.critical_subject ?? undefined,
    radar:             stats.radar            ?? [],
    classes,
    critical_subjects: stats.critical_subjects ?? [],
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors. If errors appear, check that `DirectorDashboardData`, `ClassRoom`, `Student` are exported from `components/DirectorDashboard.tsx` (they already are).

- [ ] **Step 3: Commit**

```bash
git add lib/director-data.ts
git commit -m "feat(director): add server-side data fetching lib"
```

---

## Task 5: Update Director Page

**Files:**
- Modify: `app/director/page.tsx` (currently 9 lines)

- [ ] **Step 1: Replace the entire file content**

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';
import DirectorDashboard from '@/components/DirectorDashboard';

export const metadata = {
  title: 'Painel do Diretor — FlashAprova',
};

export default async function DirectorPage() {
  // Auth: get logged-in user from session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch real data (null = not a director or school not configured)
  const data = await getDirectorDashboardData(user.id);

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

  return <DirectorDashboard data={data} />;
}
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```
Navigate to `/director` as a director user (after seeding in Task 6).
Expected: dashboard renders with real school data.

- [ ] **Step 3: Commit**

```bash
git add app/director/page.tsx
git commit -m "feat(director): wire real data to dashboard page"
```

---

## Task 6: Seed Test Data

**Files:** No new files — run SQL manually in Supabase Dashboard.

- [ ] **Step 1: Create school + classes**

Run in the Supabase SQL editor (project `mmevmdudywlqylxqsxfc`):

```sql
-- 1. Insert school
INSERT INTO public.schools (id, name, slug, logo_url, primary_color)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Colégio Panteão',
  'panteao',
  NULL,
  '#10b981'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert two classes
INSERT INTO public.classes (id, school_id, name, year)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '3º Ano A', 2026),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '3º Ano B', 2026)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Set your own user as director**

Get your user ID from Auth → Users in the Supabase dashboard, then run:

```sql
-- Replace <YOUR_USER_ID> with your actual auth.users UUID
UPDATE public.profiles
SET
  role      = 'director',
  school_id = 'aaaaaaaa-0000-0000-0000-000000000001',
  class_id  = NULL  -- directors are not assigned to a class
WHERE id = '<YOUR_USER_ID>';
```

- [ ] **Step 3: Link some existing student profiles to the school/class**

```sql
-- Link the first 3 students (by created_at) to the school and first class
-- Replace 'role != director' filter with specific user IDs if needed
UPDATE public.profiles
SET
  school_id = 'aaaaaaaa-0000-0000-0000-000000000001',
  class_id  = 'bbbbbbbb-0000-0000-0000-000000000001'
WHERE id IN (
  SELECT id FROM public.profiles
  WHERE role = 'student'
  ORDER BY id
  LIMIT 3
);
```

- [ ] **Step 4: Verify data renders in dashboard**

Navigate to `http://localhost:3000/director`.
Expected:
- School name "Colégio Panteão" in header
- Turmas table shows "3º Ano A" with linked students
- Stats cards show real values (may be 0 if students have no `user_progress` rows yet)

- [ ] **Step 5: Commit (nothing to commit — seed was manual SQL)**

No commit needed. Document the seed in a `supabase/seed.sql` file if desired.

---

## Verification Checklist

- [ ] `/director` redirects unauthenticated users to `/login`
- [ ] `/director` redirects non-director users to `/dashboard`
- [ ] Director user sees real school name, not "Colégio Panteão" mock
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run build` completes successfully
