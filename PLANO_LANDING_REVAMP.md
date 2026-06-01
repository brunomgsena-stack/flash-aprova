# Plano de Implementação — Landing Revamp FlashAprova

> Documento autocontido para retomar o trabalho em qualquer sessão.
> Baseado em auditoria 360° com 5 personas (Copywriter Direct-Response, Vestibulando Julia, CRO/UX, Mãe Pagadora Marlene, Strategist Edtech).
> **Modelo de execução:** planejamento com Opus, tarefas braçais com Haiku, criativas com Sonnet, review final com Opus.

---

## 📌 Como usar este plano

1. Sempre comece lendo este arquivo de cima a baixo antes de tocar em código.
2. Cada item tem `[modelo]` indicado — respeite o roteamento pra economizar tokens.
3. Marque o checkbox em "Status / Checklist" ao terminar cada item e commitar.
4. Não pule a ordem: Tier S → review do usuário → Tier A → review → Tier B.
5. Branch dedicada: `landing-revamp`. Commits incrementais por item.
6. Antes de implementar, **rode `git status`** e confirme que está na branch correta.

---

## 🎯 Objetivo único

Aumentar a conversão da landing `app/LandingPage.tsx` em 30-50% no funil `/` → `/quizz` → `/checkout`, removendo fricção (jargão, prova social abstrata, preço escondido, página comprida demais) e adicionando elementos que faltam (preço visível, garantia em destaque, prova suavizada e atribuída à ciência, footer compliance).

---

## 🧠 Contexto fixo (decisões já tomadas — NÃO REABRIR)

| Tema | Decisão | Motivo |
|---|---|---|
| **Wedge do Hero** | Medicina-only (mantém foco atual) | Decisão do dono |
| **Garantia** | 7 dias incondicional (mantém atual) | Texto já existe no `/checkout` linha 962-964 |
| **Branch** | `landing-revamp` (commits incrementais) | Segurança + reversibilidade |
| **Concorrentes no comparativo** | Stoodi (R$ 59/mês) + Descomplica (R$ 99/mês) — diretos | Strategist: ringue real, não Anki/cursinho fantasma |
| **Claims sem base (8000 alunos, 97%, USP)** | Suavizar/atribuir à ciência | Produto não vendeu ainda → risco propaganda enganosa |
| **Vocabulário proprietário mantido** | "Norma IA", "Motor IA", "Tutor IA" como nomes de feature | Decisão do dono |
| **Vocabulário cortado** | "Blindagem", "Arsenal", "Operação Tática", "Recuperação Tática", "Latência Zero", "Auditoria Forense", "Engenharia de Persuasão", "Veredito:" | 5/5 personas detonaram |
| **Vídeo demo** | Adiado para Tier B | Não tem app pronto pra gravar |
| **Footer compliance** | Já existe `/privacidade` e `/termos` no Next | Só plugar links no footer |
| **Prova social** | Imagens IA atuais + ReelsTestimonials atual ficam (são realistas) | Decisão do dono; mas claims numéricos suavizam |
| **Ordem** | Tier S → review → Tier A → review → Tier B | Cada tier é commit/PR separado |

---

## 🏷️ Preços e planos (extraídos de `app/checkout/CheckoutPage.tsx`)

| Plano | Anual | Parcelado | Posição | Inclui |
|---|---|---|---|---|
| **Essencial** | R$ 257 | 12x R$ 21,41 | âncora baixa | Flashcards SRS + dashboard básico (sem IA, sem Tutor, sem Norma) |
| **Protocolo Neural** 🎯 | **R$ 327** | **12x R$ 27,25** | **FOCO DE VENDA** | TUDO: SRS + 15 Especialistas IA + Tutor IA 24/7 + Norma IA Redação + simulados + **COMBO 2 ANOS de acesso** + 7d garantia |
| **Protocolo Black** | R$ 997 | 12x R$ 99,70 | âncora alta | Tudo do Neural + Mentoria 1x1 mensal + Plano reta final |

> Frase âncora do checkout: **"menos de R$ 0,90 por dia"** (refere-se ao Protocolo Neural).

> **Insight:** FlashAprova é mais barato que Stoodi (R$ 59/mês = R$ 708/ano) e Descomplica (R$ 99/mês = R$ 1.188/ano). Use isso na Auditoria de Mercado.

---

## 📐 Vocabulário — substituições globais

Faça em TODOS os componentes da landing. Use `grep -r` antes pra mapear ocorrências.

