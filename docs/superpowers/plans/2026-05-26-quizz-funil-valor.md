# Quizz como Funil de Valor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o `/quizz` num funil que faz o lead entender o app — entrada leve, microinsights entre cards, 10 cards (bio/quím/hist/geo) — mantendo a maquinaria dramática e a captura de lead/diagnóstico.

**Architecture:** Duas mudanças. (1) `flashcardData.ts`: reduzir para 4 matérias (adicionar geografia, remover filosofia/sociologia), expandir o deck para 10 cards reais, e fazer `buildTestDeck` retornar os 10. (2) `OnboardingFlow.tsx`: reescrever o copy da tela de boas-vindas (Step 1) e inserir interstitials de microinsight entre cards específicos do Step 2.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, framer-motion. Sem test runner — verificação por `npm run build` (typecheck) e walkthrough manual no browser (`npm run dev`).

---

## File Structure

- `app/onboarding/flashcardData.ts` — tipos de matéria, metadados, deck de 10 cards, builder. (modificar)
- `app/onboarding/OnboardingFlow.tsx` — fluxo do quizz: Step 1 (boas-vindas), Step 2 (cards + insights), Step 3 (loading + LeadGate). (modificar)

Não há arquivos novos. Os microinsights ficam como uma constante + um sub-estado dentro de `OnboardingFlow.tsx` (coesos com o fluxo que os usa).

---

## Task 1: Reestruturar matérias e deck em `flashcardData.ts`

**Files:**
- Modify: `app/onboarding/flashcardData.ts`

- [ ] **Step 1: Substituir tipo, metadados e mapa de área**

Substituir as linhas 1–20 (de `export type SubjectId` até o fim de `AREA_MAP`) por:

```ts
export type SubjectId = 'biologia' | 'quimica' | 'historia' | 'geografia';

export const SUBJECT_META: Record<SubjectId, {
  name: string; icon: string; color: string; area: string;
}> = {
  biologia:  { name: 'Biologia',  icon: '🧬', color: '#22c55e', area: 'Ciências da Natureza' },
  quimica:   { name: 'Química',   icon: '⚗️', color: '#06b6d4', area: 'Ciências da Natureza' },
  historia:  { name: 'História',  icon: '🏛️', color: '#eab308', area: 'Ciências Humanas' },
  geografia: { name: 'Geografia', icon: '🌍', color: '#f97316', area: 'Ciências Humanas' },
};

// ─── ENEM area mapping (for Radar) ──────────────────────────────────────────
export const AREA_MAP: Record<SubjectId, 'natureza' | 'humanas'> = {
  biologia:  'natureza',
  quimica:   'natureza',
  historia:  'humanas',
  geografia: 'humanas',
};
```

- [ ] **Step 2: Substituir o `DIAGNOSTIC_DECK` por 10 cards**

Substituir o array `DIAGNOSTIC_DECK` (linhas ~30–50) por:

```ts
export const DIAGNOSTIC_DECK: DiagnosticCard[] = [
  // ── Biologia ×3 ──
  { id: 'bio1', subject: 'biologia',
    q: 'Qual processo garante a variabilidade genética durante a formação dos gametas?',
    a: 'Crossing-over (permutação)' },
  { id: 'bio2', subject: 'biologia',
    q: 'Qual organela é responsável pela respiração celular e pela produção de ATP?',
    a: 'Mitocôndria' },
  { id: 'bio3', subject: 'biologia',
    q: 'Na fotossíntese, qual gás a planta absorve e qual ela libera?',
    a: 'Absorve CO₂ e libera O₂' },

  // ── Química ×2 ──
  { id: 'qui1', subject: 'quimica',
    q: 'Como se chama a reação entre um ácido e uma base que produz sal e água?',
    a: 'Neutralização' },
  { id: 'qui2', subject: 'quimica',
    q: 'Que tipo de ligação ocorre pela transferência de elétrons entre um metal e um ametal?',
    a: 'Ligação iônica' },

  // ── História ×3 ──
  { id: 'his1', subject: 'historia',
    q: 'Como ficou conhecido o período autoritário de Getúlio Vargas entre 1937 e 1945?',
    a: 'Estado Novo' },
  { id: 'his2', subject: 'historia',
    q: 'Em que ano foi assinada a Lei Áurea, que aboliu a escravidão no Brasil?',
    a: '1888' },
  { id: 'his3', subject: 'historia',
    q: 'Qual movimento levou Getúlio Vargas ao poder em 1930, encerrando a República Velha?',
    a: 'Revolução de 1930' },

  // ── Geografia ×2 ──
  { id: 'geo1', subject: 'geografia',
    q: 'Qual fenômeno é intensificado pelo acúmulo de gases como o CO₂ na atmosfera, elevando a temperatura do planeta?',
    a: 'Efeito estufa' },
  { id: 'geo2', subject: 'geografia',
    q: 'Qual é o tipo de clima predominante na maior parte do território brasileiro?',
    a: 'Tropical' },
];
```

- [ ] **Step 3: Fazer `buildTestDeck` retornar os 10 cards**

Substituir a função `buildTestDeck` (linhas ~62–67) por:

```ts
export function buildTestDeck(chosenSubject: SubjectId): DiagnosticCard[] {
  const chosen = DIAGNOSTIC_DECK.filter(c => c.subject === chosenSubject);
  const others = shuffle(DIAGNOSTIC_DECK.filter(c => c.subject !== chosenSubject));
  return [...chosen, ...others];
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run build`
Expected: build passa sem erros de tipo. (Se acusar uso de `filosofia`/`sociologia`, é resíduo — não deve haver, pois grep confirmou que só `flashcardData.ts` os usava.)

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/flashcardData.ts
git commit -m "feat(quizz): 4 materias (add geografia) e deck de 10 cards"
```

---

## Task 2: Reescrever a tela de boas-vindas (Step 1) em `OnboardingFlow.tsx`

**Files:**
- Modify: `app/onboarding/OnboardingFlow.tsx:374-424` (bloco `step === 1`)

- [ ] **Step 1: Substituir o cabeçalho e o footer do Step 1**

No bloco `{step === 1 && (...)}`, substituir o `<div className="text-center mb-10">...</div>` (o eyebrow + h1 + parágrafo, linhas ~376–387) por:

```tsx
              <div className="text-center mb-10">
                <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
                  Teste rápido · 10 cards · ~2 min
                </p>
                <h1 className="text-white font-black text-3xl sm:text-4xl leading-tight mb-3">
                  Bora ver como tá sua memória pro{' '}
                  <span style={{ color: GREEN, textShadow: `0 0 20px ${GREEN}80` }}>ENEM?</span>
                </h1>
                <p className="text-slate-400 text-base max-w-md mx-auto">
                  Responde 10 cards comigo, sem pressão. No fim, te mostro uma coisa sobre como você aprende.
                </p>
              </div>
```

- [ ] **Step 2: Suavizar o texto de chamada do grid e o footer**

Trocar o footer do Step 1 (linha ~421–423):

```tsx
              <p className="text-center text-slate-700 text-xs mt-6">
                10 cards · ~2 min · grátis
              </p>
```

E, dentro de cada botão de matéria, trocar o label de ação "Testar agora →" (linha ~414) por:

```tsx
                      <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>
                        Começar por aqui →
                      </span>
