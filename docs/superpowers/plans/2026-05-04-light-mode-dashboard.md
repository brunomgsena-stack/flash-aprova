# Light Mode Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a working, accessible light mode toggle for the dashboard — replacing fragile CSS `!important` overrides with CSS variable-based theming.

**Architecture:** Re-enable `ThemeProvider` toggle (persisted in `localStorage`), add a sun/moon button to `UserMenu`, then migrate each dashboard component from hardcoded dark Tailwind/inline colors to `var(--fa-*)` CSS tokens. Server components use `text-[var(--fa-text)]` Tailwind syntax; client components use `isLight` conditional or direct CSS var references. Finish by removing the now-redundant `!important` overrides in `globals.css`.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v4, CSS custom properties (`var(--fa-*)`), React `useContext`

---

## File Map

| File | Change |
|---|---|
| `components/ThemeProvider.tsx` | Re-enable toggle + localStorage |
| `app/dashboard/UserMenu.tsx` | Add sun/moon toggle button |
| `app/dashboard/SubjectCard.tsx` | Full migration — add `useTheme`, fix all hardcoded dark colors |
| `app/dashboard/subject/[subjectId]/page.tsx` | Server component — swap Tailwind classes to CSS var syntax |
| `app/dashboard/AccountStatusCard.tsx` | Fix `text-white` in `ActivePlanStrip` |
| `app/dashboard/deck/[deckId]/pre-study/DeckContent.tsx` | Migrate Markdown renderer classes |
| `app/dashboard/reports/ProgressReport.tsx` | Replace `CARD`/`DIM` hardcoded dark constants |
| `app/dashboard/schedule/WeeklySchedule.tsx` | Replace `DIM` constant + card background styles |
| `app/dashboard/OnboardingWizard.tsx` | Fix `TutorBubble` text + inactive dot color |
| `app/globals.css` | Remove `!important` text/bg overrides (lines 149–186) |

---

## Task 1: Re-enable ThemeProvider toggle

**Files:**
- Modify: `components/ThemeProvider.tsx`

- [ ] **Step 1: Replace the frozen ThemeProvider with a working toggle**

Replace the entire file contents:

```tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('fa-theme') as Theme) ?? 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fa-theme', next);
    applyTheme(next);
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('light', t === 'light');
}

export const useTheme = () => useContext(ThemeCtx);
```

- [ ] **Step 2: Verify in browser**

Start dev server (`bun dev` or `npm run dev`). Open DevTools → Console. Run:
```js
localStorage.setItem('fa-theme', 'light'); location.reload();
```
Expected: `<html>` element gains class `light`, page background becomes `#F8FAFC`.

Run:
```js
localStorage.setItem('fa-theme', 'dark'); location.reload();
```
Expected: class `light` removed, dark background returns.

- [ ] **Step 3: Commit**

```bash
git add components/ThemeProvider.tsx
git commit -m "feat(theme): re-enable light mode toggle with localStorage persistence"
```

---

## Task 2: Add sun/moon toggle to UserMenu

**Files:**
- Modify: `app/dashboard/UserMenu.tsx`

- [ ] **Step 1: Add the toggle button inside the dropdown**

In `UserMenu.tsx`, find the menu items section (the `<div className="py-2">` block starting around line 157 that contains the Link items). Add a theme toggle button **after** the last `<Link>` and **before** the closing `</div>` of that block:

```tsx
<button
  onClick={() => { toggle(); setOpen(false); }}
  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors text-left"
  style={{ color: 'var(--fa-text-2)' }}
>
  <span className="text-base">{isLight ? '🌙' : '☀️'}</span>
  <span>{isLight ? 'Modo Escuro' : 'Modo Claro'}</span>
</button>
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard`. Click the user menu (avatar/badge in top-right). Confirm the new button appears. Click it — page should switch theme. Click menu again, confirm icon has flipped (☀️ ↔ 🌙).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/UserMenu.tsx
git commit -m "feat(theme): add sun/moon toggle button to UserMenu dropdown"
```

---

## Task 3: Migrate SubjectCard to CSS variables

**Files:**
- Modify: `app/dashboard/SubjectCard.tsx`

This is the most visible card on the main dashboard. It has zero light mode support — all colors are hardcoded dark.

- [ ] **Step 1: Add useTheme import and isLight**

At the top of `SubjectCard.tsx`, add the import (after existing imports):
```tsx
import { useTheme } from '@/components/ThemeProvider';
```

Inside the `SubjectCard` function body, after line `const [hovered, setHovered] = useState(false);`, add:
```tsx
const { theme } = useTheme();
const isLight   = theme === 'light';
```

- [ ] **Step 2: Replace cardStyle with theme-aware version**

Replace the existing `cardStyle` object (lines ~27–35):
```tsx
const cardStyle = {
  background:           isLight ? '#FFFFFF' : 'rgba(6,6,18,0.72)',
  backdropFilter:       isLight ? 'none' : 'blur(36px) saturate(180%)',
  WebkitBackdropFilter: isLight ? 'none' : 'blur(36px) saturate(180%)',
  border: `1px solid ${hovered ? `${color}cc` : isLight ? `${color}30` : `${color}44`}`,
  boxShadow: hovered
    ? isLight
      ? `0 4px 24px ${color}28, 0 1px 4px rgba(0,0,0,0.08)`
      : `0 0 28px 4px ${color}44, 0 0 72px 8px ${color}18, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 24px rgba(255,255,255,0.02)`
    : isLight
      ? '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)'
      : `0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
};
```

- [ ] **Step 3: Fix title color**

Find the `<h2>` title (around line 72–80). Change its style:
```tsx
// Before
style={id === 'redacao-flash' ? {
  background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 50%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} : { color: 'white' }}

// After
style={id === 'redacao-flash' && !isLight ? {
  background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 50%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} : { color: 'var(--fa-text)' }}
```

- [ ] **Step 4: Fix progress bar label and track colors**

Find `INTEGRIDADE DE MEMÓRIA` label (around line 92) — `color: 'rgba(255,255,255,0.30)'`:
```tsx
// Change to:
color: 'var(--fa-text-3)'
```

Find `SEM DADOS · INICIAR PROTOCOLO` label (around line 117) — `color: 'rgba(255,255,255,0.22)'`:
```tsx
// Change to:
color: 'var(--fa-text-3)'
```

Find bar track `div` (around line 100) — `background: 'rgba(255,255,255,0.06)'`:
```tsx
// Change to:
background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
```

- [ ] **Step 5: Verify in browser with light mode active**

Switch to light mode (via UserMenu toggle). Navigate to `/dashboard`. Confirm:
- Subject cards have white background
- Card titles are dark/readable
- Progress bar labels are visible
- No white text on white background

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/SubjectCard.tsx
git commit -m "feat(theme): migrate SubjectCard to CSS variable theming"
```

---

## Task 4: Fix subject page server component text

**Files:**
- Modify: `app/dashboard/subject/[subjectId]/page.tsx`

This is a server component (async function) — cannot use `useTheme` hook. Use CSS variable Tailwind syntax instead.

- [ ] **Step 1: Fix breadcrumb and header text classes**

Make the following class substitutions (exact strings to find → replace):

| Find | Replace |
|---|---|
| `"hover:text-white transition-colors"` | `"hover:text-[var(--fa-text)] transition-colors"` |
| `"text-white font-medium"` | `"text-[var(--fa-text)] font-medium"` |
| `"text-white leading-tight"` | `"text-[var(--fa-text)] leading-tight"` |
| `"text-slate-400 text-sm"` | `"text-[var(--fa-text-2)] text-sm"` |
| `"text-slate-400 text-sm mt-0.5"` | `"text-[var(--fa-text-2)] text-sm mt-0.5"` |
| `"text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4"` | `"text-xs font-semibold tracking-widest uppercase text-[var(--fa-text-3)] mb-4"` |

There are two `text-slate-500 mb-4` instances (Módulos label and Outros Decks label) — replace both.

- [ ] **Step 2: Fix empty state text**

Find the empty state paragraph:
```tsx
<p className="text-slate-500 text-lg">Nenhum deck por aqui ainda.</p>
```
Replace:
```tsx
<p className="text-[var(--fa-text-3)] text-lg">Nenhum deck por aqui ainda.</p>
```

- [ ] **Step 3: Verify in browser**

Navigate to any subject page (e.g. `/dashboard/subject/<id>`). With light mode active, confirm: breadcrumbs, title, and description text are all dark/readable.

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/subject/[subjectId]/page.tsx"
git commit -m "feat(theme): fix server component text in subject page for light mode"
```

---

## Task 5: Fix AccountStatusCard text

**Files:**
- Modify: `app/dashboard/AccountStatusCard.tsx`

- [ ] **Step 1: Fix hardcoded white text in ActivePlanStrip**

In `ActivePlanStrip` function, find line with `className="text-white font-bold text-sm"` (around line 117):
```tsx
// Change from:
<span className="text-white font-bold text-sm">Protocolo Neural</span>

// Change to:
<span className="text-[var(--fa-text)] font-bold text-sm">Protocolo Neural</span>
```

Find `className="text-slate-600 text-xs mt-0.5"` (around line 130):
```tsx
// Change to:
<p className="text-[var(--fa-text-3)] text-xs mt-0.5">
```

- [ ] **Step 2: Verify in browser**

With light mode active, open dashboard. If you have a Neural Protocol plan, the active plan strip should show dark text. If on free plan, the gold upgrade banner (UpgradeBanner) is intentionally dark-on-gold and needs no change.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/AccountStatusCard.tsx
git commit -m "feat(theme): fix AccountStatusCard text for light mode"
```

---

## Task 6: Migrate DeckContent Markdown renderers

**Files:**
- Modify: `app/dashboard/deck/[deckId]/pre-study/DeckContent.tsx`

- [ ] **Step 1: Replace the `md` Components object**

Find the `const md: Components = { ... }` block (lines 31–49) and replace it entirely:

```tsx
const md: Components = {
  h1: ({ children }) => <h1 className="text-[var(--fa-text)] text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[var(--fa-text)] text-base font-bold mt-4 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[var(--fa-text)] text-sm font-semibold mt-3 mb-1 first:mt-0">{children}</h3>,
  p:  ({ children }) => <p  className="text-[var(--fa-text-2)] text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-[var(--fa-text)] font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="text-[var(--fa-text-2)] italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-[var(--fa-text-2)] text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-[var(--fa-text-2)] text-sm">{children}</ol>,
  li: ({ children }) => <li className="text-[var(--fa-text-2)] text-sm leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500 pl-4 my-3 text-[var(--fa-text-2)] text-sm italic">{children}</blockquote>
  ),
  code: ({ children, className }) =>
    className?.includes('language-')
      ? <pre className="bg-[var(--fa-card)] border border-[var(--fa-border)] rounded-lg p-3 overflow-x-auto my-3 text-xs text-[var(--fa-text-2)]"><code>{children}</code></pre>
      : <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded text-xs">{children}</code>,
  hr: () => <hr className="border-[var(--fa-border)] my-4" />,
};
```

- [ ] **Step 2: Verify in browser**

Navigate to any deck pre-study page (`/dashboard/deck/<id>/pre-study`). With light mode active, confirm: deck summary text, headings, and lists are readable (dark on light background).

- [ ] **Step 3: Commit**

```bash
git add "app/dashboard/deck/[deckId]/pre-study/DeckContent.tsx"
git commit -m "feat(theme): migrate DeckContent Markdown renderers to CSS variables"
```

---

## Task 7: Fix ProgressReport hardcoded dark constants

**Files:**
- Modify: `app/dashboard/reports/ProgressReport.tsx`

- [ ] **Step 1: Replace CARD and DIM constants**

Find the top of the file (around lines 17–19):
```ts
const DIM   = 'rgba(255,255,255,0.38)';
const CARD  = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
```

Replace with:
```ts
const DIM   = 'var(--fa-text-2)';
const CARD  = { background: 'var(--fa-card)', border: '1px solid var(--fa-border)' };
```

- [ ] **Step 2: Remove backdropFilter from SectionCard**

`SectionCard` (around line 116–122) applies `backdropFilter: 'blur(16px)'` — this is a dark glassmorphism pattern, visually wrong in light mode. Change `SectionCard`:
```tsx
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={CARD}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/dashboard/reports`. With light mode active, confirm: section cards have white background, secondary text is `#334155` (Slate-700), no glass blur artifacts.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/reports/ProgressReport.tsx
git commit -m "feat(theme): migrate ProgressReport to CSS variable tokens"
```

---

## Task 8: Fix WeeklySchedule hardcoded dark constant

**Files:**
- Modify: `app/dashboard/schedule/WeeklySchedule.tsx`

- [ ] **Step 1: Replace DIM constant**

Find at the top of the file:
```ts
const DIM = 'rgba(255,255,255,0.35)';
```

Replace with:
```ts
const DIM = 'var(--fa-text-2)';
```

- [ ] **Step 2: Search for remaining hardcoded dark inline styles in the file**

Run a targeted search in the file for any remaining `rgba(255,255,255` patterns:
```bash
grep -n "rgba(255,255,255" app/dashboard/schedule/WeeklySchedule.tsx
```

For each occurrence, apply the mapping:
- `rgba(255,255,255,0.X)` used as text/label color → `'var(--fa-text-2)'` or `'var(--fa-text-3)'` (use text-3 for <0.25 opacity, text-2 for others)
- `rgba(255,255,255,0.0X)` used as background → `'var(--fa-card)'`
- `rgba(255,255,255,0.0X)` used as border → `'var(--fa-border)'`

- [ ] **Step 3: Verify in browser**

Navigate to `/dashboard/schedule` (from the Reports button or directly). With light mode active, confirm schedule blocks and labels are readable.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/schedule/WeeklySchedule.tsx
git commit -m "feat(theme): migrate WeeklySchedule to CSS variable tokens"
```

---

## Task 9: Fix OnboardingWizard dark-only colors

**Files:**
- Modify: `app/dashboard/OnboardingWizard.tsx`

- [ ] **Step 1: Fix inactive dot color in Dots component**

In the `Dots` function (around line 38–52), find:
```ts
background: s === step ? VIOLET : s < step ? `${NEON}80` : 'rgba(255,255,255,0.12)',
```

Replace:
```ts
background: s === step ? VIOLET : s < step ? `${NEON}80` : 'var(--fa-border)',
```

- [ ] **Step 2: Fix TutorBubble text color**

In `TutorBubble` (around line 58–72), find:
```ts
color: 'rgba(255,255,255,0.80)',
```

Replace:
```ts
color: 'var(--fa-text-2)',
```

- [ ] **Step 3: Search for remaining hardcoded dark patterns**

```bash
grep -n "rgba(255,255,255" app/dashboard/OnboardingWizard.tsx
```

Apply the same mapping as Task 8 Step 2 for any remaining occurrences.

- [ ] **Step 4: Verify in browser**

The OnboardingWizard only appears on first login. To test: in Supabase, set `onboarding_completed = false` for your test user, then reload `/dashboard`. With light mode active, confirm the modal wizard is readable (dots, tutor bubble, form inputs).

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/OnboardingWizard.tsx
git commit -m "feat(theme): fix OnboardingWizard colors for light mode"
```

---

## Task 10: Clean up globals.css !important overrides

**Files:**
- Modify: `app/globals.css`

Now that components use CSS variables directly, the broad `!important` overrides are redundant and should be removed to avoid future confusion.

- [ ] **Step 1: Remove the Tailwind text class overrides**

In `app/globals.css`, delete the block from `/* Global Tailwind text overrides for light mode */` through `html.light .text-transparent { color: #0A0A0A !important; }` (approximately lines 149–168). This includes:

```css
/* DELETE this entire block: */
/* Global Tailwind text overrides for light mode — broad coverage */
html.light .text-white                           { color: #0A0A0A !important; }
html.light .text-slate-100, html.light .text-slate-200,
html.light .text-slate-300, html.light .text-slate-400 { color: #475569 !important; }
html.light .text-slate-500                       { color: #334155 !important; }
html.light .text-slate-600, html.light .text-slate-700 { color: #1E293B !important; }

/* Gray variants */
html.light .text-gray-100, html.light .text-gray-200,
html.light .text-gray-300, html.light .text-gray-400 { color: #4B5563 !important; }
html.light .text-gray-500                        { color: #374151 !important; }
html.light .text-gray-600, html.light .text-gray-700 { color: #1F2937 !important; }

/* Zinc / Neutral variants */
html.light .text-zinc-300, html.light .text-zinc-400,
html.light .text-neutral-300, html.light .text-neutral-400 { color: #52525B !important; }

/* Functional semantic — keep accent colors as-is (green, blue, amber, red) */
html.light .text-transparent { color: #0A0A0A !important; }

/* Deck count / caption labels */
html.light .text-slate-500 { color: #334155 !important; }
html.light .text-slate-600 { color: #1E293B !important; }
```

- [ ] **Step 2: Remove the backdrop-blur override**

Delete:
```css
/* Card backgrounds stuck in dark glassmorphism */
html.light [class*="backdrop-blur"] {
  background: #FFFFFF !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

- [ ] **Step 3: Keep the bg-clip-text fallback**

Do NOT remove this block — it's still needed for any gradient text not yet migrated:
```css
html.light .bg-clip-text,
html.light [class*="bg-clip-text"] {
  -webkit-text-fill-color: #0A0A0A !important;
  background-image:        none !important;
}
```

- [ ] **Step 4: Verify no regressions**

With light mode active, do a full walkthrough:
1. `/dashboard` — main page
2. Click any subject card → subject page
3. Click any deck → pre-study page
4. Click Reports button → `/dashboard/reports`
5. Click Schedule button → `/dashboard/schedule`
6. Toggle back to dark mode — confirm everything looks normal in dark mode too

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "chore(theme): remove redundant !important CSS overrides now covered by CSS variables"
```

---

## Verification Checklist

Before considering this complete:

- [ ] Light mode toggle persists across page refreshes
- [ ] Dark mode is still the default (fresh session with no localStorage has dark mode)
- [ ] No white-on-white text anywhere in the dashboard in light mode
- [ ] No white-on-white text anywhere in the dashboard in dark mode (no regressions)
- [ ] Accent colors (violet, green, amber, cyan) unchanged in both modes
- [ ] Landing page (`/`) and login page (`/login`) are unaffected — always dark
