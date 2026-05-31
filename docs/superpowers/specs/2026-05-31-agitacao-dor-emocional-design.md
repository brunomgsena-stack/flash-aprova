# Agitação da Dor — Camada Emocional na EbbinghausSection

**Data:** 2026-05-31
**Arquivo afetado:** `components/EbbinghausSection.tsx` (único)
**Render:** `app/LandingPage.tsx:662` (logo após `HeroSection` + `AuthorityBanner`)

## Objetivo

A seção atual é tecnicamente forte (curva de Ebbinghaus + 3 "Pilares do Desastre") mas comunica dor puramente técnica: esquecimento, peso morto, branco. Falta a dor emocional que faz o estudante de cursinho se reconhecer e parar de rolar.

Esta mudança troca a abordagem de "3 cards-pilar com rótulo dramático" por um **stack vertical scroll-telling** de 3 cenas reais em primeira pessoa, mostrando um estudante comum vivendo o ciclo de esquecimento ao longo de uma semana. Tom: visceralmente real, com soco emocional ao fim de cada cena. Sem rótulos como "Branco Premonitório" — substituídos por timestamps cotidianos ("SEGUNDA, 23h").

## Escopo

**Dentro:**
- Reescrever subhead da seção (manter dado 70%/24h, virar para tom de raiva qualificada)
- Substituir os 3 cards `PilarCard` por um stack vertical `MomentoStack` com linha animada
- Substituir o rótulo `> PILARES DO DESASTRE` por `> TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU`

**Fora:**
- Headline "Seu cérebro foi programado para esquecer." → mantém idêntico
- Gráfico SVG (Ebbinghaus + linha FlashAprova + zonas) → mantém idêntico
- `AnkiComparison` (seção seguinte) → fora
- CTAs gerais da LP → fora

## Copy final

### Subhead (substitui o atual)

> Você devora 8 horas de PDF por dia. Em 24h seu cérebro apaga 70% disso. **O problema nunca foi seu esforço — foi te entregarem um método que a ciência já provou que falha.**

Última frase em `text-white font-semibold` (mesma estrutura que o subhead atual usa).

### Rótulo da seção (substitui `> PILARES DO DESASTRE`)

> `> TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU`

Mantém cor `RED` e fonte mono, para coesão com os rótulos `> DIAGNÓSTICO DO SISTEMA` que já existem na seção.

### Stack de 3 momentos

