# Spec — Seção "Como Funciona em 4 Passos" na Landing

**Data:** 2026-05-31
**Owner:** brunomatheus
**Status:** Aprovação pendente

---

## 1. Objetivo

Adicionar uma nova seção na landing page que mostra a **dinâmica de uso do FlashAprova em 4 passos**, posicionada logo abaixo da primeira dobra (entre o `AuthorityBanner` e a comparação de métodos), respondendo à pergunta natural do lead: *"ok, e como eu uso isso?"*.

**Princípio guia:** mostrar **quão fácil é começar**. Cada passo precisa transmitir tempo curto e explícito, baixa fricção, e a sensação de que o algoritmo trabalha pelo usuário (não o contrário).

**Resultado esperado para o lead:** entender em <30 segundos de leitura que o esforço inicial é de **3 minutos** (diagnóstico) e o esforço diário é de **15 minutos**, sem cadastro, sem montar deck, sem configurar nada.

---

## 2. Posicionamento

**Arquivo:** `app/LandingPage.tsx`
**Slot:** entre linha 656 (fim do `<AuthorityBanner />`) e linha 659 (início da seção `METHODS COMPARISON` com `EbbinghausSection` + `AnkiComparison`).

A nova seção entra **antes** das comparações teóricas (Anki/Ebbinghaus) porque o lead precisa entender o produto concreto antes de ser convencido da fundamentação científica.

Substitui zero conteúdo existente.

---

## 3. Arquitetura

### 3.1 Componente novo

**Arquivo:** `components/ComoFuncionaSteps.tsx`
**Export:** default (`export default function ComoFuncionaSteps()`)
**Tipo:** `'use client'` (usa `framer-motion`, `useInView`)
**Auto-contido:** não importa nada de outros componentes da landing. Mockups SVG são reimplementados inline (incluindo versões reduzidas de Radar e Heatmap — copiar evita acoplamento entre componentes não relacionados).

### 3.2 Integração na LandingPage

Adicionar:

```tsx
// Junto dos outros dynamic imports (linha ~26-37):
const ComoFuncionaSteps = dynamic(() => import('@/components/ComoFuncionaSteps'), {
  ssr: false,
  loading: () => <SkeletonBlock h={720} />,
});

// No JSX, entre AuthorityBanner (:656) e a section de methods comparison (:659):
<LazySection minHeight={720}>
  <ComoFuncionaSteps />
</LazySection>
```

### 3.3 Tokens de cor (reutilizados, já definidos em LandingPage.tsx)

| Token | Hex | Uso na seção |
|---|---|---|
| `NEON` | `#00FF73` | Timeline vertical, números `[NN]`, selos `auto`, destaques de "15 min" |
| `VIOLET` | `#7C3AED` | Sublabels técnicos do SRS (passo 4), eyebrow shimmer |
| `ORANGE` | `#FF8A00` | Destaques de "lacuna" no mockup do passo 2 |
| Mono font | `JetBrains Mono` | Labels `[01]`–`[04]`, badges de tempo, microcopy técnico |

---

## 4. Conteúdo dos 4 passos

Cada passo segue a mesma estrutura visual: **`[NN]` numerador mono + título uppercase + badge de tempo + 1 frase de copy + selo de fricção + mini-mockup SVG à direita**.

### Passo `[01]` — DIAGNÓSTICO IA

- **Badge de tempo:** `3 min`
- **Copy:** "Responda 12 perguntas rápidas. A IA mapeia em quais tópicos do edital você está vulnerável."
- **Selo de fricção:** `SEM CADASTRO · COMEÇA NA HORA`
- **Mockup à direita:** Card de quiz mostrando uma pergunta de Física + 4 chips de alternativa. Um chip está hovered/selecionado em neon. Embaixo, barra de progresso `4 / 12` em neon.
- **Intenção:** prova visual de que "começar" = 1 clique e responder. Não é cadastro, não é tutorial.

### Passo `[02]` — PLANO PERSONALIZADO