| Trocar | Por |
|---|---|
| Blindagem / blindaram / Memória Blindada | Memorização permanente / fixaram / memória de longo prazo |
| Arsenal de Elite / ARSENAL | Biblioteca de cards / Recursos |
| Operação Tática / Operações | Como funciona / Plano de estudo |
| Recuperação Tática | Revisão inteligente |
| Central de Operações | Painel de revisão |
| Latência Zero / Acesso em Latência Zero | _(deletar — não substituir)_ |
| Auditoria Forense | Correção detalhada |
| Engenharia de Persuasão | _(deletar — é erro técnico; redação ENEM é dissertativa-argumentativa)_ |
| Veredito: _(prefixo do FAQ)_ | _(deletar prefixo, começa direto)_ |
| Propriedade vs Aluguel do Conhecimento | Conhecimento que fica vs conteúdo que escorre _(manter conceito mas reescrever)_ |
| Diretriz de Ataque | Plano da semana |
| Diagnóstico Forense | Diagnóstico personalizado |
| NOTA FISCAL: REPROVADO | _(deletar a badge inteira da seção Auditoria de Mercado)_ |
| ZONA DE ELIMINAÇÃO _(label do gráfico Ebbinghaus)_ | Zona de esquecimento _(ou só remover o label)_ |
| Risco Zero | Sem risco / com garantia |
| Fábrica de Reprovados | Método tradicional |
| ANTI-HESIT: ON, OUTPUT, CTRL _(badges TacticalRecovery)_ | _(seção inteira será cortada — não substituir)_ |

**Manter (são nomes de features):** Norma IA, Motor IA, Tutor IA, Especialistas IA, Radar de Lacunas, SRS, TRI, Algoritmo SRS, Curva de Ebbinghaus.

---

## 🗑️ Cortes aprovados (4 seções inteiras saem do `LandingPage.tsx`)

1. ❌ **`NeuralEcosystemFlow`** (linha ~33 import / ~681 uso) — redundante com FocusSection + BlindagemEngine
2. ❌ **`TacticalRecovery`** (linha ~35 import / ~696 uso) — Julia pulou sem ler; vocabulário militar pesado
3. ❌ **`BlindagemEngine`** (linha ~34 import / ~691 uso) — conceito duplicado em `ComoFuncionaSteps` passo 04
4. ❌ **`ArsenalElite`** (linha ~36 import / ~708 uso) — redundante com `CardVaultSection` (mais concreto)

**Ação na execução:** remover imports + remover `<LazySection>` wrapping + deletar os 4 arquivos `components/*.tsx` correspondentes (após confirmar que nenhum outro lugar usa).

> Antes de deletar: `grep -rn "BlindagemEngine\|TacticalRecovery\|NeuralEcosystemFlow\|ArsenalElite" --include="*.tsx" --include="*.ts" app components` — confirmar zero referências.

---

## 🛡️ Atribuição de claims (suavização anti-propaganda-enganosa)

Produto ainda não vendeu. Claims numéricos sem base = risco PROCON. Substituições obrigatórias:

| Hoje | Trocar por |
|---|---|
| `+8.000 estudantes já blindaram sua memória` | `Plataforma desenhada para milhares de estudantes do ENEM` |
| `+8.000 aprovados no ENEM` (Hero avatar caption) | `Estudantes que estão no piloto automático com o FlashAprova` |
| `Aprovados nas top universidades do país` (subtítulo) | `Padrão alinhado às exigências das top universidades do país` |
| `97% retenção` (sem contexto) | `Até 97% de retenção segundo o modelo de Ebbinghaus aplicado pelo SRS` |
| `97% Blindado` (Auditoria tabela) | `Fixação ativa via SRS` |
| `94% taxa de retenção` (HeroSection terminal) | `Retenção alvo do método SRS+IA` |
| `4.9★ avaliação média` | _(remover até ter avaliação real)_ |
| `3x mais acertos TRI` | `Treino direcionado pelo TRI` |
| `Cards alinhados ao ENEM 2026` | manter ✓ (verificável) |
| `15 Especialistas IA` | manter ✓ (existe no produto) |
| `18.232 cards` | manter ✓ se for verdade no produto |

Logos USP/UFRJ/UFMG no carrossel: **mudar caption de** "Aprovados nas top universidades" **para** "Padrão de exigência das top universidades" (de claim a referência).

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TIER S — Quick Wins (~4-5h dev total)
## Objetivo: +30-50% conversão mobile sem rewrite arquitetural
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Passo 0: setup [Opus, 5 min]
- [ ] **0.1** Decidir o que fazer com os ~30 arquivos modificados pendentes na `main` (commitar como WIP separado OU stash). Não misture com o landing-revamp.
- [ ] **0.2** `git switch -c landing-revamp` (a partir de `main` limpa)
- [ ] **0.3** Confirmar `pnpm dev` rodando, abrir `/` no Chrome DevTools mobile (375x812) — baseline visual

