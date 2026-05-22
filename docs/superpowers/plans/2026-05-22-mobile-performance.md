# Otimização de Performance Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar o PageSpeed mobile de 69 → 90+ na landing (`/`) sem alterar o design ou os efeitos visuais.

**Architecture:** Mudanças cirúrgicas no `HeroSection`, `MetaPixel`, `globals.css`, `package.json` e em 2 imagens. Fase 1 reúne ganhos seguros de alto ROI; Fase 2 (split do herói) é condicional ao resultado medido.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Framer Motion 12, sharp (resize de imagem).

**Verificação:** estas mudanças são de performance/visual, não unit-testáveis. A verificação de cada tarefa é `next build` limpo + inspeção visual. O PageSpeed final é rodado pelo usuário após deploy em `main`.

**Spec:** `docs/superpowers/specs/2026-05-22-mobile-performance-design.md`

---

## File Structure

- `components/HeroSection.tsx` — Tasks 1 e 6 (Fase 2)
- `components/MetaPixel.tsx` — Task 2
- `package.json` — Task 3 (campo `browserslist`)
- `public/images/tutor-historia.avif`, `public/images/tutor-quimica.avif` — Task 4
- `app/globals.css` — Task 5
- `app/LandingPage.tsx` — Task 7 (landmark `<main>`)

**Sequenciamento:** Tasks 1–7 são independentes EXCETO Task 1 e Task 6, que tocam o mesmo arquivo — fazer Task 1 antes da Task 6. Tasks 2, 3, 4, 5, 7 podem rodar em paralelo.

**Dispatch (economia de tokens):**
- **Haiku:** Tasks 1, 3, 4, 5, 7 (mecânicas)
- **Sonnet:** Tasks 2, 6 (mais julgamento)

---

# FASE 1 — Ganhos seguros (fazer todas)

## Task 1: LCP — título do herói pinta instantaneamente

**Files:**
- Modify: `components/HeroSection.tsx` (~linha 1493)

- [ ] **Step 1: Localizar o wrapper do headline**

O bloco atual (a partir da linha ~1493):

```tsx
        {/* Headline block */}
        <motion.div
          className="text-center px-4 sm:px-6 pt-0 sm:pt-14 pb-5 sm:pb-4 mx-auto"
          style={{ maxWidth: 820 }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
```

- [ ] **Step 2: Trocar por `<div>` estático (sem animação de entrada)**

```tsx
        {/* Headline block — renderiza visível no SSR (LCP) */}
        <div
          className="text-center px-4 sm:px-6 pt-0 sm:pt-14 pb-5 sm:pb-4 mx-auto"
          style={{ maxWidth: 820 }}
        >
```

E a tag de fechamento correspondente do bloco (logo após o `</h1>`, linha ~1584): trocar `</motion.div>` por `</div>`.

**IMPORTANTE:** não tocar nos `<motion.span>` internos (glows pulsantes de "esquecer", "sumirem", "ENEM") nem no `<motion.p>`/badge — só o wrapper externo do headline. Se `motion` ficar sem uso após a edição, manter o import (é usado em todo o arquivo).

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 4: Verificar visualmente**

`npm run dev`, abrir `/`. O título "Não deixe 12 meses..." deve aparecer imediatamente (sem fade-up). Glows de texto continuam pulsando.

- [ ] **Step 5: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "perf(hero): título LCP pinta no SSR sem fade-in (corrige render delay)"
```

---

## Task 2: Adiar Meta Pixel até interação/idle

**Files:**
- Modify: `components/MetaPixel.tsx`

- [ ] **Step 1: Reescrever o componente para carregar o pixel sob demanda**

Substituir o corpo do componente (mantendo o gating de rotas e `PIXEL_ID`) por uma versão que injeta o script fbevents só após a 1ª interação (`scroll`, `pointerdown`, `touchstart`, `keydown`) ou via `requestIdleCallback` (fallback timeout 4000ms). Conteúdo completo do arquivo:

```tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Prefixos de área autenticada onde o Pixel NÃO deve carregar nem rastrear. */
const EXCLUDED_PREFIXES = ['/dashboard', '/director', '/admin', '/demo-admin', '/painel'];

