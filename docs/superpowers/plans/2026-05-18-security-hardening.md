# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the concrete vulnerabilities found in the live FlashAprova app (Next.js 16 + Supabase) so it survives a professional pentest, applying the rules in `vulnerabilidades.md`.

**Architecture:** Defense in depth. Most critical holes are in the **database/RLS layer** (clients use the Supabase anon key directly, so RLS *is* the authorization boundary). We lock the DB first (new SQL migrations), then fix server-side route issues (SSRF, info disclosure, rate-limit gaps), then config/auth hardening. Privileged writes (plan, role, school binding) move to service-role-only paths or atomic SECURITY DEFINER RPCs.

**Tech Stack:** Next.js 16 App Router, React 19, `@supabase/ssr` + `@supabase/supabase-js`, Postgres 17 (Supabase project `mmevmdudywlqylxqsxfc`), Upstash rate limiting, Resend, Asaas webhook.

**Why these and not the whole checklist:** `vulnerabilidades.md` is a generic OWASP baseline. This plan only contains items where the current code/DB is *actually* vulnerable, verified by reading the code and querying live Supabase advisors. Items already correctly implemented (timing-safe webhook token, CSV formula-injection escaping in director export, prompt-injection sanitization in generate-schedule, security headers in `next.config.ts`, `.env.local` correctly gitignored and untracked) are intentionally NOT changed.

---

## Severity Overview (read before executing)

| # | Severity | Issue | OWASP |
|---|----------|-------|-------|
| P0-1 | CRITICAL | `user_stats` RLS lets a user UPDATE their own `plan` / `plan_expires_at` → free lifetime premium, payment bypass | A01/A06 |
| P0-2 | CRITICAL | `profiles` RLS lets a user UPDATE their own `role` (→ `admin`/`director`), `plan`, `school_id`, `class_id`, `onboarding_completed` → vertical privilege escalation + tenant takeover | A01 |
| P0-3 | CRITICAL | `cards`/`decks`/`subjects` have `anon` INSERT policy `WITH CHECK (true)` → unauthenticated catalog poisoning / stored content injection | A01/A05 |
| P0-4 | CRITICAL | `webhook_events` has RLS disabled but is PostgREST-exposed → anon can read full Asaas payment payloads (PII) and tamper idempotency | A01/A02 |
| P0-5 | HIGH | `/api/demo-extract` is unauthenticated and fetches arbitrary user URLs server-side → SSRF (cloud metadata, internal network) | A01/A10 |
| P0-6 | HIGH | `invite_codes` `student_increment_uses` UPDATE policy `WITH CHECK (auth.uid() IS NOT NULL)` → any user rewrites any invite (max_uses, expiry); `/join/[code]` does non-atomic client-side `uses` increment → unlimited redemption race | A01/A06/Race |
| P1-7 | MEDIUM | SECURITY DEFINER fns `handle_new_user`, `complete_onboarding`, `is_director_of_school` executable by `anon`/`authenticated` | A01/A02 |
| P1-8 | MEDIUM | `/api/chat/tutor` returns internal error detail to client | A10 |
| P1-9 | MEDIUM | Webhook logs full payload (`JSON.stringify(payload)`) incl. customer email/PII | A09 |
| P1-10 | MEDIUM | Rate-limit gaps: `/api/onboarding/` fully excluded (paid OpenAI call), `EXCLUDED_API` path `/api/webhooks/` never matches the real `/api/webhook/asaas` | A04/A07 |
| P1-11 | LOW | `function_search_path_mutable` on `complete_onboarding`, `set_updated_at` | A02 |
| P2-12 | LOW | Supabase Auth: OTP expiry > 1h, leaked-password protection disabled (manual dashboard) | A07 |
| P2-13 | LOW | `leads` open anon INSERT with no size/shape validation | A06/Input |

Execute P0 first, in order. P1/P2 after P0 is verified.

---

## File / Migration Map

- Create: `supabase/migrations/20260518_01_lock_user_stats_rls.sql` — block self-service plan changes
- Create: `supabase/migrations/20260518_02_lock_profiles_rls.sql` — block role/plan/school self-escalation
- Create: `supabase/migrations/20260518_03_lock_content_tables.sql` — drop anon INSERT on cards/decks/subjects
- Create: `supabase/migrations/20260518_04_webhook_events_rls.sql` — enable RLS, service-role only
- Create: `supabase/migrations/20260518_05_invite_redeem_rpc.sql` — atomic redeem RPC + tighten invite_codes RLS
- Create: `supabase/migrations/20260518_06_revoke_secdef_execute.sql` — revoke EXECUTE from anon/authenticated; pin search_path
- Create: `app/api/join/route.ts` — server-side invite redemption (replaces client logic)
- Modify: `app/join/[code]/page.tsx` — call the new API instead of writing DB directly
- Modify: `app/api/demo-extract/route.ts` — auth + SSRF guard
- Modify: `app/api/chat/tutor/route.ts:138` — generic error message
- Modify: `app/api/webhook/asaas/route.ts` — redact PII from logs
- Modify: `middleware.ts` — fix rate-limit exclusion list
- Create: `lib/ssrf.ts` — reusable URL allow/deny helper
- Create: `lib/__tests__/ssrf.test.ts` — SSRF guard unit tests
- Manual (no code): Supabase Dashboard → Auth settings (P2-12)

