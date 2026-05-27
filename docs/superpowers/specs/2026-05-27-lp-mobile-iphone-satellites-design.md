# LP Mobile — iPhone + satélites conectados

**Data:** 2026-05-27
**Arquivo afetado:** `components/HeroSection.tsx`

## Contexto

Hoje o hero da landing page tem duas composições:

- **Desktop (≥1024px):** MacBook central (`AppScreen` animado, ciclando abas Estudar / Tutores IA / ⚡Central / Redação) + 4 cards flutuantes nos cantos (📚 Arsenal de Revisão, 🧠 AI Memory Engine / `TerminalWidget`, 🤖 Agenda IA, 🔒 Conceitos Blindados), tudo atrás de `DesktopOnly`. Por trás, o SVG `ConnectionLines` desenha cabos com 3 "pacotes" animados convergindo dos 4 cantos pro centro do MacBook (ponto 500,308 do viewBox 1000×600).
- **Mobile (<1024px):** só o MacBook central renderiza (é o elemento LCP, montado no SSR). Os satélites e as linhas **não** renderizam (gated por `DesktopOnly`, que não hidrata em <1024px). Dentro da tela do MacBook, o `AppScreen` segue ciclando, incluindo a aba ⚡Central (`CommandCenterScreen`, grid 2×2 que recria miniaturas dos satélites).

## Objetivo

No **mobile**, substituir o MacBook por um **iPhone retrato** e trazer os 4 satélites de volta — em layout de **overlap** (cards menores "espetando" nas bordas do aparelho), conectados por **linhas com pacotes animados** convergindo pro iPhone. Espelha conceitualmente o desktop ("tudo conecta no aparelho"), mas adaptado a um viewport estreito (~360–430px).

O **desktop permanece intacto**.

## Decisões (confirmadas no brainstorming)

1. **Layout mobile:** opção B — overlap / profundidade. Satélites menores sobrepõem de leve as bordas do iPhone; linhas curtas convergem pro centro.
2. **Satélites:** os **4**, com conteúdo **vivo** (terminal tickando, barras animando, conceitos rotacionando) — reaproveitando os componentes do desktop.
3. **Tela do iPhone:** `AppScreen` ciclando, mas em **casca mobile-nativa** (status bar no topo + bottom nav), **sem a aba ⚡Central** (esse conteúdo agora vive nos satélites externos). Abas: Estudar / Tutores IA / Redação.
4. **Linhas:** pacotes animados (mesmo motor visual do `ConnectionLines`), geometria recalculada pra moldura do iPhone.

## Escopo

**Dentro:**
- Composição mobile (<1024px) do hero: iPhone central + 4 satélites em overlap + linhas animadas.
- Casca mobile-nativa pro `AppScreen` (sem aba Central no mobile).

**Fora:**
- Qualquer mudança no desktop (≥1024px) — MacBook, corner cards e `ConnectionLines` ficam como estão.
- Textos do hero (headline, subheadline, badge, CTA).
- A aba ⚡Central some **apenas** do mobile; no desktop continua.

## Arquitetura

Componentes novos em `components/HeroSection.tsx` (mesmo arquivo, seguindo o padrão atual de componentes co-localizados):

### `MobileOnly`
Espelho de `DesktopOnly`. Monta os filhos só quando `window.matchMedia('(max-width: 1023px)')` casa; em desktop renderiza `null` (não hidrata). Garante exclusividade mútua com `DesktopOnly` — nunca os dois ramos montados juntos.

### `IPhoneMockup`
Moldura de iPhone retrato: corpo arredondado, notch (pill), bordas metálicas, glow roxo (mesma paleta do MacBook: `PURPLE`/`PURPLE_L`). Renderiza `PhoneAppScreen` dentro da tela. **É o elemento LCP no mobile** → renderiza visível no SSR (como o MacBook hoje), **não** atrás de `MobileOnly`. Largura pensada pra retrato (~ máx 300px de "stage", aparelho ~120–140px de largura proporcional).