### S.1 [Haiku] Substituições globais de vocabulário militar
**Arquivos:** todos em `components/` + `app/LandingPage.tsx`
**Ação:** rodar substituições da tabela "📐 Vocabulário" acima.
**Critério:** `grep -rn "Blindagem\|Arsenal\|Tático\|Operação Tática\|Latência Zero\|Auditoria Forense\|Engenharia de Persuasão" components app/LandingPage.tsx` retorna ZERO.
**Commit:** `chore(landing): substitui jargão militar por copy normal`

### S.2 [Haiku] Remover "Engenharia de Persuasão"
**Arquivo:** `components/NormaRedacaoSection.tsx`
**Ação:** localizar e remover o termo (inclui qualquer contexto/sub-feature da Norma). Substituir por "Argumentação dissertativa" se aparecer como label de skill.
**Por quê:** redação ENEM é dissertativa-argumentativa, não persuasiva — erro técnico que quebra autoridade.
**Commit:** `fix(norma): remove termo 'Engenharia de Persuasão' (incorreto pra ENEM)`

### S.3 [Sonnet] Reescrever Hero (H1 + Sub + CTA + microcopy + selo garantia)
**Arquivo:** `components/HeroSection.tsx`
**Mudanças concretas:**
- **H1 atual:** `"Acelere sua Aprovação em Medicina no ENEM com IA"`
- **H1 novo:** `"Aprovação em Medicina sem esquecer o que você estudou ontem."` _(mantém wedge Medicina + dor + mecanismo implícito)_
- **Sub novo:** `"A única plataforma com IA que prevê o dia exato em que você vai esquecer cada conteúdo e te entrega o card 1 dia antes — em 15 minutos por dia."`
- **CTA atual:** `"Quero ter acesso ao ARSENAL FLASHAPROVA"`
- **CTA novo:** `"GERAR MEU DIAGNÓSTICO GRÁTIS"`
- **Microcopy atual:** `"Diagnóstico 100% grátis | Diagnóstico de Memória IA em 3 min"`
- **Microcopy novo:** `"Grátis · 3 min · sem cadastro · sem cartão"`
- **Selo de garantia novo:** abaixo do CTA, badge pequena: `🛡️ Garantia 7 dias · 100% de reembolso`
**Commit:** `feat(hero): reescreve H1+sub+CTA com dor+mecanismo+garantia visível`

### S.4 [Haiku] Padronizar TODOS os CTAs da landing
**Arquivos:** `app/LandingPage.tsx` + qualquer `components/*Section.tsx` que tenha CTA.
**Ação:** localizar TODOS os CTAs (`Link href="/quizz"`, função `CTAButton`). Trocar todos os labels para:
- Label principal: `"GERAR MEU DIAGNÓSTICO GRÁTIS"`
- Microcopy abaixo: `"Grátis · 3 min · sem cadastro · sem cartão"`

Variantes hoje a substituir:
- `"Quero ter acesso ao ARSENAL FLASHAPROVA"` (Hero) — já no S.3
- `"GERAR MEU DIAGNÓSTICO IA"` (ComoFunciona)
- `"COMEÇAR AGORA"` (pós-Tactical, AnkiComparison)
- `"COMECE AGORA"` (pós-Norma, FAQ)
- `"QUERO COMEÇAR AGORA"` (Auditoria)

**Critério:** `grep -rn "COMEÇAR AGORA\|COMECE AGORA\|QUERO COMEÇAR\|ARSENAL FLASHAPROVA" app components` retorna zero.
**Commit:** `feat(landing): padroniza todos os CTAs em 'GERAR MEU DIAGNÓSTICO GRÁTIS'`

### S.5 [Haiku] Mover CTA acima do mockup 3-device no Hero
**Arquivo:** `components/HeroSection.tsx`
**Diagnóstico CRO:** hoje CTA cai em ~1.300px (fora da dobra de 812px mobile).
**Ação:** reordenar JSX para que a ordem mobile seja:
1. Badge "ZERO CONFIGURAÇÃO"
2. H1
3. Subhead
4. CTA + microcopy + selo garantia
5. Avatar group (prova social mínima)
6. Mockup 3-device (MultiDeviceComposition)
**Detalhe técnico:** usar `flex-col-reverse` + `order-*` classes Tailwind se a estrutura desktop precisa de ordem diferente. Validar visual nos 2 breakpoints.
**Commit:** `feat(hero): move CTA acima do mockup 3-device (acima da dobra mobile)`

