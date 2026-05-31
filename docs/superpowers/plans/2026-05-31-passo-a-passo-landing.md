# Seção "Como Funciona em 4 Passos" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma nova seção na landing page mostrando a dinâmica de uso do FlashAprova em 4 passos (Diagnóstico IA → Plano Personalizado → Revisão Diária → SRS Blinda), posicionada entre o `AuthorityBanner` e a seção de comparação de métodos.

**Architecture:** 1 componente novo auto-contido (`components/ComoFuncionaSteps.tsx`) carregado via `dynamic()` + `<LazySection>` em `app/LandingPage.tsx`. Mockups SVG inline (sem dependências externas, sem imagens). Reaproveita tokens de cor já definidos na LandingPage. Sem testes (projeto não tem suíte para componentes da landing).

**Tech Stack:** Next.js 16 (App Router, `'use client'`), React 19, Tailwind CSS (classes utilitárias inline), framer-motion (já instalado, usar `motion`, `useInView`).

**Spec de referência:** `docs/superpowers/specs/2026-05-31-passo-a-passo-landing-design.md`

**Verificação por tarefa:**
- `npx tsc --noEmit` passa sem erros novos (o projeto não tem script `typecheck`, então rodar tsc direto)
- Visual: `npm run dev` e abrir `http://localhost:3000` — a seção deve aparecer entre o banner de universidades e a seção "Ebbinghaus"
- Commit ao fim de cada tarefa

---

## File Structure

| Arquivo | Ação |
|---|---|
| `components/ComoFuncionaSteps.tsx` | **Criar** — componente novo, ~350-420 linhas, default export, `'use client'` |
| `app/LandingPage.tsx` | **Editar** — adicionar 1 `const dynamic(...)` e 1 `<LazySection>` |

Zero modificação em outros arquivos. Zero dependência nova no `package.json`.

---

### Task 1: Esqueleto do componente + integração na LandingPage

**Objetivo:** Criar o arquivo do componente com um esqueleto renderizável e integrar na LandingPage no slot correto. Ao final, a página renderiza um placeholder visível no slot certo.

**Files:**
- Create: `components/ComoFuncionaSteps.tsx`
- Modify: `app/LandingPage.tsx` (adicionar import dinâmico e `<LazySection>`)

- [ ] **Step 1.1: Criar `components/ComoFuncionaSteps.tsx` com esqueleto**

```tsx
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// ─── Tokens (copiados da LandingPage pra manter o componente auto-contido) ────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';

export default function ComoFuncionaSteps() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pt-12 sm:pt-24 pb-12 sm:pb-24">
      <div className="text-center text-white">
        [ComoFuncionaSteps placeholder]
      </div>
    </section>
  );
}
```

- [ ] **Step 1.2: Editar `app/LandingPage.tsx` — adicionar import dinâmico**

Localizar o bloco de dynamic imports (linhas 26-37) e adicionar essa linha depois de `ReelsTestimonials` (linha 37):

```tsx
const ComoFuncionaSteps  = dynamic(() => import('@/components/ComoFuncionaSteps'),  { ssr: false, loading: () => <SkeletonBlock h={720} /> });
```

- [ ] **Step 1.3: Editar `app/LandingPage.tsx` — inserir `<LazySection>` no slot**

Localizar a linha 656 (`<AuthorityBanner />`) e a linha 659 (início de `{/* ════════════════════════════ METHODS COMPARISON ══ */}`). Entre elas, inserir:

```tsx
{/* ════════════════════════ COMO FUNCIONA · 4 PASSOS ══ */}
<LazySection minHeight={720}>
  <ComoFuncionaSteps />
</LazySection>
```

- [ ] **Step 1.4: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos. (Pode haver erros pré-existentes não relacionados — confirmar que nenhum novo erro mencione `ComoFuncionaSteps` ou `LandingPage.tsx`.)

- [ ] **Step 1.5: Verificar visual**

Run: `npm run dev` em background, abrir `http://localhost:3000`. Rolar até depois do banner "+8.000 estudantes". Deve aparecer o texto `[ComoFuncionaSteps placeholder]` antes da seção do Ebbinghaus.

- [ ] **Step 1.6: Commit**

