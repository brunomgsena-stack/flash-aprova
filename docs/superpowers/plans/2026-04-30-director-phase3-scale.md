# Director Dashboard Phase 3 — Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scale features to the B2B director dashboard: side-by-side class comparison, CSV export, at-risk student email alerts, and multi-school admin support.

**Architecture:** Class comparison is a new view added to `DirectorDashboard`. CSV export is a GET API route that serializes the same data. At-risk alerts run as a daily cron via a Supabase Edge Function + Resend email API. Multi-school admin adds a school-switcher dropdown for users with `role='admin'`.

**Tech Stack:** Next.js 15 App Router, Supabase Edge Functions (Deno), Resend email API, TypeScript.

**Prerequisites:** Phase 1 + Phase 2 complete.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `components/DirectorDashboard.tsx` | Add class comparison view |
| Create | `app/api/director/export/route.ts` | GET: CSV export of school data |
| Create | `supabase/functions/director-alerts/index.ts` | Daily Edge Function: at-risk email alerts |
| Modify | `lib/director-data.ts` | Accept `schoolId` override (for admin multi-school) |
| Modify | `app/director/page.tsx` | Admin school-switcher via URL param |

---

## Task 1: Class Comparison View

**Files:**
- Modify: `components/DirectorDashboard.tsx`

Add a fourth view (`'comparar'`) that renders two classes side by side with their radar charts and key metrics.

- [ ] **Step 1: Add `'comparar'` to `ViewState` type**

Find `type ViewState = 'escola' | 'turma' | 'aluno';` (line 628) and change to:
```typescript
type ViewState = 'escola' | 'turma' | 'aluno' | 'comparar';
```

- [ ] **Step 2: Add compare state to the component**

After the `const [reportModal, setReportModal] = useState(false);` line, add:
```typescript
  const [compareClass, setCompareClass] = useState<ClassRoom | null>(null);
```

- [ ] **Step 3: Add "Comparar" button to the escola view classes table**

In the escola view, inside each class row button (`motion.button` at line ~863), add a compare button next to the ChevronRight icon:

```typescript
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-white/35">{cls.student_count} alunos</span>
                              <span className="font-bold tabular-nums" style={{ color: isHigh ? '#00FF73' : '#f59e0b' }}>
                                {cls.retention_avg}%
                              </span>
                              {/* Compare button — only shows when another class is selectable */}
                              {selectedClass && selectedClass.id !== cls.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCompareClass(cls);
                                    setView('comparar');
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                                  style={{
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                    color: '#818cf8',
                                  }}
                                >
                                  Comparar
                                </button>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                            </div>
```

Also add a "Comparar turmas" button in the turma view header, after the back button area:

```typescript
              {/* In turma view header, add a compare prompt */}
              {view === 'turma' && classes.length > 1 && (
                <p className="text-xs text-white/30 mt-1 pl-6">
                  Selecione outra turma na lista para comparar
                </p>
              )}
```

- [ ] **Step 4: Add `goBack` handling for `'comparar'` view**

In the `goBack` callback (line 651), update:
```typescript
  const goBack = useCallback(() => {
    if (view === 'aluno')    { setView('turma');  setSelectedStudent(null); }
    else if (view === 'comparar') { setView('escola'); setCompareClass(null); setSelectedClass(null); }
    else                     { setView('escola'); setSelectedClass(null);  setSelectedStudent(null); }
  }, [view]);
```

- [ ] **Step 5: Add the comparar view section**

Inside the `<AnimatePresence mode="wait">` block (after the `aluno` view, around line 1222), add:

```typescript
          {/* ══ VIEW: COMPARAR ══════════════════════════════════════════════════ */}
          {view === 'comparar' && selectedClass && compareClass && (
            <motion.div
              key="comparar"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header note */}
              <motion.p
                {...fadeUp(0.05)}
                className="text-xs text-white/35 text-center"
              >
                Comparando turmas • Clique na seta para voltar
              </motion.p>

              {/* Metrics comparison row */}
              <div className="grid grid-cols-2 gap-4">
                {[selectedClass, compareClass].map((cls, idx) => (
                  <motion.div
                    key={cls.id}
                    {...fadeUp(0.05 + idx * 0.08)}
                    style={CARD}
                    className="relative overflow-hidden p-5"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-px pointer-events-none"
                      style={{
                        background: idx === 0
                          ? `linear-gradient(90deg, transparent, rgba(${primaryRgb},0.4), transparent)`
                          : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
                      }}
                    />
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{cls.name}</p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span
                        className="text-3xl font-black"
                        style={{ color: cls.retention_avg >= 75 ? '#00FF73' : '#f59e0b' }}
                      >
                        {cls.retention_avg}%
                      </span>
                      <span className="text-xs text-white/30">retenção média</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-lg font-black text-white">{cls.student_count}</p>
                        <p className="text-[10px] text-white/30">alunos</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p
                          className="text-lg font-black"
                          style={{ color: '#ef4444' }}
                        >
                          {cls.students.filter(s => s.retention < 50).length}
                        </p>
                        <p className="text-[10px] text-white/30">em risco</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Radar comparison — side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[selectedClass, compareClass].map((cls, idx) => (
                  <motion.div
                    key={cls.id}
                    {...fadeUp(0.18 + idx * 0.08)}
                    style={CARD}
                    className="relative overflow-hidden p-6"
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: idx === 0
                          ? `radial-gradient(ellipse at top left, rgba(${primaryRgb},0.08) 0%, transparent 65%)`
                          : 'radial-gradient(ellipse at top left, rgba(99,102,241,0.08) 0%, transparent 65%)',
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen
                          className="w-4 h-4"
                          style={{ color: idx === 0 ? school.primary_color : '#818cf8' }}
                        />
                        <p className="text-sm font-semibold text-white">{cls.name}</p>
                      </div>
                      <p className="text-xs text-white/40 mb-4 pl-6">Desempenho por área ENEM</p>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={cls.radar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                            <PolarGrid stroke="rgba(255,255,255,0.07)" />
                            <PolarAngleAxis
                              dataKey="area"
                              tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600 }}
                            />
                            <Tooltip content={RadarTooltip as React.FC} />
                            <Radar
                              dataKey="value"
                              stroke={idx === 0 ? school.primary_color : '#818cf8'}
                              fill={idx === 0 ? school.primary_color : '#818cf8'}
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
```

- [ ] **Step 6: Verify comparison view works**

1. In escola view, click a class row → enters turma view.
2. Click "Escola" breadcrumb to go back.
3. Hover over another class row → "Comparar" button appears.
4. Click "Comparar" → comparison view shows both classes side-by-side.

- [ ] **Step 7: Commit**

```bash
git add components/DirectorDashboard.tsx
git commit -m "feat(director): add class comparison view"
```

---

## Task 2: CSV Export API Route

**Files:**
- Create: `app/api/director/export/route.ts`