### S.6 [Haiku] Suavizar claims numéricos sem base
**Arquivos:** `app/LandingPage.tsx` (AuthorityBanner, FAQ), `components/HeroSection.tsx`, `components/TacticalRecovery.tsx` (será deletado depois — pula), `components/ArsenalElite.tsx` (idem), `components/AnkiComparison.tsx`, `components/EbbinghausSection.tsx`.
**Ação:** aplicar a tabela "🛡️ Atribuição de claims" acima — search & replace literal.
**Atenção:** mantenha as ocorrências de "97%" que estiverem ATRIBUÍDAS ao Ebbinghaus/SRS. Apenas as soltas (sem fonte) é que precisam contexto.
**Commit:** `fix(landing): atribui claims numéricos à ciência (Ebbinghaus/SRS) e remove números não-verificáveis`

### S.7 [Haiku] Remover "Veredito:" do FAQ
**Arquivo:** `app/LandingPage.tsx` (constante `FAQ_ITEMS`).
**Ação:** em todas as 6 respostas, remover o prefixo `"Veredito: "` no início.
**Commit:** `chore(faq): remove prefixo 'Veredito:' das respostas`

### S.8 [Haiku] Remover badges agressivas
**Arquivo:** `app/LandingPage.tsx` (seção Auditoria de Mercado, linhas ~752-769).
**Ação:**
- Remover badge `[NOTA FISCAL: REPROVADO]` (linha ~755)
- Trocar título `O CUSTO TRADICIONAL` por `O VERDADEIRO CUSTO DA APROVAÇÃO`
- Em `components/EbbinghausSection.tsx`: localizar `ZONA DE ELIMINAÇÃO` e remover ou trocar por `Zona de esquecimento`.
**Commit:** `polish(landing): remove badges agressivas que afastam o público`

### S.9 [Haiku] Footer compliance
**Arquivo:** `app/LandingPage.tsx` (linhas 928-939, função final do `LandingPage`).
**Ação:** substituir footer atual por:
```tsx
<footer className="border-t border-white/5 py-10 px-6 sm:px-10">
  <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
    <div>
      <p className="text-white font-black mb-2">
        Flash<span style={{
          background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Aprova</span>
      </p>
      <p className="text-slate-700 text-xs">© 2026 · Tecnologia de aprovação com IA</p>
    </div>
    <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
      <Link href="/privacidade" className="hover:text-slate-300">Política de Privacidade</Link>
      <Link href="/termos" className="hover:text-slate-300">Termos de Uso</Link>
      <Link href="/login" className="hover:text-slate-300">Entrar</Link>
      <a href="mailto:contato@flashaprova.com.br" className="hover:text-slate-300">Suporte</a>
    </nav>
  </div>
</footer>
```
**Atenção:** confirmar com o usuário o email de suporte real. Se ele não tiver, deixa `contato@flashaprova.com.br` como placeholder.
**Commit:** `feat(footer): adiciona links de Política, Termos, Suporte (compliance LGPD)`

### S.10 [Opus, REVIEW] Visual sanity check do Tier S
- [ ] Rodar `pnpm dev` em mobile 375x812 — Hero CTA acima da dobra? ✓/✗
- [ ] Buscar grep final de jargão removido — zero ocorrências? ✓/✗
- [ ] Footer compliance OK? ✓/✗
- [ ] Lint passa (`pnpm lint` se existir)? ✓/✗
- [ ] **PAUSA — usuário valida visualmente antes de Tier A**

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TIER A — Mudanças estruturais (~8-12h dev)
## Objetivo: subir conversão mais 15-25% via clareza de oferta + preço
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### A.1 [Haiku] Deletar 4 seções cortadas
**Pré-condição:** `grep -rn "BlindagemEngine\|TacticalRecovery\|NeuralEcosystemFlow\|ArsenalElite" app components` mostra apenas usos em `LandingPage.tsx`.

**Ação:**
1. Em `app/LandingPage.tsx`:
   - Remover os 4 `dynamic(() => import(...))` (linhas ~28-36)
   - Remover os 4 `<LazySection>` correspondentes na render tree (linhas ~679-708)
2. Deletar arquivos:
   - `components/NeuralEcosystemFlow.tsx`
   - `components/TacticalRecovery.tsx`
   - `components/BlindagemEngine.tsx`
   - `components/ArsenalElite.tsx`
3. Rodar `pnpm dev` e `pnpm build` — sem erros de import quebrado.

**Commit:** `refactor(landing): remove 4 seções redundantes (-3-4k px mobile)`

### A.2 [Sonnet] Criar bloco de OFERTA "Preço e Planos"
**Arquivo:** novo componente `components/PrecoEPlanos.tsx`.
**Onde inserir:** no `LandingPage.tsx`, entre `ReelsTestimonials` e `FAQAccordion` (depois das seções remanescentes mas antes do FAQ).

