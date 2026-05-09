# Redação Light Mode Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dark backgrounds persisting in light mode across the entire Redação | Norma.AI page — the page wrapper, header, breadcrumbs, and all three content areas (Correção, Evolução, Base de Conhecimento).

**Architecture:** The page wrapper (`page.tsx`) has hardcoded dark backgrounds (`#050814`), dark grid/scanline overlays, and dark text colors. The client component (`RedacaoClient.tsx`) already uses `isLight` conditionals in most places but inherits the dark page shell. Fix flows top-down: page shell first, then any remaining hardcoded dark values in the client.

**Tech Stack:** Next.js (App Router), React, CSS variables (`--fa-*`), inline styles with `isLight` ternaries.

---

## File Structure

- **Modify:** `app/dashboard/content/redacao/page.tsx` — page shell (background, grid, scanlines, breadcrumbs, header text)
- **Modify:** `app/dashboard/content/redacao/RedacaoClient.tsx` — remaining hardcoded dark backgrounds in sub-components

No new files needed. `components/redacao/EvolucaoChart.tsx` and `components/redacao/HistoricoList.tsx` already use CSS variables and `isLight` — no changes needed there.

---

### Task 1: Make page.tsx theme-aware

The server component `page.tsx` currently has everything hardcoded to dark. It needs to become a thin client wrapper that reads the theme, or delegate all themed rendering to the client component.

**Problem:** `page.tsx` is a **server component** (`async function`), so it can't use `useTheme()`. The simplest fix is to extract the page shell (background, overlays, header, breadcrumbs) into the client component, or create a small client wrapper for just the themed shell.

**Files:**
- Modify: `app/dashboard/content/redacao/page.tsx`
- Modify: `app/dashboard/content/redacao/RedacaoClient.tsx`

**Strategy:** Move the themed page shell (background, grid, scanlines, breadcrumbs, header) into `RedacaoClient.tsx` which already has `isLight`. Keep `page.tsx` as a minimal server component that fetches the plan and renders `<RedacaoClient>`.

- [ ] **Step 1: Slim down `page.tsx` to only data-fetching + a neutral wrapper**

Replace the entire return JSX in `page.tsx` with a minimal wrapper that delegates to `RedacaoClient`:

```tsx
// page.tsx — keep all the imports and plan-fetching logic, only change the return:
return <RedacaoClient plan={plan} />;
```

- [ ] **Step 2: Move the page shell into `RedacaoClient.tsx`**

Wrap the existing `RedacaoClient` return in the page shell, making all colors theme-aware. At the top of the component (after the existing variables), add the shell constants:

```tsx
const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
```

Then wrap the existing `<div id="tour-redacao">` inside the full page shell:

```tsx
return (
  <main
    className="min-h-screen px-4 py-10 sm:px-8 relative overflow-hidden"
    style={{ background: isLight ? 'var(--fa-bg)' : '#050814' }}
  >
    {/* Grid background — hidden in light mode */}
    {!isLight && (
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    )}

    {/* Scanlines overlay — hidden in light mode */}
    {!isLight && (
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
          opacity: 0.6,
        }}
      />
    )}

    {/* Corner glow accents — hidden in light mode */}
    {!isLight && (
      <>
        <div
          className="pointer-events-none fixed top-0 left-0 w-96 h-96 z-0"
          style={{ background: `radial-gradient(ellipse at top left, ${CYAN}0d 0%, transparent 70%)` }}
        />
        <div
          className="pointer-events-none fixed bottom-0 right-0 w-96 h-96 z-0"
          style={{ background: `radial-gradient(ellipse at bottom right, ${VIOLET}0d 0%, transparent 70%)` }}
        />
      </>
    )}

    <div className="relative z-10 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-1.5 mb-8 flex-wrap"
        style={{
          fontFamily: MONO,
          fontSize: '10px',
          color: isLight ? 'var(--fa-text-3)' : 'rgba(255,255,255,0.28)',
          letterSpacing: '0.06em',
        }}
      >
        <a href="/dashboard" className="hover:opacity-70 transition-colors">
          DASHBOARD
        </a>
        <span className="opacity-40">›</span>
        <span style={{ color: CYAN }}>REDAÇÃO</span>
        <span className="opacity-40">›</span>
        <span style={{ color: 'var(--fa-text)' }}>NORMA.AI</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-5 mb-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${CYAN}22, ${VIOLET}18)`,
            border: `1px solid ${isLight ? `${CYAN}30` : `${CYAN}44`}`,
            boxShadow: isLight ? 'var(--fa-shadow)' : `0 0 20px ${CYAN}22`,
          }}
        >
          ✒️
        </div>
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              letterSpacing: '0.18em',
              color: 'var(--fa-text-3)',
              marginBottom: '4px',
            }}
          >
            [ SISTEMA DE DIAGNÓSTICO ]
          </p>
          <h1
            className="font-black leading-tight"
            style={{
              fontSize: '22px',
              background: `linear-gradient(135deg, ${CYAN} 0%, ${VIOLET} 60%, #c084fc 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Redação | Norma.AI
          </h1>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              color: 'var(--fa-text-3)',
              letterSpacing: '0.08em',
              marginTop: '4px',
            }}
          >
            CORRETORA_IA · ANÁLISE_ENEM · BASE_CONHECIMENTO
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px w-full mt-5 mb-8"
        style={{ background: `linear-gradient(90deg, ${CYAN}55, ${VIOLET}33, transparent)` }}
      />

      {/* Content (existing tour-redacao div) */}
      <div id="tour-redacao">
        {/* ... existing content unchanged ... */}
      </div>
    </div>
  </main>
);
```

- [ ] **Step 3: Add `Link` import to `RedacaoClient.tsx`**

```tsx
import Link from 'next/link';
```

Use `<Link href="/dashboard">` instead of `<a href="/dashboard">` in the breadcrumbs.

- [ ] **Step 4: Verify the page renders correctly**

Run: `npm run dev` and navigate to `/dashboard/content/redacao`
- Toggle between light and dark mode
- Expected in light mode: white/off-white background, no grid lines, no scanlines, readable breadcrumbs and header
- Expected in dark mode: same as current (dark background with grid/scanlines)

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/content/redacao/page.tsx app/dashboard/content/redacao/RedacaoClient.tsx
git commit -m "fix(redacao): make page shell theme-aware for light mode"
```

---

### Task 2: Fix remaining hardcoded dark values in `RedacaoClient.tsx`

Several sub-components still have hardcoded dark backgrounds that don't respond to light mode.

**Files:**
- Modify: `app/dashboard/content/redacao/RedacaoClient.tsx`

**Locations to fix:**

1. **`CompetenciasDiagnostico` (line ~109):** `background: 'rgba(3,6,18,0.95)'` for dark — already has isLight ternary ✅
2. **Chat action block (line ~1124):** `background: 'rgba(3,5,18,0.97)'` — already has isLight ternary ✅
3. **Enviar Redação block (line ~1211):** `background: 'rgba(3,5,18,0.97)'` — already has isLight ternary ✅
4. **`GradeResults` (line ~595):** `background: 'rgba(4,6,16,0.97)'` — already has isLight ternary ✅
5. **`EssayModal` (line ~392, 397):** `background: 'rgba(5,8,18,0.99)'` — already has isLight ternary ✅
6. **`NormaChatModal` (line ~242):** `background: 'rgba(3,5,18,0.98)'` — already has isLight ternary ✅

After review: the sub-components inside `RedacaoClient.tsx` all already have `isLight` ternaries for their backgrounds. **The main issue is the page-level wrapper** in `page.tsx` (Task 1). Once the page shell respects the theme, the cards inside will display correctly on the light background.

- [ ] **Step 1: Verify all components have correct light-mode backgrounds**

Visually check each section in light mode after Task 1 is complete. The CSS variables (`var(--fa-card)`, `var(--fa-bg)`, etc.) should produce correct colors since they're defined in `globals.css` under `[data-theme="light"]`.

- [ ] **Step 2: Fix `NormaChatModal` online status green dot border (line ~264)**

The green dot border uses hardcoded `'#050814'` for dark:
```tsx
// Change line ~264:
style={{ background: '#00ff80', borderColor: isLight ? '#fff' : '#050814', boxShadow: '0 0 6px #00ff8088' }}
```
This is already correct ✅ — no change needed.

- [ ] **Step 3: Test all three tabs in light mode**

Run: `npm run dev` and navigate to `/dashboard/content/redacao`

**Correção tab:**
- CompetenciasDiagnostico card: white card with subtle border
- Chat + Enviar Redação blocks: white cards
- Base de Conhecimento accordion: white cards with subtle borders
- GradeResults (if available): white card

**Evolução tab:**
- Curva de Evolução chart container: white card
- Histórico de Redações list: white card

Expected: all sections show light backgrounds, readable text, no dark patches.

- [ ] **Step 4: Commit if any changes were made**

```bash
git add app/dashboard/content/redacao/RedacaoClient.tsx
git commit -m "fix(redacao): ensure all sub-components render correctly in light mode"
```

---

### Task 3: Fix the `VIOLET` constant discrepancy

**Files:**
- Modify: `app/dashboard/content/redacao/page.tsx` (if kept) or verify in `RedacaoClient.tsx`

In `page.tsx`, `VIOLET = '#818cf8'` but in `RedacaoClient.tsx`, `VIOLET = '#7C3AED'`. When moving the header into `RedacaoClient.tsx`, ensure the header uses `#818cf8` (indigo-400, lighter) since that's what the original page used for the corner glow. The `#7C3AED` (violet-600, deeper) is used for UI accents.

- [ ] **Step 1: Use existing VIOLET for the corner glow**

In the corner glow accents (moved from `page.tsx`), use the literal `#818cf8` since it's only for the subtle radial gradient:

```tsx
<div
  className="pointer-events-none fixed bottom-0 right-0 w-96 h-96 z-0"
  style={{ background: `radial-gradient(ellipse at bottom right, #818cf80d 0%, transparent 70%)` }}
/>
```

This is already handled in the Task 1 code above — just verify the value is `#818cf8` for the glow, not the `VIOLET` constant.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/content/redacao/RedacaoClient.tsx
git commit -m "fix(redacao): use correct violet shade for corner glow"
```

---

## Summary

| Task | File | What |
|------|------|------|
| 1 | `page.tsx` + `RedacaoClient.tsx` | Move page shell into client component, make theme-aware |
| 2 | `RedacaoClient.tsx` | Verify sub-components (mostly already correct) |
| 3 | `RedacaoClient.tsx` | Fix VIOLET constant for glow accent |

The root cause is **Task 1** — the server component `page.tsx` wraps everything in a hardcoded `#050814` background with dark-only overlays. Once the shell respects the theme, all inner components (which already have `isLight` conditionals) will display correctly.
