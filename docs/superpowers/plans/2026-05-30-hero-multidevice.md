# Hero Multi-Device Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as duas composições do hero (MacBook+widgets no desktop, iPhone+satélites no mobile) por uma única composição multi-device (MacBook + iPad + iPhone) escalada em todos os breakpoints.

**Architecture:** Refactor focado em `components/HeroSection.tsx`. Cada mockup de device (Mac/iPad/iPhone) vira um componente que aceita `children` (a tela renderizada dentro). Uma nova sub-função `MultiDeviceComposition` posiciona os três devices em camadas (MacBook ao fundo, iPad inferior-esquerdo, iPhone inferior-direito, com tilt). Depois removemos os 4 glass cards de canto do desktop e todo o sistema de satélites do mobile.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion. Sem framework de teste frontend — verificação visual via `npm run dev` e tipagem via `npm run build` / `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-05-30-hero-multidevice-design.md`

**Referência visual:** `ideia mockup.png` na raiz do projeto.

---

## File Structure

Todo o trabalho acontece em `components/HeroSection.tsx`. Mantemos a convenção do arquivo (componentes inline). Cada task abaixo identifica as linhas afetadas pelo número aproximado — usar `grep` para localizar caso o arquivo mude.

**Componentes existentes a modificar:**
- `IPhoneMockup` (~linha 1595) — refactor para aceitar `children`
- `MacBookMockup` (~linha 1820) — refactor para aceitar `children` e prop de `widthPx`
- `AppScreen` (~linha 624) — sem mudança de comportamento
- `CommandCenterScreen` (~linha 1145) — sem mudança de comportamento (já é standalone)
- `PhoneRedacaoScreen` (~linha 1332) — sem mudança de comportamento

**Componentes novos:**
- `IPadMockup` — frame de iPad, aceita `children` e prop de `widthPx`
- `MultiDeviceComposition` — posiciona os 3 devices em camadas

**Componentes a remover (após swap):**
- 4 glass cards de canto no JSX principal (Arsenal TL, Terminal BL, Agenda IA TR, Conceitos BR — linhas ~2096–2250)
- `MobileSatellites` (~linha 1620)
- `MobileConnectionLines` (~linha 1741)
- `IPhoneMockup`'s container relativo + satellites no JSX (~linha 2169–2191)
- `FloatWrapper` (se ficar órfão — verificar)
- Constantes de parallax `tlX/tlY/blX/blY/trX/trY/brX/brY` (se ficarem órfãs)

---

## Convenções gerais para todas as tasks

- Após cada modificação de código, rodar `npm run build` para checar TypeScript. Se passar, prosseguir.
- Para verificação visual: `npm run dev` (porta 3000 por padrão), abrir `http://localhost:3000`, ver o hero.
- Após cada task que produz mudança visível, abrir o browser e confirmar que renderiza sem erros de console.
- Commits frequentes — um por task.

---

## Task 1: Refactor IPhoneMockup para aceitar children

**Files:**
- Modify: `components/HeroSection.tsx:1594-1618`

**Por quê:** Hoje `IPhoneMockup` renderiza `<PhoneAppScreen />` hardcoded por dentro. Pra usar na nova composição precisamos passar `<PhoneRedacaoScreen />` em vez disso. Também adicionamos um prop `widthPx` para permitir escalonamento.

- [ ] **Step 1: Localizar IPhoneMockup**

Run: `grep -n "^function IPhoneMockup" components/HeroSection.tsx`
Expected: linha próxima de 1595.

- [ ] **Step 2: Substituir a definição inteira de IPhoneMockup**

Encontrar a função atual (do `function IPhoneMockup() {` até o `}` que fecha a função, ~24 linhas) e substituir por:

```tsx
// ── iPhone frame ──────────────────────────────────────────────────────────────
function IPhoneMockup({ widthPx = 212, children }: { widthPx?: number; children: React.ReactNode }) {
  const heightPx = Math.round(widthPx * (430 / 212)); // mantém aspect ratio original
  const borderRadius = Math.round(widthPx * (40 / 212));
  const notchWidth = Math.round(widthPx * (64 / 212));
  const notchHeight = Math.round(widthPx * (14 / 212));
  const notchTop = Math.round(widthPx * (12 / 212));
  const padding = Math.max(4, Math.round(widthPx * (7 / 212)));
  const screenRadius = Math.round(widthPx * (33 / 212));

  return (
    <div style={{
      width: widthPx, height: heightPx, borderRadius, position: 'relative',
      background: 'linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 100%)',
      padding, border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: `0 0 70px ${PURPLE}33, inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px rgba(0,0,0,0.75)`,
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: notchTop, left: '50%', transform: 'translateX(-50%)',
        width: notchWidth, height: notchHeight, borderRadius: 10, background: '#000', zIndex: 6,
      }} />
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: screenRadius, overflow: 'hidden',
        background: '#050b14', border: '1px solid rgba(0,0,0,0.5)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Atualizar todos os call sites de IPhoneMockup**

Run: `grep -n "<IPhoneMockup" components/HeroSection.tsx`
Expected: 1 ocorrência por volta da linha 2185.

Substituir `<IPhoneMockup />` por:

```tsx
<IPhoneMockup>
  <PhoneAppScreen />
</IPhoneMockup>
```

Isso mantém o comportamento atual idêntico (PhoneAppScreen continua sendo o conteúdo) — só estrutura mudou.

- [ ] **Step 4: Verificar tipagem e build**

Run: `npm run build`
Expected: build passa sem erros.

- [ ] **Step 5: Verificação visual**

Run em background: `npm run dev`
Abrir `http://localhost:3000` no browser. Confirmar que:
- Hero no mobile (DevTools responsive ≤768px) mostra o iPhone igualzinho ao atual
- Hero no desktop não foi afetado
- Sem erros no console

Parar dev server.

