# Checkout Pricing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar a seção de planos do checkout para arquitetura de preço anual com 3 planos e ancoragem para direcionar vendas ao Protocolo Neural (R$397/ano).

**Architecture:** Edição direta de `app/checkout/CheckoutPage.tsx`. Lógica de pagamento (ASAAS_LINKS, PlanId, handleBuy) permanece intacta. Apenas a camada de apresentação é alterada: copy, preços, features, visual e tabela comparativa.

**Tech Stack:** Next.js 14+, React, TypeScript, Tailwind CSS, Framer Motion

---

## Arquivo alterado

- Modify: `app/checkout/CheckoutPage.tsx`

Mapeamento de IDs de plano (não muda):
- `aceleracao` → FlashAprova Essencial (R$297/ano)
- `panteao_elite` → Protocolo Neural (R$397/ano) ← principal
- `black` → Protocolo Black (R$997/ano)

---

## Task 1: Adicionar intro copy antes dos cards

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o comentário `{/* ── Plan cards ── */}`** (aprox. linha 652) e inserir o bloco de intro copy imediatamente antes dele.

Substituir:
```tsx
        {/* ── Plan cards ── */}
```

Por:
```tsx
        {/* ── Intro copy ── */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Escolha seu protocolo de aprovação
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-3">
            Todos os planos são anuais. Você entra uma vez e usa o sistema durante toda a sua preparação.
          </p>
          <p className="text-sm max-w-lg mx-auto font-semibold" style={{ color: GREEN }}>
            A maioria dos alunos escolhe o Protocolo Neural porque ele libera o sistema completo de retenção, IA e redação por menos de R$ 1,09 por dia.
          </p>
        </div>

        {/* ── Plan cards ── */}
```

- [ ] **Step 2: Verificar que o arquivo compila sem erros**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros relacionados ao novo bloco.