```bash
git add components/ComoFuncionaSteps.tsx app/LandingPage.tsx
git commit -m "feat(landing): esqueleto da seção Como Funciona em 4 passos"
```

---

### Task 2: Header da seção (eyebrow + headline + subtítulo)

**Objetivo:** Substituir o placeholder pelo header definitivo da seção.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 2.1: Adicionar componente local `<Neon>` + Header**

Dentro de `ComoFuncionaSteps.tsx`, antes do `export default`, adicionar:

```tsx
// ─── Neon green highlight (replica do que existe na LandingPage) ──────────────
function Neon({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2.2: Substituir o placeholder pelo header**

Substituir o conteúdo do `<section>` no `export default function` por:

```tsx
return (
  <section className="max-w-5xl mx-auto px-4 sm:px-10 pt-12 sm:pt-24 pb-12 sm:pb-24">
    {/* Header */}
    <div className="text-center mb-12 sm:mb-16">
      <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: NEON, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
        [ COMO FUNCIONA ]
      </p>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
        Do zero ao primeiro flashcard em <Neon>3 minutos</Neon>.
      </h2>
      <p className="text-slate-400 text-sm sm:text-base">
        Sem deck, sem configuração, sem mentor.
      </p>
    </div>

    {/* TODO: timeline + 4 passos (Task 3) */}
    {/* TODO: microcopy de fechamento (Task 8) */}
    {/* TODO: CTA (Task 9) */}
  </section>
);
```

- [ ] **Step 2.3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 2.4: Verificar visual**

Recarregar `http://localhost:3000`. Deve aparecer o header centralizado: eyebrow neon mono `[ COMO FUNCIONA ]`, H2 "Do zero ao primeiro flashcard em 3 minutos." (com "3 minutos" em neon brilhante), e subtítulo "Sem deck, sem configuração, sem mentor."

