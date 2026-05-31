# Agitação da Dor — Camada Emocional na EbbinghausSection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os 3 cards-pilar de "Pilares do Desastre" por um stack vertical scroll-telling de 3 cenas em 1ª pessoa, mais reescrever o subhead da seção, em `components/EbbinghausSection.tsx`.

**Architecture:** Um único arquivo é tocado (`components/EbbinghausSection.tsx`). Removemos o array `PILARES` + componente `PilarCard`. Adicionamos array `MOMENTOS` + componentes `Momento` e `MomentoStack`. O `MomentoStack` desenha uma linha vertical animada (gradient laranja → vermelho → violeta) com 3 estações. Cada `Momento` tem um nó pulsante, timestamp, narrativa e soco emocional. Animações continuam via `framer-motion` (já dep).

**Tech Stack:** Next.js (App Router) + React + TypeScript + framer-motion + Tailwind. Sem novas deps. Sem framework de testes automatizados — verificação por `pnpm build` + checagem visual no `pnpm dev`.

**Spec:** `docs/superpowers/specs/2026-05-31-agitacao-dor-emocional-design.md`

---

## Conventions for this plan

- **Estilo de código:** seguir o padrão visual do arquivo (comentários separadores `// ─── X ───`, tokens de cor em const no topo, motion configs em linha).
- **Sem testes automatizados:** este projeto Next.js não tem suite de testes. Cada task termina com `pnpm build` (typecheck) + verificação visual no `pnpm dev`.
- **Servidor de dev:** se você precisar abrir `pnpm dev`, rode em background e mate ao fim da task. Não deixe processo pendurado.
- **Não criar arquivos novos:** todas as mudanças são em `components/EbbinghausSection.tsx`.
- **Não tocar:** `app/LandingPage.tsx`, o gráfico SVG dentro da seção, headline da seção, `AnkiComparison`.

---

## File Structure

**Arquivo único modificado:** `components/EbbinghausSection.tsx`

Responsabilidades dentro do arquivo (mesmas regiões delimitadas por comentários):
- Design tokens (cores) — mantém
- SVG paths e nodes do gráfico — mantém
- Component `NodeDot` (gráfico) — mantém
- ~~`PILARES` (array)~~ → **REMOVIDO**
- ~~`PilarCard` (component)~~ → **REMOVIDO**
- `MOMENTOS` (array) — **NOVO**
- `Momento` (component) — **NOVO**
- `MomentoStack` (component) — **NOVO**
- `EbbinghausSection` (main) — modificado: subhead reescrito + rótulo trocado + uso de `<MomentoStack/>` em vez do grid de `PilarCard`

---

## Task 1: Reescrever o subhead da seção

**Files:**
- Modify: `components/EbbinghausSection.tsx` (bloco do subhead, ~linhas 224-234)

**Why:** Mudança isolada e baixa-risco. Já valida que o engineer tem o ambiente rodando antes de tarefas maiores.

- [ ] **Step 1: Localizar o `motion.p` do subhead atual**

Abra `components/EbbinghausSection.tsx`. Procure pelo bloco que começa com `<motion.p` logo após o `</motion.h2>` do headline. O conteúdo atual é:

```tsx
<motion.p
  className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed"
  initial={{ opacity: 0 }}
  animate={isInView ? { opacity: 1 } : {}}
  transition={{ duration: 0.55, delay: 0.22 }}
>
  A ciência prova: sem engenharia, você aluga o conhecimento.{' '}
  <span className="text-white font-semibold">
    Em 24h, o proprietário (seu cérebro) deleta 70% do que você pagou com suor para aprender.
  </span>
</motion.p>
```

- [ ] **Step 2: Substituir o conteúdo do subhead**

Substituir o `<motion.p>...</motion.p>` acima por:

```tsx
<motion.p
  className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed"
  initial={{ opacity: 0 }}
  animate={isInView ? { opacity: 1 } : {}}
  transition={{ duration: 0.55, delay: 0.22 }}
>
  Você devora 8 horas de PDF por dia. Em 24h seu cérebro apaga 70% disso.{' '}
  <span className="text-white font-semibold">
    O problema nunca foi seu esforço — foi te entregarem um método que a ciência já provou que falha.
  </span>
</motion.p>
```

- [ ] **Step 3: Rodar typecheck/build**

Run: `pnpm build`
Expected: build conclui sem erro de TypeScript nem warning novo do React.