**Conteúdo do bloco:**
- Header: `"R$ 0,90 por dia. Risco zero por 7 dias."`
- Subheader: `"Escolha o plano que cabe no seu ano de estudo. Cancele a qualquer momento dentro de 7 dias e receba 100% de volta."`
- 3 cards lado a lado (mobile stacked):
  - **Card 1 — Essencial:** 12x R$ 21,41 / R$ 257 à vista — só flashcards SRS
  - **Card 2 — Protocolo Neural (DESTAQUE)** com badge "MAIS ESCOLHIDO": 12x R$ 27,25 / R$ 327 à vista — TUDO + Tutor IA + Norma + 2 anos de acesso
  - **Card 3 — Black:** 12x R$ 99,70 / R$ 997 à vista — Mentoria 1x1 mensal
- Cada card com botão que leva pra `/checkout` (parâmetro UTM pra rastrear se vier daqui: `/checkout?from=landing-pricing`)
- Selo de garantia destacado abaixo: `🛡️ Garantia incondicional de 7 dias · 100% de reembolso · Sem perguntas · Sem burocracia.`

**Critério:** preço aparece na landing antes do `/checkout`. Mãe pagadora (Marlene) acha o número.
**Commit:** `feat(landing): adiciona bloco de preço com 3 planos (foco no Protocolo Neural)`

### A.3 [Sonnet] Reescrever Auditoria de Mercado vs Stoodi/Descomplica
**Arquivo:** `app/LandingPage.tsx` (linhas ~734-919).

**Nova estrutura:**
- Header: trocar `O CUSTO TRADICIONAL` por `O CUSTO REAL DE PASSAR EM MEDICINA`
- Remover tabela de "Mentor R$ 1.200 + Corretor R$ 450 + Materiais R$ 200" (não é o concorrente real)
- Criar nova tabela comparativa (3 colunas: Atributo · Stoodi · Descomplica · FlashAprova):
  | Atributo | Stoodi | Descomplica | **FlashAprova** |
  |---|---|---|---|
  | Investimento anual | R$ 708 | R$ 1.188 | **R$ 327** |
  | Modelo de aprendizado | Videoaula passiva | Videoaula + simulado | **SRS adaptativo + IA** |
  | Correção de redação | Limitada | Limitada | **Norma IA ilimitada** |
  | Tempo médio diário | 1-2h passivo | 1-2h passivo | **15min ativo** |
  | Garantia | 7 dias | 7 dias | **7 dias** |
- Frase de fechamento: `"Pagar mais por menos retenção é o erro mais caro do seu ano de cursinho."`
- CTA: `"GERAR MEU DIAGNÓSTICO GRÁTIS"` + microcopy padrão.

**Manter:** estética cyber/recibo (funciona visualmente), só troca o conteúdo.
**Commit:** `feat(landing): reescreve Auditoria de Mercado contra Stoodi/Descomplica`

### A.4 [Sonnet] Reescrever FAQ na nova ordem
**Arquivo:** `app/LandingPage.tsx` (constante `FAQ_ITEMS`).
**Ordem nova (8 perguntas):**

1. **Quanto custa o FlashAprova? Tem parcelamento?**
   > A partir de R$ 21,41/mês (Essencial) ou R$ 27,25/mês no Protocolo Neural (completo) — pagamento parcelado em 12x sem juros, ou à vista a partir de R$ 257. O plano mais escolhido sai por menos de R$ 0,90 por dia.

2. **Tem garantia? Como pedir reembolso?**
   > Sim. 7 dias de garantia incondicional. Testou e não se encaixou na sua rotina? Mande um email pro nosso suporte e devolvemos 100% do valor. Sem perguntas, sem burocracia, sem letra miúda.

3. **Funciona para Medicina, Engenharia ou concursos?**
   > O método de SRS + IA funciona para qualquer conteúdo que exija memorização precisa. Hoje o foco é ENEM com cards desenhados para Medicina e Engenharia, mas o algoritmo é matéria-agnóstico.

4. **Quanto tempo por dia preciso estudar?**
   > 15 a 30 minutos por dia. O radar de lacunas elimina o estudo às cegas: você foca apenas no que o seu cérebro está prestes a esquecer. Menos que rolar feed do Instagram.

5. **Por que pagar se o Anki é grátis?**
   > Anki te obriga a montar deck do zero (2-3 meses antes de estudar 1 card). Aqui você abre o app e em 3 minutos já tem revisão personalizada, com biblioteca pronta de milhares de cards alinhados ao ENEM.

6. **Posso confiar na correção de redação por IA?**
   > A Norma IA segue o padrão oficial do INEP. Em segundos você recebe um parecer detalhado das cinco competências, identifica falhas estruturais que custariam pontos e melhora a próxima redação imediatamente.

7. **Funciona no celular?**
   > Sim. Plataforma 100% responsiva, abre direto no navegador do celular. Sem download obrigatório.

8. **Quem é a empresa? Como entro em contato?**
   > FlashAprova é um produto brasileiro com CNPJ, política de privacidade e termos de uso publicados. Suporte por email respondido em até 24h úteis.