**How to apply SQL:** Each migration is applied to project `mmevmdudywlqylxqsxfc` via the Supabase MCP `apply_migration` tool (name = filename without extension) OR `supabase db push` if the CLI is linked. After each, run the `get_advisors(security)` MCP tool and confirm the targeted lint disappears. The repo's `schema_*.sql` files are historical snapshots — do NOT edit them; the migration files are the source of truth going forward.

**Verification reality:** This project has no automated test runner wired (`package.json` has no `test` script; only `lib/__tests__/meta-capi.test.ts` exists). "TDD" here = a written exploit/repro you run manually with `curl` or the Supabase SQL editor BEFORE the fix (must succeed = vuln confirmed) and AFTER the fix (must fail = vuln closed). Each task gives the exact repro. The one new pure-function unit test (`lib/ssrf.ts`) gets a real test file runnable with `npx tsx`.

---

## Task 1 (P0-1): Lock `user_stats` — stop self-service plan upgrades

**Files:**
- Create: `supabase/migrations/20260518_01_lock_user_stats_rls.sql`

**Background:** `schema_streak.sql` policy `"user_stats: atualização própria"` is `FOR UPDATE USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id)` — no column restriction. AI gating in `app/api/chat/tutor/route.ts` and `app/api/ai/grade-essay/route.ts` reads `user_stats.plan`. So any logged-in user can self-grant `panteao_elite`.

- [ ] **Step 1: Confirm the vulnerability (must succeed = vulnerable)**

In Supabase SQL editor, run as an authenticated test user (or via REST with a user JWT):
```sql
-- Run impersonating a normal student user id <UID>
update public.user_stats
  set plan = 'panteao_elite', plan_expires_at = now() + interval '3650 days'
  where user_id = '<UID>';
select plan, plan_expires_at from public.user_stats where user_id = '<UID>';
```
Expected NOW: update succeeds, plan = `panteao_elite`. (Vulnerability confirmed.) Reset it: `update public.user_stats set plan='flash', plan_expires_at=null where user_id='<UID>';`

- [ ] **Step 2: Write the migration**

`supabase/migrations/20260518_01_lock_user_stats_rls.sql`:
```sql
-- P0-1: Users may update their streak fields but NOT plan / plan_expires_at.
-- Plan is written only by the service role (Asaas webhook -> grantPlan()).
-- Strategy: column-level privilege revoke + a trigger that rejects plan
-- changes coming from non-service roles (defense in depth).

-- 1. Revoke direct column UPDATE on the billing columns from app roles.
REVOKE UPDATE (plan, plan_expires_at) ON public.user_stats FROM anon, authenticated;

-- 2. Trigger guard: even if a future GRANT re-opens it, block the change
--    unless the current role is the service role.
CREATE OR REPLACE FUNCTION public.guard_user_stats_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at)
     AND current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role'
  THEN
    RAISE EXCEPTION 'plan changes are not allowed from this role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_stats_plan ON public.user_stats;
CREATE TRIGGER trg_guard_user_stats_plan
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_stats_plan();
```

- [ ] **Step 3: Apply the migration**

Apply via Supabase MCP `apply_migration` (name `20260518_01_lock_user_stats_rls`). Expected: success, no error.

- [ ] **Step 4: Re-run the Step 1 repro (must now fail = fixed)**

Run the same `update ... set plan='panteao_elite'` as the authenticated user.
Expected: `ERROR: plan changes are not allowed from this role` (or permission denied on column). `select` shows plan unchanged.

- [ ] **Step 5: Confirm the legit path still works**

Confirm the Asaas webhook still upgrades a real account: `grantPlan()` in `app/api/webhook/asaas/route.ts` uses `SUPABASE_SERVICE_ROLE_KEY` (service_role) so the trigger allows it. Spot-check by replaying a test webhook event or running the same UPDATE in the SQL editor (SQL editor runs as `postgres`/service and is allowed). Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260518_01_lock_user_stats_rls.sql
git commit -m "fix(security): block self-service plan upgrades on user_stats (P0-1)"
```

---

## Task 2 (P0-2): Lock `profiles` — stop role / plan / school self-escalation

**Files:**
- Create: `supabase/migrations/20260518_02_lock_profiles_rls.sql`

**Background:** `supabase/migrations/20260430_add_profiles_rls.sql` policy `users_update_own_profile` allows updating *any* column of the user's own row. A student can set `role='admin'` (→ passes `requireAdmin()` in `lib/auth.ts` and the `/director` guard in `middleware.ts`), or `plan`, or `school_id`/`class_id` (join any tenant with no invite). Sensitive columns must be service-role-only.

- [ ] **Step 1: Confirm the vulnerability (must succeed = vulnerable)**

As an authenticated normal student `<UID>` (REST with user JWT, or SQL editor with `set role authenticated; set request.jwt.claims ...`):
```sql
update public.profiles set role='admin' where id='<UID>';
select role from public.profiles where id='<UID>';
```
Expected NOW: succeeds, role=`admin`. (Confirmed.) Reset: `update public.profiles set role='student' where id='<UID>';`

- [ ] **Step 2: Write the migration**

`supabase/migrations/20260518_02_lock_profiles_rls.sql`:
```sql
-- P0-2: Users may edit their own profile EXCEPT privileged columns:
-- role, plan, plan_name, school_id, class_id, onboarding_completed,
-- first_session_completed. Those are written only by service role
-- (webhook grantPlan, generate-plan onboarding, the new /api/join).

