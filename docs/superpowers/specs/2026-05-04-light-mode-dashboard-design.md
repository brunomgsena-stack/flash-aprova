# Light Mode — Dashboard (Design Spec)

**Date:** 2026-05-04
**Scope:** Dashboard e páginas abertas de dentro do dashboard
**Abordagem:** Migrar componentes para CSS variables (`var(--fa-*)`)

---

## Contexto

O ThemeProvider existe com suporte a `dark`/`light`, mas o toggle foi desabilitado e o modo escuro forçado após uma tentativa anterior de modo claro que resultava em texto ilegível. A causa raiz foi overrides CSS globais com `!important` tentando inverter classes Tailwind hardcoded — cobertura incompleta e frágil.

A solução correta é substituir cores hardcoded Tailwind por CSS variables que já alternam corretamente no `globals.css`.

---

## Escopo

**In scope:**
- `app/dashboard/**/*.tsx`
- Componentes usados pelo dashboard: `StudentDashboard.tsx`, `DashboardTour.tsx`, `UserMenu.tsx`

**Out of scope:**
- Landing page, `/login`, `/onboarding`, `/study/`, `/admin/` — ficam sempre dark
- Accent colors (violet, green, amber, red) — não mudam entre temas
- Gradientes decorativos de fundo (orbs) — tratados pelo globals.css existente

---

## Mapeamento de tokens

### Classes Tailwind → CSS variables

| Cor Tailwind atual | Substituto |
|---|---|
| `text-white`, `text-slate-50`, `text-slate-100` | `text-[var(--fa-text)]` |
| `text-slate-200`, `text-slate-300`, `text-slate-400`, `text-gray-300`, `text-gray-400` | `text-[var(--fa-text-2)]` |
| `text-slate-500`, `text-slate-600`, `text-gray-500` | `text-[var(--fa-text-3)]` |
| `bg-[#050b14]`, `bg-black`, `bg-slate-900`, `bg-gray-900`, `bg-zinc-900` | `bg-[var(--fa-bg)]` |
| `bg-white/5`, `bg-white/[0.035]`, `bg-white/10` | `bg-[var(--fa-card)]` |
| `border-white/8`, `border-white/10`, `border-white/5` | `border-[var(--fa-border)]` |

### Inline styles

| Inline style atual | Substituto |
|---|---|
| `color: '#fff'`, `color: 'white'` (em texto de conteúdo) | `color: 'var(--fa-text)'` |
| `color: 'rgba(255,255,255,0.45)'` | `color: 'var(--fa-text-2)'` |
| `color: 'rgba(255,255,255,0.22)'` | `color: 'var(--fa-text-3)'` |
| `background: 'rgba(255,255,255,0.035)'` | `background: 'var(--fa-card)'` |
| `border: '1px solid rgba(255,255,255,0.08)'` | `border: '1px solid var(--fa-border)'` |

### Não alterar
- `text-white` dentro de badges/avatars com fundo colorido (ex: avatar roxo com `text-white`) — o branco é correto sobre fundo colorido em ambos os temas
- Cores de acento: violet, green, amber, red, blue em contextos semânticos
- Gradient text decorativo — `globals.css` já tem fallback `html.light [class*="bg-clip-text"]`

---

## CSS variables — valores confirmados

Já definidos em `globals.css`. Valores do modo claro verificados contra WCAG:

| Variable | Dark | Light | Uso |
|---|---|---|---|
| `--fa-bg` | `#050b14` | `#F8FAFC` | fundo da página |
| `--fa-card` | `rgba(255,255,255,0.035)` | `#FFFFFF` | fundo de cards |
| `--fa-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.06)` | bordas |
| `--fa-text` | `#ffffff` | `#0A0A0A` | headings/labels (21:1) |
| `--fa-text-2` | `rgba(255,255,255,0.45)` | `#334155` | corpo de texto (10:1) |
| `--fa-text-3` | `rgba(255,255,255,0.22)` | `#64748B` | legendas (5:1) |

---

## ThemeProvider

Re-habilitar toggle com persistência:

```ts
// Lê preferência salva, default: 'dark'
const [theme, setTheme] = useState<Theme>(() => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('fa-theme') as Theme) ?? 'dark';
});

function toggle() {
  const next = theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('fa-theme', next);
  applyTheme(next);
}
```

O toggle UI (sol/lua) vive no `UserMenu.tsx` — já tem a infra `isLight`, só estava desligado.

---

## globals.css — limpeza pós-migração

**Manter:**
- Variáveis `--fa-*` (dark e light)
- `html.light body` (grid background)
- `html.light input/textarea/select`
- `.fa-card`, `.fa-shimmer-top`, `.fa-mentor-card` (classes utilitárias)
- `html.light [class*="bg-clip-text"]` (fallback para gradient text)

**Remover após migração completa:**
- Todos os `html.light .text-white { ... !important }`
- `html.light .text-slate-*`, `html.light .text-gray-*` overrides
- `html.light [class*="backdrop-blur"]`
- `html.light .text-transparent`

---

## Ordem de execução

1. **ThemeProvider** — re-habilitar toggle + localStorage
2. **UserMenu.tsx** — adicionar botão sol/lua, terminar migração (70% pronto)
3. **`app/dashboard/page.tsx` + layout** — casca do dashboard
4. **Cards principais**: `PerformanceMetrics.tsx`, `ChartsRow.tsx`, `SubjectsWithDomain.tsx`
5. **AccountStatusCard, MathPrecisionModule, OnboardingWizard**
6. **Subpáginas**: `subject/[subjectId]/`, `deck/[deckId]/`, `reports/`, `schedule/`
7. **Componentes compartilhados**: `StudentDashboard.tsx`, `DashboardTour.tsx`
8. **Limpeza de globals.css** — remover overrides `!important` obsoletos

---

## Critérios de sucesso

- Toggle sol/lua funciona e persiste entre sessões
- Nenhum texto ilegível no modo claro (todos contrastes >= 4.5:1 WCAG AA)
- Nenhum `!important` restante para texto/fundo no globals.css
- Landing page e demais rotas fora do dashboard permanecem dark sem alteração