- [ ] **Step 4: Verificação visual (rápida)**

Run em background: `pnpm dev`
Abra `http://localhost:3000/` e role até a seção "Seu cérebro foi programado para esquecer." Confirme que:
- Texto novo aparece (sem typos)
- "O problema nunca foi seu esforço — foi te entregarem um método que a ciência já provou que falha." está em branco bold

Mate o servidor depois (`pkill -f "next dev"` ou pare o processo background).

- [ ] **Step 5: Commit**

```bash
git add components/EbbinghausSection.tsx
git commit -m "copy(ebbinghaus): subhead com virada de culpa (esforço → método)"
```

---

## Task 2: Substituir array `PILARES` por `MOMENTOS`

**Files:**
- Modify: `components/EbbinghausSection.tsx` (~linhas 78-101, bloco `const PILARES`)

**Why:** Data structure é a base. Depois construímos os componentes em cima dela.

- [ ] **Step 1: Localizar o array `PILARES`**

Procure por `// ─── Pilares data ───` em `components/EbbinghausSection.tsx`. O bloco atual é:

```tsx
// ─── Pilares data ─────────────────────────────────────────────────────────────
const PILARES = [
  {
    id: 'ilusao',
    icon: '↻',
    label: 'O Ciclo da Ilusão',
    text: 'Você entende na aula, mas o cérebro trata como lixo e descarta em horas.',
    color: ORANGE,
  },
  {
    id: 'obesidade',
    icon: '≡',
    label: 'Obesidade Mental',
    text: 'Resumos e PDFs acumulados são apenas peso morto. Eles não viram memória.',
    color: RED,
  },
  {
    id: 'branco',
    icon: '□',
    label: 'O Branco Premonitório',
    text: 'O esquecimento ataca no momento mais caro: as 4 horas de ENEM.',
    color: VIOLET,
  },
] as const;
```

- [ ] **Step 2: Substituir o bloco inteiro**

Substituir o bloco acima (do comentário `// ─── Pilares data ───` até o `] as const;`) por:

```tsx
// ─── Momentos data ────────────────────────────────────────────────────────────
const MOMENTOS = [
  {
    id: 'segunda',
    timestamp: 'SEGUNDA, 23h',
    narrativa: 'Fecho o último PDF. Sinto que produzi. Na quarta alguém comenta o tema — e dá branco. Releio o resumo. Não é o mesmo.',
    soco: 'Não é preguiça. É como o cérebro foi feito.',
    color: ORANGE,
  },
  {
    id: 'quinta',
    timestamp: 'QUINTA, 6h50',
    narrativa: 'Abro o caderno da semana passada. Os grifos coloridos parecem trabalho de outra pessoa. Tenho que reler do zero.',
    soco: 'A pilha de PDF cresce. A memória, não.',
    color: RED,
  },
  {
    id: 'domingo',
    timestamp: 'DOMINGO, prova rolando',
    narrativa: 'A questão é exatamente sobre aquele assunto. Estudei. Revi. Marquei. E agora não vem.',
    soco: 'Quatro meses inteiros, reféns de um instante de dúvida.',
    color: VIOLET,
  },
] as const;
```

- [ ] **Step 3: NÃO buildar ainda**

O arquivo agora está temporariamente quebrado — `PilarCard` referencia `PILARES.icon/label/text` que não existem mais. Será corrigido nas próximas tasks. Não buildar nem commitar agora.

---

## Task 3: Remover `PilarCard` e adicionar `Momento`

**Files:**
- Modify: `components/EbbinghausSection.tsx` (~linhas 103-181, bloco `function PilarCard`)

**Why:** O componente novo `Momento` substitui o `PilarCard` no mesmo lugar do arquivo, preservando a organização visual.

- [ ] **Step 1: Localizar e remover `PilarCard`**

Procure por `// ─── PilarCard` em `components/EbbinghausSection.tsx`. Apague todo o bloco do comentário até o `}` final do componente (inclusive). Apague também o comentário separador.

- [ ] **Step 2: Inserir o componente `Momento` no mesmo lugar**

No lugar onde estava `PilarCard`, insira:

```tsx
// ─── Momento — uma estação do stack (nó pulsante + texto) ───────────────────
function Momento({
  timestamp, narrativa, soco, color, index,
}: {
  timestamp: string; narrativa: string; soco: string; color: string; index: number;
}) {
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } };

  return (
    <motion.div
      role="listitem"
      className="relative"
      {...enter}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: 0.15 * index, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Nó pulsante alinhado à linha vertical */}
      <span
        aria-hidden
        className="absolute -left-[18px] sm:-left-[26px] top-1.5 block rounded-full"
        style={{
          width: 10,
          height: 10,
          background: color,
          boxShadow: `0 0 0 3px rgba(18,18,18,0.95), 0 0 12px ${color}, 0 0 24px ${color}80`,
        }}
      />
      <p
        className="text-xs font-black uppercase tracking-widest mb-2"
        style={{
          color: color,
          textShadow: `0 0 12px ${color}, 0 0 24px ${color}80`,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {timestamp}
      </p>
      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{narrativa}</p>
      <p className="text-sm sm:text-base text-white font-bold mt-3 leading-relaxed">{soco}</p>
    </motion.div>
  );
}
```

- [ ] **Step 3: Atualizar o import do framer-motion**

No topo do arquivo, o import atual é:

```tsx
import { motion, useInView } from 'framer-motion';
```

Trocar por:

```tsx
import { motion, useInView, useReducedMotion } from 'framer-motion';
```

- [ ] **Step 4: NÃO buildar ainda**

Ainda falta o `MomentoStack` e o JSX principal. Próxima task.

---

## Task 4: Adicionar `MomentoStack` com linha vertical animada

**Files:**
- Modify: `components/EbbinghausSection.tsx` (logo abaixo do componente `Momento`)

- [ ] **Step 1: Inserir o componente `MomentoStack`**

Logo abaixo do componente `Momento` (e antes do comentário `// ─── Main component ───`), insira:

```tsx
// ─── MomentoStack — container vertical com linha animada conectando momentos ──
function MomentoStack() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="list"
      aria-label="Três momentos de um estudante real"
      className="relative pl-7 sm:pl-10"
    >
      {/* Linha vertical contínua (gradient laranja → vermelho → violeta) */}
      <motion.div
        aria-hidden
        className="absolute left-2 sm:left-3 top-2 bottom-2 w-px"
        style={{
          background: `linear-gradient(180deg, ${ORANGE} 0%, ${RED} 50%, ${VIOLET} 100%)`,
          transformOrigin: 'top',
          boxShadow: `0 0 12px ${RED}55`,
        }}
        initial={reduceMotion ? { opacity: 0 } : { scaleY: 0 }}
        whileInView={reduceMotion ? { opacity: 1 } : { scaleY: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      <div className="space-y-8 sm:space-y-10">
        {MOMENTOS.map((m, i) => (
          <Momento
            key={m.id}
            timestamp={m.timestamp}
            narrativa={m.narrativa}
            soco={m.soco}
            color={m.color}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: NÃO buildar ainda**

O JSX principal ainda usa `<PilarCard>` que não existe mais. Próxima task fecha o loop.

---

## Task 5: Atualizar JSX principal (rótulo + uso de `MomentoStack`)

**Files:**
- Modify: `components/EbbinghausSection.tsx` (bloco "Pilares do Desastre" no `EbbinghausSection`)

- [ ] **Step 1: Localizar o bloco do main JSX**

Dentro de `EbbinghausSection`, procure pelo comentário `{/* ── Pilares do Desastre ── */}`. O bloco atual é:

```tsx
{/* ── Pilares do Desastre ── */}
<div className="mb-4 sm:mb-14 relative z-10">
  <motion.p
    className="text-center text-xs font-bold tracking-widest uppercase mb-7"
    style={{ color: RED, fontFamily: 'ui-monospace, monospace' }}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.4 }}
  >
    &gt; PILARES DO DESASTRE
  </motion.p>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {PILARES.map((p, i) => (
      <PilarCard key={p.id} {...p} index={i} />
    ))}
  </div>
</div>
```

- [ ] **Step 2: Substituir o bloco inteiro**

Substituir o bloco acima por:

```tsx
{/* ── Três momentos que você já viveu ── */}
<div className="mb-4 sm:mb-14 relative z-10">
  <motion.p
    className="text-center text-xs font-bold tracking-widest uppercase mb-7"
    style={{ color: RED, fontFamily: 'ui-monospace, monospace' }}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.4 }}
  >
    &gt; TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU
  </motion.p>
  <MomentoStack />