-- 1. Revoke column UPDATE on privileged columns from app roles.
REVOKE UPDATE (
  role, plan, plan_name, school_id, class_id,
  onboarding_completed, first_session_completed
) ON public.profiles FROM anon, authenticated;

-- 2. Trigger guard (defense in depth): reject privileged-column changes
--    unless the caller is the service role.
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allowed writers: (a) the service role (webhook/onboarding admin client),
  -- (b) the redeem_invite_code() RPC, which sets the app.invite_redeem GUC
  --     for the duration of its transaction (Task 5). The GUC exception is
  --     harmless until that RPC exists.
  IF (NEW.role                   IS DISTINCT FROM OLD.role
      OR NEW.plan                IS DISTINCT FROM OLD.plan
      OR NEW.plan_name           IS DISTINCT FROM OLD.plan_name
      OR NEW.school_id           IS DISTINCT FROM OLD.school_id
      OR NEW.class_id            IS DISTINCT FROM OLD.class_id
      OR NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed
      OR NEW.first_session_completed IS DISTINCT FROM OLD.first_session_completed)
     AND current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role'
     AND current_setting('app.invite_redeem', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'privileged profile columns cannot be changed from this role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_privileged ON public.profiles;
CREATE TRIGGER trg_guard_profiles_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged();
```

> NOTE: This makes the *client-side* writes in `app/join/[code]/page.tsx` (which set `school_id`/`class_id`) fail. That is fixed in Task 5, which moves redemption server-side. Execute Task 5 in the same release as Task 2 (they ship together — do not deploy Task 2 alone or student join breaks).

- [ ] **Step 3: Verify columns exist before applying**

The `profiles` table is not in `schema.sql`. Confirm column names with the Supabase MCP `list_tables` tool (`schemas:["public"]`, `verbose:true`) and adjust the column list if any name differs (e.g. `first_session_completed`). Do not invent columns — only revoke/guard ones that exist.

- [ ] **Step 4: Apply the migration**

Apply via MCP `apply_migration` (`20260518_02_lock_profiles_rls`). Expected: success.

- [ ] **Step 5: Re-run Step 1 repro (must fail = fixed)**

`update public.profiles set role='admin' where id='<UID>'` as authenticated user → Expected: `ERROR: privileged profile columns cannot be changed from this role`. Also verify a *normal* profile edit still works: `update public.profiles set full_name='Teste' where id='<UID>'` → Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260518_02_lock_profiles_rls.sql
git commit -m "fix(security): block role/plan/school self-escalation on profiles (P0-2)"
```

---

## Task 3 (P0-3): Drop anon INSERT on `cards` / `decks` / `subjects`

**Files:**
- Create: `supabase/migrations/20260518_03_lock_content_tables.sql`

**Background:** Live advisor `rls_policy_always_true`: tables `cards`, `decks`, `subjects` each have an INSERT policy named `allow insert` with `WITH CHECK (true)` granted to `anon`. The curated catalog is editable by unauthenticated users (catalog poisoning; injected card text is later rendered in study views). `schema.sql` only declared SELECT policies — these INSERT policies were added out-of-band and must go. Content is seeded via service role (`scripts/seed.ts`, `app/admin`), which bypasses RLS, so dropping anon write does not break ingestion.

- [ ] **Step 1: Confirm (must succeed = vulnerable)**

With the anon key (no auth), via REST or SQL editor as `anon`:
```sql
insert into public.subjects (title) values ('PWNED');
select id,title from public.subjects where title='PWNED';
```
Expected NOW: insert succeeds. (Confirmed.) Delete it as service role afterwards.

- [ ] **Step 2: Write the migration**

`supabase/migrations/20260518_03_lock_content_tables.sql`:
```sql
-- P0-3: Curated catalog is read-only for clients. Writes happen only via
-- service role (seed script / admin importer), which bypasses RLS.
DROP POLICY IF EXISTS "allow insert" ON public.cards;
DROP POLICY IF EXISTS "allow insert" ON public.decks;
DROP POLICY IF EXISTS "allow insert" ON public.subjects;

-- Also drop any equivalently-permissive UPDATE/DELETE policies if present.
DROP POLICY IF EXISTS "allow update" ON public.cards;
DROP POLICY IF EXISTS "allow update" ON public.decks;
DROP POLICY IF EXISTS "allow update" ON public.subjects;
DROP POLICY IF EXISTS "allow delete" ON public.cards;
DROP POLICY IF EXISTS "allow delete" ON public.decks;
DROP POLICY IF EXISTS "allow delete" ON public.subjects;
-- SELECT policies ("leitura pública") are intentionally kept.
```

- [ ] **Step 3: Inventory existing policies first**

Before applying, list current policies so the DROPs match real names:
```sql
select tablename, policyname, cmd
from pg_policies
where schemaname='public' and tablename in ('cards','decks','subjects');
```
Add `DROP POLICY IF EXISTS "<exact name>"` lines for any other non-SELECT policy returned. (Names may differ from `allow insert`.)

- [ ] **Step 4: Apply the migration**

Apply via MCP `apply_migration` (`20260518_03_lock_content_tables`). Expected: success.

- [ ] **Step 5: Verify (must fail = fixed) + advisor clean**

Re-run Step 1 insert as `anon` → Expected: `new row violates row-level security policy`. Confirm reads still work: `select count(*) from public.subjects` as anon → Expected: succeeds. Run MCP `get_advisors(security)` → the three `rls_policy_always_true` lints for cards/decks/subjects are gone.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260518_03_lock_content_tables.sql
git commit -m "fix(security): drop anon write policies on cards/decks/subjects (P0-3)"
```

---

## Task 4 (P0-4): Enable RLS on `webhook_events`

**Files:**
- Create: `supabase/migrations/20260518_04_webhook_events_rls.sql`

**Background:** Live advisor `rls_disabled_in_public` (ERROR): `webhook_events` is PostgREST-exposed with RLS off. Rows contain the full Asaas `payload` (customer email, payment value). Anon can `select`/`delete` them — PII leak + idempotency tampering. The webhook writes via service role only (`app/api/webhook/asaas/route.ts` uses `SUPABASE_SERVICE_ROLE_KEY`), which bypasses RLS, so enabling RLS with **no** anon/authenticated policy fully closes client access without breaking the webhook.

- [ ] **Step 1: Confirm (must succeed = vulnerable)**

As `anon`: `select event_id, payload from public.webhook_events limit 1;` → Expected NOW: returns rows (PII visible).

- [ ] **Step 2: Write the migration**

`supabase/migrations/20260518_04_webhook_events_rls.sql`:
```sql
-- P0-4: webhook_events holds payment PII. Only the service role (webhook
-- handler) touches it. Enable RLS with NO policy for anon/authenticated
-- => clients get zero rows; service role bypasses RLS entirely.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

-- Explicit deny-all is implicit (RLS on + no permissive policy = no access).
-- Add a service_role ALL policy only if FORCE RLS would otherwise block the
-- backend; service_role bypasses RLS by default so this is usually unneeded.
```

> NOTE on `FORCE ROW LEVEL SECURITY`: it does NOT apply to the `service_role`/`postgres` superuser bypass used by the webhook's admin client, so the webhook keeps working. If, after applying, a webhook test fails with an RLS error, drop the `FORCE` line (keep `ENABLE`) and re-apply.

- [ ] **Step 3: Apply the migration**

Apply via MCP `apply_migration` (`20260518_04_webhook_events_rls`). Expected: success.

- [ ] **Step 4: Verify (must fail = fixed)**

As `anon`: `select * from public.webhook_events;` → Expected: 0 rows. Replay a test Asaas event (or run the webhook's upsert in SQL editor as service) → Expected: row written, idempotency still works. Run MCP `get_advisors(security)` → `rls_disabled_in_public` for `webhook_events` is gone.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260518_04_webhook_events_rls.sql
git commit -m "fix(security): enable RLS on webhook_events to stop PII leak (P0-4)"
```

---

## Task 5 (P0-6): Server-side, atomic invite redemption

**Files:**
- Create: `supabase/migrations/20260518_05_invite_redeem_rpc.sql`
- Create: `app/api/join/route.ts`
- Modify: `app/join/[code]/page.tsx`

**Background:** Today `app/join/[code]/page.tsx` does the whole flow with the anon client: read `invite_codes`, check `uses < max_uses` in JS, write `profiles.school_id/class_id`, then `update uses = uses+1` (non-atomic read-modify-write → N parallel requests all redeem; race). Plus `invite_codes` policy `student_increment_uses` is `FOR UPDATE WITH CHECK (auth.uid() IS NOT NULL)` → any user can set any invite's `max_uses`/`expires_at`. Fix: one atomic SECURITY DEFINER RPC that validates + binds + increments in a single statement, called from a thin authenticated API route. Drop the broad UPDATE policy.

- [ ] **Step 1: Confirm both bugs (must succeed = vulnerable)**

(a) Tamper: as any authenticated user, `update public.invite_codes set max_uses=999999 where code='<SOME_CODE>';` → Expected NOW: succeeds.
(b) Race: fire 20 parallel `/join/<CODE>` redemptions for a code with `max_uses=1` (script with 20 concurrent `fetch`) → Expected NOW: more than 1 succeeds (uses ends > max_uses).

- [ ] **Step 2: Write the RPC + RLS migration**

`supabase/migrations/20260518_05_invite_redeem_rpc.sql`:
```sql
-- P0-6: Atomic invite redemption. Validates code, enforces expiry &
-- max_uses, binds the CALLER's profile to the school/class, and increments
-- uses — all in one statement, immune to the read-modify-write race.

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_invite public.invite_codes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  -- Atomic claim: only succeeds if not expired AND uses < max_uses.
  UPDATE public.invite_codes
     SET uses = uses + 1
   WHERE code = upper(p_code)
     AND expires_at > now()
     AND uses < max_uses
  RETURNING * INTO v_invite;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_exhausted');
  END IF;

  -- Open the guarded-column gate for THIS transaction only (the third
  -- arg `true` = is_local, so it auto-resets at txn end). The
  -- guard_profiles_privileged trigger (Task 2) honors this GUC.
  PERFORM set_config('app.invite_redeem', 'on', true);

  UPDATE public.profiles
     SET school_id = v_invite.school_id,
         class_id  = v_invite.class_id
   WHERE id = v_uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Caller is `authenticated`; SECURITY DEFINER runs as owner so it can write
-- the privileged profile columns locked in Task 2.
REVOKE ALL ON FUNCTION public.redeem_invite_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;

-- Remove the over-permissive client UPDATE policy.
DROP POLICY IF EXISTS "student_increment_uses" ON public.invite_codes;

-- Students no longer SELECT invite rows directly (redemption is via RPC).
-- Keep director read/insert policies; drop the broad student SELECT.
DROP POLICY IF EXISTS "student_read_single_invite_code" ON public.invite_codes;
```

> The `guard_profiles_privileged` trigger from Task 2 blocks non-service roles from changing `school_id`/`class_id`. Task 2's migration already includes the `app.invite_redeem` GUC exception, and this RPC sets that GUC (`PERFORM set_config('app.invite_redeem','on',true)`) for its transaction before the profile UPDATE — so the binding succeeds while direct client writes stay blocked. No edit to Task 2 is needed; just apply Task 2 before Task 5 (P0 order already enforces this).

- [ ] **Step 3: Write the API route**

`app/api/join/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let code = '';
  try {
    const body = await req.json();
    code = typeof body?.code === 'string' ? body.code.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
  if (!code || code.length > 32 || !/^[A-Za-z0-9_-]+$/.test(code)) {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: code });
  if (error) {
    console.error('[api/join] rpc error:', error.message);
    return NextResponse.json({ error: 'Erro ao processar convite.' }, { status: 500 });
  }
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) {
    return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Rewrite the client page to call the API**

In `app/join/[code]/page.tsx`, replace the `join()` body (the auth check stays; remove the direct `invite_codes` select, the `profiles` update, and the `uses` increment) with:
```ts
async function join() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    sessionStorage.setItem('pendingJoinCode', code);
    router.replace(`/login?next=/join/${code}`);
    return;
  }
  setStatus('joining');
  const res = await fetch('/api/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    setStatus('error');
    setMessage(j.error ?? 'Convite inválido ou expirado.');
    return;
  }
  setStatus('success');
  setTimeout(() => router.replace('/dashboard'), 2500);
}
```
Leave the JSX (loading/joining/success/error UI) unchanged.

- [ ] **Step 5: Apply migration + deploy, then verify both bugs fixed**

Apply `20260518_05_invite_redeem_rpc` via MCP. Then:
(a) Tamper repro from Step 1(a) → Expected: `ERROR ... permission denied` / `policy` (no client UPDATE policy on invite_codes anymore).
(b) Race repro from Step 1(b) with `max_uses=1`, 20 concurrent `/api/join` calls → Expected: exactly 1 returns `{ok:true}`, 19 return 400 `invalid_or_exhausted`; `select uses from invite_codes where code=...` = 1.
(c) Happy path: a fresh user POSTs `/api/join` with a valid code → 200, and `select school_id,class_id from profiles where id=<uid>` is populated.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260518_05_invite_redeem_rpc.sql app/api/join/route.ts "app/join/[code]/page.tsx"
git commit -m "fix(security): atomic server-side invite redemption, drop tamperable RLS (P0-6)"
```

