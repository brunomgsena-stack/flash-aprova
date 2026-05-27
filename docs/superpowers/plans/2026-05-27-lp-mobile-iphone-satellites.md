# LP Mobile — iPhone + satélites conectados — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No mobile (<1024px), trocar o MacBook do hero por um iPhone retrato com os 4 satélites vivos em overlap, ligados por linhas com pacotes animados; o desktop fica intacto.

**Architecture:** Tudo dentro de `components/HeroSection.tsx`, seguindo o padrão de componentes co-localizados. Novos componentes: `MobileOnly` (gate <1024px), `PhoneAppScreen` (casca mobile-nativa), `IPhoneMockup` (moldura retrato), `MobileSatellites` (4 cards em overlap), `MobileConnectionLines` (SVG animado). O ramo desktop (MacBook + corners + `ConnectionLines`) vira `hidden lg:block`; o ramo mobile vira `lg:hidden`. Tickers `termLines`/`visibleConcepts` já existentes alimentam os dois lados.

**Tech Stack:** Next.js 16, React 19, framer-motion 12, Tailwind. **Sem framework de testes no projeto** → verificação por `npx tsc --noEmit` (typecheck) + `npm run lint` + checagem visual no `npm run dev` nos viewports 360/390/430px e ≥1024px.

---

## Notas de verificação (valem pra todas as tasks)

- **Typecheck:** `npx tsc --noEmit` → Expected: sem erros.
- **Lint:** `npm run lint` → Expected: sem erros novos.
- **Visual:** `npm run dev`, abrir `http://localhost:3000`, DevTools responsivo. Mobile = 390px; Desktop = 1280px.
- Constantes já existentes no arquivo e reutilizáveis: `PURPLE`, `PURPLE_L`, `EMERALD`, `CYAN`, `NEON_G`, `OBSIDIAN`, `FLASHCARDS`, `CONCEPTS`, `PACKET_DUR`, `PACKETS`. Componentes reutilizáveis: `GlassCard`, `FloatWrapper`, `TerminalWidget`, `ConceptsWidget`, `TutoresScreen`, `RedacaoScreen`, `DesktopOnly`.

---

## Task 1: Gate `MobileOnly`

Espelho de `DesktopOnly`, mas casa em telas < 1024px. Usado pra satélites e linhas que não devem hidratar no desktop.

**Files:**
- Modify: `components/HeroSection.tsx` (logo após `DesktopOnly`, ~linha 1401)

- [ ] **Step 1: Adicionar o componente `MobileOnly` logo abaixo de `DesktopOnly`**

Localizar o fim de `DesktopOnly` (a linha `}` que fecha a função, seguida do comentário `// ── Main HeroSection`). Inserir antes do comentário do Main HeroSection:

```tsx
// ── Mobile-only gate: filhos só montam em telas < lg (1024px). ────────────────
// No desktop renderiza null (sem hidratar), evitando trabalho de JS desnecessário.
function MobileOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setShow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setShow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return show ? <>{children}</> : null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (componente ainda não usado — só definido).

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): gate MobileOnly (espelho do DesktopOnly)"
```

---

## Task 2: `PhoneAppScreen` (casca mobile-nativa)

Substitui a casca macOS do `AppScreen` por uma casca de celular: status bar no topo + bottom nav (📚 Estudar / 🤖 Tutores / ✍️ Redação), ciclando, **sem** a aba Central. Reaproveita `TutoresScreen` e `RedacaoScreen`; a aba Estudar é um flashcard com flip em coluna única.

**Files:**
- Modify: `components/HeroSection.tsx` (inserir logo antes de `function MacBookMockup`, ~linha 1322)

- [ ] **Step 1: Inserir o componente `PhoneAppScreen`**

