# Checkout Pricing Redesign — Spec

**Data:** 2026-05-26  
**Arquivo alvo:** `app/checkout/CheckoutPage.tsx`  
**Objetivo:** Atualizar seção de planos para arquitetura de preço anual com ancoragem de 3 planos.

---

## Contexto

FlashAprova vende apenas plano anual. O plano do meio (Protocolo Neural, R$397/ano) é o produto principal. Os outros dois servem como âncoras: Essencial (decoy barato/incompleto) e Black (âncora premium). Os links ASAAS permanecem inalterados — apenas a apresentação muda. Preços à vista removidos de todos os cards.

Mapeamento de IDs:
- `aceleracao` → Essencial (R$297/ano)
- `panteao_elite` → Protocolo Neural (R$397/ano) ← principal
- `black` → Protocolo Black (R$997/ano)

---

## Estrutura de alterações

### 1. Copy antes dos cards

Inserir acima da grid de planos:

- **Título:** "Escolha seu protocolo de aprovação"
- **Subtítulo:** "Todos os planos são anuais. Você entra uma vez e usa o sistema durante toda a sua preparação."
- **Texto de direcionamento:** "A maioria dos alunos escolhe o Protocolo Neural porque ele libera o sistema completo de retenção, IA e redação por menos de R$ 1,09 por dia."

### 2. Plano 1 — FlashAprova Essencial (aceleracao)

| Campo | Valor |
|---|---|
| Nome | FlashAprova Essencial |
| Badge | BÁSICO |
| Preço principal | R$ 297/ano |
| Parcelamento | ou 12x de R$ 29,16 |
| Subtítulo | Para quem quer apenas revisar com flashcards. |
| CTA | QUERO SÓ OS FLASHCARDS |
| Microcopy | Ideal para quem já tem estratégia própria. |

**Incluídos:** Flashcards SRS ilimitados, Revisão por matéria, Dashboard básico, Acesso por 12 meses, Progresso salvo automaticamente.

**Bloqueados (visual apagado):** Tutor IA 24/7, Radar de Lacunas avançado, Correção de Redação IA, Simulados TRI, Especialistas IA.

**Visual:** Card menor, borda roxa discreta, sem glow dominante, sem badge "recomendado".

### 3. Plano 2 — Protocolo Neural (panteao_elite) ← PRINCIPAL

| Campo | Valor |
|---|---|
| Nome | Protocolo Neural |
| Badge principal | MAIS ESCOLHIDO |
| Badge secundária | MELHOR CUSTO-BENEFÍCIO |
| Preço principal | R$ 397/ano |
| Parcelamento | ou 12x de R$ 33,08 |
| Reforço | menos de R$ 1,09 por dia |
| Headline | O sistema completo para não esquecer o que estudou até o ENEM. |
| CTA | GARANTIR MINHA VAGA |
| Microcopy | Garantia incondicional de 7 dias. Risco zero. |
| Texto comparação | Por só R$ 100 a mais que o Essencial, você desbloqueia o sistema completo. |

**Incluídos:** Tudo do Essencial + Dashboard + heatmap, Radar de Lacunas, Algoritmo SRS, Resumos Storytelling, Tabelas comparativas, 15 Especialistas IA, Tutor IA 24/7, Correção de Redação com IA, Treinos e simulados direcionados, Acesso por 12 meses.

**Visual:** Card central maior, borda verde neon (`#22c55e`), glow verde, fundo levemente mais contrastado, badge "MAIS ESCOLHIDO" no topo, botão verde neon dominante. É claramente a melhor opção.

### 4. Plano 3 — Protocolo Black (black)

| Campo | Valor |
|---|---|
| Nome | Protocolo Black |
| Badge | PREMIUM |
| Preço principal | R$ 997/ano |
| Parcelamento | ou 12x de R$ 99,70 |
| Subtítulo | Para quem quer acompanhamento estratégico máximo. |
| CTA | APLICAR PARA O BLACK |
| Microcopy | Indicado para quem quer máxima personalização. |

**Incluídos:** Tudo do Protocolo Neural + Análise avançada de desempenho, Plano estratégico semanal, Correções extras de redação, Prioridade na IA, Rotas personalizadas por curso, Modo intensivo reta final, Suporte prioritário, Diagnóstico avançado por área, Recomendações de estudo de alto impacto.

**Visual:** Borda dourada/âmbar discreta, botão outline neutro (sem glow), NÃO mais chamativo que o Protocolo Neural.

---

## Tabela comparativa (3 colunas)

Título: "Compare os protocolos"

| Recurso | Essencial | Protocolo Neural | Black |
|---|---|---|---|
| Flashcards SRS ilimitados | ✓ | ✓ | ✓ |
| Dashboard básico | ✓ | ✓ | ✓ |
| Dashboard + heatmap | — | ✓ | ✓ |
| Radar de Lacunas | — | ✓ | ✓ |
| Resumos Storytelling | — | ✓ | ✓ |
| Tabelas comparativas | — | ✓ | ✓ |
| 15 Especialistas IA | — | ✓ | ✓ |
| Tutor IA 24/7 | — | ✓ | ✓ |
| Correção de Redação IA | — | ✓ | ✓ |
| Simulados/Treinos direcionados | — | ✓ | ✓ |
| Plano estratégico semanal | — | — | ✓ |
| Prioridade na IA | — | — | ✓ |
| Suporte prioritário | — | — | ✓ |

Coluna "Protocolo Neural" destacada com cor verde neon.

---

## Blocos após os cards

### Garantia
- **Título:** "Garantia incondicional de 7 dias"
- **Texto:** "Entre, teste o FlashAprova e veja se o sistema faz sentido para sua rotina. Se não sentir clareza no plano de estudo, devolvemos 100% do valor. Sem pergunta, sem burocracia."

### Urgência leve
- **Título:** "Acesso liberado em menos de 2 minutos"
- **Texto:** "Após a confirmação, seus flashcards, diagnóstico, radar de lacunas e tutores IA ficam disponíveis imediatamente."

---

## Regras de implementação

1. **Não alterar** `ASAAS_LINKS`, `PlanId`, `handleBuy` ou qualquer lógica de pagamento.
2. **Manter** todos os componentes internos (`RadarChart`, `NarrativeReport`, `InsightsPanel`, `EvidenceCarousel`).
3. **Mobile:** Protocolo Neural primeiro no mobile via `order` CSS ou estrutura de grid, ou destacado muito claramente se no meio.
4. **Design tokens** existentes (`GREEN`, `VIOLET`, `CYAN`, etc.) devem ser reutilizados.
5. **Tabela comparativa** deve ter 4 colunas (Recurso + 3 planos), com Protocolo Neural destacado.
6. Manter responsividade do layout atual (grid `lg:grid-cols-3`).
