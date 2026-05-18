# Meta Conversions API — Design Spec

**Date:** 2026-05-17
**Status:** Approved (design)
**Stack:** Next.js 16 (App Router, Node runtime), Supabase, Asaas (payment gateway)

## Goal

Provide a safe, centralized utility to send server-side events to the Meta
Conversions API (CAPI) using `META_ACCESS_TOKEN` and `META_PIXEL_ID`. Cover the
events: `Purchase`, `CompleteRegistration` (standard), and `OnboardingCompleted`
(custom).

Tracking must **never** block or break signup, payment activation, or
onboarding. Marketing instrumentation is strictly best-effort.

## Non-Goals (YAGNI)

- Retry queue / async durable delivery (future enhancement; current volume does
  not justify it).
- Advanced Matching beyond email + `external_id` (Supabase user id).
- Installing the browser Meta Pixel. We only make events **dedup-ready** so a
  future Pixel automatically deduplicates against the server events.

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `META_PIXEL_ID` | yes | — | Pixel/dataset id |
| `META_ACCESS_TOKEN` | yes | — | CAPI access token |
| `META_GRAPH_VERSION` | no | `v21.0` | Graph API version |
| `META_TEST_EVENT_CODE` | no | — | Sends events to Meta Test Events when set |

If `META_PIXEL_ID` or `META_ACCESS_TOKEN` is missing: log a one-time
`[meta-capi]` warning and **no-op** (never throw). Mirrors the lazy-client
pattern in `lib/mail.ts`.

## Architecture

### Core module — `lib/meta-capi.ts`

Lazy, never throws at build time. Components:

**Config getter**
- Reads env lazily. Returns `null` (no-op mode) if pixel/token absent.

**Pure helpers**
- `normalizeAndHash(value: string): string` — `trim()` → `toLowerCase()` →
  SHA-256 hex (Node `crypto`). Returns `''` for empty input.
- `buildUserData(input)` — builds Meta `user_data`:
  - Hashed: `em` (email), `ph` (phone, digits only before hashing),
    `external_id` (Supabase user id).
  - Raw (per Meta spec, NOT hashed): `client_ip_address`,
    `client_user_agent`, `fbp`, `fbc`.
  - Omits any field that is absent. Hashed fields are emitted as single-element
    arrays per Meta's expected shape.
- `deterministicEventId(eventName: string, key: string): string` — stable id
  (e.g. `${eventName}.${key}`) so a future browser Pixel deduplicates the same
  conversion. Safe even when no Pixel exists.

**Dispatcher**
- `sendMetaEvent(event)`:
  - POST `https://graph.facebook.com/{ver}/{pixelId}/events?access_token=...`
  - Body: `{ data: [event], test_event_code? }` (include
    `test_event_code` only when `META_TEST_EVENT_CODE` is set).
  - 3s timeout via `AbortController`.
  - Returns `{ ok: boolean, status: number }`.
  - All errors caught + logged under `[meta-capi]`; **never throws**.

**Public typed functions**
- `trackPurchase({ email, externalId?, value, currency, planName, eventId, clientIpAddress?, clientUserAgent?, fbp?, fbc?, eventSourceUrl? })`
  - `event_name: 'Purchase'`, `action_source: 'system_generated'` (webhook),
    `custom_data: { currency, value, content_name: planName }`.
- `trackCompleteRegistration({ email, externalId?, eventId, ...matchSignals })`
  - `event_name: 'CompleteRegistration'`,
    `action_source: 'website' | 'system_generated'` depending on caller.
- `trackOnboardingCompleted({ email, externalId?, eventId, ... })`
  - `event_name: 'OnboardingCompleted'` (custom), `action_source: 'website'`.

Every event object includes `event_time` (unix seconds), `event_id`,
`event_name`, `action_source`, `user_data`, and optional `event_source_url` /
`custom_data`.

### Integration points

