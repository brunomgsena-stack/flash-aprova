# Task 2: DemoStudentDashboard — Plano de Implementação para Sonnet

> **Modelo:** Sonnet 4.6. Este plano contém TODO o código necessário — basta copiar, adaptar e commitar.

**Objetivo:** Criar `components/DemoStudentDashboard.tsx` — réplica visual standalone do dashboard do aluno, parameterizada por branding da escola (logo, cor, nome do tutor).

**Regra absoluta:** ZERO imports de `StudentDashboard.tsx`, `DashboardContext`, `UserMenu`, `StreakBadge`, ou qualquer outro componente B2C do `/dashboard`. Este componente é 100% isolado.

---

## Contexto Visual

O StudentDashboard real (788 linhas) tem estas seções visuais na ordem:

1. **Header** — Logo ⚡FlashAprova + StreakBadge + UserMenu
2. **Greeting** — "Sinta-se em casa, [nome]."
3. **Status line** — dot colorido + "Meta de hoje batida!" etc
4. **Copilot Card** (card principal com glass morphism):
   - Label "💡 Seu Copiloto" + badge "[SISTEMA OPERANDO]"
   - DailyProgressBar (barra de progresso META DIÁRIA)
   - Avatar do tutor + bubble com mensagem empática
   - StatPills (% EDITAL DOMINADO, DIAS EM SEQUÊNCIA)
   - 4 AreaFocusCards (Humanas, Natureza, Linguagens, Matemática)
   - 2 botões: "📊 Relatório de Progresso" + "🗓️ Cronograma IA"
5. **Charts Row** — Radar ENEM + Retenção (area chart)
6. **Subject Cards** — matérias agrupadas por área

---

## Props do Componente

```typescript
type DemoStudentDashboardProps = {
  schoolName: string;        // ex: "Colégio Elite"
  schoolLogo?: string;       // URL da logo
  primaryColor: string;      // hex ex: "#1E40AF"
  tutorName: string;         // ex: "Elite AI"
};
```

**Regra de cores:** O componente recebe `primaryColor` e deriva todas as outras cores a partir dele:
- `PRIMARY` = props.primaryColor (substitui EMERALD em todos os lugares)
- `FOCUS` = '#0EA5E9' (mantém fixo — é informacional)
- `AMBER` = '#F59E0B' (mantém fixo — atenção suave)

---

## Arquivo: `components/DemoStudentDashboard.tsx`

### Estrutura geral

```
'use client';

imports: useState, Image, recharts (RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip)

// Props type
// Mock data constants
// Sub-components: DemoLogo, DemoProgressBar, DemoStatPill, DemoAreaCard, DemoRadarChart, DemoSubjectCard
// Main component: export default function DemoStudentDashboard(props)
```

### Mock Data (hardcoded no arquivo)

```typescript
const MOCK_STUDENT_NAME = 'Maria Clara';
const MOCK_STREAK = 12;
const MOCK_DAILY_GOAL = 50;
const MOCK_CARDS_DONE = 38;
const MOCK_MATURE_PCT = 42;

const MOCK_AREA_SCORES: Record<string, { score: number; cardsDue: number }> = {
  Humanas:    { score: 51, cardsDue: 14 },
  Natureza:   { score: 68, cardsDue: 8 },
  Linguagens: { score: 73, cardsDue: 22 },
  Matemática: { score: 45, cardsDue: 6 },
};

const MOCK_RADAR_DATA = [
  { area: 'Natureza',   mastery: 68, fullMark: 100 },
  { area: 'Humanas',    mastery: 51, fullMark: 100 },
  { area: 'Linguagens', mastery: 73, fullMark: 100 },
  { area: 'Matemática', mastery: 45, fullMark: 100 },
];

const MOCK_SUBJECTS = [
  { id: '1', title: 'Biologia',    icon: '🧬', category: 'Natureza',   progress: 72 },
  { id: '2', title: 'Química',     icon: '🧪', category: 'Natureza',   progress: 58 },
  { id: '3', title: 'Física',      icon: '⚡', category: 'Natureza',   progress: 65 },
  { id: '4', title: 'História',    icon: '🏛️', category: 'Humanas',    progress: 48 },
  { id: '5', title: 'Geografia',   icon: '🌍', category: 'Humanas',    progress: 55 },
  { id: '6', title: 'Português',   icon: '📚', category: 'Linguagens', progress: 78 },
  { id: '7', title: 'Literatura',  icon: '📖', category: 'Linguagens', progress: 70 },
  { id: '8', title: 'Inglês',      icon: '🌐', category: 'Linguagens', progress: 62 },
  { id: '9', title: 'Matemática',  icon: '📐', category: 'Matemática', progress: 45 },
  { id: '10', title: 'Redação',    icon: '✒️', category: 'Redação',    progress: 60 },
];

const AREA_CONFIG = [
  { key: 'Humanas',    icon: '🏛️', label: 'Humanas' },
  { key: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza' },
  { key: 'Linguagens', icon: '📚', label: 'Linguagens' },
  { key: 'Matemática', icon: '📐', label: 'Matemática' },
];
```

