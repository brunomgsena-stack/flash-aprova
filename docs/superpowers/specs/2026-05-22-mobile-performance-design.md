# Design — Otimização de Performance Mobile (flashaprova.app)

**Data:** 2026-05-22
**Página alvo:** `/` (sales page) → `app/page.tsx` → `app/LandingPage.tsx` → `components/HeroSection.tsx`
**Stack:** Next.js 16, React 19, Tailwind 4, Framer Motion 12

## Objetivo

Elevar a pontuação mobile do PageSpeed de **69 → 90+** preservando 100% do design,
efeitos e branding (glows, partículas, animações de texto). Desktop já está em 97.

### Métricas mobile atuais (alvo)
- LCP: 5,1 s → **< 2,5 s**
- TBT: 310 ms → **< 200 ms**
- Speed Index: 5,5 s → menor
- CLS: 0 (manter)

## Causa raiz do LCP

O bloco do `<h1>` em `HeroSection.tsx:1493` está dentro de um
`<motion.div initial={{ opacity: 0, y: 32 }}>`. No HTML do servidor o título
nasce **invisível** e só aparece após o JS do herói (client component de ~140KB)
hidratar e rodar a animação → "render delay" de 2,64 s. Esse é o gargalo nº1.

## Mudanças

### 1. LCP — título instantâneo (maior ganho)
- **Arquivo:** `components/HeroSection.tsx` (~linha 1493)
- Remover `initial={{ opacity: 0, y: 32 }}` / `animate` do `motion.div` que envolve
  o headline. O bloco passa a renderizar visível no SSR. Pode virar `<div>` comum.
- **Preservar:** os `motion.span` com `textShadow`/glow pulsante (laranja "sumirem",
  verde "ENEM", roxo "esquecer") permanecem inalterados.
- **Risco:** baixo. Mudança isolada no wrapper de entrada.

### 2. Dividir a "cena central" do herói (reduz TBT / main-thread)
- **Arquivo:** `components/HeroSection.tsx` + novo componente
- O herói é um único `'use client'` gigante que hidrata inteiro antes de qualquer
  interação. Extrair a cena animada below-headline (terminal de IA, chat de tutores,
  `ConnectionLines` SVG, partículas/orbs, painéis) para um novo componente
  (ex.: `HeroScene.tsx`) carregado via `next/dynamic` com `ssr: false` + gatilho
  de mount/idle.
- Headline + CTA continuam no bundle inicial e hidratam imediatamente; a cena entra
  logo após (com placeholder de mesma altura para evitar CLS).
- **Preservar:** todos os efeitos visuais idênticos; apenas mudam o momento de carga.
- **Risco:** médio — é o único refactor estrutural. Validar visualmente que a cena
  aparece e que não há salto de layout (reservar `minHeight`).

### 3. Adiar Meta Pixel até interação/idle (−154KB / −297ms iniciais)
- **Arquivo:** `components/MetaPixel.tsx`
- Trocar `<Script strategy="afterInteractive">` por carregamento disparado no
  primeiro evento de interação (`scroll`, `pointerdown`, `touchstart`, `keydown`)
  com fallback via `requestIdleCallback` (timeout ~3-5s). Após carregar, executar
  `fbq('init', ...)` + `fbq('track', 'PageView')` uma única vez.
- **Seguro porque:** o CAPI server-side (`app/api/meta`) cobre a janela inicial de
  eventos. Ver [[project_meta_pixel_gating]].
- Manter o auto-gating de rotas logadas e o `<noscript>` existentes.
- **Risco:** baixo-médio. Validar que o pixel ainda dispara após interação.

### 4. Remover polyfills legados (−26KB)
- **Arquivo:** `package.json` (campo `browserslist`)
- Adicionar targets modernos para o SWC parar de transpilar `Object.hasOwn`,
  `Object.fromEntries`, `Array.prototype.at/flat/flatMap`,
  `String.prototype.trimStart/trimEnd`. Ex.: `"browserslist": ["chrome >= 111",
  "edge >= 111", "firefox >= 111", "safari >= 16.4", "ios_saf >= 16.4"]`
  (ajustar para os menos restritivos que cubram o público real).
- **Risco:** baixo. `next build` valida.

### 5. Redimensionar 2 imagens (−104KB)
- **Arquivos:** `public/images/tutor-historia.avif`, `public/images/tutor-quimica.avif`
- Atualmente 500x500, exibidas a ~20-22px (`<img>` no herói). Reduzir para ~64x64
  (2x para retina). Manter formato AVIF.
- **Risco:** baixo. Conferir que a nitidez nos avatares pequenos permanece boa.

### 6. `.cta-pulse` composta (remove warning de animação não-composta)
- **Arquivo:** `app/globals.css` (~linha 198)
- Hoje anima `box-shadow` (não-composta → repaints na main thread, 4 elementos).
  Mover o glow para um pseudo-elemento `::before` posicionado atrás do CTA e animar
  `opacity` (composta) em vez de `box-shadow`. O pulso visual deve ficar idêntico.
- **Risco:** baixo-médio. Validar visualmente que o pulso verde-neon não mudou.

### Itens menores (opcionais, baixo custo)
- **Acessibilidade (94):** adicionar landmark `<main>` na landing; revisar contraste
  apontado.
- **Best Practices (92):** investigar erros de console registrados.

## Execução — economia de tokens

Coordenação por Opus; implementação despachada:

- **Agentes Haiku** (mecânico, baixo risco): itens **1, 4, 5, 6** (+ landmark `<main>`).
- **Agentes Sonnet** (mais julgamento): itens **2** (split do herói) e **3** (pixel).
- **Opus:** revisa diffs, roda `next build`, confirma ausência de regressão de bundle.

Tarefas independentes podem rodar em paralelo, exceto itens 1 e 2 que tocam o mesmo
arquivo (`HeroSection.tsx`) — sequenciar: item 1 primeiro, depois item 2.

## Validação
- `next build` deve compilar sem erros e sem aumento de bundle inicial.
- Revisão de diff pelo usuário.
- PageSpeed rodado pelo usuário após deploy em prod (branch `main`).

## Não-objetivos (YAGNI)
- Não migrar framer-motion para `LazyMotion`/`m` em todo o projeto (refactor amplo).
- Não reescrever o CSS render-blocking do Tailwind (ganho marginal, ~380ms).
- Não tocar em rotas logadas (`/dashboard`, `/director`, etc.).