</div>
```

- [ ] **Step 3: Rodar typecheck/build**

Run: `pnpm build`
Expected: build conclui sem erros. Nenhuma referência pendente a `PILARES` ou `PilarCard` (você removeu nas tasks 2 e 3).

Se aparecer "Cannot find name 'PILARES'" ou "Cannot find name 'PilarCard'", grep o arquivo:

```bash
grep -n "PILARES\|PilarCard" components/EbbinghausSection.tsx
```

Não deve retornar nada. Se retornar, remova as referências antes de seguir.

- [ ] **Step 4: Commit**

```bash
git add components/EbbinghausSection.tsx
git commit -m "feat(ebbinghaus): stack vertical scroll-telling com 3 momentos em 1ª pessoa"
```

---

## Task 6: Verificação visual completa (desktop + mobile + reduced-motion)

**Files:** nenhum a modificar — só validação.

- [ ] **Step 1: Subir o dev server em background**

Run em background: `pnpm dev`
Aguarde o "Ready" no log antes de seguir.

- [ ] **Step 2: Validação desktop (≥1024px)**

Abra `http://localhost:3000/` no Chrome.

Role até "Seu cérebro foi programado para esquecer." Confirme:
- [ ] Subhead novo aparece com "O problema nunca foi seu esforço — foi te entregarem um método que a ciência já provou que falha." em branco bold
- [ ] Gráfico Ebbinghaus (curva laranja + linha violeta/neon) renderiza idêntico ao antes
- [ ] Rótulo `> TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU` aparece em vermelho mono
- [ ] Linha vertical com gradient laranja → vermelho → violeta aparece
- [ ] Linha anima (cresce do topo pra baixo) ao entrar no viewport
- [ ] 3 momentos aparecem na ordem SEGUNDA → QUINTA → DOMINGO com fade-in + slide-from-left
- [ ] Cada nó pulsante está alinhado à linha vertical
- [ ] Sem warnings no console (React keys, hydration, etc.)

- [ ] **Step 3: Validação mobile (~390px)**

Abra DevTools → Toggle device toolbar → iPhone 14 Pro (390x844). Recarregue.

Confirme:
- [ ] Sem overflow horizontal (sem scroll lateral)
- [ ] Stack vertical legível com padding adequado
- [ ] Linha + nós visualmente alinhados
- [ ] Texto narrativa/soco em `text-sm` (não cresceu)

- [ ] **Step 4: Validação `prefers-reduced-motion`**

DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce".

Recarregue e role até a seção. Confirme:
- [ ] Linha vertical aparece estática (sem scaleY anim)
- [ ] Momentos aparecem com opacity, sem slide-from-left
- [ ] Gráfico Ebbinghaus segue funcionando (não regredimos nada lá)

- [ ] **Step 5: Matar o dev server**

```bash
pkill -f "next dev"
```

- [ ] **Step 6: Se algum checkpoint falhou, abra issue inline**

Se algum item visual falhou (overflow, alinhamento, animação), corrija no `components/EbbinghausSection.tsx` antes de seguir. Commit a correção como `fix(ebbinghaus): <descrição curta>`.

- [ ] **Step 7: Verificação final do escopo (nada quebrou)**

```bash
grep -n "PILARES\|PilarCard" components/EbbinghausSection.tsx
```

Expected: nada retornado (código morto removido).

```bash
git diff main --stat
```

Expected: apenas `components/EbbinghausSection.tsx` modificado (e a spec/plan committada antes). Nada mais.

---

## Self-review (já feito pelo autor do plano)

**Spec coverage:**
- ✅ Subhead reescrito → Task 1
- ✅ Rótulo `> TRÊS MOMENTOS...` → Task 5
- ✅ Array `MOMENTOS` com 3 itens → Task 2
- ✅ Componente `Momento` → Task 3
- ✅ Componente `MomentoStack` com linha animada → Task 4
- ✅ Remover `PILARES` + `PilarCard` → Tasks 2 e 3
- ✅ `prefers-reduced-motion` → Tasks 3 e 4 (uso de `useReducedMotion`)
- ✅ Mobile padding `pl-7 sm:pl-10` → Task 4
- ✅ Critérios de aceitação 1–12 → Task 6 (checklist visual)

**Placeholder scan:** sem TBD/TODO/incomplete. Cada step tem código completo ou comando exato.

**Type consistency:** `MOMENTOS` items têm `id/timestamp/narrativa/soco/color` — usados consistentemente nas tasks 2, 3 e 4. `Momento` recebe `timestamp/narrativa/soco/color/index`. `MomentoStack` não recebe props.