---

### Sub-componente 1: DemoLogo

Substitui `FlashAprovaLogo`. Quando `schoolLogo` existe, mostra a imagem; senão, mostra o nome da escola estilizado.

```tsx
function DemoLogo({ schoolName, schoolLogo, primaryColor }: { schoolName: string; schoolLogo?: string; primaryColor: string }) {
  const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
  if (schoolLogo) {
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={schoolLogo} alt={schoolName} className="h-6 w-6 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
        <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em', color: primaryColor }}>
          {schoolName}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1" style={{ lineHeight: 1 }}>
      <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em', color: primaryColor }}>
        {schoolName}
      </span>
    </div>
  );
}
```

---

### Sub-componente 2: DemoProgressBar

Cópia exata da `DailyProgressBar` do original, mas usa `primaryColor` ao invés de EMERALD/FOCUS.

```tsx
function DemoProgressBar({ done, goal, primaryColor }: { done: number; goal: number; primaryColor: string }) {
  const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
  const FOCUS = '#0EA5E9';
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const done_ = Math.min(done, goal);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.10em' }}>
          META DIÁRIA
        </span>
        <span className="font-black tabular-nums" style={{ fontFamily: MONO, fontSize: '11px', color: pct >= 100 ? primaryColor : FOCUS }}>
          {done_}<span style={{ color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}> / {goal}</span>
          {pct >= 100 && ' 🎉'}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? `linear-gradient(90deg, ${primaryColor}, ${primaryColor}CC)`
              : `linear-gradient(90deg, ${FOCUS}, ${primaryColor})`,
            boxShadow: pct > 0 ? `0 0 8px ${pct >= 100 ? primaryColor : FOCUS}55` : 'none',
          }}
        />
      </div>
      {pct > 0 && pct < 100 && (
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Faltam {goal - done_} cards · ~{Math.max(1, Math.round((goal - done_) / 10))} min
        </p>
      )}
    </div>
  );
}
```

---

### Sub-componente 3: DemoStatPill

Idêntico ao `StatPill` original.

```tsx
function DemoStatPill({ value, label, color }: { value: string; label: string; color: string }) {
  const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-0.5"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, minWidth: 62, fontFamily: MONO }}
    >
      <span className="text-lg font-black tabular-nums leading-none" style={{ color }}>{value}</span>
      <span
        className="text-center leading-tight uppercase"
        style={{ fontSize: '7px', color: 'rgba(255,255,255,0.28)', whiteSpace: 'pre-line', letterSpacing: '0.08em' }}
      >
        {label}
      </span>
    </div>
  );
}
```

---

### Sub-componente 4: DemoAreaCard

Versão simplificada do `AreaFocusCard`. Sem onClick, sem router, sem isPro — puramente visual.

```tsx
function DemoAreaCard({ icon, label, cardsDue, score, isStrength, isNext, primaryColor }: {
  icon: string; label: string; cardsDue: number; score: number;
  isStrength: boolean; isNext: boolean; primaryColor: string;
}) {
  const FOCUS = '#0EA5E9';
  const AMBER = '#F59E0B';
  const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
  const color = isStrength ? primaryColor : isNext ? AMBER : FOCUS;
  const badge = isStrength ? '⭐ Ponto Forte' : isNext ? '💡 Destaque de Aprendizado' : null;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3.5 text-left"
      style={{
        background: `${color}0A`,
        border: `1px solid ${color}${isStrength || isNext ? '40' : '22'}`,
        boxShadow: isStrength || isNext ? `0 0 16px ${color}12` : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-bold text-white leading-tight truncate">{label}</span>
        <span className="ml-auto text-xs opacity-40">▶</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {cardsDue > 0 ? `${cardsDue} cards` : 'Em dia ✓'}
        </span>
        {score > 0 && (
          <span
            className="font-bold tabular-nums rounded-full px-2 py-0.5"
            style={{ fontFamily: MONO, fontSize: '10px', background: `${color}18`, color }}
          >
            {score}%
          </span>
        )}
      </div>
      {badge && (
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 self-start"
          style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
```

