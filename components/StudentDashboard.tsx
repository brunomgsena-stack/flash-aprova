'use client';

/**
 * StudentDashboard – "Copiloto Amigável" edition
 *
 * Filosofia: O app pega na mão do aluno, não grita com ele.
 * Paleta:    Esmeralda #10B981 · Azul Foco #0EA5E9 · Âmbar Suave #F59E0B
 * Remoção:   vermelho, linguagem de crise, contadores de "atraso", ícones de alerta
 */

import { useMemo, useState, type ReactNode } from 'react';
import Image                                   from 'next/image';
import Link                                    from 'next/link';
import { useRouter }                           from 'next/navigation';
import { getCategoryShort, ENEM_AREAS }        from '@/lib/categories';
import { getFlashTutor }                       from '@/lib/tutor-config';
import { useDashboardData }                    from '@/lib/DashboardContext';
import UserMenu                                from '@/app/dashboard/UserMenu';
import StreakBadge                             from '@/app/dashboard/StreakBadge';
import AiProUpgradeModal                       from '@/components/AiProUpgradeModal';

// ─── Paleta "Copiloto Amigável" ───────────────────────────────────────────────
const EMERALD = '#10B981';  // progresso, conquista, força
const FOCUS   = '#0EA5E9';  // informação, foco, próximo passo
const AMBER   = '#F59E0B';  // atenção suave (nunca vermelho)
const MONO    = 'var(--font-jetbrains), "JetBrains Mono", monospace';

const SESSION_BTN_STYLE = `
@keyframes sd-glow-pulse {
  0%,100% {
    box-shadow: 0 0 14px #10B98155, 0 0 28px #10B98122;
  }
  50% {
    box-shadow: 0 0 32px #10B98199, 0 0 64px #10B98155, 0 0 96px #10B98122;
  }
}
`;

