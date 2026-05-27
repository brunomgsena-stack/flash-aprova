# LP Mobile iPhone — Iteração v2 (satélites com destaque + tela cheia)

> **For agentic workers:** implemente task por task. Mesmo arquivo: `components/HeroSection.tsx`. Sem test runner → verificação por `npx tsc --noEmit` + `npm run build` + visual no `npm run dev`.

**Contexto:** v1 já entregue (iPhone central + 4 satélites em overlap + linhas animadas). Feedback do usuário:
1. Cards da esquerda ficam **na frente** do iPhone e tampam ele.
2. Conceitos / AI Memory (direita) **desalinhados** vs. esquerda — quer simetria.
3. Quer os blocos **atrás** do aparelho, vindo pra frente **um de cada vez** com **glitch sutil** (momento de destaque); ao destacar, o card **desliza pra fora** pra não cobrir a tela.
4. A **tela do iPhone deve ser usada por inteiro** — hoje (no `TutoresScreen`) sobra o meio vazio.

**Baseline tsc:** 3 erros pré-existentes em `lib/__tests__/meta-capi.test.ts` e `lib/admin-panel-auth.test.ts` (imports `.ts`). Ignorar — garantir zero erros novos em `HeroSection.tsx`.

---

## Task 1: Keyframes do glitch sutil

**Files:** Modify `components/HeroSection.tsx` — o `<style>` dentro do `return` de `HeroSection()` (hoje contém o `@import` de fonte e `.macbook-screen`, ~linha 1478).

- [ ] **Step 1:** Adicionar dentro daquele bloco `<style>{`...`}</style>`, após a regra `.macbook-screen`:

```css
        @keyframes satGlitch {
          0%   { clip-path: inset(0 0 0 0);     opacity: 0.5; transform: translateX(0); }
          15%  { clip-path: inset(20% 0 50% 0); opacity: 0.9; transform: translateX(1.5px); }
          30%  { clip-path: inset(55% 0 10% 0); opacity: 0.7; transform: translateX(-1.5px); }
          45%  { clip-path: inset(10% 0 40% 0); opacity: 1;   transform: translateX(0.5px); }
          60%  { clip-path: inset(0 0 0 0);     opacity: 0.85; transform: translateX(1px); }
          100% { clip-path: inset(0 0 0 0);     opacity: 1;   transform: translateX(0); }
        }
        .sat-glitch-in { animation: satGlitch 0.5s steps(3, end) 1; }
```

- [ ] **Step 2:** `npx tsc --noEmit` → sem erros novos.
- [ ] **Step 3:** Commit: `feat(hero): keyframes satGlitch (flicker + clip) p/ destaque dos satélites`

---

## Task 2: Reescrever `MobileSatellites` (simétrico, atrás, destaque ciclado)

Substituir **toda** a função `MobileSatellites` por esta. Mudanças: layout simétrico em 2 linhas (esquerda/direita alinhadas); todos os cards **atrás** do iPhone por padrão (z=2, dimmados/menores → iPhone aparece inteiro); um `active` cicla a cada 2.1s, e o card ativo vem pra **frente** (z=20), **desliza pra fora** (x ±30), des-dimma e roda o `sat-glitch-in`.

**Files:** Modify `components/HeroSection.tsx` (função `MobileSatellites`).

- [ ] **Step 1:** Substituir a função inteira por:

```tsx
function MobileSatellites({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActive((a) => (a + 1) % 4), 2100);
    return () => clearInterval(iv);
  }, []);

  const ARSENAL = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>📚 Arsenal</div>
      {[{ name: 'Biologia', pct: 78, color: '#34d399' }, { name: 'Física', pct: 91, color: PURPLE_L }].map((s) => (
        <div key={s.name} className="mb-2">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
          <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" style={{ background: s.color }}
              initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }} />
          </div>
        </div>
      ))}
    </GlassCard>
  );

  const MEMORY = <TerminalWidget className="!w-[142px] !p-3" lines={termLines} />;

  const AGENDA = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>🤖 Agenda IA</div>
      {[{ time: '14:00', subject: 'Termo', icon: '⚛️' }, { time: '16:30', subject: 'Genética', icon: '🧬' }].map((s) => (
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
  );

  const CONCEITOS = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>🔒 Conceitos</div>
      <ConceptsWidget visible={visibleConcepts} />
    </GlassCard>
  );

  // 2 linhas simétricas: topo (top:58) e baixo (top:300); esquerda/direita espelhados.
  const SATS = [
    { node: ARSENAL,   side: 'left'  as const, top: 58,  floatDelay: 0   },
    { node: MEMORY,    side: 'right' as const, top: 58,  floatDelay: 0.6 },
    { node: AGENDA,    side: 'left'  as const, top: 300, floatDelay: 1.2 },
    { node: CONCEITOS, side: 'right' as const, top: 300, floatDelay: 1.8 },
  ];

  return (
    <>
      {SATS.map((s, i) => {
        const isActive = i === active;
        const out = s.side === 'left' ? -30 : 30;
        const sidePos = s.side === 'left' ? { left: 0 } : { right: 0 };
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ ...sidePos, top: s.top, width: 142, zIndex: isActive ? 20 : 2 }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: isActive ? 1 : 0.3,
              scale: isActive ? 1 : 0.88,
              x: isActive ? out : 0,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <FloatWrapper delay={s.floatDelay} intensity={5}>
              {/* key força remount → re-dispara o glitch toda vez que vira ativo */}
              <div key={isActive ? `on-${active}` : 'off'} className={isActive ? 'sat-glitch-in' : ''}>
                {s.node}
              </div>
            </FloatWrapper>
          </motion.div>
        );
      })}
    </>
  );
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → sem erros novos.
- [ ] **Step 3:** `npm run dev` viewport 390px: iPhone **inteiro visível** (cards atrás/dimmados); a cada ~2s um card vem pra frente, desliza pro lado e dá um glitch sutil; esquerda e direita alinhadas (2 linhas).
- [ ] **Step 4:** Commit: `feat(hero): satélites simétricos atrás do iPhone com destaque ciclado + glitch`

---

## Task 3: Realinhar `MCONN_LINES` às novas posições

Origens das linhas nas laterais visíveis (fora do iPhone, que ocupa x≈74–286 no viewBox 360), convergindo ao centro (180,250). Simétricas.

**Files:** Modify `components/HeroSection.tsx` (const `MCONN_LINES`).

- [ ] **Step 1:** Substituir o array `MCONN_LINES` por:

```tsx
const MCONN_LINES = [
  { d: 'M 52,100 C 110,150 160,210 180,242',  color: PURPLE_L,  delay: 0,   gradId: 'mcg0', cx: 52,  cy: 100 },  // Arsenal (topo-esq)
  { d: 'M 308,100 C 250,150 200,210 180,242', color: '#34d399', delay: 0.5, gradId: 'mcg1', cx: 308, cy: 100 },  // AI Memory (topo-dir)
  { d: 'M 52,330 C 110,310 160,275 180,258',  color: '#fb923c', delay: 1.0, gradId: 'mcg2', cx: 52,  cy: 330 },  // Agenda (baixo-esq)
  { d: 'M 308,330 C 250,310 200,275 180,258', color: CYAN,      delay: 1.5, gradId: 'mcg3', cx: 308, cy: 330 },  // Conceitos (baixo-dir)
];
```

- [ ] **Step 2:** `npx tsc --noEmit` → sem erros novos.
- [ ] **Step 3:** `npm run dev` viewport 390px: 4 cabos saindo das laterais e convergindo pro iPhone, simétricos.
- [ ] **Step 4:** Commit: `feat(hero): realinhar linhas mobile às posições simétricas dos satélites`

---

## Task 4: `TutoresScreen` em modo `fill` (usar a tela inteira)

`TutoresScreen` é compartilhado com o MacBook (desktop). Adicionar prop **opcional** `fill` que, quando `true`, preenche a tela alta do iPhone (mais mensagens + fontes maiores). Default = comportamento atual (desktop intacto).

**Files:** Modify `components/HeroSection.tsx` (função `TutoresScreen` e a chamada dentro de `PhoneAppScreen`).

- [ ] **Step 1:** Mudar a assinatura:

De:
```tsx
function TutoresScreen() {
```
Para:
```tsx
function TutoresScreen({ fill = false }: { fill?: boolean }) {
```

- [ ] **Step 2:** No interval que monta o feed, manter mais mensagens quando `fill`. Localizar:
```tsx
        setFeed((prev) => [...prev.slice(-2), { id: counter, tutorIdx: nextT, msgIdx: nextM }]);
```
Substituir por:
```tsx
        setFeed((prev) => [...prev.slice(fill ? -4 : -2), { id: counter, tutorIdx: nextT, msgIdx: nextM }]);
```

- [ ] **Step 3:** No estado inicial do feed, começar já com 4 itens quando `fill` pra não ter gap no primeiro frame. Localizar o `useState<FeedItem[]>([...])` inicial e substituir por:
```tsx
  const [feed, setFeed] = useState<FeedItem[]>(
    fill
      ? [
          { id: 0, tutorIdx: 0, msgIdx: 0 },
          { id: 1, tutorIdx: 1, msgIdx: 0 },
          { id: 2, tutorIdx: 2, msgIdx: 0 },
          { id: 3, tutorIdx: 0, msgIdx: 1 },
          { id: 4, tutorIdx: 1, msgIdx: 1 },
        ]
      : [
          { id: 0, tutorIdx: 0, msgIdx: 0 },
          { id: 1, tutorIdx: 1, msgIdx: 0 },
          { id: 2, tutorIdx: 2, msgIdx: 0 },
        ]
  );
```
E ajustar o `nextRef` inicial pra continuar a contagem certa quando `fill`:
```tsx
  const nextRef = useRef({ counter: fill ? 5 : 3, tIdx: 1, mIdx: 1 });
```

- [ ] **Step 4:** No bloco do chat feed e nas bolhas, aumentar tamanhos quando `fill` (mais legível e preenche). Localizar o container do feed:
```tsx
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5, overflow: 'hidden' }}>
```
Substituir por:
```tsx
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: fill ? 'flex-start' : 'flex-end', gap: fill ? 8 : 5, overflow: 'hidden' }}>
```
E na bolha de mensagem, o `fontSize: 7.5` → usar `fill ? 10 : 7.5`. Localizar:
```tsx
                    fontSize: 7.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45,