- [ ] **Step 3: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): adicionar intro copy antes dos cards de planos"
```

---

## Task 2: Substituir card do Plano 1 — FlashAprova Essencial

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o bloco do Plano 1** — começa em `{/* ── PROTOCOLO MANUAL ── */}` (aprox. linha 655) e termina no `</div>` que fecha o card (antes do comentário `{/* ── PLANO PANTEÃO ELITE */}`).

Substituir todo esse bloco (da abertura `{/* ── PROTOCOLO MANUAL */}` até o `</div>` do card, inclusive) por:

```tsx
          {/* ── ESSENCIAL ── */}
          <div className="relative rounded-2xl p-7 overflow-hidden order-2 lg:order-1"
            style={{ ...cardStyle, border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, rgba(124,58,237,0.30), transparent)` }} />

            {/* Badge */}
            <div className="mb-4">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#8b5cf6' }}>
                BÁSICO
              </span>
            </div>

            {/* Plan name */}
            <p className="text-base font-black text-white mb-4 leading-tight">
              FlashAprova <span style={{ color: '#8b5cf6' }}>Essencial</span>
            </p>

            {/* Price */}
            <div className="mb-2">
              <span className="text-3xl font-black text-white">R$&nbsp;297<span className="text-lg font-semibold text-slate-400">/ano</span></span>
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>ou 12x de R$ 29,16</p>
            <p className="text-slate-500 text-xs italic mb-6">Para quem quer apenas revisar com flashcards.</p>

            <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

            <div className="flex flex-col gap-2.5 mb-4 text-sm">
              {[
                'Flashcards SRS ilimitados',
                'Revisão por matéria',
                'Dashboard básico',
                'Acesso por 12 meses',
                'Progresso salvo automaticamente',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: '#8b5cf6' }}>✓</span>
                  <span className="text-slate-300">{f}</span>
                </div>
              ))}

              {[
                'Tutor IA 24/7',
                'Radar de Lacunas avançado',
                'Correção de Redação IA',
                'Simulados TRI',
                'Especialistas IA',
              ].map(f => (
                <div key={f} className="flex items-start gap-2 opacity-35">
                  <span className="shrink-0 mt-0.5 text-xs">🔒</span>
                  <span className="line-through text-slate-500 leading-snug">
                    {f}
                    <span className="no-underline not-italic text-[9px] font-black tracking-wider ml-1.5 align-middle"
                      style={{ color: 'rgba(239,68,68,0.6)' }}>[ BLOQUEADO ]</span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
              style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
              Ideal para quem já tem estratégia própria.
            </p>

            <button
              onClick={() => handleBuy('aceleracao')}
              aria-label="Assinar FlashAprova Essencial"
              disabled={!!buying}
              className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}>
              {buying === 'aceleracao' ? '[ AGUARDE... ]' : '[ QUERO SÓ OS FLASHCARDS ]'}
            </button>
          </div>
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): substituir card Plano 1 por FlashAprova Essencial"
```

---

## Task 3: Substituir card do Plano 2 — Protocolo Neural (principal)

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o bloco do Plano 2** — começa em `{/* ── PLANO PANTEÃO ELITE (AiPro+) ── */}` (aprox. linha 733) e termina antes de `{/* ── PROTOCOLO BLACK */}`.

Substituir todo esse bloco por:

```tsx
          {/* ── PROTOCOLO NEURAL (principal) ── */}
          <div className="elite-card relative rounded-2xl p-8 overflow-hidden order-first lg:order-2"
            style={{ background: 'rgba(4,10,8,0.97)' }}>
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding: '1.5px',
                background: `linear-gradient(135deg, ${GREEN}, ${CYAN}, #a78bfa, ${GREEN})`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
              }} />
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${GREEN}18 0%, transparent 55%)` }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN}, #a78bfa)` }} />

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white inline-flex items-center gap-1"
                style={{ background: `linear-gradient(135deg, ${GREEN}, ${CYAN})`, boxShadow: `0 0 20px ${GREEN}55` }}>
                🏅 MAIS ESCOLHIDO
              </span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40`, color: GREEN }}>
                MELHOR CUSTO-BENEFÍCIO
              </span>
            </div>

            {/* Plan name */}
            <p className="text-xs font-black mb-2 leading-tight tracking-tight"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              [ PROTOCOLO NEURAL ]
            </p>

            {/* Headline */}
            <p className="text-white text-sm font-semibold leading-snug mb-4">
              O sistema completo para não esquecer o que estudou até o ENEM.
            </p>

            {/* Price */}
            <div className="mb-2 relative">
              <span className="text-4xl font-black text-white">R$&nbsp;397<span className="text-lg font-semibold text-slate-400">/ano</span></span>
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: GREEN }}>ou 12x de R$ 33,08</p>
            <p className="text-sm font-semibold italic mb-2" style={{ color: GREEN }}>menos de R$ 1,09 por dia</p>
            <p className="text-xs mb-6 font-medium" style={{ color: '#a78bfa' }}>
              Por só R$ 100 a mais que o Essencial, você desbloqueia o sistema completo.
            </p>

            <div className="h-px mb-4 relative"
              style={{ background: `linear-gradient(90deg, ${GREEN}55, ${CYAN}55)` }} />

            <div className="flex flex-col gap-2.5 mb-6 text-sm relative">
              {([
                { t: 'Tudo do Essencial incluído',               c: GREEN },
                { t: 'Dashboard + heatmap',                      c: GREEN },
                { t: 'Radar de Lacunas',                         c: GREEN },
                { t: 'Algoritmo SRS de retenção espaçada',       c: GREEN },
                { t: 'Resumos Storytelling',                     c: CYAN  },
                { t: 'Tabelas comparativas',                     c: CYAN  },
                { t: '15 Especialistas IA',                      c: GREEN },
                { t: 'Tutor IA 24/7',                            c: GREEN },
                { t: 'Correção de Redação com IA',               c: GREEN },
                { t: 'Treinos e simulados direcionados',         c: GREEN },
                { t: 'Acesso por 12 meses',                      c: GREEN },
              ] as { t: string; c: string }[]).map(({ t, c }) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: c }}>✓</span>
                  <span className="text-slate-200 leading-snug">{t}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy('panteao_elite')}
              aria-label="Assinar Protocolo Neural"
              disabled={!!buying}
              className="relative block w-full py-4 rounded-xl text-center font-black text-white text-sm tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
              style={{
                background: `linear-gradient(135deg, ${GREEN} 0%, ${CYAN} 60%, #a78bfa 100%)`,
                boxShadow: `0 0 40px ${GREEN}55, 0 4px 20px rgba(0,0,0,0.50)`,
              }}>
              <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <span className="absolute inset-0"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }} />
              </span>
              {buying === 'panteao_elite' ? '[ AGUARDE... ]' : '[ GARANTIR MINHA VAGA ]'}
            </button>

            <p className="text-center text-sm font-black mt-4 relative" style={{ color: GREEN, textShadow: `0 0 12px ${GREEN}60` }}>
              🛡️ Garantia incondicional de 7 dias. Risco zero.
            </p>
          </div>