// ─── Config das 4 Áreas ENEM ─────────────────────────────────────────────────
const AREA_CONFIG = [
  { key: 'Humanas',    icon: '🏛️', label: 'Humanas'            },
  { key: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza' },
  { key: 'Linguagens', icon: '📚', label: 'Linguagens'          },
  { key: 'Matemática', icon: '📐', label: 'Matemática'          },
] as const;

// ─── Cálculo de tempo: 10 flashcards = 1 minuto ───────────────────────────────
function minsForCards(n: number) {
  return Math.max(1, Math.round(n / 10));
}

// ─── Logo inline ──────────────────────────────────────────────────────────────
function FlashAprovaLogo() {
  return (
    <div className="flex items-center gap-1" style={{ lineHeight: 1 }}>
      <span style={{ fontSize: 14 }}>⚡</span>
      <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em', color: EMERALD }}>
        Flash<span style={{ color: 'var(--fa-text)' }}>Aprova</span>
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStreak(dailyCounts: Map<string, number>): number {
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if ((dailyCounts.get(d.toISOString().split('T')[0]) ?? 0) > 0) streak++; else break;
  }
  return streak;
}

function firstName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().split(/\s+/)[0];
}

// ─── Status "Meu Foco" (nunca negativo) ──────────────────────────────────────

function buildFocusStatus(p: {
  hasHistory:          boolean;
  streak:              number;
  cardsReviewedToday:  number;
  dailyGoal:           number;
  nextArea:            string | null;
  maturePct:           number;
}): { dot: string; text: string } {
  const pct = p.dailyGoal > 0
    ? Math.round((p.cardsReviewedToday / p.dailyGoal) * 100)
    : 0;

  if (!p.hasHistory)
    return { dot: EMERALD, text: 'Energia Mental: pronta para começar · Dê o primeiro passo hoje 🌱' };
  if (p.cardsReviewedToday >= p.dailyGoal && p.dailyGoal > 0)
    return { dot: EMERALD, text: `Meta de hoje batida! 🎉 ${p.cardsReviewedToday} cards revisados` };
  if (p.streak > 1)
    return { dot: EMERALD, text: `${p.streak} dias em sequência · Você está construindo um hábito real` };
  if (pct > 0)
    return { dot: FOCUS, text: `Hoje: ${pct}% da meta concluída · Continue — você está no caminho certo` };
  if (p.nextArea)
    return { dot: FOCUS, text: `Destaque de Aprendizado: ${p.nextArea} · Uma sessão focada abre portas` };
  return { dot: EMERALD, text: `${p.maturePct}% do edital consolidado · Mantenha o ritmo` };
}

// ─── Mensagem empática do copiloto ────────────────────────────────────────────
// Tom: "pega na mão", nunca grita ou culpa.

function buildCopilotMsg(p: {
  name:                string;
  hasHistory:          boolean;
  cardsReviewedToday:  number;
  dailyGoal:           number;
  nextArea:            string | null;
  topStrength:         string | null;
  maturePct:           number;
  streak:              number;
}): string {
  const hi   = p.name ? `Oi ${p.name}!` : 'Oi!';
  const remaining = Math.max(0, p.dailyGoal - p.cardsReviewedToday);
  const mins  = minsForCards(remaining);
  const area  = p.nextArea;

  if (!p.hasHistory)
    return `${hi} Que tal começar com 5 minutinhos hoje? Não precisa ser perfeito — só precisa começar. 🌱`;

  if (p.cardsReviewedToday >= p.dailyGoal && p.dailyGoal > 0)
    return `${hi} Você bateu a meta de hoje! 🎉 Isso é constância de verdade. Quer revisar mais ou descansar? As duas opções são válidas.`;

  if (area && remaining > 0)
    return `${hi} Hoje vamos focar em ~${mins} minutinhos de ${area}? É o caminho mais tranquilo para a sua meta de hoje. 💡`;

  if (remaining > 0 && p.streak > 0)
    return `${hi} Faltam só ${remaining} cartões para sua meta hoje. ~${mins} min e você mantém a sequência de ${p.streak} dias! 🔥`;

  if (remaining > 0)
    return `${hi} Sua meta de hoje tem ${p.dailyGoal} cartões e você já fez ${p.cardsReviewedToday}. ~${mins} min bastam para fechar o dia bem. 🎯`;

  if (p.topStrength)
    return `${hi} ${p.topStrength} é sua área mais forte agora — isso é uma vantagem real no ENEM. Continue assim! ⭐`;

  return `${hi} Você está em ${p.maturePct}% do edital consolidado. Cada revisão de hoje soma. 📈`;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-8 w-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div className="h-9 w-44 rounded mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-4 w-72 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function CopilotSkeleton() {
  return (
    <div
      className="mb-10 rounded-2xl animate-pulse"
      style={{ height: 280, background: 'rgba(255,255,255,0.03)', border: `1px solid ${EMERALD}10` }}
    />
  );
}

// ─── Daily Progress Bar ───────────────────────────────────────────────────────

function DailyProgressBar({ done, goal }: { done: number; goal: number }) {
  const pct  = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const done_ = Math.min(done, goal);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.10em' }}>
          META DIÁRIA
        </span>
        <span className="font-black tabular-nums" style={{ fontFamily: MONO, fontSize: '11px', color: pct >= 100 ? EMERALD : FOCUS }}>
          {done_}<span style={{ color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}> / {goal}</span>
          {pct >= 100 && ' 🎉'}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 fa-progress-bar"
          style={{
            width:      `${pct}%`,
            background: pct >= 100
              ? `linear-gradient(90deg, ${EMERALD}, #059669)`
              : `linear-gradient(90deg, ${FOCUS}, ${EMERALD})`,
            boxShadow:  pct > 0 ? `0 0 8px ${pct >= 100 ? EMERALD : FOCUS}55` : 'none',
          }}
        />
      </div>
      {pct > 0 && pct < 100 && (
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Faltam {goal - done_} cards · ~{minsForCards(goal - done_)} min
        </p>
      )}
    </div>
  );
}

// ─── Area Focus Card ──────────────────────────────────────────────────────────

function AreaFocusCard({
  icon, label, cardsDue, score, isStrength, isNext, deckIds, isPro, onUpgrade,
}: {
  icon: string; label: string; cardsDue: number; score: number;
  isStrength: boolean; isNext: boolean;
  deckIds: string[]; isPro: boolean; onUpgrade: () => void;
}) {
  const router = useRouter();
  const color  = isStrength ? EMERALD : isNext ? AMBER : FOCUS;
  const mins   = minsForCards(cardsDue);
  const badge  = isStrength ? '⭐ Ponto Forte' : isNext ? '💡 Destaque de Aprendizado' : null;
  const hasCards = cardsDue > 0;

  function handleClick() {
    if (!hasCards) return;
    if (!isPro) { onUpgrade(); return; }
    const ids = deckIds.join(',');
    router.push(ids ? `/study/turbo?decks=${ids}` : '/study/turbo');
  }

  return (
    <button
      onClick={handleClick}
      disabled={!hasCards}
      className="flex flex-col gap-2 rounded-xl p-3.5 text-left transition-all duration-200 disabled:cursor-default"
      style={{
        background: `${color}0A`,
        border:     `1px solid ${color}${isStrength || isNext ? '40' : '22'}`,
        boxShadow:  isStrength || isNext ? `0 0 16px ${color}12` : 'none',
        cursor:     hasCards ? 'pointer' : 'default',
        transform:  undefined,
      }}
      onMouseEnter={e => { if (hasCards) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-bold text-white leading-tight truncate">{label}</span>
        {hasCards && isPro && <span className="ml-auto text-xs opacity-40">▶</span>}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {hasCards ? `${cardsDue} cards` : 'Em dia ✓'}
        </span>
        {score > 0 && (
          <span
            className="font-bold tabular-nums rounded-full px-2 py-0.5"
            style={{ fontFamily: MONO, fontSize: '10px', background: `${color}18`, color }}
          >
            {score}%
          </span>
        )}
      </div>

      {/* Badge (força / destaque de aprendizado) */}
      {badge && (
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 self-start"
          style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-0.5"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, minWidth: 62, fontFamily: MONO }}
    >
      <span className="text-lg font-black tabular-nums leading-none" style={{ color }}>{value}</span>
      <span
        className="text-center leading-tight uppercase"
        style={{ fontSize: '7px', color: 'rgba(255,255,255,0.28)', whiteSpace: 'pre-line', letterSpacing: '0.08em' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentDashboard({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const dashState = useDashboardData();
  const [showUpgrade, setUpgrade] = useState(false);

  // ── Derive component-specific data from shared context ──────────────────────
  const derived = useMemo(() => {
    if (dashState.status !== 'ready') return null;
    const { plan, profile, normCards, progress, totalCardCount, domainMap, dailyCounts, totalReviews } = dashState.data;

    const today = new Date().toISOString().split('T')[0];
    const dailyGoal = profile.daily_card_goal ?? 50;
    const userName  = firstName(profile.full_name);

    // maturePct
    const maturePct = totalCardCount > 0
      ? Math.round((progress.filter(r => (r.interval_days ?? 0) > 21).length / totalCardCount) * 100)
      : 0;

    // Cards due today (total + per area)
    const nrMap = new Map(progress.map(r => [r.card_id, r.next_review]));
    const areaCards: Record<string, number> = {};
    let cardsToday = 0;
    for (const c of normCards) {
      const nr    = nrMap.get(c.id);
      const isDue = nr === undefined || (nr !== null && nr <= today);
      if (!isDue) continue;
      cardsToday++;
      const area = getCategoryShort(c.subjectCategory);
      if (area) areaCards[area] = (areaCards[area] ?? 0) + 1;
    }

    // Cards reviewed today
    let cardsReviewedToday = 0;
    for (const row of progress) {
      for (const entry of row.history ?? []) {
        if (entry.reviewed_at?.slice(0, 10) === today) cardsReviewedToday++;
      }
    }

    const streak          = calcStreak(dailyCounts);
    const hasHistory      = totalReviews > 0;
    const firstSessionDone = profile.first_session_completed === true;

    // Area scores
    const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.subjectCategory)]));
    const shortScore = new Map<string, { sum: number; count: number }>();
    for (const [sid, domain] of domainMap.entries()) {
      const area = subjAreaMap.get(sid);
      if (!area) continue;
      const s = shortScore.get(area) ?? { sum: 0, count: 0 };
      s.sum += domain.level; s.count++;
      shortScore.set(area, s);
    }

    const areaScores: Record<string, number> = {};
    let topStrength: string | null = null, topScore    = 0;
    let nextArea:    string | null = null, lowestScore = 101;
    for (const area of ENEM_AREAS) {
      const s     = shortScore.get(area.short);
      const score = s && s.count > 0 ? Math.round((s.sum / s.count / 5) * 100) : 0;
      areaScores[area.short] = score;
      if (score > 0 && score > topScore)    { topScore    = score; topStrength = area.short; }
      if (score > 0 && score < lowestScore) { lowestScore = score; nextArea    = area.short; }
    }

    // Deck IDs per area (for clickable area cards)
    const areaDeckIds: Record<string, string[]> = {};
    for (const c of normCards) {
      const area = getCategoryShort(c.subjectCategory);
      if (!area) continue;
      const nr    = nrMap.get(c.id);
      const isDue = nr === undefined || (nr !== null && nr <= today);
      if (isDue) {
        if (!areaDeckIds[area]) areaDeckIds[area] = [];
        if (!areaDeckIds[area].includes(c.deckId)) areaDeckIds[area].push(c.deckId);
      }
    }

    return {
      userName, maturePct, streak, dailyGoal, cardsReviewedToday,
      cardsToday, areaCards, topStrength, nextArea,
      plan, profile, areaScores, hasHistory, firstSessionDone,
      nextAreaDeckIds: areaDeckIds[nextArea ?? ''] ?? [],
      areaDeckIds,
    };
  }, [dashState]);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (dashState.status === 'loading') {
    return (
      <>
        <HeaderSkeleton />
        <CopilotSkeleton />
        {children}
      </>
    );
  }

  if (!derived) {
    return (
      <>
        <HeaderSkeleton />
        <CopilotSkeleton />
        {children}
      </>
    );
  }

  const {
    userName, maturePct, streak, dailyGoal, cardsReviewedToday,
    areaCards, topStrength, nextArea, plan, areaScores, hasHistory, firstSessionDone,
    nextAreaDeckIds, areaDeckIds,
  } = derived;

  const isPro        = plan === 'panteao_elite';
  const tutor        = getFlashTutor();
  const focusStatus  = buildFocusStatus({ hasHistory, streak, cardsReviewedToday, dailyGoal, nextArea, maturePct });
  const copilotMsg   = buildCopilotMsg({ name: userName, hasHistory, cardsReviewedToday, dailyGoal, nextArea, topStrength, maturePct, streak });

  const jarvisGreeting = (() => {
    const name = userName ? `, ${userName}` : '';
    const greetings = [
      `Sinta-se em casa${name}.`,
      `Tudo pronto pra você${name}.`,
      `Seus cards te esperaram${name}.`,
      `Sistema online${name}.`,
      `Missão retomada${name}.`,
    ];
    // Estável por dia — não muda a cada render
    const idx = new Date().getDate() % greetings.length;
    return greetings[idx];
  })();

  // ── Empty state para novos alunos (sem histórico OU primeira sessão pendente) ──
  if (!hasHistory || !firstSessionDone) {
    return (
      <>
        {showUpgrade && <AiProUpgradeModal onClose={() => setUpgrade(false)} />}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <FlashAprovaLogo />
            <div className="flex items-center gap-3">
              <StreakBadge /><UserMenu />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: 'var(--fa-text)' }}>
            {userName ? `Bem-vindo, ${userName}!` : 'Bem-vindo!'}
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--fa-text-2)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle" style={{ background: EMERALD, boxShadow: `0 0 5px ${EMERALD}` }} />
            Tudo pronto — comece seu primeiro estudo agora
          </p>
        </div>

        <div className="mb-10">
          <div className="relative rounded-2xl p-8 overflow-hidden fa-card fa-shimmer-top flex flex-col items-center gap-5 text-center"
            style={{ background: 'var(--fa-card)', border: '1px solid var(--fa-border)', boxShadow: 'var(--fa-shadow)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top, ${EMERALD}0A 0%, transparent 60%)` }} />
            <div className="rounded-full overflow-hidden relative z-10"
              style={{ width: 64, height: 64, border: `2px solid ${EMERALD}60`, boxShadow: `0 0 24px ${EMERALD}28` }}>
              <img src={tutor.avatar_url} alt={tutor.name} width={64} height={64} />
            </div>
            <div className="relative z-10">
              <p className="text-lg font-bold text-white mb-1">{tutor.name} está pronto para te guiar</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fa-text-2)' }}>
                Não precisa ser longo — <strong>5 minutinhos</strong> já ativam o diagnóstico e o SRS começa a trabalhar por você.
              </p>
            </div>
            <button
              onClick={() => router.push('/welcome/first-session')}
              className="relative z-10 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${EMERALD}, #059669)`, boxShadow: `0 0 24px ${EMERALD}40` }}
            >
              ⚡ Começar Primeira Sessão
            </button>
            <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Você escolhe o ritmo. Pode parar quando quiser.
            </p>
          </div>
        </div>

        {children}
      </>
    );
  }

  return (
    <>
      <style>{SESSION_BTN_STYLE}</style>
      {showUpgrade && <AiProUpgradeModal onClose={() => setUpgrade(false)} />}

      {/* ════ Header "Meu Foco" ════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <FlashAprovaLogo />
          <div className="flex items-center gap-3">
            <StreakBadge />
            <UserMenu />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--fa-text)' }}>
          {jarvisGreeting}
        </h1>

        {/* Status "Energia Mental" — nunca negativo */}
        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--fa-text-2)' }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
            style={{ background: focusStatus.dot, boxShadow: `0 0 5px ${focusStatus.dot}` }}
          />
          {focusStatus.text}
        </p>
      </div>

      {/* ════ Copiloto Card ═══════════════════════════════════════════════════ */}
      <div className="mb-10" id="tour-copilot">
        <div
          className="relative rounded-2xl p-6 overflow-hidden fa-card fa-shimmer-top"
          style={{
            background:           'var(--fa-card)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:               '1px solid var(--fa-border)',
            boxShadow:            'var(--fa-shadow)',
          }}
        >
          {/* Top shimmer (dark only — light uses ::before pseudo via CSS) */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'var(--fa-shimmer)' }}
          />
          {/* Radial ambient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, var(--fa-iris-a) 0%, transparent 55%)` }}
          />

          {/* ── Label row ── */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: EMERALD }}>
              💡 Seu Copiloto
            </p>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
              style={{
                background: isPro ? `${EMERALD}18` : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${isPro ? EMERALD + '44' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isPro ? EMERALD : 'rgba(255,255,255,0.18)', boxShadow: isPro ? `0 0 6px ${EMERALD}` : 'none' }}
              />
              <span className="text-xs font-semibold" style={{ color: isPro ? EMERALD : 'rgba(255,255,255,0.28)' }}>
                {isPro ? '[SISTEMA OPERANDO]' : 'Plano Flash'}
              </span>
            </div>
          </div>

          {/* ── Daily Progress Bar ── */}
          <div className="relative z-10">
            <DailyProgressBar done={cardsReviewedToday} goal={dailyGoal} />
          </div>

          {/* ── Avatar + mensagem empática ── */}
          <div className="relative z-10 flex items-start gap-4 mb-5">

            {/* Avatar */}
            <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
              <div
                className="rounded-full overflow-hidden"
                style={{
                  width:     44,
                  height:    44,
                  border:    `2px solid ${EMERALD}60`,
                  boxShadow: `0 0 14px ${EMERALD}28`,
                }}
              >
                <Image src={tutor.avatar_url} alt={tutor.name} width={44} height={44} unoptimized />
              </div>
              <span style={{ color: EMERALD, fontSize: '7px', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.70 }}>
                COPILOTO
              </span>
            </div>

            {/* Bubble */}
            <div className="relative flex-1 min-w-0">
              {/* Tail */}
              <div
                aria-hidden
                style={{
                  position:     'absolute',
                  left:         '-7px',
                  top:          '16px',
                  width:        0,
                  height:       0,
                  borderTop:    '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderRight:  '7px solid rgba(255,255,255,0.04)',
                  filter:       `drop-shadow(-1px 0 0 ${EMERALD}20)`,
                }}
              />
              <div
                className="rounded-2xl px-4 py-3.5"
                style={{
                  background:     'var(--fa-card)',
                  border:         `1px solid var(--fa-border)`,
                  backdropFilter: 'blur(8px)',
                  boxShadow:      'var(--fa-shadow)',
                }}
              >
                {/* Tutor identity */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-sm font-bold" style={{ color: EMERALD }}>{tutor.name}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{tutor.title}</span>
                </div>

                {/* Mensagem empática — sempre positiva, nunca culpa */}
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fa-text-2)' }}>
                  {copilotMsg}
                </p>

                {/* Upsell suave para plano Flash */}
                {!isPro && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Com <span style={{ color: EMERALD, fontWeight: 700 }}>Protocolo Neural</span> você recebe sessões personalizadas por área e cronograma semanal IA.
                  </p>
                )}

                {/* CTA */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {isPro ? (
                    <button
                      onClick={() => {
                        const ids = nextAreaDeckIds.length > 0
                          ? nextAreaDeckIds.join(',')
                          : null;
                        router.push(ids ? `/study/turbo?decks=${ids}` : '/study/turbo');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold active:scale-95 hover:brightness-115"
                      style={{
                        background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
                        border:     `1px solid ${EMERALD}88`,
                        color:      'white',
                        animation:  'sd-glow-pulse 2.4s ease-in-out infinite',
                        transition: 'filter 0.15s',
                      }}
                    >
                      ⚡ Iniciar Sessão
                      {nextArea && (
                        <span style={{ opacity: 0.80, fontFamily: MONO, fontSize: '10px', letterSpacing: '0.04em' }}>
                          · {nextArea}
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setUpgrade(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${EMERALD}40, ${FOCUS}28)`,
                        border:     `1px solid ${EMERALD}40`,
                        color:      'white',
                        cursor:     'pointer',
                      }}
                    >
                      🔒 Desbloquear Copiloto IA
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats pills (sm+ — vertical) */}
            <div className="shrink-0 hidden sm:flex flex-col gap-2">
              <StatPill value={`${maturePct}%`} label={`EDITAL\nDOMINADO`} color={EMERALD} />
              {streak > 0 && (
                <StatPill
                  value={`${streak}${streak >= 7 ? '🔥' : ''}`}
                  label={`DIAS EM\nSEQUÊNCIA`}
                  color={AMBER}
                />
              )}
            </div>
          </div>

          {/* Stats pills (mobile only — horizontal row) */}
          <div className="hidden gap-2 relative z-10 mb-4">
            <StatPill value={`${maturePct}%`} label={`EDITAL\nDOMINADO`} color={EMERALD} />
            {streak > 0 && (
              <StatPill
                value={`${streak}${streak >= 7 ? '🔥' : ''}`}
                label={`DIAS EM\nSEQUÊNCIA`}
                color={AMBER}
              />
            )}
            <StatPill
              value={`${cardsReviewedToday}`}
              label={`CARDS\nHOJE`}
              color={FOCUS}
            />
          </div>

          {/* ════ Seleção de Áreas ENEM ═══════════════════════════════════════ */}
          <div className="relative z-10" id="tour-areas">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
              FRENTES DE ATAQUE:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AREA_CONFIG.map(area => (
                <AreaFocusCard
                  key={area.key}
                  icon={area.icon}
                  label={area.label}
                  cardsDue={areaCards[area.key] ?? 0}
                  score={areaScores[area.key] ?? 0}
                  isStrength={topStrength === area.key}
                  isNext={nextArea === area.key && topStrength !== area.key}
                  deckIds={areaDeckIds[area.key] ?? []}
                  isPro={isPro}
                  onUpgrade={() => setUpgrade(true)}
                />
              ))}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="relative z-10 flex gap-3 mt-5">
            <Link
              id="tour-report-btn"
              href="/dashboard/reports"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background:     'transparent',
                border:         `1px solid ${FOCUS}40`,
                color:           FOCUS,
                textDecoration: 'none',
              }}
            >
              📊 Relatório de Progresso
            </Link>

            {isPro ? (
              <Link
                id="tour-schedule-btn"
                href="/dashboard/schedule"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background:     `linear-gradient(135deg, ${FOCUS}22, ${EMERALD}14)`,
                  border:         `1px solid ${FOCUS}40`,
                  color:          'white',
                  boxShadow:      `0 0 12px ${FOCUS}14`,
                  textDecoration: 'none',
                }}
              >
                🗓️ Cronograma IA
              </Link>
            ) : (
              <button
                id="tour-schedule-btn"
                onClick={() => setUpgrade(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: `${FOCUS}08`,
                  border:     `1px solid ${FOCUS}18`,
                  color:      'rgba(255,255,255,0.35)',
                }}
              >
                🔒 Cronograma IA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════ Resto do dashboard (Charts, Metrics, Subjects) ════════════════════ */}
      {children}
    </>
  );
}