---

## Task 6 (P0-5): SSRF guard on `/api/demo-extract`

**Files:**
- Create: `lib/ssrf.ts`
- Create: `lib/__tests__/ssrf.test.ts`
- Modify: `app/api/demo-extract/route.ts`

**Background:** `app/api/demo-extract/route.ts` is unauthenticated and `fetch`es any user-supplied URL server-side, returning extracted HTML metadata. Classic SSRF: an attacker hits `http://169.254.169.254/latest/meta-data/`, `http://localhost`, internal RFC1918 hosts, or `file:`-ish tricks. Current code only checks the URL parses.

- [ ] **Step 1: Write the failing test**

`lib/__tests__/ssrf.test.ts`:
```ts
import assert from 'node:assert';
import { isUrlAllowed } from '../ssrf';

(async () => {
  // Blocked
  assert.strictEqual((await isUrlAllowed('http://169.254.169.254/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://localhost/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://127.0.0.1/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://10.0.0.5/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://192.168.1.1/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://[::1]/')).ok, false);
  assert.strictEqual((await isUrlAllowed('ftp://example.com/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://metadata.google.internal/')).ok, false);
  // Allowed (public host)
  assert.strictEqual((await isUrlAllowed('https://example.com/')).ok, true);
  console.log('ssrf.test.ts PASS');
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx tsx lib/__tests__/ssrf.test.ts`
Expected: FAIL — `Cannot find module '../ssrf'`.