**Momento 1 — cor `ORANGE` (#FF8A00)**
- Timestamp: `SEGUNDA, 23h`
- Narrativa: "Fecho o último PDF. Sinto que produzi. Na quarta alguém comenta o tema — e dá branco. Releio o resumo. Não é o mesmo."
- Soco: "Não é preguiça. É como o cérebro foi feito."

**Momento 2 — cor `RED` (#ef4444)**
- Timestamp: `QUINTA, 6h50`
- Narrativa: "Abro o caderno da semana passada. Os grifos coloridos parecem trabalho de outra pessoa. Tenho que reler do zero."
- Soco: "A pilha de PDF cresce. A memória, não."

**Momento 3 — cor `VIOLET` (#7C3AED)**
- Timestamp: `DOMINGO, prova rolando`
- Narrativa: "A questão é exatamente sobre aquele assunto. Estudei. Revi. Marquei. E agora não vem."
- Soco: "Quatro meses inteiros, reféns de um instante de dúvida."

## Arquitetura técnica

### Data structure

Remover o array `PILARES` e introduzir:

```ts
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

### Componentes a remover

- `function PilarCard({...})` — todo o componente (cards 3D tilt + cursor glow)

### Componentes a adicionar

**`<Momento>`** — uma estação do stack
- Props: `{ timestamp, narrativa, soco, color, index }`
- Layout: bloco com padding-left para deixar espaço para a linha + nó
- Nó pulsante absoluto à esquerda (reutilizar a lógica do `NodeDot` existente, mas inlinado para esta estação — sem `delay` por path, apenas `index * 0.15s`)
- Texto:
  - Timestamp: `text-xs uppercase tracking-widest font-bold`, cor da fase, fonte mono, `textShadow: 0 0 12px ${color}, 0 0 24px ${color}80`
  - Narrativa: `text-sm sm:text-base text-slate-300 leading-relaxed mt-2`
  - Soco: `text-sm sm:text-base text-white font-bold mt-3`
- Entrada: `initial={{opacity:0, x:-20}} whileInView={{opacity:1, x:0}} viewport={{once:true, margin:'-80px'}} transition={{duration:0.5, delay: 0.15 * index, ease:[0.22,1,0.36,1]}}`

**`<MomentoStack>`** — container com linha vertical animada
- Props: nenhum (lê `MOMENTOS` direto)
- Layout: `<div className="relative pl-7 sm:pl-10">`
- Linha vertical:
  - `<motion.div>` `absolute left-3 top-2 bottom-2 w-px`
  - `style={{ background: 'linear-gradient(180deg, ${ORANGE}, ${RED}, ${VIOLET})', transformOrigin: 'top', boxShadow: '0 0 12px ${RED}55' }}`
  - `initial={{ scaleY: 0 }}` + `whileInView={{ scaleY: 1 }}` + `viewport={{ once: true, margin: '-100px' }}` + `transition={{ duration: 1.2, ease: 'easeInOut' }}`
- Filhos: `{MOMENTOS.map((m, i) => <Momento key={m.id} {...m} index={i} />)}`
- Gap entre momentos: `space-y-8 sm:space-y-10`

### Substituição no JSX principal

Trocar este bloco em `EbbinghausSection`:

```tsx
{/* ── Pilares do Desastre ── */}
<div className="mb-4 sm:mb-14 relative z-10">
  <motion.p ...>&gt; PILARES DO DESASTRE</motion.p>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {PILARES.map((p, i) => <PilarCard key={p.id} {...p} index={i} />)}
  </div>
</div>
```

Por:

```tsx
{/* ── Três momentos que você já viveu ── */}
<div className="mb-4 sm:mb-14 relative z-10">
  <motion.p ...>&gt; TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU</motion.p>
  <MomentoStack />
</div>
```

### Acessibilidade

- `<MomentoStack>` recebe `role="list"` e `aria-label="Três momentos de um estudante real"`
- Cada `<Momento>` recebe `role="listitem"`
- Respeitar `prefers-reduced-motion` via `useReducedMotion()` do framer-motion:
  - Linha vertical: aparece com `opacity` em vez de `scaleY`
  - Momentos: sem `x: -20` — apenas opacity

### Mobile (≤640px)

- Stack vertical já é mobile-native — sem mudança de layout
- `pl-7` em vez de `pl-10`
- Texto narrativa/soco fica em `text-sm` (não cresce para `text-base`)
- Espaçamento entre momentos: `space-y-8`

### Performance

- Componente segue sendo carregado via `dynamic({ ssr: false })` em `LandingPage.tsx:27`
- Sem novas deps (framer-motion já é usado)
- Sem imagens novas, sem fontes novas

## Critérios de aceitação

1. Subhead reescrito está visível com a última frase em destaque (branco bold)
2. Rótulo da seção diz exatamente `> TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU`
3. Stack vertical renderiza 3 momentos na ordem: SEGUNDA → QUINTA → DOMINGO
4. Linha vertical conecta os 3 nós com gradiente laranja → vermelho → violeta
5. Linha vertical anima (scaleY 0→1) quando o stack entra no viewport
6. Cada momento faz fade-in + slide-from-left com stagger ao entrar no viewport
7. Em mobile (≤640px) o layout segue legível, sem overflow horizontal
8. `prefers-reduced-motion: reduce` desliga as animações de transform mantendo opacity
9. Curva de Ebbinghaus (gráfico SVG) renderiza idêntica ao estado atual
10. Headline "Seu cérebro foi programado para esquecer." segue idêntica
11. `AnkiComparison` (seção seguinte) segue funcionando normalmente
12. Sem warnings novos no console (React keys, hydration, etc.)

## Verificação

- Rodar `pnpm dev` e abrir `/` (LP pública)
- Validar desktop (≥1024px), tablet (~768px) e mobile (~390px)
- Validar com DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
- Confirmar via Network que nenhum asset novo é baixado
- Conferir que o gráfico Ebbinghaus segue animando como antes
