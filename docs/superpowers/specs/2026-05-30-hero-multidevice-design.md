# Hero Multi-Device — Design Spec

**Data:** 2026-05-30
**Arquivo afetado:** `components/HeroSection.tsx`
**Referência visual:** `ideia mockup.png` (raiz do projeto) — composição estilo Studei

## 1. Contexto e objetivo

O hero atual tem duas composições distintas:
- **Desktop (lg+):** MacBook ao centro + 4 widgets em glass card nos cantos (Arsenal TL, Terminal BL, Agenda IA TR, Conceitos BR), com leve parallax/float.
- **Mobile:** iPhone ao centro + 4 ícones-satélite orbitando, com linhas SVG de conexão e glow de "packets".

Objetivo da mudança: substituir as duas composições por **uma única composição multi-device** (MacBook + iPad + iPhone), exibida em todos os breakpoints e escalada conforme o viewport. A mensagem que isso transmite é **"plataforma robusta e completa"** — três experiências distintas e complementares.

## 2. Composição visual

### 2.1 Layout (desktop e mobile, escalado)

```
        ┌──────────────────────────┐
        │                          │
        │     MacBook (centro,     │
        │      atrás dos outros)   │
        │                          │
   ┌────┤                          ├────┐
   │    │                          │ 📱 │
   │iPad│                          │iPh │
   │ -8°│                          │ +8°│
   └────┴──────────────────────────┴────┘
   ↑ frente, sobrepondo            ↑ frente,
     borda inferior esquerda         sobrepondo direita
```

- **MacBook** ao centro/fundo. É o maior elemento, ancora a composição.
- **iPad** inferior-esquerdo, na frente do MacBook, com leve rotação (~−8°).
- **iPhone** inferior-direito, na frente do MacBook, com leve rotação (~+8°).
- iPad e iPhone sobrepõem as bordas inferiores do MacBook (efeito "camadas").

### 2.2 Escalas-alvo

| Breakpoint | MacBook (largura) | iPad | iPhone |
|---|---|---|---|
| Desktop (≥lg) | ~560px | ~200px | ~150px |
| Tablet (md) | ~440px | ~160px | ~120px |
| Mobile (<md) | ~280–300px | ~100–120px | ~80–100px |

No mobile, iPad/iPhone ficam significativamente menores e o conteúdo interno vira mais decorativo do que legível — mas reconhecível por padrão visual (cores, blocos, layout).

## 3. Conteúdo de cada tela (reaproveitando código existente)

| Device | Componente | Papel narrativo |
|---|---|---|
| **MacBook** | `AppScreen` (atual, ~linhas 624–1143) — cicla por Estudar / Tutores IA / Central / Redação | Vista panorâmica do produto |
| **iPad** | `CommandCenterScreen` (atual, ~linhas 1145–1330) — grid 2×2 com Arsenal, métricas | Painel analítico / overview de progresso |
| **iPhone** | `PhoneRedacaoScreen` (atual, ~linhas 1332–1434) — auditoria TRI da redação | Prova de produto / feature destaque |

**Importante:** todos os três componentes de conteúdo já existem no arquivo. Não precisa criar UIs novas — apenas portar/posicionar dentro dos novos frames de device.

## 4. Componentes a adicionar/modificar/remover

### 4.1 Adicionar
- **`IPadMockup`** (novo) — frame de iPad em CSS/SVG, recebe children (a tela renderizada). Deve ter:
  - Bezel preto fino, cantos arredondados
  - Suporte a prop `tilt` (em graus)
  - Câmera frontal (dot pequeno no topo)
  - Sombra realista para dar profundidade
- Refator de layout no `HeroSection.tsx` (~linhas 2090–2251): remover composições antigas (4 glass cards + iPhone-satélites), substituir por um único container que monta os 3 devices em todos os breakpoints.

### 4.2 Modificar
- **`MacBookMockup`** (linhas 1819+) — pode precisar ajuste de tamanho responsivo. Hoje é `hidden lg:block`; nova versão precisa renderizar em todos os breakpoints, com largura via `clamp()` ou tailwind responsivo.
- **`IPhoneMockup`** (linhas 1594+) — manter, mas reposicionar (canto inferior-direito da composição, com tilt). Hoje fica centralizado no mobile.
- **`CommandCenterScreen`** (1145+) — hoje só é usado em uma aba do AppScreen. Vai virar conteúdo standalone do iPad. Pode precisar ajustes leves de proporção (iPad é 4:3, mais quadrado).