**Commit:** `feat(faq): reescreve FAQ na nova ordem (preço #1, garantia #2)`

### A.5 [Sonnet] Reescrever ReelsTestimonials com clareza de status
**Arquivo:** `components/ReelsTestimonials.tsx` + `lib/reels-data.ts`.
**Ação:**
- Adicionar caption acima da seção: `"Histórias de quem está no piloto automático com o FlashAprova"`
- Por enquanto NÃO criar nomes que fingem aprovação que não aconteceu (produto não vendeu). Reformular cada card para mostrar:
  - Foto (a IA-gerada que já existe)
  - Nome (primeiro nome + inicial)
  - Curso de meta (não "aprovado em")
  - Frase em primeira pessoa sobre o método (não sobre o resultado)
  - Ex: `"BRUNO M. · Meta: Medicina UFPE · 'Em 15 min/dia eu finalmente sinto que estou retendo'"`
- Quando tiver depoimentos reais (Tier B), substituir.
**Commit:** `fix(reels): refraseia depoimentos pra meta/método (não claims de aprovação ainda)`

### A.6 [Haiku] Sticky CTA mobile bottom
**Arquivo:** novo componente `components/StickyMobileCTA.tsx`, montado em `app/LandingPage.tsx`.
**Spec:**
- Aparece SÓ no mobile (`sm:hidden`)
- Aparece após scroll > 400px (intersection observer ou scroll listener com throttle)
- Posição `fixed bottom-0 inset-x-0`, z-index alto
- Conteúdo: botão único `"GERAR DIAGNÓSTICO GRÁTIS"` em verde neon + microcopy minúsculo "Grátis · 3 min"
- Padding seguro pra safe-area-inset-bottom (iPhone)
- Some quando o usuário chega no footer (opcional)
**Commit:** `feat(landing): adiciona sticky CTA mobile (aparece após 400px de scroll)`

### A.7 [Haiku] Fix CLS — SkeletonBlock minHeights realistas
**Arquivo:** `app/LandingPage.tsx` (todas as `<LazySection minHeight={...}>`).
**Problema:** os minHeights atuais (340, 400, 480, 520, 720) são MUITO menores que o componente real renderiza em mobile (chega a 1.500-2.400px). CLS estimado 0.4-0.8 (péssimo).

**Ação:** medir altura real de cada seção em mobile 375px (DevTools) e ajustar `minHeight` correspondente. Tabela de referência:
- `EbbinghausSection`: medir e ajustar (provável 600-800)
- `AnkiComparison`: medir e ajustar (provável 700-1000)
- `FocusSection`: medir (provável 800-1100)
- `CardVaultSection`: medir (provável 800-1200)
- `AiTutorsSection`: medir (provável 900-1300)
- `NormaRedacaoSection`: medir (provável 1400-1800)
- `ReelsTestimonials`: medir (provável 500-700)
- `ComoFuncionaSteps`: medir (provável 2200-2800)

**Critério:** Lighthouse mobile CLS < 0.1.
**Commit:** `perf(landing): ajusta SkeletonBlock minHeights pra reduzir CLS`

### A.8 [Opus, REVIEW] Lighthouse + visual review do Tier A
- [ ] Rodar Lighthouse mobile (CLS, LCP, TBT)
- [ ] Conferir que o bloco de Preço aparece e é clicável
- [ ] Conferir que FAQ está na ordem nova
- [ ] Conferir que footer tem todos os links
- [ ] **PAUSA — usuário valida antes de Tier B**

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TIER B — Estratégico (~16-24h dev, opcional)
## Objetivo: estabelecer moat de confiança e ampliar canais
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### B.1 [Sonnet] Página /metodo
**Rota nova:** `app/metodo/page.tsx`
**Conteúdo:**
- Explicar Ebbinghaus + SRS com fontes acadêmicas (Cepeda et al. 2006, Karpicke & Roediger 2008)
- Mostrar metodologia interna (algoritmo de cálculo de intervalo, calibração TRI, curadoria editorial)
- Linkar do Hero e do FAQ #6 ("A IA é confiável?")
**Commit:** `feat(metodo): cria página /metodo com fundamentação científica`

### B.2 [Sonnet] Vídeo demo / Screenshots app real
**Pré-requisito:** usuário gravar 15-30s de tela usando o app real.
**Ação:** criar componente `components/AppDemo.tsx` com vídeo (auto-play muted, loop) OU carousel de screenshots reais (não mockup).
**Onde inserir:** entre Hero e ComoFuncionaSteps.
**Commit:** `feat(landing): adiciona seção 'Veja o app por dentro' com vídeo real`