```

- [ ] **Step 2: Atualizar a animação CSS `emerald-pulse` para usar `GREEN`**

No bloco `<style>` no topo do return (aprox. linha 535–550), localizar:

```tsx
      @keyframes emerald-pulse {
        0%, 100% { box-shadow: 0 0 0 1px ${EMERALD}88, 0 0 28px ${EMERALD}30, 0 0 60px ${EMERALD}14; }
        50%       { box-shadow: 0 0 0 1px ${EMERALD}, 0 0 48px ${EMERALD}55, 0 0 100px ${EMERALD}22; }
      }
```

Substituir por:

```tsx
      @keyframes emerald-pulse {
        0%, 100% { box-shadow: 0 0 0 1px ${GREEN}88, 0 0 28px ${GREEN}30, 0 0 60px ${GREEN}14; }
        50%       { box-shadow: 0 0 0 1px ${GREEN}, 0 0 48px ${GREEN}55, 0 0 100px ${GREEN}22; }
      }
```

- [ ] **Step 3: Verificar compilação**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): substituir card Plano 2 por Protocolo Neural (plano principal)"
```

---

## Task 4: Substituir card do Plano 3 — Protocolo Black

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o bloco do Plano 3** — começa em `{/* ── PROTOCOLO BLACK (Decoy/Âncora */}` (aprox. linha 839) e termina no `</div>` do card (antes do fechamento da grid `</div>`).

Substituir todo esse bloco por:

```tsx
          {/* ── PROTOCOLO BLACK (âncora premium) ── */}
          <div className="relative rounded-2xl p-7 overflow-hidden order-3 lg:order-3"
            style={{ background: 'rgba(18,14,6,0.96)', border: '1px solid rgba(217,119,6,0.22)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.50), transparent)' }} />

            {/* Badge */}
            <div className="mb-4">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.30)', color: '#d97706' }}>
                PREMIUM
              </span>
            </div>

            {/* Plan name */}
            <p className="text-base font-black mb-4 leading-tight" style={{ color: '#fbbf24' }}>
              Protocolo <span style={{ color: '#d97706' }}>Black</span>
            </p>

            {/* Price */}
            <div className="mb-2">
              <span className="text-3xl font-black" style={{ color: '#fef3c7' }}>R$&nbsp;997<span className="text-lg font-semibold" style={{ color: '#92400e' }}>/ano</span></span>
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#d97706' }}>ou 12x de R$ 99,70</p>
            <p className="text-slate-500 text-xs italic mb-6">Para quem quer acompanhamento estratégico máximo.</p>

            <div className="h-px mb-4" style={{ background: 'rgba(217,119,6,0.15)' }} />

            <div className="flex flex-col gap-2.5 mb-6 text-sm">
              {[
                'Tudo do Protocolo Neural',
                'Análise avançada de desempenho',
                'Plano estratégico semanal',
                'Correções extras de redação',
                'Prioridade na IA',
                'Rotas personalizadas por curso',
                'Modo intensivo reta final',
                'Suporte prioritário',
                'Diagnóstico avançado por área',
                'Recomendações de estudo de alto impacto',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: '#d97706' }}>✓</span>
                  <span className="text-slate-300 leading-snug">{f}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
              style={{ borderColor: 'rgba(217,119,6,0.25)' }}>
              Indicado para quem quer máxima personalização.
            </p>

            <button
              onClick={() => handleBuy('black')}
              aria-label="Aplicar para o Protocolo Black"
              disabled={!!buying}
              className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:bg-amber-900/10 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: 'transparent', border: '1px solid rgba(217,119,6,0.40)', color: '#d97706' }}>
              {buying === 'black' ? '[ AGUARDE... ]' : '[ APLICAR PARA O BLACK ]'}
            </button>
          </div>
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): substituir card Plano 3 por Protocolo Black (âncora premium)"
```

---

## Task 5: Atualizar blocos de garantia e urgência

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o bloco `{/* ── Guarantee ── */}`** (aprox. linha 908) e substituir o conteúdo interno dos dois cards:

Substituir o bloco inteiro `{/* ── Guarantee ── */}` por:

```tsx
        {/* ── Guarantee ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(10,5,20,0.70)', border: `1px solid ${GREEN}20` }}>
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <p className="text-white font-bold text-sm">Garantia incondicional de 7 dias</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Entre, teste o FlashAprova e veja se o sistema faz sentido para sua rotina. Se não sentir clareza no plano de estudo, devolvemos 100% do valor. Sem pergunta, sem burocracia.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(10,5,20,0.70)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="text-3xl shrink-0">⚡</div>
            <div>
              <p className="text-white font-bold text-sm">Acesso liberado em menos de 2 minutos</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Após a confirmação, seus flashcards, diagnóstico, radar de lacunas e tutores IA ficam disponíveis imediatamente.
              </p>
            </div>
          </div>
        </div>
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): atualizar copy dos blocos de garantia e urgência"
```