---

### Sub-componente 5: DemoRadarChart

Radar ENEM simplificado usando recharts (já no projeto). Usa a mesma paleta de cores por área do MasteryRadarChart.

```tsx
function DemoRadarChart({ data, primaryColor }: { data: { area: string; mastery: number; fullMark: number }[]; primaryColor: string }) {
  return (
    <div
      className="rounded-2xl p-5 overflow-hidden"
      style={{ background: 'var(--fa-card)', border: '1px solid var(--fa-border)', boxShadow: 'var(--fa-shadow)' }}
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
        RADAR ENEM
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <Radar
            dataKey="mastery"
            stroke={primaryColor}
            fill={primaryColor}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

### Sub-componente 6: DemoSubjectCard

Card simples de matéria com progress bar.

```tsx
function DemoSubjectCard({ title, icon, progress, primaryColor }: { title: string; icon: string; progress: number; primaryColor: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ background: 'var(--fa-card)', border: '1px solid var(--fa-border)' }}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: primaryColor, boxShadow: `0 0 6px ${primaryColor}40` }}
          />
        </div>
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: primaryColor }}>{progress}%</span>
    </div>
  );
}
```

---

### Componente Principal: DemoStudentDashboard

Monta tudo na mesma ordem visual do StudentDashboard real. Seções:

```tsx
export default function DemoStudentDashboard({ schoolName, schoolLogo, primaryColor, tutorName }: DemoStudentDashboardProps) {
  const FOCUS = '#0EA5E9';
  const AMBER = '#F59E0B';
  const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';

  // Determinar top/next area
  const topArea = 'Linguagens';    // score 73 (mais alto)
  const nextArea = 'Matemática';   // score 45 (mais baixo)

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">

        {/* ═══ 1. Header ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <DemoLogo schoolName={schoolName} schoolLogo={schoolLogo} primaryColor={primaryColor} />
            <div className="flex items-center gap-3">
              {/* Mock StreakBadge */}
              <div className="flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{ background: `${AMBER}15`, border: `1px solid ${AMBER}30` }}>
                <span className="text-xs">🔥</span>
                <span className="text-xs font-bold" style={{ color: AMBER }}>{MOCK_STREAK}</span>
              </div>
              {/* Mock avatar */}
              <div className="w-8 h-8 rounded-full" style={{ background: `${primaryColor}30`, border: `1px solid ${primaryColor}40` }} />
            </div>
          </div>

          {/* ═══ 2. Greeting ═══ */}
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--fa-text)' }}>
            Sinta-se em casa, {MOCK_STUDENT_NAME}.
          </h1>

          {/* ═══ 3. Status line ═══ */}
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--fa-text-2)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
              style={{ background: primaryColor, boxShadow: `0 0 5px ${primaryColor}` }} />
            {MOCK_STREAK} dias em sequência · Você está construindo um hábito real
          </p>
        </div>

        {/* ═══ 4. Copilot Card ═══ */}
        <div className="mb-10">
          <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background: 'var(--fa-card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--fa-border)',
              boxShadow: 'var(--fa-shadow)',
            }}
          >
            {/* Top shimmer */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'var(--fa-shimmer)' }} />
            {/* Radial ambient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${primaryColor}0A, transparent 55%)` }} />

            {/* Label row */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: primaryColor }}>
                💡 Seu Copiloto
              </p>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ background: `${primaryColor}18`, border: `1px solid ${primaryColor}44` }}>
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: primaryColor, boxShadow: `0 0 6px ${primaryColor}` }} />
                <span className="text-xs font-semibold" style={{ color: primaryColor }}>[SISTEMA OPERANDO]</span>
              </div>
            </div>

            {/* Daily Progress */}
            <div className="relative z-10">
              <DemoProgressBar done={MOCK_CARDS_DONE} goal={MOCK_DAILY_GOAL} primaryColor={primaryColor} />
            </div>

            {/* Avatar + bubble */}
            <div className="relative z-10 flex items-start gap-4 mb-5">
              <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                <div className="rounded-full flex items-center justify-center"
                  style={{
                    width: 44, height: 44,
                    border: `2px solid ${primaryColor}60`,
                    boxShadow: `0 0 14px ${primaryColor}28`,
                    background: `${primaryColor}20`,
                    fontSize: 20,
                  }}>
                  🤖
                </div>
                <span style={{ color: primaryColor, fontSize: '7px', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.70 }}>
                  COPILOTO
                </span>
              </div>

              <div className="relative flex-1 min-w-0">
                {/* Tail */}
                <div aria-hidden style={{
                  position: 'absolute', left: '-7px', top: '16px',
                  width: 0, height: 0,
                  borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
                  borderRight: '7px solid rgba(255,255,255,0.04)',
                  filter: `drop-shadow(-1px 0 0 ${primaryColor}20)`,
                }} />
                <div className="rounded-2xl px-4 py-3.5"
                  style={{ background: 'var(--fa-card)', border: '1px solid var(--fa-border)', backdropFilter: 'blur(8px)', boxShadow: 'var(--fa-shadow)' }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-bold" style={{ color: primaryColor }}>{tutorName}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Assistente IA</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--fa-text-2)' }}>
                    Oi {MOCK_STUDENT_NAME}! Hoje vamos focar em ~2 minutinhos de Matemática? É o caminho mais tranquilo para a sua meta de hoje. 💡
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <div
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
                        border: `1px solid ${primaryColor}88`,
                        color: 'white',
                      }}>
                      ⚡ Iniciar Sessão
                      <span style={{ opacity: 0.80, fontFamily: MONO, fontSize: '10px', letterSpacing: '0.04em' }}>
                        · Matemática
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat pills */}
              <div className="shrink-0 hidden sm:flex flex-col gap-2">
                <DemoStatPill value={`${MOCK_MATURE_PCT}%`} label={`EDITAL\nDOMINADO`} color={primaryColor} />
                <DemoStatPill value={`${MOCK_STREAK}🔥`} label={`DIAS EM\nSEQUÊNCIA`} color={AMBER} />
              </div>
            </div>

            {/* Area Cards */}
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
                FRENTES DE ATAQUE:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AREA_CONFIG.map(area => {
                  const data = MOCK_AREA_SCORES[area.key];
                  return (
                    <DemoAreaCard
                      key={area.key}
                      icon={area.icon}
                      label={area.label}
                      cardsDue={data?.cardsDue ?? 0}
                      score={data?.score ?? 0}
                      isStrength={area.key === topArea}
                      isNext={area.key === nextArea}
                      primaryColor={primaryColor}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="relative z-10 flex gap-3 mt-5">
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: 'transparent', border: `1px solid ${FOCUS}40`, color: FOCUS }}>
                📊 Relatório de Progresso
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: `linear-gradient(135deg, ${FOCUS}22, ${primaryColor}14)`,
                  border: `1px solid ${FOCUS}40`,
                  color: 'white',
                  boxShadow: `0 0 12px ${FOCUS}14`,
                }}>
                🗓️ Cronograma IA
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 5. Charts Row ═══ */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <DemoRadarChart data={MOCK_RADAR_DATA} primaryColor={primaryColor} />
          {/* Retention chart placeholder — visual simples */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--fa-card)', border: '1px solid var(--fa-border)', boxShadow: 'var(--fa-shadow)' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
              CURVA DE RETENÇÃO
            </p>
            <div className="flex items-end gap-1 h-[200px] pt-4">
              {[65, 78, 52, 88, 71, 60, 82].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${v}%`, background: `linear-gradient(to top, ${primaryColor}40, ${primaryColor})`, minHeight: 4 }}
                  />
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 6. Subject Cards ═══ */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
            MATÉRIAS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MOCK_SUBJECTS.map(s => (
              <DemoSubjectCard key={s.id} title={s.title} icon={s.icon} progress={s.progress} primaryColor={primaryColor} />
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
```

---

## Imports necessários no topo do arquivo

```typescript
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
```

Não importar NADA de `@/lib/DashboardContext`, `@/lib/tutor-config`, `@/app/dashboard/*`, `@/components/StudentDashboard`, `@/components/ThemeProvider`, etc.

---

## Checklist de verificação pós-implementação

1. `npx tsc --noEmit 2>&1 | grep DemoStudent` → sem erros
2. O componente NÃO importa nada do B2C
3. Todas as cores hardcoded (EMERALD `#10B981`) foram substituídas por `primaryColor`
4. O `tutorName` aparece na bubble do copiloto
5. A `schoolLogo` aparece no header se fornecida
6. Os botões (Iniciar Sessão, Relatório, Cronograma) são `<div>` ou `<button>` sem onClick — visuais
7. O componente renderiza sem erros quando montado isoladamente

---

## Commit

```bash
git add components/DemoStudentDashboard.tsx
git commit -m "feat: add DemoStudentDashboard — standalone visual replica for B2B demos"
```