- **Badge de tempo:** `auto`
- **Copy:** "Em segundos você recebe seu mapa de lacunas e um plano focado nos 20% que valem 80% da nota."
- **Selo de fricção:** `GERADO PELA IA · SEM CONFIGURAR NADA`
- **Mockup à direita:** Mini-radar (versão reduzida do `RadarMockup` que existe em `LandingPage.tsx:232`), com 2 eixos pulsando em laranja indicando "lacunas críticas detectadas". Tag flutuante: `3 lacunas críticas` em laranja.
- **Intenção:** mostra que o app *faz o trabalho pelo usuário* — sem montar deck, sem escolher matéria, sem configurar algoritmo.

### Passo `[03]` — REVISÃO DIÁRIA

- **Badge de tempo:** `15 min/dia`
- **Copy:** "Todo dia o app entrega só os flashcards que você está prestes a esquecer. Responde, marca a dificuldade, pronto."
- **Selo de fricção:** `SÓ O QUE IMPORTA HOJE · ZERO PLANEJAMENTO`
- **Mockup à direita:** Flashcard estilizado com efeito flip leve. Frente: pergunta curta de Biologia. Verso visível em sombra: resposta + 3 botões coloridos (`Difícil` laranja / `Bom` verde / `Fácil` neon). Anotação `≈ 30s por card` embaixo.
- **Intenção:** este é o "produto real". Tem que ser tátil, com botões reconhecíveis de SRS sem nomear "SM-2".

### Passo `[04]` — ALGORITMO SRS BLINDA

- **Badge de tempo:** `automático, 24/7`
- **Copy:** "Acertou fácil? Volta daqui a 7 dias. Errou? Volta amanhã. O algoritmo calcula sozinho o intervalo perfeito pra cada card."
- **Selo de fricção:** `BASEADO EM EBBINGHAUS · AJUSTE CONTÍNUO`
- **Mockup à direita:** Mini-heatmap (versão reduzida do `HeatmapMockup` que existe em `LandingPage.tsx:284`), com 3 células destacadas em neon brilhante + uma linha de timeline embaixo mostrando: `Card #A → revisão em 1d / 3d / 7d / 18d` (intervalos crescentes).
- **Intenção:** responde à pergunta "como o algoritmo controla as revisões" e transmite o alívio cognitivo de que **estudar fica menor com o tempo, não maior**.

---

## 5. Header da seção (acima dos 4 passos)

```
[ COMO FUNCIONA ]                              ← eyebrow mono, NEON
Do zero ao primeiro flashcard em 3 minutos.    ← H2, branco, font-black ("3 minutos" em <Neon>)
Sem deck, sem configuração, sem mentor.        ← subtítulo, slate-400
```

- Eyebrow: `text-xs font-bold tracking-widest uppercase`, cor `NEON`
- Headline: `text-3xl sm:text-4xl font-black text-white`, "3 minutos" wrapeado no componente `<Neon>` que já existe (`LandingPage.tsx:365`). O `<Neon>` é local na LandingPage — replicar inline em `ComoFuncionaSteps` (componente trivial, 6 linhas).
- Subtítulo: `text-slate-400 text-sm sm:text-base`
- Layout: centralizado, `mb-12 sm:mb-16` antes da timeline

---

## 6. Microcopy de fechamento (entre os passos e o CTA)

Card simples centrado:

```
─────────────────────────────────────
Tempo total/dia depois do diagnóstico:
            15 minutos
[ menos que rolar o feed do Instagram ]
─────────────────────────────────────
```

- Container: `max-w-md mx-auto`, border dashed `rgba(255,255,255,0.08)`, background `rgba(0,255,115,0.03)`, `rounded-2xl`, `py-6 px-8`
- Frase superior: `text-sm text-slate-400`
- "15 minutos": `text-4xl font-black`, cor `NEON`, glow via `textShadow`
- Microcopy inferior em mono: `text-xs`, opacity 50%, cor `NEON`

---

## 7. CTA da seção

Reusa `<CTAButton size="lg" label="GERAR MEU DIAGNÓSTICO IA" />` definido em `LandingPage.tsx:332`.

**Problema:** `CTAButton` é local na LandingPage e não está exportado. Solução: replicar inline em `ComoFuncionaSteps.tsx` (componente de ~30 linhas) — mantém o componente auto-contido e o custo é baixo. Não criar shared component agora (YAGNI: só dois lugares usariam).

Embaixo do botão, em `text-xs` opacity 35%, cor branca:
```
3 min · sem cadastro · sem cartão
```

---

## 8. Layout responsivo