1. **Webhook — `app/api/webhook/asaas/route.ts`**
   - After `grantPlan` succeeds, dispatch via `after()` (from `next/server`)
     so the webhook response is not delayed:
     - Always `trackPurchase`:
       - `value` = `payment.value` from the Asaas payload, `currency` = `BRL`.
       - `eventId` = `asaas_${paymentId}` (idempotent dedup key).
       - `planName` = resolved `plan.name`.
       - `user_data`: email + `external_id` (Supabase user id). No fbp/fbc/UA
         for server-to-server.
     - Additionally `trackCompleteRegistration` **only** when
       `action === 'user_created'` (new purchaser account), with
       `action_source: 'system_generated'` and
       `eventId = reg_${userId}`.
   - `payment.value` must be read from the payload (currently not extracted)
     and coerced to a number. Purchase requires a value, so if it is
     absent/invalid: log `[meta-capi]` and skip the Purchase event entirely.
     CompleteRegistration is unaffected by this.

2. **New route — `POST /api/meta/complete-registration`** (Node runtime)
   - Called by `app/login/page.tsx` immediately after a successful
     `supabase.auth.signUp`.
   - Request body: `{ email: string }`.
   - Server reads `_fbp` / `_fbc` cookies and `x-forwarded-for` /
     `user-agent` headers for richer match quality.
   - `event_id` = `deterministicEventId('CompleteRegistration', email)` so a
     future browser Pixel deduplicates automatically.
   - `action_source: 'website'`, `event_source_url` from the `referer`/origin.
   - Always responds `{ ok: true }` (HTTP 200) regardless of Meta's response;
     tracking failure must not surface to the signup UI.
   - Basic input validation: `email` is a non-empty string ≤ 320 chars and
     contains `@`; otherwise `{ ok: true }` with no event sent (silent no-op,
     never an error to the client).

3. **generate-plan — `app/api/onboarding/generate-plan/route.ts`**
   - After the success payload is prepared, dispatch `trackOnboardingCompleted`
     via `after()` using the authenticated user's email + id (`external_id`).
   - `event_id` = `deterministicEventId('OnboardingCompleted', user.id)`.
   - Best-effort; failures only logged.

### Non-blocking guarantee

- Server routes use `after()` so Meta calls run after the response is sent.
- The client-facing `/api/meta/complete-registration` route awaits internally
  but always returns `{ ok: true }`.
- No `meta-capi` code path throws to its caller.
- Missing env → silent no-op + single warning.

## Error Handling Summary

| Failure | Behavior |
|---|---|
| Missing env vars | One-time `[meta-capi]` warn, no-op |
| Meta API non-2xx | Log status + response body, return `{ ok:false }` |
| Network/timeout | Caught, logged, return `{ ok:false }` |
| Invalid input (client route) | Return `{ ok:true }`, no event |
| Missing `payment.value` (Purchase) | Log + skip Purchase event only |

## Testing

The repo has no test runner configured; `tsx` is available as a dev dependency.

1. **Unit tests (`node:test`)** for pure, network-free helpers:
   - `normalizeAndHash`: trims, lowercases, correct SHA-256 hex; empty → `''`.
   - `buildUserData`: hashes `em`/`ph`/`external_id`, leaves `fbp`/`fbc`/IP/UA
     raw, omits absent fields, array shape for hashed fields.
   - `deterministicEventId`: stable for same inputs, differs across events/keys.
2. **Manual integration script — `scripts/test-meta-capi.ts`** (run with
   `tsx`): fires a sample `Purchase` and `CompleteRegistration` with
   `META_TEST_EVENT_CODE` set, for verification in Meta's Test Events tool.

## File Changes Summary

| File | Change |
|---|---|
| `lib/meta-capi.ts` | New — core utility |
| `app/api/meta/complete-registration/route.ts` | New — client signup tracking endpoint |
| `app/api/webhook/asaas/route.ts` | Edit — extract `payment.value`; fire Purchase + (conditional) CompleteRegistration via `after()` |
| `app/login/page.tsx` | Edit — call `/api/meta/complete-registration` after `signUp` |
| `app/api/onboarding/generate-plan/route.ts` | Edit — fire `OnboardingCompleted` via `after()` |
| `lib/__tests__/meta-capi.test.ts` (or `node:test` location) | New — pure helper unit tests |
| `scripts/test-meta-capi.ts` | New — manual CAPI verification script |