```tsx
// ── App screen renderizado dentro do iPhone (mobile) ─────────────────────────
function PhoneAppScreen() {
  const [activeTab, setActiveTab] = useState<'Estudar' | 'TutoresIA' | 'Redacao'>('Estudar');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Ciclo: Estudar 4s → Tutores 4.5s → Redação 5s → repeat
  useEffect(() => {
    const DUR: Record<typeof activeTab, number> = { Estudar: 4000, TutoresIA: 4500, Redacao: 5000 };
    const NEXT: Record<typeof activeTab, typeof activeTab> = {
      Estudar: 'TutoresIA', TutoresIA: 'Redacao', Redacao: 'Estudar',
    };
    const t = setTimeout(() => setActiveTab((x) => NEXT[x]), DUR[activeTab]);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Flip do card quando em Estudar
  useEffect(() => {
    if (activeTab !== 'Estudar') return;
    const t1 = setTimeout(() => setFlipped(true), 2000);
    const t2 = setTimeout(() => { setCardIdx((i) => (i + 1) % FLASHCARDS.length); setFlipped(false); }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cardIdx, activeTab]);

  const card = FLASHCARDS[cardIdx];

  const NAV = [
    { id: 'Estudar',   icon: '📚', label: 'Estudar', ac: PURPLE_L },
    { id: 'TutoresIA', icon: '🤖', label: 'Tutores', ac: '#a855f7' },
    { id: 'Redacao',   icon: '✍️', label: 'Redação', ac: EMERALD  },
  ] as const;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)', overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px 6px', flexShrink: 0, fontSize: 9, color: 'rgba(255,255,255,0.55)',
      }}>
        <span style={{ fontWeight: 800, color: '#fff' }}>
          <span style={{ color: PURPLE_L }}>●</span> FlashAprova
        </span>
        <span style={{ fontWeight: 600 }}>9:41</span>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'TutoresIA' && <TutoresScreen />}
        {activeTab === 'Redacao' && <RedacaoScreen />}
        {activeTab === 'Estudar' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 12px 6px', gap: 8 }}>
            {/* stat chips */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {[
                { label: 'Hoje', value: '32', color: EMERALD },
                { label: 'Retenção', value: '94%', color: PURPLE_L },
                { label: 'Streak', value: '12d', color: '#fb923c' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, padding: '5px 7px',
                }}>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* flip card */}
            <div style={{ flex: 1, perspective: 800, minHeight: 0 }}>
              <motion.div
                style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(124,58,237,0.08) 100%)',
                  border: '1px solid rgba(0,229,255,0.2)', borderRadius: 14, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: CYAN,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}30`, padding: '2px 6px', borderRadius: 4,
                    }}>PERGUNTA</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{card.subject}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5, fontWeight: 600, flex: 1 }}>{card.q}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>▶ Toque para revelar</div>
                </div>
                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, rgba(0,255,128,0.06) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '1px solid rgba(0,255,128,0.2)', borderRadius: 14, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: NEON_G, alignSelf: 'flex-start',
                    background: `${NEON_G}15`, border: `1px solid ${NEON_G}30`, padding: '2px 6px', borderRadius: 4, marginBottom: 10,
                  }}>RESPOSTA</span>
                  <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5, flex: 1 }}>{card.a}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginTop: 8 }}>
                    {[
                      { label: 'Errei', color: '#ef4444' }, { label: 'Hard', color: '#f97316' },
                      { label: 'Bom', color: '#3b82f6' }, { label: 'Fácil', color: NEON_G },
                    ].map((b) => (
                      <div key={b.label} style={{
                        fontSize: 8, color: b.color, fontWeight: 700, textAlign: 'center',
                        background: `${b.color}14`, border: `1px solid ${b.color}35`, borderRadius: 5, padding: '3px 2px',
                      }}>{b.label}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            {/* dots */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
              {FLASHCARDS.map((fc, i) => (
                <motion.div key={i}
                  animate={{ width: i === cardIdx ? 18 : 5, opacity: i === cardIdx ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 3, borderRadius: 2, background: i === cardIdx ? fc.color : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 0 8px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18,18,18,0.92)',
      }}>
        {NAV.map((n) => {
          const on = n.id === activeTab;
          return (
            <div key={n.id} onClick={() => setActiveTab(n.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer', opacity: on ? 1 : 0.4, transition: 'opacity 0.3s',
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: on ? n.ac : 'rgba(255,255,255,0.4)' }}>{n.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros. (Componente definido mas ainda não montado.)

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): PhoneAppScreen (casca mobile-nativa, sem aba Central)"
```

---

## Task 3: `IPhoneMockup` (moldura retrato)

Moldura de iPhone com notch, glow roxo, renderizando `PhoneAppScreen` dentro.

**Files:**
- Modify: `components/HeroSection.tsx` (inserir logo após `PhoneAppScreen`, antes de `MacBookMockup`)

- [ ] **Step 1: Inserir o componente `IPhoneMockup`**

```tsx
// ── iPhone frame (mobile) ─────────────────────────────────────────────────────
function IPhoneMockup() {
  return (
    <div style={{
      width: 212, height: 430, borderRadius: 40, position: 'relative',
      background: 'linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 100%)',
      padding: 7, border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: `0 0 70px ${PURPLE}33, inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px rgba(0,0,0,0.75)`,
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 64, height: 14, borderRadius: 10, background: '#000', zIndex: 6,
      }} />
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 33, overflow: 'hidden',
        background: '#050b14', border: '1px solid rgba(0,0,0,0.5)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        <PhoneAppScreen />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): IPhoneMockup (moldura retrato com PhoneAppScreen)"
```

---

## Task 4: Wire — iPhone no mobile, MacBook só no desktop

Trocar a visibilidade: MacBook central passa a `hidden lg:block`; adicionar um wrapper mobile `lg:hidden` com o iPhone centrado. Sem satélites/linhas ainda — só validar a troca do aparelho por breakpoint.

**Files:**
- Modify: `components/HeroSection.tsx` (bloco "MacBook center", ~linhas 1677-1683)

- [ ] **Step 1: Tornar o MacBook visível só no desktop**

Localizar:

```tsx
            {/* MacBook center — visível no SSR (é o elemento LCP no mobile) */}
            <motion.div
              className="relative"
              style={{ zIndex: 10, x: nbX, y: nbY, width: '100%', maxWidth: 560 }}
            >
              <MacBookMockup termLines={termLines} visibleConcepts={visibleConcepts} />
            </motion.div>
```

Substituir por (adiciona `hidden lg:block` e um wrapper mobile irmão):

```tsx
            {/* MacBook center — desktop apenas */}
            <motion.div
              className="relative hidden lg:block"
              style={{ zIndex: 10, x: nbX, y: nbY, width: '100%', maxWidth: 560 }}
            >
              <MacBookMockup termLines={termLines} visibleConcepts={visibleConcepts} />
            </motion.div>

            {/* iPhone + satélites — mobile apenas. Container relativo p/ overlap. */}
            <div
              className="relative lg:hidden mx-auto"
              style={{ width: '100%', maxWidth: 360, height: 500 }}
            >
              {/* iPhone centro — visível no SSR (LCP no mobile) */}
              <div
                className="absolute left-1/2 top-1/2"
                style={{ transform: 'translate(-50%,-50%)', zIndex: 5 }}
              >
                <IPhoneMockup />
              </div>
            </div>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação visual**

Run: `npm run dev` e abrir `http://localhost:3000`.
Expected:
- Em 390px: aparece o **iPhone** central (status bar + flip card + bottom nav ciclando), **sem** MacBook.
- Em 1280px: **MacBook** + 4 corner cards + linhas, exatamente como antes; **sem** iPhone.
- Sem layout shift perceptível no load do mobile.

- [ ] **Step 4: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): iPhone no mobile, MacBook restrito ao desktop"
```

---

## Task 5: `MobileSatellites` (4 cards vivos em overlap)

Os 4 satélites posicionados em overlap nas bordas do iPhone (layout B), vivos, reaproveitando `GlassCard`/`TerminalWidget`/`ConceptsWidget`. Recebe os tickers por props.

**Files:**
- Modify: `components/HeroSection.tsx` (definição: após `IPhoneMockup`; uso: dentro do wrapper mobile criado na Task 4)

- [ ] **Step 1: Definir `MobileSatellites` (após `IPhoneMockup`)**

```tsx
// ── 4 satélites em overlap ao redor do iPhone (mobile) ───────────────────────
function MobileSatellites({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
  const wrap = 'absolute z-[6]';
  return (
    <>
      {/* Arsenal — topo-esquerda */}
      <motion.div className={wrap} style={{ left: 0, top: 60, width: 150 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <FloatWrapper delay={0} intensity={7}>
          <GlassCard className="!p-3" style={{ width: 150 }}>
            <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>📚 Arsenal</div>
            {[
              { name: 'Biologia', pct: 78, color: '#34d399' },
              { name: 'Física', pct: 91, color: PURPLE_L },
            ].map((s) => (
              <div key={s.name} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: s.color }}
                    initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }} />
                </div>
              </div>
            ))}
          </GlassCard>
        </FloatWrapper>
      </motion.div>

      {/* AI Memory — borda direita, meio */}
      <motion.div className={wrap} style={{ right: -6, top: 168, width: 150 }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}>
        <FloatWrapper delay={1.4} intensity={6}>
          <TerminalWidget className="!w-[150px] !p-3" lines={termLines} />
        </FloatWrapper>
      </motion.div>

      {/* Agenda IA — borda esquerda, baixo */}
      <motion.div className={wrap} style={{ left: -6, top: 300, width: 148 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}>
        <FloatWrapper delay={0.8} intensity={7}>
          <GlassCard className="!p-3" style={{ width: 148 }}>
            <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>🤖 Agenda IA</div>
            {[
              { time: '14:00', subject: 'Termo', icon: '⚛️' },
              { time: '16:30', subject: 'Genética', icon: '🧬' },
            ].map((s) => (
              <div key={s.time} className="flex items-center gap-2 mb-1.5 p-1.5 rounded-lg"
                style={{ background: `${PURPLE}12`, border: '1px solid rgba(124,58,237,0.18)' }}>
                <span className="text-sm">{s.icon}</span>
                <div>
                  <div className="text-[9px] font-semibold" style={{ color: '#fff' }}>{s.subject}</div>
                  <div className="text-[8px]" style={{ color: PURPLE_L }}>{s.time}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        </FloatWrapper>
      </motion.div>

      {/* Conceitos — baixo-direita */}
      <motion.div className={wrap} style={{ right: 0, top: 348, width: 150 }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}>
        <FloatWrapper delay={2} intensity={8}>
          <GlassCard className="!p-3" style={{ width: 150 }}>
            <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>🔒 Conceitos</div>
            <ConceptsWidget visible={visibleConcepts} />
          </GlassCard>
        </FloatWrapper>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: Montar `MobileSatellites` no wrapper mobile (gated por `MobileOnly`)**

No wrapper mobile criado na Task 4, adicionar **depois** do `<IPhoneMockup />` (irmão da div do iPhone, dentro do mesmo container `lg:hidden`):

```tsx
              {/* satélites em overlap */}
              <MobileOnly>
                <MobileSatellites termLines={termLines} visibleConcepts={visibleConcepts} />
              </MobileOnly>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação visual**

Run: `npm run dev`, viewport 390px.
Expected: os 4 satélites aparecem ao redor do iPhone com leve overlap, entrando em fade/float; terminal tickando e conceitos rotacionando. Em 360px nenhum card corta feio fora da tela (pode encostar de leve nas bordas — esperado). Em 1280px nada disso aparece.

- [ ] **Step 5: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): MobileSatellites — 4 cards vivos em overlap no iPhone"
```

---

## Task 6: `MobileConnectionLines` (linhas com pacotes animados)

SVG com cabos + 3 pacotes viajando dos 4 satélites pro centro do iPhone, reaproveitando `PACKET_DUR`/`PACKETS` e o motor visual do `ConnectionLines`. ViewBox 360×500 alinhado ao container mobile; centro do iPhone ≈ (180,250).

**Files:**
- Modify: `components/HeroSection.tsx` (definição: após `MobileSatellites`; uso: dentro do wrapper mobile, atrás do iPhone)

- [ ] **Step 1: Definir constantes e `MobileConnectionLines` (após `MobileSatellites`)**

```tsx
// ── Linhas de conexão satélite→iPhone (mobile) ───────────────────────────────
// viewBox 360×500; centro do iPhone ≈ (180,250). Origens nas bordas dos satélites.
const MCONN_LINES = [
  { d: 'M 70,95 C 110,150 150,200 180,238',  color: PURPLE_L,  delay: 0,    gradId: 'mcg0', cx: 70,  cy: 95  },
  { d: 'M 300,210 C 260,225 220,235 200,245', color: '#34d399', delay: 0.6,  gradId: 'mcg1', cx: 300, cy: 210 },
  { d: 'M 60,330 C 110,310 150,285 180,262',  color: '#fb923c', delay: 1.2,  gradId: 'mcg2', cx: 60,  cy: 330 },
  { d: 'M 300,380 C 260,340 220,300 200,268', color: CYAN,      delay: 1.8,  gradId: 'mcg3', cx: 300, cy: 380 },
];

function MobileConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}
      viewBox="0 0 360 500" preserveAspectRatio="xMidYMid meet">
      <defs>
        {MCONN_LINES.map((l) => (
          <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={l.color} stopOpacity="0.05" />
            <stop offset="45%" stopColor={l.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </linearGradient>
        ))}
        {MCONN_LINES.map((l) => (
          <filter key={`f-${l.gradId}`} id={`mglow-${l.gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        <filter id="mdot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mcenter-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {MCONN_LINES.map((l, i) => (
        <g key={i}>
          <path id={`mpath-${i}`} d={l.d} fill="none" stroke="none" />
          <path d={l.d} fill="none" stroke={l.color} strokeWidth="0.7" strokeOpacity="0.18" strokeDasharray="3 9" />
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <motion.path key={`pkt-${p}`} d={l.d} fill="none" stroke={`url(#${l.gradId})`} strokeWidth="2"
                filter={`url(#mglow-${l.gradId})`}
                initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
                animate={{ pathLength: [0, 0.32, 0], pathOffset: [0, 0.68, 1], opacity: [0, 1, 0] }}
                transition={{ duration: PACKET_DUR, repeat: Infinity, ease: 'easeInOut', delay: pktDelay }} />
            );
          })}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <circle key={`dot-${p}`} r="2" fill={l.color} filter="url(#mdot-glow)">
                <animateMotion dur={`${PACKET_DUR}s`} repeatCount="indefinite" begin={`${pktDelay}s`}
                  calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1">
                  <mpath href={`#mpath-${i}`} />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;0" dur={`${PACKET_DUR}s`} begin={`${pktDelay}s`}
                  repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" />
              </circle>
            );
          })}
          <motion.circle cx={l.cx} cy={l.cy} r="3.5" fill={l.color} filter="url(#mdot-glow)"
            animate={{ opacity: [0.25, 0.85, 0.25], r: [2.5, 4.5, 2.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: l.delay }} />
        </g>
      ))}

      {/* Glow de chegada no centro do iPhone */}
      <motion.circle cx="180" cy="250" r="6" fill={PURPLE_L} filter="url(#mcenter-glow)"
        animate={{ opacity: [0.2, 0.7, 0.2], r: [4, 9, 4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  );
}
```

- [ ] **Step 2: Montar `MobileConnectionLines` atrás do iPhone (gated por `MobileOnly`)**

No wrapper mobile, inserir como **primeiro** filho (antes da div do iPhone), pra ficar atrás:

```tsx
              {/* linhas atrás de tudo */}
              <MobileOnly>
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                  <MobileConnectionLines />
                </div>
              </MobileOnly>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação visual**

Run: `npm run dev`, viewport 390px.
Expected: cabos pontilhados ligando cada satélite ao centro do iPhone, com pontos/pacotes viajando até o aparelho e glow pulsando no centro. As 4 origens (`cx`,`cy`) batem aproximadamente nas bordas dos satélites. Em 1280px nada aparece.

- [ ] **Step 5: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): MobileConnectionLines — pacotes animados satélite→iPhone"
```

---

## Task 7: Verificação final e ajuste de alinhamento

Polir alinhamento das origens das linhas com os satélites e rodar build/lint completos.

**Files:**
- Modify: `components/HeroSection.tsx` (apenas as coordenadas `cx`/`cy`/`d` em `MCONN_LINES` e/ou `top`/`left` em `MobileSatellites`, se necessário)

- [ ] **Step 1: Ajuste fino visual (se necessário)**

`npm run dev`, viewport 390px. Se algum pacote não nascer encostado na borda do satélite, ajustar o ponto inicial do `d` e o `cx`/`cy` correspondente em `MCONN_LINES` pra casar com a posição (`top`/`left` + tamanho) do satélite em `MobileSatellites`. Mapeamento satélite→linha: Arsenal→mcg0, AI Memory→mcg1, Agenda→mcg2, Conceitos→mcg3.

- [ ] **Step 2: Checar 3 viewports**

`npm run dev`. Conferir em **360 / 390 / 430px**: iPhone legível e centrado, 4 satélites sem corte feio, linhas convergindo, bottom nav e ciclo de abas funcionando. Conferir em **1280px**: desktop idêntico ao original.

- [ ] **Step 3: Build + lint completos**

Run: `npm run build`
Expected: build conclui sem erros de tipo.

Run: `npm run lint`
Expected: sem erros novos.

- [ ] **Step 4: Commit (se houve ajuste)**

```bash
git add components/HeroSection.tsx
git commit -m "fix(hero): alinhar origens das linhas mobile com os satélites"
```

---

## Self-Review (cobertura do spec)

- **Layout B (overlap):** Task 5 posiciona os satélites sobrepondo as bordas do iPhone. ✓
- **iPhone substitui MacBook no mobile / desktop intacto:** Task 4 (`hidden lg:block` no MacBook, `lg:hidden` no iPhone). ✓
- **4 satélites vivos reusando componentes:** Task 5 usa `GlassCard`/`TerminalWidget`/`ConceptsWidget` com tickers compartilhados. ✓
- **Casca mobile-nativa sem aba Central:** Task 2 (`PhoneAppScreen`, NAV com 3 abas). ✓
- **Linhas com pacotes animados:** Task 6 (`MobileConnectionLines` reusa `PACKET_DUR`/`PACKETS`). ✓
- **`MobileOnly`/`DesktopOnly` evitam duplo-mount:** Task 1 + gating nas Tasks 5/6; iPhone e MacBook coexistem no DOM mas alternados por CSS (`lg:`). ✓
- **iPhone como LCP/SSR:** Task 4 renderiza o iPhone fora do `MobileOnly` (montado no SSR), só satélites/linhas atrás de `MobileOnly`. ✓
- **Tickers compartilhados (sem timers novos):** `termLines`/`visibleConcepts` passados por props nas Tasks 5/6; `PhoneAppScreen` usa só seus próprios timers de ciclo/flip (equivalente ao `AppScreen`, não um ticker global novo). ✓

Sem placeholders. Nomes de componentes/props consistentes entre tasks (`MobileOnly`, `IPhoneMockup`, `PhoneAppScreen`, `MobileSatellites`, `MobileConnectionLines`; props `termLines`/`visibleConcepts`).