```

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: passa sem erros.

- [ ] **Step 4: Verificação manual no browser**

Run: `npm run dev` e abrir `http://localhost:3000/quizz`
Expected: tela de boas-vindas mostra o novo H1 leve, 4 matérias (Biologia, Química, História, Geografia), footer "10 cards · ~2 min · grátis". Sem o eyebrow "Diagnóstico Personalizado por IA" nem "por onde dói mais".

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/OnboardingFlow.tsx
git commit -m "feat(quizz): tela de boas-vindas leve e despretensiosa"
```

---

## Task 3: Microinsights entre cards (interstitials) em `OnboardingFlow.tsx`

**Files:**
- Modify: `app/onboarding/OnboardingFlow.tsx`

- [ ] **Step 1: Definir os dados dos insights**

Adicionar, logo após a definição de `SCORE_MAP` (linha ~193), a constante de insights. A chave é o índice (0-based) do card recém-respondido; o insight aparece após esse card.

```ts
interface Insight { tag: string; title: string; body: string; curve?: boolean; }

const INSIGHTS: Record<number, Insight> = {
  0: {
    tag: 'MÉTODO',
    title: 'Isso que você acabou de fazer tem nome',
    body: 'Tentar lembrar antes de ver a resposta é recall ativo — o esforço de puxar da memória é o que realmente fixa. Reler não faz isso.',
  },
  2: {
    tag: 'MEMÓRIA',
    title: 'Por que você esquece',
    body: 'Sem revisar, você esquece ~70% disso em 7 dias. Não é burrice — é a curva do esquecimento. Todo cérebro funciona assim.',
    curve: true,
  },
  4: {
    tag: 'FLASHAPROVA',
    title: 'Onde o app entra',
    body: 'O FlashAprova calcula a hora exata de te mostrar cada card de novo — bem antes de você esquecer. Cada aluno tem o próprio ritmo.',
  },
  7: {
    tag: 'POR QUE FUNCIONA',
    title: 'Caderno x flashcard',
    body: 'Caderno e resumo dão a ilusão de que você aprendeu. O card te obriga a provar. Por isso 10 min de flashcard valem mais que 1h relendo.',
  },
};
```

- [ ] **Step 2: Adicionar o sub-estado do insight**

Após o estado `const [step, setStep] = useState(1);` (linha ~242), adicionar:

```tsx
  const [insightIdx, setInsightIdx] = useState<number | null>(null);
```

- [ ] **Step 3: Disparar o insight no `handleRate` em vez de avançar direto**

Substituir o bloco final do `handleRate` (o `const next = cardIndex + 1; if (next < testDeck.length) {...} else {...}`, linhas ~299–311) por:

```tsx
    const next = cardIndex + 1;
    if (next < testDeck.length) {
      if (INSIGHTS[cardIndex]) {
        setInsightIdx(cardIndex);   // mostra interstitial; avanço acontece no "continuar"
      } else {
        setCardIndex(next);
        setShowAnswer(false);
        setElapsed(0);
      }
    } else {
      // Quiz done → loading → lead form
      setFinalData({ results: newResults, health: newHealth });
      setAnalyzing(true);
      setStep(3);
      setTimeout(() => setAnalyzing(false), 1500);
    }
```

- [ ] **Step 4: Adicionar o handler de "continuar" do insight**

Adicionar uma função logo após `handleRate` (antes de `handleLeadEmail`, linha ~313):

```tsx
  function dismissInsight() {
    if (insightIdx === null) return;
    setInsightIdx(null);
    setCardIndex(insightIdx + 1);
    setShowAnswer(false);
    setElapsed(0);
  }