- [ ] **Step 1: Create `app/api/director/export/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';

// GET /api/director/export?period=30d
// Returns CSV of all students with their metrics
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const rawPeriod = request.nextUrl.searchParams.get('period') ?? '7d';
  const days: 7 | 30 | 90 =
    rawPeriod === '30d' ? 30 : rawPeriod === '90d' ? 90 : 7;

  const data = await getDirectorDashboardData(user.id, days);
  if (!data) {
    return NextResponse.json({ error: 'Escola não configurada' }, { status: 403 });
  }

  // Build CSV rows
  const rows: string[] = [
    'Escola,Turma,Aluno,Retenção (%),Engajamento (%),Sessões Noturnas,Status',
  ];

  for (const cls of data.classes) {
    for (const student of cls.students) {
      const nightSessions = student.study_hours.filter((h) =>
        [23, 0, 1, 2, 3, 4].includes(h),
      ).length;
      const status =
        student.retention >= 75
          ? 'Alta Performance'
          : student.retention < 50
          ? 'Em Risco'
          : 'Regular';

      rows.push(
        [
          `"${data.school.name}"`,
          `"${cls.name}"`,
          `"${student.name}"`,
          student.retention,
          student.engagement,
          nightSessions,
          `"${status}"`,
        ].join(','),
      );
    }
  }

  const csv = rows.join('\n');
  const filename = `flashaprova-${data.school.name.toLowerCase().replace(/\s+/g, '-')}-${rawPeriod}-${new Date().toISOString().substring(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 2: Add CSV export button to DirectorDashboard escola view**

In `DirectorDashboard.tsx`, in the escola view header area (near the period filter buttons), add an export button:

```typescript
            {/* Export CSV button */}
            <a
              href={`/api/director/export?period=${period}`}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              download
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </a>
```

- [ ] **Step 3: Test CSV download**

Navigate to `/director`, click "Exportar CSV".
Expected: browser downloads a `.csv` file containing one row per student with their metrics.

Verify the CSV is parseable:
```bash
# After downloading, inspect the file
cat ~/Downloads/flashaprova-*.csv | head -5
```

- [ ] **Step 4: Commit**

```bash
git add app/api/director/export/route.ts components/DirectorDashboard.tsx
git commit -m "feat(director): add CSV export for school data"
```

---

## Task 3: At-Risk Alert Edge Function

**Files:**
- Create: `supabase/functions/director-alerts/index.ts`

This Deno Edge Function is triggered daily (via Supabase cron or external cron). It finds all schools where `students_at_risk > 0` and emails the director.

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/director-alerts/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL     = 'alertas@flashaprova.com.br';

Deno.serve(async (req) => {
  // Require the cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find all schools with at-risk students (no review in 7 days)
  const { data: atRiskRows } = await supabase.rpc('get_all_schools_at_risk');

  if (!atRiskRows || atRiskRows.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;

  for (const row of atRiskRows as { school_name: string; director_email: string; at_risk_count: number }[]) {
    if (row.at_risk_count === 0 || !row.director_email) continue;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      row.director_email,
        subject: `[FlashAprova] ${row.at_risk_count} alunos sem revisão em ${row.school_name}`,
        html: `
          <p>Olá, Diretor(a)!</p>
          <p>O painel detectou <strong>${row.at_risk_count} aluno(s)</strong> sem revisão nos últimos 7 dias em <strong>${row.school_name}</strong>.</p>
          <p><a href="https://app.flashaprova.com.br/director">Acesse o painel</a> para ver quem precisa de atenção.</p>
          <hr>
          <p style="color:#999;font-size:12px">FlashAprova B2B · Dados pedagógicos confidenciais</p>
        `,
      }),
    });

    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Create the helper RPC `get_all_schools_at_risk`**

Add to a new migration file `supabase/migrations/20260430_school_alerts_rpc.sql`:

```sql
-- Returns one row per school-director pair where at_risk_count > 0.
-- Used by the director-alerts Edge Function.
CREATE OR REPLACE FUNCTION get_all_schools_at_risk()
RETURNS TABLE(school_name text, director_email text, at_risk_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.name                                              AS school_name,
    au.email                                            AS director_email,
    COUNT(DISTINCT risk_students.id)::int               AS at_risk_count
  FROM schools s
  JOIN profiles director_p ON director_p.school_id = s.id AND director_p.role = 'director'
  JOIN auth.users au ON au.id = director_p.id
  LEFT JOIN LATERAL (
    SELECT p.id
    FROM profiles p
    WHERE p.school_id = s.id
      AND EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM user_progress up2
        WHERE up2.user_id = p.id AND up2.updated_at >= NOW() - INTERVAL '7 days'
      )
  ) risk_students ON TRUE
  GROUP BY s.id, s.name, au.email
  HAVING COUNT(DISTINCT risk_students.id) > 0;
END;
$$;
```

Apply with `npx supabase db push` or Supabase Dashboard SQL editor.

- [ ] **Step 3: Deploy the Edge Function**

```bash
# Set required secrets
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set CRON_SECRET=your-random-secret-here

# Deploy
npx supabase functions deploy director-alerts
```

- [ ] **Step 4: Schedule the function (daily at 8am BRT)**

In the Supabase Dashboard → Database → Extensions, enable `pg_cron`.

Then run in the SQL editor:
```sql
SELECT cron.schedule(
  'director-alerts-daily',
  '0 11 * * *',  -- 11:00 UTC = 08:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/director-alerts',
    headers := '{"Authorization": "Bearer your-random-secret-here"}'::jsonb
  );
  $$
);
```
Replace `<PROJECT_REF>` with `mmevmdudywlqylxqsxfc` and the secret with your actual `CRON_SECRET` value.

- [ ] **Step 5: Test the function manually**

```bash
curl -X POST https://mmevmdudywlqylxqsxfc.supabase.co/functions/v1/director-alerts \
  -H "Authorization: Bearer your-random-secret-here"
```
Expected response: `{"sent":N}` where N is the number of emails dispatched.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/director-alerts/ supabase/migrations/20260430_school_alerts_rpc.sql
git commit -m "feat(director): at-risk student email alerts via Edge Function + cron"
```

---

## Task 4: Multi-School Admin Support

**Files:**
- Modify: `lib/director-data.ts`
- Modify: `app/director/page.tsx`
- Modify: `components/DirectorDashboard.tsx`

Users with `role='admin'` should be able to view any school's dashboard via a school picker.

- [ ] **Step 1: Update `getDirectorDashboardData` to accept an optional `schoolId` override**

In `lib/director-data.ts`, change the function signature:
```typescript
export async function getDirectorDashboardData(
  directorUserId: string,
  days: 7 | 30 | 90 = 7,
  schoolIdOverride?: string,
): Promise<DirectorDashboardData | null> {
```

At the top of the function, after getting `directorProfile`, add:
```typescript
  // Admins can view any school; directors are limited to their own
  let schoolId: string;
  if (directorProfile.role === 'admin' && schoolIdOverride) {
    schoolId = schoolIdOverride;
  } else if (directorProfile.school_id) {
    schoolId = directorProfile.school_id as string;
  } else {
    return null;
  }
```

Remove the earlier `const schoolId = directorProfile.school_id as string;` line.

Update the null check:
```typescript
  if (!directorProfile) return null;
  // role check: allow 'director' (own school) or 'admin' (any school)
  if (directorProfile.role !== 'director' && directorProfile.role !== 'admin') return null;
```

- [ ] **Step 2: Add school list query for admins**

Add a new export to `lib/director-data.ts`:
```typescript
/** Returns all schools — only for use by admin users. */
export async function getAllSchools(
  adminUserId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUserId)
    .maybeSingle();

  if (profile?.role !== 'admin') return [];

  const { data } = await supabase
    .from('schools')
    .select('id, name')
    .order('name');

  return data ?? [];
}
```

- [ ] **Step 3: Update `app/director/page.tsx` to pass school list and selected school**

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getDirectorDashboardData,
  getAllSchools,
} from '@/lib/director-data';
import DirectorDashboard, { type DashboardPeriod } from '@/components/DirectorDashboard';

export const metadata = { title: 'Painel do Diretor — FlashAprova' };

export default async function DirectorPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; school?: string }>;
}) {
  const params = await searchParams;
  const rawPeriod  = params.period;
  const schoolParam = params.school;

  const period: DashboardPeriod =
    rawPeriod === '30d' ? '30d' : rawPeriod === '90d' ? '90d' : '7d';
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check role to decide if admin school-switcher is needed
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';

  const [data, allSchools] = await Promise.all([
    getDirectorDashboardData(user.id, days, schoolParam),
    isAdmin ? getAllSchools(user.id) : Promise.resolve([]),
  ]);

  if (!data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center"
        style={{ background: '#0c0c14' }}
      >
        <p className="text-white/60 text-lg font-semibold">Escola não configurada</p>
        <p className="text-white/30 text-sm max-w-xs">
          Sua conta ainda não está vinculada a uma escola.
        </p>
      </div>
    );
  }

  return (
    <DirectorDashboard
      data={data}
      period={period}
      adminSchools={isAdmin ? allSchools : undefined}
      currentSchoolId={schoolParam}
    />
  );
}
```

- [ ] **Step 4: Add `adminSchools` and `currentSchoolId` props to `DirectorDashboard`**

Update the component props interface:
```typescript
export default function DirectorDashboard({
  data = MOCK_DATA,
  isLoading = false,
  period = '7d',
  adminSchools,
  currentSchoolId,
}: {
  data?: DirectorDashboardData;
  isLoading?: boolean;
  period?: DashboardPeriod;
  adminSchools?: { id: string; name: string }[];
  currentSchoolId?: string;
}) {
```

Add a school-switcher dropdown in the header (right after the period filter buttons):

```typescript
          {/* Admin school-switcher (only for admin users with multiple schools) */}
          {adminSchools && adminSchools.length > 1 && (
            <select
              value={currentSchoolId ?? ''}
              onChange={(e) => {
                const params = new URLSearchParams();
                params.set('school', e.target.value);
                params.set('period', period);
                router.push(`/director?${params.toString()}`);
              }}
              className="text-xs rounded-lg px-3 py-1.5 font-semibold outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border:     '1px solid rgba(255,255,255,0.12)',
                color:      'rgba(255,255,255,0.7)',
              }}
            >
              {adminSchools.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
```

- [ ] **Step 5: Set up an admin user for testing**

Run in Supabase SQL editor:
```sql
-- Replace <YOUR_USER_ID> with your user UUID
UPDATE public.profiles
SET role = 'admin', school_id = NULL
WHERE id = '<YOUR_USER_ID>';
```

Navigate to `/director?school=aaaaaaaa-0000-0000-0000-000000000001`.
Expected: dashboard shows Colégio Panteão data. School switcher dropdown visible in header.

Also update `middleware.ts` to allow `role='admin'` through the `/director` guard:
```typescript
    // Director role guard — allow director OR admin
    if (pathname.startsWith('/director') && profile?.role !== 'director' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
```

- [ ] **Step 6: Commit**

```bash
git add lib/director-data.ts app/director/page.tsx components/DirectorDashboard.tsx middleware.ts
git commit -m "feat(director): multi-school admin support with school-switcher dropdown"
```

---

## Verification Checklist

- [ ] Class comparison view renders side-by-side radar charts correctly
- [ ] CSV export downloads a valid CSV file with all student data
- [ ] Edge Function `director-alerts` deploys without errors
- [ ] Edge Function returns `{"sent": N}` when called manually
- [ ] Admin user can switch between schools via the dropdown
- [ ] Non-admin, non-director users cannot access `/director`
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run build` completes successfully