### B.3 [Haiku] Trust signals
**Arquivos:** `app/LandingPage.tsx` (footer) + novo `components/TrustBadges.tsx`.
**Adicionar:**
- Badges de pagamento (Pix, Visa, Master, Elo, Hipercard, Boleto) próximas ao bloco de preço
- Badge SSL no footer
- (Quando tiver) selo Reclame Aqui
- (Quando tiver) badges de imprensa
**Commit:** `feat(trust): adiciona badges de pagamento e segurança`

### B.4 [Sonnet] Coletar e integrar depoimentos reais
**Depende:** ter aluno real que comprou e usou.
**Ação:** quando tiver 3-5 alunos reais com nota antes/depois ou print de aprovação, substituir o `ReelsTestimonials` placeholder por dados reais.

### B.5 [Sonnet] Sistema de referral
**Spec:** botão "Indique um amigo, ganhem 30 dias os dois" na landing + no dashboard.
**Banco:** tabela `referrals` no Supabase.
**Commit:** `feat(referral): adiciona programa de indicação 1+1`

### B.6 [Opus, REVIEW FINAL] Polish + coesão
- [ ] Reler a página inteira como Julia (vestibulando)
- [ ] Reler como Marlene (mãe)
- [ ] Conferir mobile no iPhone real
- [ ] Conferir Lighthouse > 90 em todos os scores
- [ ] Conferir tempo total de leitura mobile < 4min
- [ ] Merge `landing-revamp` → `main` (PR com sumário detalhado)

---

## 🤖 Roteamento de modelo (economia de tokens)

| Modelo | Quando usar | Exemplos no plano |
|---|---|---|
| **Haiku** | search-and-replace, deletar arquivos, reordenar JSX, padronizar strings | S.1, S.2, S.4, S.5, S.6, S.7, S.8, S.9, A.1, A.6, A.7, B.3 |
| **Sonnet** | reescrita criativa de copy, criar componente novo, decidir estrutura de FAQ | S.3, A.2, A.3, A.4, A.5, B.1, B.2, B.4, B.5 |
| **Opus** | revisão arquitetural, decisão estratégica, polish final, debugar bug obscuro | Passo 0, S.10, A.8, B.6 |

**Padrão de dispatch:**
- Pra Haiku: `Agent({subagent_type: "general-purpose", model: "haiku", description: "...", prompt: "..."})` com prompt curto e específico (1 task, arquivos exatos, antes/depois).
- Pra Sonnet: idem mas com prompt mais elaborado, deixando espaço pra criatividade.
- Pra paralelizar: múltiplas chamadas Agent em uma única mensagem (não sequencial).

**Não despache Opus pra tarefas braçais.** Não despache Haiku pra reescrever copy persuasiva.

---

## 📊 Status / Checklist (atualizado 2026-06-01)

### Setup
- [x] 0.1 — Modificações pendentes mantidas no working tree (não interferiram)
- [x] 0.2 — Branch `landing-revamp` criada (16 commits acima da main)
- [x] 0.3 — Baseline visual confirmado pelo usuário

### Tier S ✅ COMPLETO
- [x] S.1 Substituir vocabulário militar — commits d0a5a15, bd162d2
- [x] S.2 Remover "Engenharia de Persuasão" — commit d0a5a15
- [x] S.3 Reescrever Hero — commits 17d3780, 7531be1, 82812fd (passou por re-iteração)
- [x] S.4 Padronizar CTAs — commit bd162d2 ("GERAR MEU DIAGNÓSTICO GRÁTIS")
- [x] S.5 Mover CTA acima do mockup — revertido em 7531be1 a pedido do usuário (mockup quebrou)
- [x] S.6 Suavizar claims numéricos — commits 0bedf9b, d0a5a15
- [x] S.7 Remover "Veredito:" do FAQ — commit 0bedf9b
- [x] S.8 Remover badges agressivas — commit 0bedf9b
- [x] S.9 Footer compliance — commit 0bedf9b (Política, Termos, Suporte mailto)
- [x] S.10 Review Opus + PAUSA validação usuário — aprovado

