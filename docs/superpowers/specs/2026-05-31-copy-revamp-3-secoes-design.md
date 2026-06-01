# Spec — Copy Revamp das 3 Seções (Motor IA / Revisão Automática / Recuperação)

**Data:** 2026-05-31
**Owner:** brunomatheus
**Status:** Aprovado

---

## 1. Objetivo

Reescrever a copy (eyebrow + headline + subtitle) de 3 seções da landing page que estão **visualmente fortes mas fracas em convencimento**. As headlines atuais são abstratas demais ("Engenharia da Memória", "Sua memória no piloto automático"), não distinguem o produto de qualquer SaaS edutech, e perdem a voz tática que o brand tem em outras partes do site.

**Princípio guia (vindo de debate multi-agente — copywriter direct-response + estudante ENEM real + brand strategist):**

> Toda headline da landing precisa conter **um verbo de ação visível no app** OU **uma cena que o aluno consegue ver acontecendo no dia da prova**. Se a frase funcionaria pra um CRM de vendas, joga fora.

**Narrativa-âncora entre as 3 seções** (não explícita na copy, mas estruturante):

- Seção 1 (Motor IA): **A IA conhece você**
- Seção 2 (Revisão Automática): **A IA trabalha por você**
- Seção 3 (Hora da Verdade): **A IA vence por você**

---

## 2. Escopo de arquivos

| Arquivo | Linhas a editar | Tipo |
|---|---|---|
| `components/NeuralEcosystemFlow.tsx` | ~486-503 | Edit (eyebrow + headline + subtitle) |
| `components/BlindagemEngine.tsx` | ~360-377 | Edit (eyebrow + headline + subtitle) |
| `components/TacticalRecovery.tsx` | ~332-354 | Edit (eyebrow + headline + subtitle + remover dependência do "97%") |

Zero arquivo novo. Zero modificação em outros componentes. Zero mexer em CSS/animação/visual fora do texto e do span de gradient.

**Nota sobre WIP existente:** os 3 arquivos já têm pequenos edits de copy não commitados (terminology refresh: `NEURAL CORE` → `MOTOR IA`, `RECUPERAÇÃO TÁTICA` → `RECUPERA O QUE VOCÊ ESQUECEU`, etc.). Essas mudanças são intencionais e alinhadas com a direção deste spec — devem ser **preservadas** e commitadas junto com as novas headlines. Os outros 30+ arquivos com WIP no repo **não devem ser tocados**.

---

## 3. Seção 1 — MOTOR IA (`NeuralEcosystemFlow.tsx`)

### 3.1 Estado atual (depois do WIP existente)

```tsx
// linha ~486
>_ MOTOR IA

// linha ~489-495
<h2>
  A Engenharia da{' '}
  <span style={{ color: NEON, textShadow: ... }}>Memória.</span>
</h2>

// linha ~497-503
<p>
  Conheça o{' '}
  <span className="text-white font-semibold">Motor IA</span>
  : a tecnologia do FlashAprova que garante que você{' '}
  <span style={{ color: V_LIGHT }}>nunca mais perca</span>{' '}
  o que estudou.
</p>
```

### 3.2 Copy nova

```tsx
// Eyebrow
>_ MOTOR IA · 3 SISTEMAS ATIVOS

// Headline (manter o gradient span; deslocar pra última frase do título)
<h2>
  A IA estuda você.{' '}
  <span style={{ color: NEON, textShadow: ... }}>
    Enquanto você estuda a matéria.
  </span>
</h2>

// Subtitle (reescrita completa, manter o tag <p> e classes existentes)
<p>
  Um sistema <span className="text-white font-semibold">mapeia o que você ainda não sabe</span>.{' '}
  Outro marca o <span className="text-white font-semibold">dia exato de cada revisão</span>.{' '}
  O terceiro responde sua dúvida em <span style={{ color: V_LIGHT }}>4 segundos</span>.{' '}
  Juntos, fazem o trabalho do cursinho — com 5% do esforço.
</p>
```

**Decisões visuais:**
- Eyebrow ganha sufixo `· 3 SISTEMAS ATIVOS` — antecipa os 3 anéis da seção, mantém o mesmo estilo mono.
- Headline: gradient NEON aplicado na **segunda frase** ("Enquanto você estuda a matéria.") — preserva o destaque visual, dá ritmo de 2 cláusulas (statement + twist).
- Subtitle: usa o mesmo padrão de spans destacados que o original (3 `text-white font-semibold` + 1 `V_LIGHT`), só troca o conteúdo.

---

## 4. Seção 2 — REVISÃO AUTOMÁTICA POR IA (`BlindagemEngine.tsx`)

### 4.1 Estado atual

```tsx
// linha ~363
> Revisão Automática por IA

// linha ~365-373
<h2>
  Sua memória no{' '}
  <span style={{ background: linear-gradient(NEON → CYAN), ... }}>
    piloto automático.
  </span>
</h2>

// linha ~374-377
<p>
  Pare de gerenciar revisões. <strong>Enquanto você descansa</strong>, a Revisão
  Automática por IA calcula o timing exato para <strong>revisar no momento exato</strong>.
</p>
```

### 4.2 Copy nova