```

- [ ] **Step 5: Renderizar o interstitial dentro do Step 2**

Dentro do bloco `{step === 2 && subject && currentCard && (...)}`, a condição de render do card deve ceder lugar ao insight quando `insightIdx !== null`. Envolver o conteúdo existente do card e adicionar o painel de insight. Trocar a abertura do bloco do card (logo após `<HealthBar health={health} />`, antes do "Subject badge", linha ~457) para renderizar condicionalmente.

Substituir a linha do header `{step === 2 && subject && currentCard && (` permanece igual; logo após `<HealthBar health={health} />` (linha ~456), inserir:

```tsx
              {insightIdx !== null ? (
                <InsightPanel insight={INSIGHTS[insightIdx]} onContinue={dismissInsight} />
              ) : (
              <>
```

E fechar o fragmento logo antes do fechamento do `<div>` do Step 2 (depois do bloco dos botões de ação, antes do `</div>` que fecha `{step === 2 && ...}`, linha ~534), adicionar:

```tsx
              </>
              )}
```

(O "Subject badge", o "Card", e os "Action buttons" existentes ficam dentro do `<>...</>`.)

- [ ] **Step 6: Criar o componente `InsightPanel`**

Adicionar o componente antes de `export default function OnboardingFlow()` (linha ~218):

```tsx
// ─── Insight interstitial ─────────────────────────────────────────────────────
function ForgettingCurve() {
  return (
    <svg width="100%" viewBox="0 0 260 90" className="mt-4" aria-hidden="true">
      <line x1="10" y1="78" x2="250" y2="78" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="10" y1="8"  x2="10"  y2="78" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M10,14 C60,55 110,70 250,76" fill="none" stroke={RED} strokeWidth="2.5"
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${RED}80)` }} />
      <text x="16" y="12" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">100%</text>
      <text x="210" y="74" fill={RED} fontSize="9" fontFamily="monospace">~30% em 7 dias</text>
    </svg>
  );
}

function InsightPanel({ insight, onContinue }: { insight: Insight; onContinue: () => void }) {
  return (
    <div className="relative rounded-3xl p-7 sm:p-9 mb-5 fade-up" style={cardStyle}>
      {topShimmer}
      <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: CYAN }}>
        💡 {insight.tag}
      </p>
      <h3 className="text-white font-black text-xl leading-snug mb-3">{insight.title}</h3>
      <p className="text-slate-300 text-base leading-relaxed">{insight.body}</p>
      {insight.curve && <ForgettingCurve />}
      <button onClick={onContinue}
        className="mt-6 w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        style={{
          background: 'rgba(124,58,237,0.15)',
          border: `1px solid rgba(124,58,237,0.40)`,
          color: '#c4b5fd',
          boxShadow: '0 0 20px rgba(124,58,237,0.10)',
        }}>
        Continuar →
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run build`
Expected: passa sem erros. (Atenção a tags `<>`/`</>` balanceadas no Step 2.)

- [ ] **Step 8: Verificação manual no browser**

Run: `npm run dev` e percorrer `http://localhost:3000/quizz` do início ao fim.
Expected:
- Após responder o 1º card → interstitial "MÉTODO" (recall ativo) com botão "Continuar →".
- Após o 3º card → interstitial "MEMÓRIA" com a curva do esquecimento desenhada.
- Após o 5º card → interstitial "FLASHAPROVA".
- Após o 8º card → interstitial "POR QUE FUNCIONA".
- Demais cards avançam direto, sem interstitial.
- Após o 10º card → loading "IA analisando" → LeadGate normal → checkout.
- Barra de saúde e alertas continuam funcionando durante os cards.

- [ ] **Step 9: Commit**

```bash
git add app/onboarding/OnboardingFlow.tsx
git commit -m "feat(quizz): microinsights entre cards (interstitials)"
```

---

## Self-Review (preenchido pelo autor do plano)

- **Spec coverage:** matérias/deck → Task 1; boas-vindas leve → Task 2; microinsights (abordagem A, 4 ideias) → Task 3; maquinaria/LeadGate/checkout intocados → garantido (nenhuma task os altera). ✓
- **Placeholder scan:** sem TODO/TBD; todo código está completo. ✓
- **Type consistency:** `Insight`/`INSIGHTS` definidos na Task 3 Step 1; `InsightPanel`/`ForgettingCurve` usam `cardStyle`, `topShimmer`, `CYAN`, `RED` já existentes no arquivo; `insightIdx` consistente entre estado, `handleRate`, `dismissInsight` e render. ✓
```