```
Substituir por:
```tsx
                    fontSize: fill ? 10 : 7.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45,
```
E o nome/subject `fontSize: 6` → `fill ? 8 : 6`. Localizar:
```tsx
                  <div style={{ fontSize: 6, fontWeight: 700, color: t.color, marginBottom: 2 }}>
```
Substituir por:
```tsx
                  <div style={{ fontSize: fill ? 8 : 6, fontWeight: 700, color: t.color, marginBottom: 2 }}>
```

- [ ] **Step 5:** Na `PhoneAppScreen`, passar `fill`. Localizar:
```tsx
        {activeTab === 'TutoresIA' && <TutoresScreen />}
```
Substituir por:
```tsx
        {activeTab === 'TutoresIA' && <TutoresScreen fill />}
```

- [ ] **Step 6:** `npx tsc --noEmit` → sem erros novos.
- [ ] **Step 7:** `npm run dev`: em 390px a aba Tutores preenche a tela do iPhone (sem buraco no meio); no MacBook (≥1024px) o chat segue **idêntico** ao anterior.
- [ ] **Step 8:** Commit: `feat(hero): TutoresScreen modo fill p/ usar a tela inteira no iPhone`

---

## Verificação final

- [ ] `npm run build` → `✓ Compiled successfully`.
- [ ] `npm run dev` em 360/390/430px: iPhone inteiro visível; cards atrás, destaque ciclando com slide-out + glitch; tela do iPhone cheia nas 3 abas; desktop ≥1024px idêntico ao original.

## Self-Review (cobertura do feedback)
- Cards atrás / iPhone visível → Task 2 (z=2 default, dimmados). ✓
- Simetria esquerda/direita → Task 2 (2 linhas, espelhado) + Task 3 (linhas simétricas). ✓
- Destaque um por vez + slide pra fora + glitch sutil → Task 1 (keyframes) + Task 2 (active cycle, x±30, z=20, sat-glitch-in). ✓
- Tela do iPhone usada por inteiro → Task 4 (TutoresScreen fill; Estudar/Redação já preenchem via flex:1). ✓
- Desktop intacto → MobileSatellites/linhas gated por MobileOnly; TutoresScreen fill é opt-in (default preserva MacBook). ✓