### `PhoneAppScreen`
Casca mobile-nativa que substitui a casca macOS do `AppScreen` no mobile:
- Topo: barra fina com marca + relógio fake (status bar).
- Meio: área de conteúdo que cicla entre as telas reaproveitando os miolos existentes — flashcard com flip (lógica de `AppScreen` Estudar), `TutoresScreen`, `RedacaoScreen` — adaptados pro retrato (coluna única, sem sidebar).
- Base: **bottom nav** com 3 abas (📚 Estudar / 🤖 Tutores / ✍️ Redação) destacando a ativa.
- **Sem** a aba/tela ⚡Central.
- Mesmo timing de ciclo do `AppScreen` (sem o estágio CommandCenter).

### `MobileSatellites`
Os 4 cards vivos posicionados em overlap nas bordas do iPhone (posições do layout B):
- 📚 **Arsenal de Revisão** — `GlassCard` com barras animadas (mesmos dados do desktop).
- 🧠 **AI Memory Engine** — `TerminalWidget` (alimentado por `termLines`).
- 🤖 **Agenda IA** — `GlassCard` com lista de sessões.
- 🔒 **Conceitos Blindados** — `GlassCard` + `ConceptsWidget` (alimentado por `visibleConcepts`).

Versões mais estreitas que as do desktop (ex.: ~140–170px) pra caber em overlap. Reaproveitam `GlassCard`/`TerminalWidget`/`ConceptsWidget` — só mudam largura/posição. Entram com fade/float após o mount. Gated por `MobileOnly`.

### `MobileConnectionLines`
SVG com o mesmo motor visual de `ConnectionLines` (cabo pontilhado dim + 3 pacotes `motion.path` + dots `animateMotion` + glow de chegada no centro), porém:
- `viewBox` e coordenadas recalculados pra moldura retrato / posições de overlap dos satélites.
- 4 caminhos (um por satélite) convergindo no ponto central do iPhone.
- Reaproveita constantes de animação (`PACKET_DUR`, `PACKETS`) e a paleta. Gated por `MobileOnly`.

## Estrutura no render do `HeroSection`

A "Central scene" (hoje `div` com `minHeight` clamp) passa a ter dois ramos mutuamente exclusivos:

- **Desktop:** como hoje — `<DesktopOnly>` envolve `ConnectionLines`, os 4 corner cards e (centro) o `MacBookMockup`.
- **Mobile:** `<MobileOnly>` envolve `MobileConnectionLines` + `MobileSatellites`; o `IPhoneMockup` no centro renderiza no SSR (fora do `MobileOnly`, escondido em `lg` via `lg:hidden`), espelhando como o MacBook é o LCP hoje.

O MacBook central atual (`lg:` visível) e o iPhone (`lg:hidden`) coexistem no DOM por responsividade de CSS, mas só um é visível por breakpoint. Os satélites/linhas de cada lado são gated por `DesktopOnly`/`MobileOnly` pra não hidratar no breakpoint errado.

## Estado compartilhado

`termLines` e `visibleConcepts` já vivem no `HeroSection` e são passados por props. Os satélites mobile e o `PhoneAppScreen` consomem os **mesmos** valores — nenhum `setInterval`/ticker novo.

## Performance

- iPhone + primeira tela do `PhoneAppScreen` = LCP, renderizado no SSR (sem layout shift).
- Satélites e linhas animam após o mount (fade/float), gated por `MobileOnly` (não hidratam no desktop).
- `DesktopOnly` + `MobileOnly` garantem que o ramo do breakpoint oposto nunca hidrata → sem duplo-mount de animações.
- Reuso dos tickers existentes evita timers extras.

## Testing (manual / visual)

- Viewports **360 / 390 / 430px**: iPhone central legível, 4 satélites em overlap sem vazar/encostar feio, linhas convergindo no aparelho, bottom nav visível, ciclo de abas funcionando sem a Central.
- Viewport **≥1024px**: desktop **idêntico** ao atual (MacBook + corners + linhas), iPhone/satélites mobile **não** montados.
- Sem layout shift no carregamento (iPhone é LCP estável).
- Sem duplo-mount: alternar breakpoints (resize) monta só um ramo por vez.