function isExcluded(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function loadPixel(pixelId: string) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { fbq?: unknown; _fbq?: unknown };
  if (w.fbq) return;
  /* eslint-disable */
  // @ts-ignore — código-base oficial do Meta Pixel
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  // @ts-ignore
  window.fbq('init', pixelId);
  // @ts-ignore
  window.fbq('track', 'PageView');
}

/**
 * Meta Pixel com carregamento adiado: injeta fbevents.js apenas após a
 * primeira interação do usuário (ou em idle), liberando a thread no carregamento
 * inicial. O CAPI server-side (app/api/meta) cobre a janela inicial.
 * Auto-gating: só atua em rotas públicas. No-op sem NEXT_PUBLIC_META_PIXEL_ID.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const excluded = isExcluded(pathname);
  const loadedRef = useRef(false);
  const firstRun = useRef(true);

  // Carrega o pixel sob demanda (interação ou idle)
  useEffect(() => {
    if (!PIXEL_ID || excluded || loadedRef.current) return;

    let idleId: number | undefined;
    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;

    const trigger = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      cleanup();
      loadPixel(PIXEL_ID);
    };

    const cleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, trigger));
      if (idleId !== undefined) {
        const ric = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        ric?.(idleId);
      }
    };

    events.forEach((ev) => window.addEventListener(ev, trigger, { once: true, passive: true }));

    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) {
      idleId = ric(trigger, { timeout: 4000 });
    } else {
      idleId = window.setTimeout(trigger, 4000) as unknown as number;
    }

    return cleanup;
  }, [excluded]);

  // PageView em navegações SPA subsequentes (só se já carregou)
  useEffect(() => {
    if (excluded) return;
    if (firstRun.current) { firstRun.current = false; return; }
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq !== 'function') return;
    fbq('track', 'PageView');
  }, [pathname, searchParams, excluded]);

  if (!PIXEL_ID || excluded) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sem erros de tipo/lint.

- [ ] **Step 3: Verificar comportamento**

`npm run dev`, abrir `/` deslogado (ver [[project_meta_pixel_gating]]). Antes de qualquer scroll/clique, `window.fbq` deve ser `undefined`. Após o 1º scroll/clique, `fbq` passa a existir e dispara PageView. Conferir no painel do Meta / Network que `fbevents.js` só carrega após interação.

- [ ] **Step 4: Commit**

```bash
git add components/MetaPixel.tsx
git commit -m "perf(pixel): carregar Meta Pixel sob interação/idle (CAPI cobre janela inicial)"
```

---

## Task 3: Remover polyfills legados via browserslist

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Adicionar campo `browserslist`**

Adicionar ao `package.json` (nível raiz do objeto, ex. após `"devDependencies"`):

```json
  "browserslist": [
    "chrome >= 111",
    "edge >= 111",
    "firefox >= 111",
    "safari >= 16.4",
    "ios_saf >= 16.4",
    "not dead"
  ]
```

Esses targets cobrem `Object.hasOwn`, `Object.fromEntries`, `Array.prototype.at/flat/flatMap`, `String.prototype.trimStart/trimEnd` nativamente, então o SWC para de transpilá-los.

- [ ] **Step 2: Build limpo (sem cache)**

Run: `rm -rf .next && npm run build`
Expected: compila sem erros. Bundle inicial não deve aumentar.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "perf: definir browserslist moderno (remove polyfills ES desnecessários)"
```

---

## Task 4: Redimensionar avatares AVIF (500x500 → 96x96)

**Files:**
- Modify: `public/images/tutor-historia.avif`, `public/images/tutor-quimica.avif`

Contexto: exibidas a ~20-28px no herói via `<img width=22 height=22>`. 96x96 cobre retina com folga.

- [ ] **Step 1: Backup dos originais**

```bash
mkdir -p public/images/_orig
cp public/images/tutor-historia.avif public/images/tutor-quimica.avif public/images/_orig/
```

- [ ] **Step 2: Redimensionar com sharp**

```bash
node -e "
const sharp = require('sharp');
(async () => {
  for (const f of ['tutor-historia', 'tutor-quimica']) {
    const src = 'public/images/_orig/' + f + '.avif';
    const out = 'public/images/' + f + '.avif';
    await sharp(src).resize(96, 96, { fit: 'cover' }).avif({ quality: 60 }).toFile(out + '.tmp');
    require('fs').renameSync(out + '.tmp', out);
    console.log(f, '→', require('fs').statSync(out).size, 'bytes');
  }
})();
"
```

Expected: cada arquivo cai para ~3-10KB (de ~50-60KB).

- [ ] **Step 3: Verificar visualmente e remover backup**

`npm run dev`, abrir `/`, conferir que os avatares dos tutores História/Química continuam nítidos nos círculos pequenos. Se OK:

```bash
rm -rf public/images/_orig
```

- [ ] **Step 4: Commit**

```bash
git add public/images/tutor-historia.avif public/images/tutor-quimica.avif
git commit -m "perf(img): reduzir avatares AVIF de 500x500 para 96x96 (-~100KB)"
```

---

## Task 5: `.cta-pulse` — animação composta via pseudo-elemento

**Files:**
- Modify: `app/globals.css` (~linhas 197-202)

- [ ] **Step 1: Substituir a animação de box-shadow por opacity de pseudo-elemento**

Bloco atual:

```css
/* ── Landing page CTA pulse (verde neon #00FF73) ─────────────────────────── */
@keyframes cta-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0,255,115,0.45), 0 0 60px rgba(0,255,115,0.15), 0 4px 24px rgba(0,0,0,0.50); }
  50%       { box-shadow: 0 0 44px rgba(0,255,115,0.80), 0 0 90px rgba(0,255,115,0.30), 0 4px 24px rgba(0,0,0,0.50); }
}
.cta-pulse { animation: cta-pulse 2.4s ease-in-out infinite; }
```

Substituir por (glow composto, animando apenas `opacity` de um `::before`):

```css
/* ── Landing page CTA pulse (verde neon #00FF73) — animação composta ─────── */
@keyframes cta-pulse-opacity {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
.cta-pulse {
  position: relative;
  /* sombra base estática (drop shadow do botão), não animada */
  box-shadow: 0 4px 24px rgba(0,0,0,0.50);
}
.cta-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  pointer-events: none;
  box-shadow: 0 0 44px rgba(0,255,115,0.80), 0 0 90px rgba(0,255,115,0.30);
  animation: cta-pulse-opacity 2.4s ease-in-out infinite;
  will-change: opacity;
}
```

Nota: o CTA já usa `position: relative` inline em alguns casos; `inherit` no border-radius mantém o formato. Se o elemento tiver `overflow: hidden`, o glow externo pode ser cortado — nesse caso, conferir visualmente.

- [ ] **Step 2: Verificar visualmente**

`npm run dev`, abrir `/`. O botão CTA verde-neon deve pulsar com o mesmo glow de antes (suave, 2.4s). Confirmar que o brilho não está cortado e o pulso é idêntico.

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "perf(css): cta-pulse usa opacity composta em ::before (remove animação não-composta)"
```