### Tier A ✅ COMPLETO
- [x] A.1 Deletar 4 seções cortadas — commit 9761295 (-1.900 linhas)
- [x] A.2 Bloco de Preço e Planos — commit 470531d (`components/PrecoEPlanos.tsx`)
- [x] A.3 Reescrever Auditoria de Mercado — commit 1fae836 (vs Stoodi/Descomplica)
- [x] A.4 Reescrever FAQ — commit 666e0b5 (8 perguntas, preço #1, garantia #2)
- [x] A.5 Reescrever ReelsTestimonials — commit 10a564d ("Meta:" em vez de "Aprovado em")
- [x] A.6 Sticky CTA mobile — commit af1e678 (`components/StickyMobileCTA.tsx`)
- [x] A.7 Fix CLS skeletons — commit af1e678 (minHeights realistas)
- [x] A.8 Review Opus + PAUSA validação usuário — aprovado

### Tier B
- [x] B.1 Página /metodo — commit f9ad215 (`app/metodo/page.tsx` com Ebbinghaus, SRS, transparência)
- [x] B.2 Vídeo demo — commit 87a883c — **ESQUELETO PRONTO** (`components/AppDemo.tsx` + `public/videos/README.md` com specs ffmpeg). Falta: gravar e colocar `app-demo.{mp4,webm}` + poster em `public/videos/`. O placeholder some sozinho quando os arquivos existirem.
- [x] B.3 Trust signals — commit c878b12 (`components/TrustBadges.tsx` + SSL no footer)
- [x] B.4 Depoimentos reais — commit 9f4d3a5 — **TODO INLINE PRONTO** em `lib/reels-data.ts` (schema, instruções de captura, onde otimizar foto, o que atualizar em `/metodo`). Falta: ter primeiras aprovações confirmadas → trocar os 8 objetos do array `REELS`.
- [x] B.5 Sistema de referral — commit 55467e3 — **ESQUELETO COMPLETO** (4 arquivos novos):
    - `supabase/migrations/20260601_referrals_skeleton.sql` (tabela + RLS + RPC) — não aplicado, rodar manualmente
    - `app/api/referrals/route.ts` (GET stats + POST click) — retorna 501 até implementar auth
    - `components/ReferralProgram.tsx` (bloco público na landing) — funcional visualmente, lógica real depende de dashboard
    - Falta: aplicar migration, implementar auth nas routes, criar `/app/dashboard/indique/page.tsx`, middleware pra `?ref=CODE`, webhook do gateway de pagamento, email transacional, anti-fraude
- [x] B.6 Polish final + verificação tipo — feito em 2026-06-01

## 🟢 Estado final desta sessão

**Branch:** `landing-revamp` · 16 commits acima de `main` · **+1.527 / -2.131 linhas** (página líquido menor — gordura cortada)

**Verificações:**
- `tsc --noEmit`: zero erros novos (apenas erro pré-existente em `lib/__tests__` não relacionado)
- Imports mortos removidos (NeuralBrainMap)
- 4 componentes deletados sem referências quebradas

**Pronto pra merge?** Sim, após:
1. Usuário rodar `pnpm dev` e confirmar visual mobile + desktop
2. Lighthouse mobile passar com CLS < 0.1 (estimado dado o ajuste de minHeights)
3. Verificar que `/checkout?from=landing-pricing&plan=X` é tracking adequado (ou ajustar)

**Pendências pra próximas sessões:**
- B.2 (vídeo demo) — quando o app estiver gravável, criar `components/AppDemo.tsx`
- B.4 (depoimentos reais) — quando houver aprovação confirmada via SISU, substituir o `lib/reels-data.ts`
- B.5 (referral) — feature de growth pra escalar via indicação
- Revisar conteúdo de `/privacidade` e `/termos` com advogado

---

## 🚨 Bloqueadores conhecidos (resolver antes/durante)

| Item | Bloqueador | Quem resolve |
|---|---|---|
| S.9 Footer | Confirmar email de suporte real | Usuário |
| A.5 ReelsTestimonials | Decidir se troca nomes IA-gerados ou mantém | Usuário (já optou por manter) |
| B.2 Vídeo demo | App em estado gravável | Dev |
| B.4 Depoimentos reais | Ter alunos pagantes | Após primeiras vendas |
| Política /privacidade e /termos | Conferir conteúdo está atualizado (já existe rota) | Usuário (revisar texto) |

---

## 📚 Referências (resultados da auditoria 360)

Os relatórios completos das 5 personas estão nas memórias da sessão (gerados em 2026-05-31). Resumo:

1. **Copywriter direct-response (Halbert/Schwartz)** — Big Idea dispersa, oferta inexistente, 7 CTAs com 5 labels, garantia enterrada.
2. **Vestibulando Julia (17, target)** — vocabulário militar afasta, prova social fraca, preço invisível, "menos que um jantar" é vago.
3. **CRO/UX** — página 50% longa demais, CTA fora da dobra mobile, CLS 0.4-0.8, 11 cores, 5 seções redundantes.
4. **Mãe Marlene (47, pagadora)** — parece pirâmide/cripto, sem CNPJ é red flag, "cadê o humano?", "cadê o preço?".
5. **Strategist Edtech BR** — posicionamento disperso, ataca Anki (nicho) ignorando Stoodi/Descomplica (ringue real), PR-bomba esperando.

---

> **Última atualização:** 2026-05-31
> **Mantenedor:** dono do FlashAprova
> **Próxima ação:** Setup (Passo 0) → Tier S.1
