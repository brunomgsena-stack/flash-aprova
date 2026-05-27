# Quizz como funil de valor — design

**Data:** 2026-05-26
**Arquivos principais:** `app/onboarding/flashcardData.ts`, `app/onboarding/OnboardingFlow.tsx`

## Contexto e problema

Os CTAs da landing (`CTAButton` em `app/LandingPage.tsx`, `AnkiComparison.tsx`, e `router.push('/quizz')` no `HeroSection.tsx`) levam o lead ao `/quizz`, que renderiza `OnboardingFlow`. O funil atual:

1. **Step 1** — eyebrow "Diagnóstico Personalizado por IA" + "Vamos começar por onde dói mais no ENEM?" → escolher matéria (tom agressivo).
2. **Step 2** — "STRESS TEST ATIVO": cards com barra de Saúde da Memória caindo + alertas de lacuna (tom de medo).
3. **Step 3** — loading "IA analisando" → `LeadGate` ("RAIO-X CONCLUÍDO", estética hacker/terminal) → captura de lead → `/checkout`.

Tudo é construído em cima de medo/urgência. O lead não entende o que o app faz; é empurrado direto pro pitch.

**Objetivo:** transformar o quizz num pequeno funil que faz o lead **entender o app** e perceber valor, mantendo a captura de lead e o diagnóstico. A **entrada** deve parecer despretensiosa e entregar muito valor.

## Decisões (alinhadas com o usuário)

- O quizz deve fazer o lead captar **as 4 ideias**: sentir o método na pele, perceber que esquece muito, ver que o app é feito pra ele, e entender o diferencial vs estudar sozinho.
- **Arco leve → dramático:** entrada amigável; clímax dramático no `LeadGate` (mantido).
- **Primeira interação:** boas-vindas amigável + escolha leve de matéria (sem "onde dói mais").
- **Valor no miolo:** microinsights entre os cards, ensinando o método progressivamente.
- **Maquinaria dramática** (barra de saúde, alertas, Radar, loading, `LeadGate`) **mantida desde o card 1** — só a entrada e o tom dos insights são leves.
- **10 flashcards** contemplando **biologia, química, história e geografia**.

## Mudanças

### 1. Matérias e deck — `flashcardData.ts`

- `SubjectId` passa a ser `'biologia' | 'quimica' | 'historia' | 'geografia'`. Remover `filosofia` e `sociologia` (usadas apenas neste arquivo — verificado por grep).
- `SUBJECT_META`: manter biologia, quimica, historia; **adicionar `geografia`** (`name: 'Geografia'`, `icon: '🌍'`, `color: '#f97316'`, `area: 'Ciências Humanas'`). Ajustar `historia` se necessário para consistência de área.
- `AREA_MAP`: `biologia` e `quimica` → `'natureza'`; `historia` e `geografia` → `'humanas'`. Isso alimenta o Radar do checkout, que lê `data.radar['natureza' | 'humanas']` (`CheckoutPage.tsx:525`).
- `DIAGNOSTIC_DECK`: **10 cards** reais estilo ENEM, distribuídos:
  - biologia ×3, química ×2, história ×3, geografia ×2.
  - IDs sequenciais por matéria (`bio1..bio3`, `qui1..qui2`, `his1..his3`, `geo1..geo2`).
- `buildTestDeck(chosenSubject)`: **retornar os 10 cards** — cards da matéria escolhida primeiro, o restante embaralhado. (Hoje tenta montar 10 mas o deck só tem 5, então caem 5.)

**Cards (rascunho — texto final no implementation):**
- Biologia: crossing-over; função da mitocôndria; fotossíntese (reagentes/produtos).
- Química: neutralização (ácido+base); ligação iônica vs covalente.
- História: Estado Novo (1937–45); Lei Áurea (1888); Era Vargas / Revolução de 1930.
- Geografia: efeito estufa vs camada de ozônio; tipos de clima brasileiro.

### 2. Tela de boas-vindas (Step 1 reescrita) — `OnboardingFlow.tsx`

- Remover eyebrow "Diagnóstico Personalizado por IA" e o H1 "por onde dói mais".
- Novo conteúdo (tom leve):
  - Eyebrow neutro/curto.
  - H1: ~"Bora ver como tá sua memória pro ENEM?"
  - Subtítulo: ~"Responde 10 cards comigo, sem pressão — no fim te mostro uma coisa sobre como você aprende."
  - Grid das **4 matérias** com chamada neutra ("escolha por onde começar"), em vez de "que mais te preocupa".
  - Footer: "10 cards · ~2 min · grátis".
- O grid renderiza `Object.entries(SUBJECT_META)` — passará a mostrar 4 matérias automaticamente.

### 3. Microinsights entre cards (abordagem A)

Interstitial curto após cards em **posições específicas** (não após todos, pra não cansar). Cada um entrega uma das 4 ideias. Tom amigável, estética alinhada (violeta/cyan), 1 frase + botão "continuar".

- **Após o card 1 → método na pele:** "Você tentou lembrar antes de ver a resposta? Isso é *recall ativo* — o esforço de puxar da memória é o que fixa. Reler não faz isso."
- **Após o card 3 → esquece muito:** "Sem revisar, você esquece ~70% disso em 7 dias. Não é burrice — é a curva do esquecimento." + microvisual simples da curva.
- **Após o card 5 → feito pra você:** "O FlashAprova calcula a hora exata de te mostrar cada card de novo, antes de você esquecer."
- **Após o card 8 → diferencial:** "Caderno dá a ilusão de que aprendeu. O card te obriga a provar. Por isso 10 min de flashcard valem mais que 1h relendo."

**Implementação:** estrutura de dados mapeando posição do card → conteúdo do insight. Novo estado/sub-step "insight" entre `handleRate` e o avanço do card: quando o índice recém-respondido tem insight, mostra o interstitial; o "continuar" avança pro próximo card (ou pro loading/Step 3 se foi o último). O cálculo de health/alertas continua acontecendo no `handleRate` como hoje.

### 4. O que NÃO muda

- Barra de Saúde da Memória, `LacunaAlert`, Radar, `AnalysisLoader` ("IA analisando"), `LeadGate` ("RAIO-X"), `calcRadar`, e o handoff `router.push('/checkout')` via `localStorage` (`flashAprovaOnboarding`).
- Captura de lead no Supabase (`leads`) e o payload salvo no `localStorage`.
- Estrutura de scoring (`SCORE_MAP`, deltas de health, `buildAlertMsg`).

## Nota de tom (aceita)

A tela de card mantém "STRESS TEST ATIVO" e os alertas desde o card 1 (maquinaria preservada por decisão do usuário). Há leve contraste com a entrada leve; os microinsights suavizam. Ajustável depois se desejado.

## Fora de escopo

- Mudar `LeadGate`, checkout, ou os CTAs da landing.
- Capturar dados extras de personalização (objetivo/curso) na entrada.
- Reescrever a estética dramática das telas de card/resultado.