```tsx
// Eyebrow (uppercase pra dar mais autoridade)
> REVISÃO AUTOMÁTICA POR IA

// Headline (gradient na última frase, que é o ato cinematográfico)
<h2>
  O card volta{' '}
  <span style={{ background: linear-gradient(NEON → CYAN), ... }}>
    1 dia antes de você esquecer.
  </span>
</h2>

// Subtitle (3 frases: contraste, mecanismo, ação física)
<p>
  Anki te obriga a montar deck. Aqui, a IA olha seus <strong>últimos 72h de erros</strong> e
  empurra os <strong>12 cards</strong> que seu cérebro vai apagar amanhã. Você abre,
  responde, fecha. <strong>15 minutos</strong>.
</p>
```

**Decisões visuais:**
- Eyebrow vai pra UPPERCASE (consistência com Seção 1 e brand tático).
- Headline: gradient NEON→CYAN aplicado na cláusula que carrega o mecanismo ("1 dia antes de você esquecer") — esse é o "wow" da frase.
- Subtitle: mantém o uso de `<strong>` do original (3 destaques), mas agora ancorados em **números** (72h, 12 cards, 15 minutos). Cita Anki abertamente — o lead conhece e confia.

---

## 5. Seção 3 — HORA DA VERDADE (`TacticalRecovery.tsx`)

### 5.1 Estado atual (depois do WIP existente)

```tsx
// linha ~337
> RECUPERA O QUE VOCÊ ESQUECEU

// linha ~339-349
<h2>
  Lembre{' '}
  <span style={{ background: linear-gradient(NEON → CYAN), ... }}>
    97%
  </span>
  {' '}na hora do ENEM.
</h2>

// linha ~350-353
<p>
  Esqueça apenas a concorrência. Nossa tecnologia garante que a resposta correta
  salte na sua mente no momento de maior pressão:{' '}
  <span className="text-white font-semibold">na hora da prova</span>.
</p>
```

### 5.2 Copy nova

```tsx
// Eyebrow (substitui completamente — vai direto ao momento da prova)
> HORA DA VERDADE

// Headline (remove o "97%" — não tem fonte verificável; coloca gradient nas
//  3 palavras finais que carregam o payoff)
<h2>
  Quando bater o branco,{' '}
  <span style={{ background: linear-gradient(NEON → CYAN), ... }}>
    a resposta volta.
  </span>
</h2>

// Subtitle (reescrita completa: mecanismo + contraste cinematográfico)
<p>
  Cada card que você revisou aqui foi treinado <strong>sob pressão simulada</strong>
  — contagem regressiva, sem consulta. Quando chega a prova, o cérebro já passou
  por aquele momento dezenas de vezes. <span className="text-white font-semibold">O resto da sala trava. Você dispara.</span>
</p>
```

**Decisões visuais:**
- O gradient NEON→CYAN que antes destacava "97%" agora destaca **"a resposta volta"** — preserva o highlight visual sem inventar número sem fonte.
- Subtitle: mantém o `text-white font-semibold` final do original, mas agora carregando a frase de impacto ("O resto da sala trava. Você dispara.") que é o **contraste cinematográfico** que devolve a voz tática perdida.

---

## 6. O que NÃO mudar (anti-escopo)

- **Zero alteração visual** fora da copy: tokens de cor, animações, layout, SVG, canvas, gradient definitions — tudo permanece.
- **Estrutura JSX** preservada: mesmas tags (`<h2>`, `<p>`, `<span>`), mesmas classes Tailwind, mesmos style objects. Só o conteúdo textual e a posição do `<span>` de gradient mudam.
- **Não mexer** em nenhum outro componente da landing, mesmo os que têm WIP no repo (são edits independentes de outro fluxo).
- **Não criar** novo termo de marca tipo "Núcleo SRS-7" ou "Segundo do Apagão" (sugeridos pelos agentes, descartados pelo owner por preferência de clareza imediata).
- **Não inventar** prova social, screenshot ou número que não exista (Lucas — o agente estudante — alertou: lead BS-detector pune isso).

---

## 7. Critérios de aceitação

- [ ] `components/NeuralEcosystemFlow.tsx`: eyebrow, headline e subtitle batem 1:1 com a seção 3.2 deste spec
- [ ] `components/BlindagemEngine.tsx`: eyebrow, headline e subtitle batem 1:1 com a seção 4.2
- [ ] `components/TacticalRecovery.tsx`: eyebrow, headline e subtitle batem 1:1 com a seção 5.2
- [ ] Nas 3 seções, o `<span>` de gradient (com `background: linear-gradient(...)` ou `textShadow: ...`) está envolvendo as palavras especificadas, não as antigas
- [ ] WIP existente nos 3 arquivos (terminology refresh em linhas não relacionadas à copy alvo) está preservado no mesmo commit
- [ ] Zero outros arquivos modificados
- [ ] `npx tsc --noEmit` passa sem erros novos
- [ ] Visual no `npm run dev`: as 3 seções continuam renderizando, gradient destaca as palavras certas, layout intacto

---

## 8. Plano de roteamento (handoff)

- **Brainstorm + síntese de copy:** Opus 4.7 (eu) + 3 agentes Opus paralelos com personas distintas
- **Implementação:** delegar a 1 subagent Sonnet 4.6 (trabalho mecânico de Edit em 3 arquivos com strings exatas fornecidas)
- **Verificação visual final:** owner (você) no browser