### Desktop (`sm:` e acima)
- Cada passo: 2 colunas. Texto à esquerda, mockup à direita. Gap entre eles ~48px.
- Timeline vertical neon corre na **borda esquerda** dos números `[01]`–`[04]`.
- Container: `max-w-5xl mx-auto px-10`

### Mobile
- Cada passo empilha: **mockup acima**, bloco de texto abaixo (mantém ordem visual de "olho vai pro mockup primeiro").
- Timeline vertical: ainda existe, mas mais sutil (apenas ponto de conexão entre passos).
- Container: `max-w-5xl mx-auto px-4`

---

## 9. Animações

- **Entrada de cada passo:** `framer-motion` com `useInView`. Fade + slide-up de 16px. Stagger 120ms entre os 4 passos.
- **Linha vertical neon:** se desenha de cima pra baixo conforme cada passo entra. Animar `height` ou `pathLength` em SVG. Trigger: quando o primeiro passo entra no viewport, a linha inteira começa o desenho.
- **Hover state nos mockups:** ganham glow neon leve, número `[NN]` vai de opacity 70 → 100.
- **Sem loops de animação contínuos nos mockups** (custo de performance, e não há necessidade narrativa).

---

## 10. Escopo de arquivos

| Arquivo | Ação | Linhas estimadas |
|---|---|---|
| `components/ComoFuncionaSteps.tsx` | **Criar** (novo, auto-contido) | ~350–420 |
| `app/LandingPage.tsx` | **Editar**: 1 import dinâmico + 1 `<LazySection>` no slot `:657` | +4 |

Zero modificação em outros componentes. Zero export novo. Zero dependência nova no `package.json`.

---

## 11. Critérios de aceitação

- [ ] `components/ComoFuncionaSteps.tsx` existe e tem default export
- [ ] Header com eyebrow `[ COMO FUNCIONA ]`, H2 com "3 minutos" em neon, subtítulo "Sem deck, sem configuração, sem mentor"
- [ ] Timeline vertical neon ligando os 4 passos (desenho animado conforme entram no viewport)
- [ ] 4 passos com: número `[NN]`, título uppercase, badge de tempo, copy, selo de fricção, mockup à direita (desktop) / acima (mobile)
- [ ] Mockups SVG: Quiz Card (passo 1), Mini-Radar com lacunas pulsando (passo 2), Flashcard com botões de dificuldade (passo 3), Mini-Heatmap + timeline de intervalos (passo 4)
- [ ] Microcopy de fechamento com "15 minutos" destacado e linha mono "[ menos que rolar o feed do Instagram ]"
- [ ] CTA `GERAR MEU DIAGNÓSTICO IA` (size lg) + microcopy `3 min · sem cadastro · sem cartão`
- [ ] Layout responsivo: timeline + mockup empilham em mobile, lado a lado a partir de `sm`
- [ ] Import + `<LazySection minHeight={720}>` registrados em `LandingPage.tsx` entre o `AuthorityBanner` e a seção de comparison
- [ ] `npx tsc --noEmit` (ou equivalente do projeto) passa sem erros novos
- [ ] Animações de stagger funcionando ao scrollar a seção pra dentro do viewport

---

## 12. Fora do escopo (YAGNI explícito)

- Animações de loop contínuas nos mockups (só hover state)
- Testes unitários ou de componente (projeto não tem suíte de testes para componentes da landing — verificável: nenhum `*.test.tsx` na pasta `components/`)
- Variantes A/B
- Tracking analytics adicional
- Tradução / i18n
- Storybook ou docs do componente
- Extração de `<CTAButton>` ou `<Neon>` para shared components
- Modificações em outras seções da landing

---

## 13. Plano de roteamento de modelos (para o handoff)

Seguindo a preferência de economia de tokens registrada na memória `feedback_model_routing`:

- **Planejamento (este spec):** Opus 4.7 — concluído
- **Implementação:** delegar a subagent com modelo **Sonnet 4.6**. Sonnet é suficiente para os mockups SVG (alinhamento e spacing têm nuance), enquanto Haiku poderia falhar na precisão visual.
- **Follow-ups menores (typo, ajuste de copy, troca de cor):** podem ir pra Haiku 4.5.

O subagent recebe este spec por inteiro e executa contra os critérios da seção 11.