---

## Task 7: Landmark `<main>` na landing (acessibilidade)

**Files:**
- Modify: `app/LandingPage.tsx`

- [ ] **Step 1: Envolver o conteúdo principal num `<main>`**

Localizar o elemento raiz do return de `LandingPage` (o container que envolve `HeroSection` + as seções). Se for um `<div>` ou fragmento, trocar o wrapper externo por `<main>` (ou adicionar `<main>` envolvendo o conteúdo). Garantir que exista exatamente um `<main>` na página. Não alterar classes/estilos existentes — apenas a tag semântica.

- [ ] **Step 2: Verificar build e visual**

Run: `npm run build` → sem erros. `npm run dev` → layout idêntico.

- [ ] **Step 3: Commit**

```bash
git add app/LandingPage.tsx
git commit -m "a11y: adicionar landmark <main> na landing"
```

---

## Checkpoint Fase 1

Após Tasks 1–5 e 7: deploy em `main` e rodar PageSpeed mobile. Se ≥ 90, **parar** — Fase 2 não é necessária. Se ainda < 90 (TBT alto), seguir para Task 6.

---

# FASE 2 — Condicional (só se mobile < 90 após Fase 1)

## Task 6: Dividir a cena central do herói (reduz TBT/hidratação)

**Files:**
- Create: `components/HeroScene.tsx`
- Modify: `components/HeroSection.tsx`