- [ ] **Step 3: Implement `lib/ssrf.ts`**

```ts
import { lookup } from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;        // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const v = ip.toLowerCase();
  if (v === '::1' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
  if (v === '::' ) return true;
  return false;
}

export async function isUrlAllowed(
  raw: string,
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, reason: 'malformed' }; }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, reason: 'protocol' };
  }
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.internal') || host.endsWith('.local')) {
    return { ok: false, reason: 'blocked-host' };
  }
  if (raw.length > 2048) return { ok: false, reason: 'too-long' };

  // Resolve and reject if ANY resolved address is private/loopback/link-local.
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    return { ok: false, reason: 'dns' };
  }
  if (addrs.length === 0) return { ok: false, reason: 'dns-empty' };
  for (const { address } of addrs) {
    if (isPrivateIp(address)) return { ok: false, reason: 'private-ip' };
  }
  return { ok: true, url: u.toString() };
}
```

- [ ] **Step 4: Run the test, expect pass**

Run: `npx tsx lib/__tests__/ssrf.test.ts`
Expected: `ssrf.test.ts PASS`.

- [ ] **Step 5: Wire the guard into the route + require auth + block redirects**

In `app/api/demo-extract/route.ts`: (a) at the top of `POST`, add auth (this endpoint feeds the authenticated demo-admin flow):
```ts
import { createClient } from '@/lib/supabase/server';
import { isUrlAllowed } from '@/lib/ssrf';
// ...
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({}, { status: 401 });
```
(b) Replace the existing `try { url = rawUrl.startsWith('http') ? ... ; new URL(url); } catch { return NextResponse.json({}); }` block with:
```ts
const candidate = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
const verdict = await isUrlAllowed(candidate);
if (!verdict.ok) return NextResponse.json({});
const url = verdict.url;
```
(c) In the `fetch(url, { signal, headers })` call add `redirect: 'error'` so a public URL can't 30x-redirect to an internal one. Keep the existing 5s `AbortController` timeout.