---

## Task 6: Substituir tabela comparativa por versão de 4 colunas (3 planos)

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Localizar o bloco `{/* ── Feature comparison ── */}`** (aprox. linha 932) e substituí-lo inteiramente:

```tsx
        {/* ── Feature comparison ── */}
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,5,20,0.60)' }}>
          <div className="text-center py-4 border-b border-white/5">
            <h3 className="text-white font-black text-base">Compare os protocolos</h3>
          </div>
          <div className="grid grid-cols-4 px-3 sm:px-5 py-3 border-b border-white/5">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurso</span>
            <span className="text-[10px] sm:text-xs font-semibold text-center uppercase tracking-wider" style={{ color: '#8b5cf6' }}>
              Essencial
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-center uppercase tracking-widest"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🏆 P. Neural
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-center uppercase tracking-wider" style={{ color: '#d97706' }}>
              Black
            </span>
          </div>
          {([
            ['Flashcards SRS ilimitados',       true,  true,  true ],
            ['Dashboard básico',                true,  true,  true ],
            ['Dashboard + heatmap',             false, true,  true ],
            ['Radar de Lacunas',                false, true,  true ],
            ['Resumos Storytelling',            false, true,  true ],
            ['Tabelas comparativas',            false, true,  true ],
            ['15 Especialistas IA',             false, true,  true ],
            ['Tutor IA 24/7',                   false, true,  true ],
            ['Correção de Redação IA',          false, true,  true ],
            ['Simulados/Treinos direcionados',  false, true,  true ],
            ['Plano estratégico semanal',       false, false, true ],
            ['Prioridade na IA',                false, false, true ],
            ['Suporte prioritário',             false, false, true ],
          ] as [string, boolean, boolean, boolean][]).map(([feat, ess, pro, blk], i) => (
            <div key={feat} className="grid grid-cols-4 px-3 sm:px-5 py-3 text-xs sm:text-sm"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <span className="text-slate-400 leading-snug text-[10px] sm:text-xs">{feat}</span>
              <span className="text-center font-semibold" style={{ color: ess ? '#8b5cf6' : '#1e1b4b' }}>{ess ? '✓' : '—'}</span>
              <span className="text-center font-bold" style={{ color: pro ? GREEN : '#334155', textShadow: pro ? `0 0 8px ${GREEN}60` : 'none' }}>{pro ? '✓' : '—'}</span>
              <span className="text-center font-semibold" style={{ color: blk ? '#d97706' : '#292524' }}>{blk ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): tabela comparativa com 3 planos (4 colunas)"
```

---

## Task 7: Verificação final e ajuste de ordenação mobile

**Files:**
- Modify: `app/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Verificar que a grid dos cards tem a classe correta**

Localizar a linha da grid container (aprox. linha 653):

```tsx
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 items-start lg:w-[min(64rem,92vw)] lg:relative lg:left-1/2 lg:-translate-x-1/2">
```

Confirmar que o `div` do Essencial tem `order-2 lg:order-1`, o do Neural tem `order-first lg:order-2`, e o do Black tem `order-3 lg:order-3` (já definidos nas tasks 2, 3 e 4). Se estiver correto, não há nada a alterar aqui.

- [ ] **Step 2: Verificar compilação final**

```bash
cd /Users/brunomatheus/app-flashcards && npx tsc --noEmit 2>&1
```

Esperado: zero erros.

- [ ] **Step 3: Iniciar servidor de desenvolvimento e inspecionar visualmente**

```bash
cd /Users/brunomatheus/app-flashcards && npm run dev
```

Navegar para `http://localhost:3000/checkout` e verificar:
- [ ] Intro copy aparece acima dos cards
- [ ] Card Essencial: badge "BÁSICO", preço R$297/ano, 12x R$29,16, features bloqueadas visíveis
- [ ] Card Neural: badge "MAIS ESCOLHIDO", preço R$397/ano, 12x R$33,08, glow verde neon, botão verde dominante
- [ ] Card Black: badge "PREMIUM", preço R$997/ano, 12x R$99,70, visual dourado discreto
- [ ] No mobile (redimensionar janela): Protocolo Neural aparece primeiro
- [ ] Tabela tem 4 colunas (Recurso, Essencial, P. Neural, Black)
- [ ] Blocos de garantia com copy atualizado

- [ ] **Step 4: Commit final**

```bash
git add app/checkout/CheckoutPage.tsx
git commit -m "feat(checkout): verificação final — pricing anual com ancoragem Protocolo Neural"
```