- [ ] **Step 6: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "refactor(hero): IPhoneMockup aceita children e widthPx"
```

---

## Task 2: Refactor MacBookMockup para aceitar children e width

**Files:**
- Modify: `components/HeroSection.tsx:1819-?` (a função MacBookMockup inteira)

**Por quê:** Mesmo motivo do iPhone. Hoje `MacBookMockup` renderiza `<AppScreen termLines={...} visibleConcepts={...} />` hardcoded. Precisamos permitir children e prop de largura para responsividade.

- [ ] **Step 1: Localizar e ler MacBookMockup completo**

Run: `grep -n "^function MacBookMockup\|^// ── MacBook" components/HeroSection.tsx`
Identificar onde começa e onde termina (busca pelo próximo `^function` ou comentário de seção).

- [ ] **Step 2: Refactor da assinatura**

Trocar a assinatura de:
```tsx
function MacBookMockup({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
```
para:
```tsx
function MacBookMockup({ widthPx = 560, children }: { widthPx?: number; children: React.ReactNode }) {
```

E dentro do body, substituir `<AppScreen termLines={...} visibleConcepts={...} />` por `{children}`.

Se houver dimensões hardcoded (largura/altura do frame, screen, notch, etc), trocá-las para serem proporcionais a `widthPx` igual ao Task 1. Manter o aspect ratio do laptop (~16:10 da tela + bezel; verificar valores atuais).

⚠️ Se a função usa `termLines` ou `visibleConcepts` em algum outro lugar dentro dela (além de passar para AppScreen), manter via outro caminho — mas a expectativa é que só seja repassado. Conferir.

- [ ] **Step 3: Atualizar call site único**

Run: `grep -n "<MacBookMockup" components/HeroSection.tsx`
Expected: 1 ocorrência por volta da linha 2166.

Substituir:
```tsx
<MacBookMockup termLines={termLines} visibleConcepts={visibleConcepts} />
```
por:
```tsx
<MacBookMockup>
  <AppScreen termLines={termLines} visibleConcepts={visibleConcepts} />
</MacBookMockup>
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: passa.

- [ ] **Step 5: Visual check**

Run em background: `npm run dev`. Abrir desktop view (largura ≥1024px). MacBook deve aparecer igualzinho. Console limpo.

- [ ] **Step 6: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "refactor(hero): MacBookMockup aceita children e widthPx"
```

---

## Task 3: Criar IPadMockup

**Files:**
- Modify: `components/HeroSection.tsx` — adicionar nova função logo antes de `MacBookMockup` (ordem alfabética/lógica)

**Por quê:** Não existe iPad mockup hoje. Frame visual deve combinar com o do iPhone (mesma família de bezel, cantos, mas formato 4:3 mais quadrado, sem notch — câmera frontal como pequeno dot).

- [ ] **Step 1: Adicionar a função IPadMockup**

Adicionar antes de `function MacBookMockup` (use grep para encontrar a linha exata):

```tsx
// ── iPad frame ────────────────────────────────────────────────────────────────
function IPadMockup({ widthPx = 280, children }: { widthPx?: number; children: React.ReactNode }) {
  // iPad aspect ratio ~ 4:3 (1180/820 da real). Aqui usamos 4:3 em landscape ou 3:4 em portrait?
  // Para o hero, usamos PORTRAIT (mais alto que largo), ratio 3:4.
  const heightPx = Math.round(widthPx * (4 / 3));
  const borderRadius = Math.round(widthPx * (24 / 280));
  const padding = Math.max(6, Math.round(widthPx * (10 / 280)));
  const screenRadius = Math.round(widthPx * (16 / 280));
  const cameraSize = Math.max(3, Math.round(widthPx * (5 / 280)));

  return (
    <div style={{
      width: widthPx, height: heightPx, borderRadius, position: 'relative',
      background: 'linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 100%)',
      padding, border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: `0 0 60px ${PURPLE}28, inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.7)`,
    }}>
      {/* Câmera frontal (dot pequeno no topo, centralizado) */}
      <div style={{
        position: 'absolute', top: Math.round(padding / 2), left: '50%', transform: 'translateX(-50%)',
        width: cameraSize, height: cameraSize, borderRadius: '50%',
        background: '#000', border: '1px solid rgba(255,255,255,0.1)', zIndex: 6,
      }} />
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: screenRadius, overflow: 'hidden',
        background: '#050b14', border: '1px solid rgba(0,0,0,0.5)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: passa. (Função declarada mas não usada ainda — TypeScript/ESLint não devem reclamar de função top-level não usada, mas se reclamar, ignorar por enquanto — será usada na próxima task.)

Se o lint reclamar de "unused function", aceitar e prosseguir — vai sumir o warning na próxima task.

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): adiciona IPadMockup (frame + children + widthPx)"
```

---

## Task 4: Criar MultiDeviceComposition (sem usar ainda)

**Files:**
- Modify: `components/HeroSection.tsx` — adicionar nova função logo antes do componente principal do hero (perto do final do arquivo, antes do `export default`)

**Por quê:** Encapsular o posicionamento dos 3 devices num componente próprio. Mantém a JSX principal limpa. Posicionamento absoluto: MacBook no fundo centro, iPad inferior-esquerdo com tilt −8°, iPhone inferior-direito com tilt +8°.

- [ ] **Step 1: Identificar o melhor lugar**

Run: `grep -n "^export default" components/HeroSection.tsx`
Adicionar a função logo antes desta linha (ou antes do componente `HeroSection` principal — qualquer lugar acima dele).

- [ ] **Step 2: Adicionar MultiDeviceComposition**

```tsx
// ── Composição Multi-Device (MacBook + iPad + iPhone) ────────────────────────
function MultiDeviceComposition({
  termLines,
  visibleConcepts,
}: {
  termLines: string[];
  visibleConcepts: number[];
}) {
  // Escalas responsivas via Tailwind (clamp via CSS vars seria mais robusto, mas usamos
  // breakpoints discretos pra simplicidade e SSR consistente).
  // Mobile: Mac 280, iPad 110, iPhone 90
  // md:    Mac 440, iPad 170, iPhone 130
  // lg:    Mac 560, iPad 210, iPhone 160
  return (
    <div
      className="relative mx-auto"
      style={{
        width: '100%',
        maxWidth: 720,
        // altura proporcional para reservar espaço (evita CLS):
        // mobile MacBook 280px width ~ 180px tall + iPad/iPhone overflow ~80px abaixo
        // lg MacBook 560 width ~ 360 tall + overflow ~100 abaixo
        aspectRatio: '720 / 480',
      }}
      role="img"
      aria-label="FlashAprova em três dispositivos: MacBook, iPad e iPhone, exibindo dashboard, painel de progresso e correção de redação"
    >
      {/* MacBook centro/fundo */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ zIndex: 10 }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="block lg:hidden md:hidden">
          <MacBookMockup widthPx={280}>
            <AppScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </MacBookMockup>
        </div>
        <div className="hidden md:block lg:hidden">
          <MacBookMockup widthPx={440}>
            <AppScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </MacBookMockup>
        </div>
        <div className="hidden lg:block">
          <MacBookMockup widthPx={560}>
            <AppScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </MacBookMockup>
        </div>
      </motion.div>

      {/* iPad inferior-esquerdo, frente, tilt −8° */}
      <motion.div
        className="absolute"
        style={{
          left: '4%',
          bottom: '0%',
          transform: 'rotate(-8deg)',
          transformOrigin: 'bottom left',
          zIndex: 20,
        }}
        initial={{ opacity: 0, y: 24, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -8 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="block md:hidden">
          <IPadMockup widthPx={110}>
            <CommandCenterScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </IPadMockup>
        </div>
        <div className="hidden md:block lg:hidden">
          <IPadMockup widthPx={170}>
            <CommandCenterScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </IPadMockup>
        </div>
        <div className="hidden lg:block">
          <IPadMockup widthPx={210}>
            <CommandCenterScreen termLines={termLines} visibleConcepts={visibleConcepts} />
          </IPadMockup>
        </div>
      </motion.div>

      {/* iPhone inferior-direito, frente, tilt +8° */}
      <motion.div
        className="absolute"
        style={{
          right: '4%',
          bottom: '0%',
          transform: 'rotate(8deg)',
          transformOrigin: 'bottom right',
          zIndex: 30,
        }}
        initial={{ opacity: 0, y: 24, rotate: 8 }}
        animate={{ opacity: 1, y: 0, rotate: 8 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="block md:hidden">
          <IPhoneMockup widthPx={90}>
            <PhoneRedacaoScreen />
          </IPhoneMockup>
        </div>
        <div className="hidden md:block lg:hidden">
          <IPhoneMockup widthPx={130}>
            <PhoneRedacaoScreen />
          </IPhoneMockup>
        </div>
        <div className="hidden lg:block">
          <IPhoneMockup widthPx={160}>
            <PhoneRedacaoScreen />
          </IPhoneMockup>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: passa. Função não usada ainda — warning aceitável.

- [ ] **Step 4: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): adiciona MultiDeviceComposition (não usada ainda)"
```

---

## Task 5: Swap da composição no JSX principal (e remoção das antigas)

**Files:**
- Modify: `components/HeroSection.tsx` — bloco JSX entre ~linhas 2090 e 2251 (o `<div className="relative flex items-center justify-center" ...>` que contém os 4 cards de canto + MacBook + iPhone+satélites)

**Por quê:** Esta é a task "atômica" do swap. Removemos o bloco inteiro da composição antiga e colocamos `<MultiDeviceComposition />` no lugar.

- [ ] **Step 1: Localizar o bloco**

Run: `grep -n 'className="relative flex items-center justify-center"' components/HeroSection.tsx`
Expected: 1 ocorrência por volta da linha 2092.

- [ ] **Step 2: Substituir o bloco inteiro**

Encontrar o `<div className="relative flex items-center justify-center" style={{ minHeight: ..., zIndex: 1 }}>` (~linha 2091-2093) e seu `</div>` de fechamento (~linha 2251, antes do bloco "Subheadline + CTA").

Substituir TUDO entre essas duas linhas por:

```tsx
<div
  className="relative mx-auto"
  style={{ width: '100%', zIndex: 1 }}
>
  <MultiDeviceComposition termLines={termLines} visibleConcepts={visibleConcepts} />
</div>
```

⚠️ Confirmar manualmente que: o JSX que vem ANTES (headline) e DEPOIS (subheadline+CTA, avatares) NÃO foi tocado. Só o bloco da composição.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: passa. Pode ter warnings sobre imports/variáveis não usadas (FloatWrapper, parallax vars, TerminalWidget, etc) — vamos limpar na Task 6.

- [ ] **Step 4: Visual check — desktop**

Run em background: `npm run dev`. Abrir `http://localhost:3000` em viewport largo (≥1280px). Confirmar:
- MacBook ao centro, AppScreen ciclando entre tabs (Estudar/Tutores IA/Central/Redação) a cada 3-5s
- iPad inferior-esquerdo, levemente rotacionado, mostrando Arsenal (CommandCenterScreen)
- iPhone inferior-direito, levemente rotacionado, mostrando auditoria TRI da redação
- SEM os 4 glass cards de canto
- Console limpo (sem erros — warnings de "unused" são esperados até a Task 6)

- [ ] **Step 5: Visual check — mobile**

DevTools responsive, 375px width. Confirmar:
- Mesma composição visível, escalada
- MacBook não estoura o viewport
- iPad e iPhone visíveis nos cantos inferiores
- Conteúdo dentro das telas reconhecível (mesmo que pequeno)
- Sem layout horizontal scroll

- [ ] **Step 6: Visual check — tablet**

DevTools responsive, 768px width. Confirmar transição suave entre breakpoints.

- [ ] **Step 7: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "feat(hero): substitui composição antiga por MultiDeviceComposition"
```

Parar dev server (pode reiniciar nas próximas tasks se quiser).

---

## Task 6: Limpeza de código morto

**Files:**
- Modify: `components/HeroSection.tsx` — remover funções e variáveis órfãs

**Por quê:** Após a Task 5, vários componentes/variáveis ficaram sem uso. Limpar reduz bundle e ruído.

- [ ] **Step 1: Identificar candidatos a remoção**

Para cada item abaixo, rodar `grep -n` para verificar se ainda é usado em algum lugar do arquivo (além da própria definição). Se NÃO for usado, remover. Se for usado, manter.

Run os greps em paralelo (separe-os por `;` ou rode 1 por vez):

```bash
grep -n "MobileSatellites\|MobileConnectionLines\|FloatWrapper\|TerminalWidget\|GlassCard\|PhoneSatellites" components/HeroSection.tsx
```

Esperado para remover:
- `MobileSatellites` (definição ~1620 + import em JSX antigo já removido) — REMOVER se grep só achar a definição.
- `MobileConnectionLines` (definição ~1741) — REMOVER se órfão.
- `FloatWrapper` — VERIFICAR. Provavelmente órfão após remoção dos 4 cards.
- `TerminalWidget` (~190) — VERIFICAR. Era usado em MobileSatellites (MEMORY = ...) e em BL card. Se órfão, remover.
- `GlassCard` — VERIFICAR. Era usado nos 4 cards do desktop e em MobileSatellites. Se órfão, remover.
- Constantes parallax: `tlX, tlY, blX, blY, trX, trY, brX, brY, nbX, nbY` — VERIFICAR via grep. Se órfãs, remover suas declarações (provavelmente `useTransform(scrollY, ...)` próximo do topo do componente principal).
- `DesktopOnly` e `MobileOnly` — VERIFICAR. Se ainda usados em outro lugar, manter.

Para cada um, decidir após o grep e remover apenas se SÓ a definição aparece.

- [ ] **Step 2: Remover funções órfãs**

Editar `components/HeroSection.tsx` removendo cada função identificada como órfã. Removê-las inteiras (do comentário `// ──` até o `}` que fecha).

⚠️ Não remover `AppScreen`, `CommandCenterScreen`, `PhoneRedacaoScreen`, `PhoneAppScreen`, `MacBookMockup`, `IPhoneMockup`, `IPadMockup`, `MultiDeviceComposition` — todos esses são usados.

⚠️ Não remover os `useState`/`useEffect` que geram `termLines` e `visibleConcepts` no componente principal (`HeroSection`) — continuam sendo passados para `MultiDeviceComposition` que repassa para `AppScreen` e `CommandCenterScreen`. Antes de remover qualquer state hook, `grep -n "termLines\|visibleConcepts"` para confirmar uso.

- [ ] **Step 3: Remover imports não usados**

Run: `grep -n "^import" components/HeroSection.tsx`
Para cada import, verificar se é usado. Remover imports órfãos.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: passa sem warnings de "unused" (ou pelo menos com menos warnings que antes).

- [ ] **Step 5: Lint check**

Run: `npm run lint`
Expected: passa. Se reportar `no-unused-vars` em algo, voltar e remover.

- [ ] **Step 6: Visual check rápido**

Run em background: `npm run dev`. Confirmar que o hero ainda renderiza correto (nada quebrou na limpeza).

- [ ] **Step 7: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "chore(hero): remove código morto pós-refactor (satélites, glass cards)"
```

---

## Task 7: QA visual final + ajustes de polish

**Files:**
- Possivelmente: `components/HeroSection.tsx` (ajustes pontuais)

**Por quê:** Depois de tudo funcional, fazer uma passada de polimento: tilts, espaçamento, alinhamento vertical, espaço entre hero e subheadline.

- [ ] **Step 1: Iniciar dev server**

Run em background: `npm run dev`

- [ ] **Step 2: QA viewport por viewport**

Abrir browser. Para cada viewport abaixo, confirmar visualmente:

| Viewport | Confirmações |
|---|---|
| 1920×1080 | Composição centralizada, sem espaços vazios estranhos. MacBook ocupa ~560px. |
| 1280×800 | Composição encaixa. Subheadline + CTA visíveis sem scroll excessivo. |
| 1024×768 | Transição entre lg e md ainda visualmente coerente. |
| 768×1024 | iPad e iPhone ainda visíveis, MacBook ~440px. |
| 414×896 (iPhone Pro Max) | Composição cabe, sem overflow horizontal. |
| 375×812 (iPhone padrão) | Composição cabe, sem overflow. |
| 320×568 (iPhone SE 1ª ger) | Aceita se ficar apertado, desde que não quebre o layout. |

- [ ] **Step 3: Conferir animações internas**

Em desktop, ficar parado 30s vendo:
- AppScreen no MacBook cicla por todas as 4 tabs (Estudar → Tutores IA → Central → Redação → volta)
- CommandCenterScreen no iPad anima barras de Arsenal preenchendo + pulsing nos %
- PhoneRedacaoScreen no iPhone digita as linhas de auditoria TRI + score animando

- [ ] **Step 4: Conferir console**

DevTools console — sem erros vermelhos. Warnings sobre `<img>` ou similar são aceitáveis se já existiam antes.

- [ ] **Step 5: Lighthouse mobile (opcional mas recomendado)**

DevTools → Lighthouse → Mobile → Performance only. Comparar com baseline da spec (LCP ≤2.5s, CLS ≤0.05). Se LCP regredir muito (>20%), abrir issue ou ajustar.

- [ ] **Step 6: Polish (se necessário)**

Se identificar problemas visuais (tilts feios, espaçamento, sobreposição estranha), ajustar valores em `MultiDeviceComposition`:
- Tilts (`rotate(-8deg)`, `rotate(8deg)`) — testar ±5° a ±12°
- `left: '4%'`, `right: '4%'` — testar 0–8%
- `bottom: '0%'` — testar valores diferentes
- `widthPx` por breakpoint — ajustar se algum device parecer pequeno/grande demais

Cada ajuste deve ter um motivo visual (não muxoxar valores aleatórios).

- [ ] **Step 7: Commit (se houve ajustes)**

```bash
git add components/HeroSection.tsx
git commit -m "polish(hero): ajustes finais de tilt/spacing na composição multi-device"
```

Se não houve ajustes, pular o commit.

Parar dev server.

---

## Critérios de aceitação finais (replica da spec §9)

- [x] Em desktop (≥1024px): composição MacBook+iPad+iPhone visível, sem widgets de canto.
- [x] Em mobile (375px): mesma composição, escalada, sem cortar conteúdo importante.
- [x] AppScreen continua ciclando entre as 4 tabs dentro do MacBook.
- [x] CommandCenterScreen renderiza dentro do iPad com proporção correta.
- [x] PhoneRedacaoScreen renderiza dentro do iPhone com a animação TRI.
- [x] Subheadline + CTA + avatar group abaixo do hero permanecem inalterados.
- [x] LCP mobile ≤ 2.5s (medir com Lighthouse, opcional na Task 7).
- [x] CLS ≤ 0.05.

---

## Notas para quem for executar

- O arquivo `HeroSection.tsx` tem ~2400 linhas. Use `grep -n` agressivamente para localizar trechos — não tente ler tudo.
- Use `Read` com `offset` e `limit` em vez de ler o arquivo inteiro.
- Após cada task, parar o dev server antes de commitar (não bloqueia o commit, mas é mais limpo).
- Se algum step "Build check" falhar com TypeScript error, ler o erro e corrigir antes de prosseguir. Não tente "consertar" pulando steps.
- A imagem `ideia mockup.png` na raiz é referência visual — abra ela em qualquer momento para comparar a composição final.