Contexto: `HeroSection` é um único client component de ~1868 linhas. O headline (Task 1) já pinta no SSR. A "cena central" (a partir do comentário `{/* ── Central scene ── */}`, ~linha 1586: `ConnectionLines`, `MacBookMockup`, painéis animados, partículas) é JS pesado que pode ser carregado após o mount.

- [ ] **Step 1: Identificar o bloco da cena**

Em `HeroSection.tsx`, o bloco da cena central vai do comentário `{/* ── Central scene ── */}` (~1586) até o fim do `<div className="relative mx-auto px-4 pb-2" ...>` correspondente. Mapear quais estados/props ele consome: `termLines`, `visibleConcepts` (passados a `MacBookMockup`/`CommandCenterScreen`) e o handler de parallax do mouse.

- [ ] **Step 2: Criar `components/HeroScene.tsx`**

Mover para o novo arquivo `'use client'`: as funções auxiliares usadas SÓ pela cena (`ConnectionLines`, `MacBookMockup`, `CommandCenterScreen`, `TutoresScreen`, `AppScreen`, `RedacaoScreen`, `GlassCard`, `FloatWrapper`, `TerminalWidget`, `ConceptsWidget`, `PARTICLES`, `lcg`) e o JSX da cena. O componente recebe `termLines: string[]` e `visibleConcepts: number[]` por props. Manter parallax interno se depender de ref próprio; caso contrário, aceitar como prop. Exportar `default`.

- [ ] **Step 3: Importar a cena dinamicamente no `HeroSection`**

No topo de `HeroSection.tsx`:

```tsx
import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      style={{ minHeight: 'clamp(280px, 55vw, 540px)' }}
    />
  ),
});
```

Substituir o bloco da cena central no JSX por `<HeroScene termLines={termLines} visibleConcepts={visibleConcepts} />`. O placeholder reserva a MESMA altura (`clamp(280px, 55vw, 540px)`, igual ao `minHeight` original em ~linha 1596) para CLS = 0.

- [ ] **Step 4: Carregar a cena após o mount/idle**

Para evitar competir com a hidratação do headline, gate o render da cena com um estado que vira `true` em `requestIdleCallback`/`setTimeout(0)` após o mount:

```tsx
const [sceneReady, setSceneReady] = useState(false);
useEffect(() => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (ric) ric(() => setSceneReady(true));
  else setTimeout(() => setSceneReady(true), 200);
}, []);
```

Renderizar `{sceneReady ? <HeroScene .../> : <div aria-hidden style={{ minHeight: 'clamp(280px,55vw,540px)' }} />}`.

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: compila; o chunk do `HeroScene` aparece separado.

- [ ] **Step 6: Verificar visualmente (crítico)**

`npm run dev`, abrir `/`. Conferir: (a) headline aparece imediato; (b) a cena (terminal, chat de tutores, linhas SVG, partículas) aparece logo após sem salto de layout (CLS); (c) parallax do mouse funciona; (d) animações idênticas ao original. Comparar lado a lado com a versão anterior.

- [ ] **Step 7: Commit**

```bash
git add components/HeroSection.tsx components/HeroScene.tsx
git commit -m "perf(hero): carregar cena central via dynamic/idle (reduz TBT inicial)"
```

---

## Self-Review (cobertura do spec)

- Spec item 1 (LCP título) → Task 1 ✓
- Spec item 2 (split herói) → Task 6 (Fase 2, condicional) ✓
- Spec item 3 (Meta Pixel) → Task 2 ✓
- Spec item 4 (browserslist) → Task 3 ✓
- Spec item 5 (imagens) → Task 4 ✓
- Spec item 6 (cta-pulse) → Task 5 ✓
- Spec opcional (landmark) → Task 7 ✓
- Spec opcional (erros de console) → investigar durante verificação visual da Task 1/2; não há tarefa dedicada (depende do que aparecer no console).