### 4.3 Remover
- 4 glass cards de canto no desktop:
  - TL — Arsenal de Revisão (linhas ~2096–2144)
  - BL — Terminal (linhas ~2146–2159)
  - TR — Agenda IA (linhas ~2194–2230)
  - BR — Conceitos Blindados (linhas ~2233–2250)
- `MobileSatellites` (linhas 1620+) e satellites helpers
- `MobileConnectionLines` (linhas 1741+) — SVG das linhas
- "Center MacBook receiver glow" (linha 414) — sistema de packets/glow
- `FloatWrapper`, `tlX/tlY/blX/blY/trX/trY/brX/brY` parallax — não há mais cantos para flutuar
- Eventualmente: estado de `termLines`, `visibleConcepts` se ficar órfão (verificar referências antes de deletar)

## 5. Considerações de SSR e LCP

- **LCP atual no mobile** é o `IPhoneMockup` (renderizado fora de `MobileOnly` para aparecer no SSR — vide comentário linha 2180).
- **No novo design**, o MacBook passa a ser o elemento dominante visualmente em todos os breakpoints. Decisão: **o MacBook (com sua tela renderizada) deve estar no SSR**, sendo o LCP element. iPad e iPhone podem ser `MobileOnly`/lazy se necessário (mas idealmente também SSR para não causar layout shift).
- Conteúdo animado dentro das telas (cycling tabs, redação digitando) pode permanecer client-side via `useEffect` — só a estrutura precisa estar no SSR.

## 6. Animações

- **Sem satélites, sem linhas de conexão, sem packets/glow externos** (decisão validada com usuário).
- O movimento vem do conteúdo INTERNO das telas:
  - MacBook: tabs ciclando (3.5–5s cada)
  - iPad: barras de Arsenal preenchendo, pulsing nos %
  - iPhone: redação digitando linha-a-linha, score TRI animando
- Entrada do hero: fade-in + leve translateY dos 3 devices em cascata (Mac 0ms → iPad 150ms → iPhone 300ms), igual ao stagger atual.
- **Sem float/parallax** dos devices (estáticos, exceto pelo conteúdo).

## 7. Acessibilidade e responsividade

- Todos os devices devem ter `aria-label` descrevendo o que é (ex.: "Mockup de MacBook exibindo a dashboard da FlashAprova").
- A composição inteira pode ser tratada como decorativa (`role="img"` no container, com label resumindo "plataforma multi-device").
- Em viewports ≤320px (raros mas existem), permitir overflow horizontal controlado ou reduzir mais agressivamente. **Não** ativar scroll horizontal.

## 8. Performance

- Reduzir bundle: ao remover satélites, linhas SVG e float wrappers, espera-se queda no JS/animation cost.
- Animações internas (Framer Motion) continuam — sem mudança significativa.
- Verificar Lighthouse Mobile antes/depois (LCP, TBT, CLS).

## 9. Critérios de aceitação

- [ ] Em desktop (≥1024px): composição MacBook+iPad+iPhone visível, sem widgets de canto.
- [ ] Em mobile (375px): mesma composição, escalada, sem cortar conteúdo importante.
- [ ] AppScreen continua ciclando entre as 4 tabs dentro do MacBook.
- [ ] CommandCenterScreen renderiza dentro do iPad com proporção correta.
- [ ] PhoneRedacaoScreen renderiza dentro do iPhone com a animação TRI.
- [ ] LCP mobile ≤ 2.5s (medir com Lighthouse).
- [ ] CLS ≤ 0.05 (sem layout shift na entrada dos devices).
- [ ] Subheadline + CTA + avatar group abaixo do hero permanecem inalterados.

## 10. Fora do escopo (não fazer agora)

- Não alterar a subheadline, CTA "QUERO COMEÇAR AGORA", ou avatar group de aprovados.
- Não tocar nos componentes/seções abaixo do hero.
- Não trocar paleta de cores ou tipografia globais.
- Não adicionar interatividade (clique nos devices, hover, etc) — composição é puramente visual.

## 11. Decisões pendentes a validar na revisão

1. **Remoção dos 4 glass cards de canto:** estou propondo remover todos para coerência com o approach "limpo". Se quiser manter algum (ex.: "Agenda IA" no canto pra reforçar feature), levantar agora.
2. **Lado de iPad vs iPhone:** spec define iPad à esquerda, iPhone à direita. Inverter é trivial — confirmar preferência.
3. **Tilt dos devices:** ~±8° é "sutil mas perceptível". Pode ser mais agressivo (±12–15°) pra mais dinamismo, ou 0° pra ficar mais corporativo.