> NOTE: there is a TOCTOU window (DNS rebinding) between `isUrlAllowed`'s lookup and `fetch`'s own lookup. For this low-value metadata-scraper that is acceptable; document it in a one-line comment. A fully robust fix (pin resolved IP, custom agent) is out of scope here.

- [ ] **Step 6: Verify the route**

With dev server running and a valid session cookie:
```bash
curl -s -X POST localhost:3000/api/demo-extract -H 'Content-Type: application/json' \
  -b "<auth cookies>" -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
```
Expected: `{}` (blocked, no fetch). Unauthenticated same call → HTTP 401. A real public site (`{"url":"https://example.com"}`) still returns extracted metadata.

- [ ] **Step 7: Commit**

```bash
git add lib/ssrf.ts lib/__tests__/ssrf.test.ts app/api/demo-extract/route.ts
git commit -m "fix(security): require auth + SSRF allowlist on /api/demo-extract (P0-5)"
```

---

## Task 7 (P1-7 + P1-11): Revoke EXECUTE on SECURITY DEFINER fns + pin search_path

**Files:**
- Create: `supabase/migrations/20260518_06_revoke_secdef_execute.sql`

**Background:** Live advisors flag `public.handle_new_user()`, `public.complete_onboarding()`, `public.is_director_of_school(uuid)` as anon/authenticated-executable SECURITY DEFINER. `handle_new_user` is the signup trigger fn — directly callable by anon is dangerous. `complete_onboarding` should be callable by the logged-in user (it's used in `app/api/onboarding/generate-plan/route.ts` via `serverClient.rpc('complete_onboarding')` on the user session) — keep `authenticated`, revoke `anon`. `is_director_of_school` is a boolean helper for RLS — keep usable by `authenticated`, revoke `anon`. Also `function_search_path_mutable` on `complete_onboarding` and `set_updated_at`.

- [ ] **Step 1: Confirm (must succeed = vulnerable)**

As `anon` via REST: `POST /rest/v1/rpc/handle_new_user` → Expected NOW: not 403 (callable).

- [ ] **Step 2: Write the migration**

`supabase/migrations/20260518_06_revoke_secdef_execute.sql`:
```sql
-- P1-7: tighten EXECUTE on SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding()       FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.complete_onboarding()       TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_director_of_school(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.is_director_of_school(uuid) TO authenticated;

-- P1-11: pin search_path on flagged functions.
ALTER FUNCTION public.complete_onboarding() SET search_path = '';
ALTER FUNCTION public.set_updated_at()      SET search_path = '';
```

> Before applying, confirm exact signatures with `select oid::regprocedure from pg_proc where proname in ('handle_new_user','complete_onboarding','is_director_of_school','set_updated_at');`. Adjust arg lists if they differ. `handle_new_user` must remain owned/triggered correctly — revoking EXECUTE from roles does NOT stop the `auth.users` trigger from firing (triggers run as the function owner), so signup is unaffected. Verify after applying.

- [ ] **Step 3: Apply + verify**

Apply via MCP `apply_migration` (`20260518_06_revoke_secdef_execute`). Then: (a) anon `POST /rpc/handle_new_user` → 403/permission denied. (b) Create a brand-new test signup → profile row still auto-created (trigger still fires). (c) Complete onboarding as that user via the app → `complete_onboarding` RPC still works. (d) Open `/director` as a director → still works (`is_director_of_school` usable by authenticated). (e) MCP `get_advisors(security)` → the three secdef lints + the two `function_search_path_mutable` lints are gone.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518_06_revoke_secdef_execute.sql
git commit -m "fix(security): restrict SECURITY DEFINER EXECUTE + pin search_path (P1-7, P1-11)"
```

---

## Task 8 (P1-8 + P1-9): Stop leaking internals (error detail + PII logs)

**Files:**
- Modify: `app/api/chat/tutor/route.ts:137-138`
- Modify: `app/api/webhook/asaas/route.ts:214`

- [ ] **Step 1: Confirm**

Trigger an OpenAI error on `/api/chat/tutor` (e.g. temporarily bad model) → response body contains `Erro interno: <openai internal message>`. In webhook logs, line 214 prints `JSON.stringify(payload)` with customer email/value.

- [ ] **Step 2: Fix the tutor error response**

In `app/api/chat/tutor/route.ts`, replace lines 137-138:
```ts
    const detail = err?.error?.message ?? err?.message ?? 'desconhecido';
    return NextResponse.json({ error: `Erro interno: ${detail}` }, { status: 500 });
```
with:
```ts
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
```
(The detailed `console.error` above it stays — server-side logging is fine; only the client response changes.)

- [ ] **Step 3: Redact the webhook payload log**

In `app/api/webhook/asaas/route.ts` line 214, replace:
```ts
  console.log(`[webhook/asaas] Evento recebido: ${event}`, JSON.stringify(payload));
```
with (log only non-PII envelope fields):
```ts
  const pmt = (payload.payment as Record<string, unknown> | undefined) ?? {};
  console.log(`[webhook/asaas] Evento recebido: ${event}`, JSON.stringify({
    event,
    paymentId: pmt.id ?? null,
    paymentLink: pmt.paymentLink ?? null,
    value: pmt.value ?? null,
  }));
```
Also scan the rest of the file for other PII logs: the `[webhook/asaas] E-mail obtido via ...` lines (259, 266, 276) and `Processando plano="..." para email="..."` (285) print raw email. Mask them — replace each logged email with a helper `const maskEmail = (e:string) => e.replace(/^(.).*(@.*)$/, '$1***$2');` and log `maskEmail(email)` instead of `email`. Keep functional logs (paymentId, plan slug, userId) intact.

- [ ] **Step 4: Verify**

Re-trigger tutor error → body is exactly `{"error":"Erro interno. Tente novamente."}`, status 500; server log still has detail. Replay a webhook test event → logs show `j***@domain.com` and no full payload JSON.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/tutor/route.ts app/api/webhook/asaas/route.ts
git commit -m "fix(security): generic client errors + redact PII from webhook logs (P1-8, P1-9)"
```

---

## Task 9 (P1-10): Close rate-limit gaps in middleware

**Files:**
- Modify: `middleware.ts:6-9`

**Background:** `EXCLUDED_API = ['/api/webhooks/', '/api/onboarding/']`. (1) `/api/onboarding/generate-plan` makes a paid OpenAI call yet is fully exempt from rate limiting — a logged-in user can hammer it (cost abuse). (2) The exclusion `/api/webhooks/` (plural) never matches the real route `/api/webhook/asaas` (singular), so the intent (don't rate-limit Asaas) isn't even achieved by that string — and Asaas callbacks shouldn't be IP/user limited. Fix both.

- [ ] **Step 1: Edit the constants**

In `middleware.ts`:
- Change `EXCLUDED_API` to only the real webhook path: `const EXCLUDED_API = ['/api/webhook/'];`
- Add the onboarding generation route to the strict AI limiter list:
  `const AI_ROUTES = ['/api/chat/tutor', '/api/chat/redacao', '/api/ai/grade-essay', '/api/ai/generate-schedule', '/api/insights/briefing', '/api/onboarding/generate-plan'];`

- [ ] **Step 2: Verify**

With Upstash configured, send 7 rapid POSTs to `/api/onboarding/generate-plan` as one authenticated user → Expected: first 5 pass, 6th+ return HTTP 429. Send a POST to `/api/webhook/asaas` repeatedly with a valid token → Expected: never 429 (excluded). `/api/director/*` etc. still use the general 60/min limiter.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "fix(security): rate-limit onboarding AI route, fix webhook exclusion path (P1-10)"
```

---

## Task 10 (P2-12): Supabase Auth dashboard hardening (manual — no code)

**This task has no code. It is a checklist for the human operator (Bruno) — the executing model should surface it, not attempt it via API.**

- [ ] **Step 1:** Supabase Dashboard → Authentication → Providers → Email → set **OTP expiry** to `1800` (30 min) or less. (Advisor `auth_otp_long_expiry`.)
- [ ] **Step 2:** Supabase Dashboard → Authentication → Policies/Password → enable **Leaked password protection** (HaveIBeenPwned). (Advisor `auth_leaked_password_protection`.)
- [ ] **Step 3:** Re-run MCP `get_advisors(security)` → both `auth_*` warnings gone.
- [ ] **Step 4:** No commit (dashboard settings). Note completion in the PR description.

---

## Task 11 (P2-13): Validate & rate-limit the public `leads` insert

**Files:**
- Create: `supabase/migrations/20260518_07_leads_constraints.sql`

**Background:** `leads` has anon INSERT `WITH CHECK (true)` (intentional — public lead-capture form) but no bounds → spam / oversized payload vector. Keep it public but add DB-level shape constraints (cheap defense; the form is the only writer). Rate limiting at the edge already covers `/api/*` but lead capture may be a direct PostgREST insert from the client — constraints are the reliable layer.

- [ ] **Step 1: Inspect the table**

MCP `list_tables` (verbose) → note `leads` columns (likely `email`, `name`, maybe `phone`, `source`). Only constrain columns that exist.

- [ ] **Step 2: Write the migration** (adjust column names to match Step 1)

`supabase/migrations/20260518_07_leads_constraints.sql`:
```sql
-- P2-13: bound the public lead-capture insert.
ALTER TABLE public.leads
  ADD CONSTRAINT leads_email_len   CHECK (char_length(email) <= 320),
  ADD CONSTRAINT leads_email_shape CHECK (position('@' in email) > 1);
-- If a free-text name/message column exists, also:
-- ADD CONSTRAINT leads_name_len CHECK (name IS NULL OR char_length(name) <= 200);
```

- [ ] **Step 3: Apply + verify**

Apply via MCP. As anon: inserting a 10,000-char email → Expected: constraint violation. A normal lead → succeeds.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260518_07_leads_constraints.sql
git commit -m "fix(security): bound public leads insert with DB constraints (P2-13)"
```

---

## Final Verification (after all tasks)

- [ ] Run MCP `get_advisors(security)` for project `mmevmdudywlqylxqsxfc`. Expected: `rls_disabled_in_public` (webhook_events) gone; the cards/decks/subjects `rls_policy_always_true` gone; all `*_security_definer_function_executable` for handle_new_user/complete_onboarding/is_director_of_school gone or reduced to intended `authenticated`; both `function_search_path_mutable` gone; both `auth_*` gone (after Task 10). Remaining: only the intentional `leads` public-insert lint (accepted, now constrained).
- [ ] Manually re-run every "must fail = fixed" repro from P0 tasks 1–6. All must fail (vuln closed).
- [ ] Smoke test the happy paths end-to-end on a staging/preview deploy: signup → onboarding → study a deck → (paid user) tutor chat & essay grading → student joins via invite link → director dashboard + CSV export → Asaas test webhook grants a plan. None may regress.
- [ ] `git log --oneline` shows one focused commit per task. Open a single PR titled "Security hardening (vulnerabilidades.md)" summarizing P0/P1/P2 and listing the manual Task 10 steps for the operator.

## Notes / Out of Scope (document in PR, do not implement now)

- Nonce-based CSP (currently `script-src 'unsafe-inline'`): meaningful XSS hardening but invasive in Next 16; track separately.
- Privacy self-service endpoints (export / delete-my-data, A privacy section of the checklist): product feature, separate plan.
- Honeypot routes (`/wp-admin` etc.): optional, low ROI now.
- KaTeX `dangerouslySetInnerHTML` in study pages: `katex.renderToString` HTML-escapes input and `throwOnError:false` returns escaped text, so it is not a practical XSS sink; once Task 3 removes anon card writes the input is curated anyway. Left as-is, documented.
- Asaas webhook has no HMAC signature (Asaas uses a shared static token, which is already validated timing-safe) — acceptable given the provider's design.