- [ ] **Step 2.5: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): header da seção Como Funciona"
```

---

### Task 3: Timeline vertical + 4 passos com copy completa (sem mockups ainda)

**Objetivo:** Construir a estrutura da timeline com os 4 passos contendo todo o texto (numerador, título, badge de tempo, copy, selo de fricção), com placeholder no lugar dos mockups.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 3.1: Adicionar data dos passos no topo do arquivo**

Adicionar depois das constantes de cor, antes de `function Neon`:

```tsx
// ─── Data dos 4 passos ────────────────────────────────────────────────────────
const STEPS = [
  {
    id:     '01',
    title:  'DIAGNÓSTICO IA',
    time:   '3 min',
    copy:   'Responda 12 perguntas rápidas. A IA mapeia em quais tópicos do edital você está vulnerável.',
    badge:  'SEM CADASTRO · COMEÇA NA HORA',
    color:  NEON,
  },
  {
    id:     '02',
    title:  'PLANO PERSONALIZADO',
    time:   'auto',
    copy:   'Em segundos você recebe seu mapa de lacunas e um plano focado nos 20% que valem 80% da nota.',
    badge:  'GERADO PELA IA · SEM CONFIGURAR NADA',
    color:  ORANGE,
  },
  {
    id:     '03',
    title:  'REVISÃO DIÁRIA',
    time:   '15 min/dia',
    copy:   'Todo dia o app entrega só os flashcards que você está prestes a esquecer. Responde, marca a dificuldade, pronto.',
    badge:  'SÓ O QUE IMPORTA HOJE · ZERO PLANEJAMENTO',
    color:  NEON,
  },
  {
    id:     '04',
    title:  'ALGORITMO SRS BLINDA',
    time:   'automático, 24/7',
    copy:   'Acertou fácil? Volta daqui a 7 dias. Errou? Volta amanhã. O algoritmo calcula sozinho o intervalo perfeito pra cada card.',
    badge:  'BASEADO EM EBBINGHAUS · AJUSTE CONTÍNUO',
    color:  VIOLET,
  },
] as const;
```

- [ ] **Step 3.2: Adicionar componente `<StepRow>` antes do `export default`**

```tsx
// ─── Step row (timeline + texto + mockup) ─────────────────────────────────────
function StepRow({
  step,
  index,
  isLast,
  mockup,
}: {
  step: typeof STEPS[number];
  index: number;
  isLast: boolean;
  mockup: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4 sm:gap-6 pb-10 sm:pb-14">
      {/* Coluna da timeline (número + linha vertical) */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-black tabular-nums"
          style={{
            background:   'rgba(9,9,11,0.92)',
            border:       `1px solid ${step.color}45`,
            color:        step.color,
            fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
            fontSize:     '0.95rem',
            boxShadow:    `0 0 20px ${step.color}25`,
          }}
        >
          [{step.id}]
        </div>
        {!isLast && (
          <div
            className="flex-1 w-px mt-2"
            style={{
              background: `linear-gradient(180deg, ${step.color}60, ${STEPS[index + 1]?.color ?? NEON}30)`,
            }}
          />
        )}
      </div>

      {/* Coluna de conteúdo: texto + mockup */}
      <div className="flex-1 grid sm:grid-cols-2 gap-6 sm:gap-10 items-start">
        {/* Mockup vem primeiro em mobile (ordem visual), à direita em desktop */}
        <div className="order-1 sm:order-2 flex justify-center sm:justify-start">
          {mockup}
        </div>

        {/* Texto */}
        <div className="order-2 sm:order-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">
              {step.title}
            </h3>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded"
              style={{
                background:   `${step.color}15`,
                border:       `1px solid ${step.color}40`,
                color:        step.color,
                fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {step.time}
            </span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            {step.copy}
          </p>
          <p
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{
              fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
              color:        'rgba(255,255,255,0.45)',
            }}
          >
            › {step.badge}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.3: Renderizar os 4 passos no `export default`**

Substituir o comentário `{/* TODO: timeline + 4 passos (Task 3) */}` por:

```tsx
{/* Timeline com 4 passos */}
<div className="relative mb-12">
  {STEPS.map((step, i) => (
    <StepRow
      key={step.id}
      step={step}
      index={i}
      isLast={i === STEPS.length - 1}
      mockup={
        <div
          className="w-full max-w-[280px] h-[180px] rounded-2xl flex items-center justify-center text-xs text-slate-500"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
        >
          [mockup {step.id}]
        </div>
      }
    />
  ))}
</div>
```

- [ ] **Step 3.4: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 3.5: Verificar visual**

Recarregar a página. Deve aparecer:
- Os 4 passos empilhados verticalmente
- Cada um com numerador `[01]` `[02]` `[03]` `[04]` em mono, com glow
- Linha vertical conectando os números (gradiente entre as cores de cada passo)
- À direita do texto (desktop) ou acima (mobile), um placeholder cinza tracejado
- Título uppercase + badge de tempo colorida + copy + selo de fricção com `›` prefix

Testar mobile redimensionando o navegador < 640px: mockup placeholder deve ir acima do texto.

- [ ] **Step 3.6: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): timeline vertical + estrutura dos 4 passos"
```

---

### Task 4: Mockup do Passo 01 — Quiz Card (Diagnóstico IA)

**Objetivo:** Substituir o placeholder do passo 01 por um mockup SVG/HTML de um card de quiz com pergunta de Física, 4 chips de alternativa (1 selecionado em neon) e barra de progresso `4/12`.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 4.1: Adicionar componente `<QuizMockup>` antes do `export default`**

```tsx
// ─── Mockup 01: Quiz Card ─────────────────────────────────────────────────────
function QuizMockup() {
  const alts = ['9.8 m/s²', '5.0 m/s²', '10 m/s²', '3.2 m/s²'];
  const selected = 0;

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${NEON}10`,
      }}
    >
      {/* shimmer top */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }}
      />

      {/* Subject tag */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ background: `${ORANGE}15`, border: `1px solid ${ORANGE}40`, color: ORANGE, fontFamily: "'JetBrains Mono', monospace" }}
        >
          FÍSICA · CINEMÁTICA
        </span>
        <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          04 / 12
        </span>
      </div>

      {/* Question */}
      <p className="text-white text-xs leading-snug mb-3 font-medium">
        Qual a aceleração da gravidade na superfície da Terra (g)?
      </p>

      {/* Chips */}
      <div className="flex flex-col gap-1.5 mb-3">
        {alts.map((alt, i) => {
          const isSel = i === selected;
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
              style={{
                background:  isSel ? `${NEON}12` : 'rgba(255,255,255,0.03)',
                border:      `1px solid ${isSel ? `${NEON}50` : 'rgba(255,255,255,0.07)'}`,
                color:       isSel ? '#fff' : '#94a3b8',
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background:  isSel ? NEON : 'rgba(255,255,255,0.06)',
                  color:       isSel ? '#000' : '#64748b',
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span>{alt}</span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width:      `${(4 / 12) * 100}%`,
            background: `linear-gradient(90deg, ${NEON}, #00cc5a)`,
            boxShadow:  `0 0 8px ${NEON}80`,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Substituir o placeholder do passo 01**

No `STEPS.map(...)`, trocar o `mockup={...}` para usar `<QuizMockup />` quando `step.id === '01'`:

```tsx
mockup={
  step.id === '01' ? <QuizMockup /> :
  <div
    className="w-full max-w-[280px] h-[180px] rounded-2xl flex items-center justify-center text-xs text-slate-500"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
  >
    [mockup {step.id}]
  </div>
}
```

- [ ] **Step 4.3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 4.4: Verificar visual**

Passo 01 deve mostrar um card de quiz com:
- Tag `FÍSICA · CINEMÁTICA` em laranja, contador `04 / 12` à direita
- Pergunta sobre aceleração da gravidade
- 4 chips de alternativa, primeiro (`A · 9.8 m/s²`) destacado em neon
- Barra de progresso preenchida ~33% em neon com glow

- [ ] **Step 4.5: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): mockup do passo 01 (quiz IA)"
```

---

### Task 5: Mockup do Passo 02 — Mini-Radar de Lacunas

**Objetivo:** Mockup do radar mostrando 6 eixos das matérias do ENEM, com 2 eixos pulsando em laranja indicando "lacunas críticas". Tag flutuante `3 lacunas críticas`.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 5.1: Adicionar componente `<RadarLacunasMockup>` antes do `export default`**

```tsx
// ─── Mockup 02: Mini-Radar com lacunas ────────────────────────────────────────
function RadarLacunasMockup() {
  const cx = 100, cy = 100, R = 70;
  const angles = [-90, -30, 30, 90, 150, 210].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) =>
    `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  // Lacunas críticas: índices 1 e 4 (em laranja, pulsando)
  const dataR = [0.78, 0.32, 0.65, 0.85, 0.28, 0.72].map(p => p * R);
  const labels = ['Bio', 'Quím', 'Fís', 'Hist', 'Geo', 'Mat'];
  const isLacuna = [false, true, false, false, true, false];

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${ORANGE}10`,
      }}
    >
      {/* shimmer top */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}50, transparent)` }}
      />

      {/* Tag flutuante */}
      <div
        className="absolute top-3 right-3 z-10 px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase"
        style={{
          background:  `${ORANGE}15`,
          border:      `1px solid ${ORANGE}50`,
          color:       ORANGE,
          fontFamily:  "'JetBrains Mono', monospace",
        }}
      >
        3 LACUNAS
      </div>

      <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: NEON, fontFamily: "'JetBrains Mono', monospace" }}>
        RADAR · MAPA DE FRAGILIDADES
      </p>

      <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 180 }}>
        {/* anéis */}
        {[0.25, 0.50, 0.75, 1.0].map((pct) => (
          <polygon key={pct}
            points={angles.map((_, i) => pt(pct * R, i)).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {/* raios */}
        {angles.map((_, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {/* polygon do data */}
        <polygon
          points={dataR.map((r, i) => pt(r, i)).join(' ')}
          fill={`${NEON}22`} stroke={NEON} strokeWidth="1.5"
        />
        {/* pontos */}
        {dataR.map((r, i) => (
          <g key={i}>
            <circle
              cx={cx + r * Math.cos(angles[i])}
              cy={cy + r * Math.sin(angles[i])}
              r={isLacuna[i] ? 5 : 3}
              fill={isLacuna[i] ? ORANGE : NEON}
            />
            {isLacuna[i] && (
              <circle
                cx={cx + r * Math.cos(angles[i])}
                cy={cy + r * Math.sin(angles[i])}
                r="9"
                fill="none"
                stroke={ORANGE}
                strokeWidth="1"
                opacity="0.5"
              >
                <animate attributeName="r" values="5;12;5" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}
        {/* labels */}
        {angles.map((_, i) => {
          const lx = cx + (R + 14) * Math.cos(angles[i]);
          const ly = cy + (R + 14) * Math.sin(angles[i]);
          return (
            <text key={i} x={lx} y={ly + 3} textAnchor="middle"
              fill={isLacuna[i] ? ORANGE : 'rgba(255,255,255,0.6)'}
              fontSize="9" fontWeight="700" fontFamily="Inter,system-ui">
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 5.2: Adicionar `<RadarLacunasMockup />` ao mapeamento**

Atualizar o `mockup={...}` no `STEPS.map(...)`:

```tsx
mockup={
  step.id === '01' ? <QuizMockup /> :
  step.id === '02' ? <RadarLacunasMockup /> :
  <div
    className="w-full max-w-[280px] h-[180px] rounded-2xl flex items-center justify-center text-xs text-slate-500"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
  >
    [mockup {step.id}]
  </div>
}
```

- [ ] **Step 5.3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 5.4: Verificar visual**

Passo 02 deve mostrar um radar com 6 eixos (Bio, Quím, Fís, Hist, Geo, Mat). Dois pontos (Quím e Geo) devem estar em laranja, com anel pulsante ao redor. Tag `3 LACUNAS` no canto superior direito.

- [ ] **Step 5.5: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): mockup do passo 02 (radar de lacunas)"
```

---

### Task 6: Mockup do Passo 03 — Flashcard com botões de dificuldade

**Objetivo:** Mockup de um flashcard mostrando frente (pergunta) e o início do verso (resposta + 3 botões de dificuldade).

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 6.1: Adicionar componente `<FlashcardMockup>` antes do `export default`**

```tsx
// ─── Mockup 03: Flashcard com botões de dificuldade ───────────────────────────
function FlashcardMockup() {
  return (
    <div className="w-full max-w-[280px] relative">
      {/* Card "atrás" (sombra/profundidade) */}
      <div
        className="absolute inset-x-3 top-3 bottom-0 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border:     '1px solid rgba(255,255,255,0.05)',
          transform:  'translateY(8px) scale(0.96)',
        }}
      />

      {/* Card da frente */}
      <div
        className="relative rounded-2xl p-4"
        style={{
          background:    'rgba(9,9,11,0.95)',
          border:        '1px solid rgba(255,255,255,0.1)',
          boxShadow:     `0 0 32px ${NEON}12`,
        }}
      >
        {/* shimmer top */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}60, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: `${NEON}12`, border: `1px solid ${NEON}40`, color: NEON, fontFamily: "'JetBrains Mono', monospace" }}
          >
            BIOLOGIA · CITOLOGIA
          </span>
          <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            #1247
          </span>
        </div>

        {/* Pergunta */}
        <p className="text-white text-xs leading-snug mb-3 font-medium">
          Qual organela é responsável pela produção de ATP na célula?
        </p>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Resposta */}
        <p className="text-slate-400 text-[11px] leading-snug mb-3 italic">
          Mitocôndria — realiza a respiração celular oxidativa.
        </p>

        {/* Botões de dificuldade */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Difícil', color: ORANGE, sub: '< 1d' },
            { label: 'Bom',     color: NEON,   sub: '3d'   },
            { label: 'Fácil',   color: NEON,   sub: '7d'   },
          ].map((btn, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{
                background: `${btn.color}10`,
                border:     `1px solid ${btn.color}30`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
              <span className="text-[8px]" style={{ color: `${btn.color}99`, fontFamily: "'JetBrains Mono', monospace" }}>
                {btn.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-[9px] text-slate-600 text-center mt-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ≈ 30s por card
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Adicionar `<FlashcardMockup />` ao mapeamento**

Atualizar o `mockup={...}` no `STEPS.map(...)`:

```tsx
mockup={
  step.id === '01' ? <QuizMockup /> :
  step.id === '02' ? <RadarLacunasMockup /> :
  step.id === '03' ? <FlashcardMockup /> :
  <div
    className="w-full max-w-[280px] h-[180px] rounded-2xl flex items-center justify-center text-xs text-slate-500"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
  >
    [mockup {step.id}]
  </div>
}
```

- [ ] **Step 6.3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 6.4: Verificar visual**

Passo 03 deve mostrar um flashcard com:
- Tag `BIOLOGIA · CITOLOGIA` em neon, código `#1247` à direita
- Pergunta sobre organela / ATP
- Resposta em itálico cinza ("Mitocôndria — realiza...")
- 3 botões: `Difícil` laranja, `Bom` neon, `Fácil` neon — com intervalo `< 1d` / `3d` / `7d` embaixo de cada
- Footnote `≈ 30s por card`
- Sombra atrás indicando "pilha de cards"

- [ ] **Step 6.5: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): mockup do passo 03 (flashcard SRS)"
```

---

### Task 7: Mockup do Passo 04 — Heatmap + timeline de intervalos

**Objetivo:** Mockup com mini-heatmap (grid de células com algumas em neon brilhante) + uma linha de timeline embaixo mostrando intervalos crescentes de revisão `1d → 3d → 7d → 18d`.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 7.1: Adicionar componente `<SRSIntervalMockup>` antes do `export default`**

```tsx
// ─── Mockup 04: Heatmap + timeline de intervalos ──────────────────────────────
function SRSIntervalMockup() {
  // Grid 7 dias x 6 semanas
  const grid = [
    [0,0,2,3,5,0,1],
    [0,4,5,2,0,3,1],
    [2,0,3,5,4,1,0],
    [0,1,5,3,2,0,4],
    [3,2,0,4,5,1,0],
    [0,5,3,1,0,4,2],
  ];
  const HEAT_ALPHA = [0.05, 0.20, 0.40, 0.65, 0.85, 1.0];

  const intervals = ['1d', '3d', '7d', '18d'];

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${VIOLET}10`,
      }}
    >
      {/* shimmer top */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}50, transparent)` }}
      />

      <p className="text-[9px] font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET, fontFamily: "'JetBrains Mono', monospace" }}>
        AGENDA NEURAL · ALGORITMO SRS
      </p>

      {/* Heatmap */}
      <div className="flex justify-center mb-4" style={{ gap: 3 }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((v, di) => (
              <div
                key={di}
                style={{
                  width:       12,
                  height:      12,
                  borderRadius: 2,
                  background:  v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(0,255,115,${HEAT_ALPHA[v]})`,
                  boxShadow:   v >= 4 ? `0 0 6px rgba(0,255,115,0.6)` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Timeline de intervalos */}
      <div className="pt-3" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
        <p className="text-[9px] mb-2 text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          CARD #A · PRÓXIMAS REVISÕES
        </p>
        <div className="flex items-center justify-between">
          {intervals.map((iv, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: NEON,
                    opacity:    0.4 + i * 0.2,
                    boxShadow:  i === intervals.length - 1 ? `0 0 6px ${NEON}` : 'none',
                  }}
                />
                <span
                  className="text-[10px] font-bold mt-1"
                  style={{ color: NEON, opacity: 0.6 + i * 0.13, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {iv}
                </span>
              </div>
              {i < intervals.length - 1 && (
                <div className="flex-1 h-px mx-1 mb-3" style={{ background: `linear-gradient(90deg, ${NEON}40, ${NEON}60)`, minWidth: 18 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Substituir o fallback do mockup**

Atualizar o `mockup={...}` no `STEPS.map(...)` (remover o placeholder completamente, pois agora todos os 4 têm mockup):

```tsx
mockup={
  step.id === '01' ? <QuizMockup /> :
  step.id === '02' ? <RadarLacunasMockup /> :
  step.id === '03' ? <FlashcardMockup /> :
  <SRSIntervalMockup />
}
```

- [ ] **Step 7.3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 7.4: Verificar visual**

Passo 04 deve mostrar:
- Header `AGENDA NEURAL · ALGORITMO SRS` em violeta
- Heatmap grid 6×7 de células, várias preenchidas em neon (algumas com glow)
- Linha divisória dashed
- Texto `CARD #A · PRÓXIMAS REVISÕES`
- Timeline horizontal com 4 pontos crescentes `1d → 3d → 7d → 18d`, último ponto com glow

- [ ] **Step 7.5: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): mockup do passo 04 (SRS + intervalos)"
```

---

### Task 8: Microcopy de fechamento ("15 minutos · menos que rolar o feed")

**Objetivo:** Adicionar o bloco de fechamento entre os passos e o CTA.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 8.1: Substituir o comentário `{/* TODO: microcopy de fechamento (Task 8) */}`**

```tsx
{/* Microcopy de fechamento */}
<div className="flex justify-center mb-10">
  <div
    className="max-w-md w-full text-center rounded-2xl py-6 px-8"
    style={{
      background: 'rgba(0,255,115,0.03)',
      border:     '1px dashed rgba(255,255,255,0.08)',
    }}
  >
    <p className="text-sm text-slate-400 mb-1">
      Tempo total/dia depois do diagnóstico:
    </p>
    <p
      className="text-4xl font-black mb-2 leading-none"
      style={{ color: NEON, textShadow: `0 0 24px ${NEON}80, 0 0 48px ${NEON}40` }}
    >
      15 minutos
    </p>
    <p
      className="text-[10px] tracking-widest uppercase"
      style={{ color: `${NEON}80`, opacity: 0.55, fontFamily: "'JetBrains Mono', monospace" }}
    >
      [ menos que rolar o feed do Instagram ]
    </p>
  </div>
</div>
```

- [ ] **Step 8.2: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 8.3: Verificar visual**

Logo depois dos 4 passos deve aparecer um card centralizado com fundo verde sutil, texto "Tempo total/dia depois do diagnóstico:", "15 minutos" em neon grande com glow, e a frase mono em opacidade baixa "[ menos que rolar o feed do Instagram ]".

- [ ] **Step 8.4: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): microcopy de fechamento da seção"
```

---

### Task 9: CTA + microcopy de fricções zeradas

**Objetivo:** Adicionar o botão de CTA final e a microcopy abaixo.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 9.1: Adicionar componente `<CTAButton>` local antes do `export default`**

```tsx
// ─── CTA (replica do que existe na LandingPage, mantém componente auto-contido)
import Link from 'next/link';

function CTAButton({ label = 'GERAR MEU DIAGNÓSTICO IA' }: { label?: string }) {
  return (
    <Link
      href="/quizz"
      className="cta-pulse relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-2xl font-black text-black overflow-hidden whitespace-nowrap transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] px-8 py-5 text-lg"
      style={{
        background:    `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
        letterSpacing: '-0.01em',
        boxShadow:     `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
          animation:  'shimmer 2.4s infinite',
        }}
      />
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="relative">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
      <span className="relative">{label}</span>
    </Link>
  );
}
```

> **Nota:** o `import Link from 'next/link'` deve ir junto com o `import { motion, useInView } from 'framer-motion'` no topo do arquivo, não dentro do meio do código. Mover para o topo.

- [ ] **Step 9.2: Mover o `import Link` para o topo**

Garantir que os imports no topo do arquivo fiquem:

```tsx
'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
```

- [ ] **Step 9.3: Substituir o comentário `{/* TODO: CTA (Task 9) */}`**

```tsx
{/* CTA final */}
<div className="flex flex-col items-center">
  <CTAButton />
  <p
    className="text-center text-xs mt-3"
    style={{ color: 'rgba(255,255,255,0.35)' }}
  >
    3 min · sem cadastro · sem cartão
  </p>
</div>
```

- [ ] **Step 9.4: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 9.5: Verificar visual**

Abaixo do bloco "15 minutos" deve aparecer o botão CTA neon grande "GERAR MEU DIAGNÓSTICO IA" com shimmer animado, e abaixo a microcopy `3 min · sem cadastro · sem cartão` em cinza claro.

- [ ] **Step 9.6: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): CTA final da seção Como Funciona"
```

---

### Task 10: Animações — stagger entry dos passos

**Objetivo:** Adicionar fade + slide-up com `framer-motion` quando cada passo entra no viewport, com stagger de 120ms entre eles.

**Files:**
- Modify: `components/ComoFuncionaSteps.tsx`

- [ ] **Step 10.1: Wrappar o `StepRow` em `motion.div`**

Modificar o componente `StepRow` para adicionar `useRef` + `useInView` + `motion.div`:

```tsx
function StepRow({
  step,
  index,
  isLast,
  mockup,
}: {
  step: typeof STEPS[number];
  index: number;
  isLast: boolean;
  mockup: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative flex gap-4 sm:gap-6 pb-10 sm:pb-14"
    >
      {/* (resto do conteúdo do StepRow permanece igual) */}
      {/* Coluna da timeline (número + linha vertical) */}
      <div className="relative flex flex-col items-center shrink-0">
        {/* ... idêntico ao Task 3 ... */}
      </div>

      <div className="flex-1 grid sm:grid-cols-2 gap-6 sm:gap-10 items-start">
        {/* ... idêntico ao Task 3 ... */}
      </div>
    </motion.div>
  );
}
```

> **Importante:** preservar **todo** o conteúdo interno do `StepRow` que já existia (coluna da timeline, coluna de conteúdo com mockup + texto). Apenas trocar o `<div className="relative flex...">` por `<motion.div ref={ref} initial=... animate=... transition=... className="relative flex...">`.

- [ ] **Step 10.2: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 10.3: Verificar visual**

Recarregar a página, rolar de cima da seção. Cada passo deve aparecer com fade + slide-up sutil, um após o outro com pequeno delay (120ms entre eles). A animação dispara **uma vez só** (não repete ao scrollar de volta).

- [ ] **Step 10.4: Commit**

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "feat(landing): stagger entry animation nos 4 passos"
```

---

### Task 11: QA responsivo final + commit de fechamento

**Objetivo:** Testar visualmente em mobile, desktop e mid-size. Confirmar que todos os critérios de aceitação do spec estão cumpridos.

**Files:** nenhum arquivo modificado (a menos que o QA revele ajustes necessários).

- [ ] **Step 11.1: Verificar TypeScript final**

Run: `npx tsc --noEmit`
Expected: Sem erros novos.

- [ ] **Step 11.2: Verificar build de produção**

Run: `npm run build`
Expected: Build completa sem erros. (Warnings de unused vars podem ser ignorados; erros de compilação não.)

- [ ] **Step 11.3: Checklist visual (com `npm run dev`)**

Abrir `http://localhost:3000` e validar:

**Desktop (≥ 1024px):**
- [ ] Seção aparece entre o banner "+8.000 estudantes" e a seção do Ebbinghaus
- [ ] Header centralizado com eyebrow `[ COMO FUNCIONA ]` em neon mono
- [ ] H2: "Do zero ao primeiro flashcard em 3 minutos." com "3 minutos" em verde com glow
- [ ] Subtítulo: "Sem deck, sem configuração, sem mentor."
- [ ] 4 passos empilhados verticalmente
- [ ] Cada passo: numerador `[NN]` à esquerda, texto + mockup à direita (2 colunas)
- [ ] Linha vertical conectando os 4 números
- [ ] Mockups: Quiz IA, Radar com lacunas pulsando, Flashcard, Heatmap + intervalos
- [ ] Selo de fricção mono em cada passo com prefixo `›`
- [ ] Bloco "15 minutos" centralizado com glow
- [ ] CTA neon grande + microcopy `3 min · sem cadastro · sem cartão`
- [ ] Animação de stagger ao rolar dentro da seção

**Mobile (< 640px, redimensionar o navegador ou DevTools):**
- [ ] Em cada passo, o mockup aparece **acima** do texto (não ao lado)
- [ ] Header centralizado e legível
- [ ] Botões e tags não quebram layout
- [ ] CTA ocupa largura total

- [ ] **Step 11.4: Se houver bugs visuais, corrigir e commitar como tarefa de fix**

Se algum item do checklist falhou, fazer o ajuste mínimo necessário no `components/ComoFuncionaSteps.tsx` e commitar:

```bash
git add components/ComoFuncionaSteps.tsx
git commit -m "fix(landing): ajustes visuais do QA da seção Como Funciona"
```

Se passou tudo, nada a commitar.

---

## Resumo da entrega

Ao final das 11 tarefas:

- **1 arquivo novo:** `components/ComoFuncionaSteps.tsx` (~350-420 linhas, auto-contido)
- **1 arquivo editado:** `app/LandingPage.tsx` (+4 linhas: import + LazySection)
- **10-11 commits atômicos** (1 por tarefa, mais um eventual de fix)
- **Zero dependência nova** no `package.json`
- **Zero modificação** em outros componentes
- **Zero teste novo** (projeto não tem suíte para landing components)
