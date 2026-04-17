'use client';

/**
 * StudentDashboard – "Copiloto Amigável" edition
 *
 * Filosofia: O app pega na mão do aluno, não grita com ele.
 * Paleta:    Esmeralda #10B981 · Azul Foco #0EA5E9 · Âmbar Suave #F59E0B
 * Remoção:   vermelho, linguagem de crise, contadores de "atraso", ícones de alerta
 */

import { useEffect, useState, type ReactNode } from 'react';
import Image                                   from 'next/image';
import Link                                    from 'next/link';
import { useRouter }                           from 'next/navigation';
import { supabase }                            from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan }            from '@/lib/plan';
import { buildDomainMap }                      from '@/lib/domain';
import { getCategoryShort, ENEM_AREAS }        from '@/lib/categories';
import { getFlashTutor }                       from '@/lib/tutor-config';
import UserMenu                                from '@/app/dashboard/UserMenu';
import StreakBadge                             from '@/app/dashboard/StreakBadge';
import EnemCountdown                           from '@/app/dashboard/EnemCountdown';
import AiProUpgradeModal                       from '@/components/AiProUpgradeModal';

// ─── Paleta "Copiloto Amigável" ───────────────────────────────────────────────
const EMERALD = '#10B981';  // progresso, conquista, força
const FOCUS   = '#0EA5E9';  // informação, foco, próximo passo
const AMBER   = '#F59E0B';  // atenção suave (nunca vermelho)

// ─── Config das 4 Áreas ENEM ─────────────────────────────────────────────────
const AREA_CONFIG = [
  { key: 'Humanas',    icon: '🏛️', label: 'Humanas'            },
  { key: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza' },
  { key: 'Linguagens', icon: '📚', label: 'Linguagens'          },
  { key: 'Matemática', icon: '📐', label: 'Matemática'          },
] as const;

const SECS_PER_CARD = 35; // estimativa realista por cartão

function minsForCards(n: number) {
  return Math.max(1, Math.round((n * SECS_PER_CARD) / 60));
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

// ─── Types ────────────────────────────────────────────────────────────────────

type DashData = {
  userName:            string;
  maturePct:           number;
  streak:              number;
  dailyGoal:           number;
  cardsReviewedToday:  number;
  cardsToday:          number;          // total disponíveis (para o cap)
  areaCards:           Record<string, number>;  // cards disponíveis por área
  topStrength:         string | null;
  nextArea:            string | null;
  plan:                Plan;
  profile: {
    target_course?:       string | null;
    target_university?:   string | null;
    difficulty_subjects?: string[] | null;
  };
  areaScores:       Record<string, number>;
  hasHistory:       boolean;
  nextAreaDeckIds:  string[];
};

type State = { status: 'loading' } | { status: 'ready'; data: DashData };

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
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Meta de hoje
        </span>
        <span className="text-xs font-black tabular-nums" style={{ color: pct >= 100 ? EMERALD : FOCUS }}>
          {done_}&thinsp;<span style={{ color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}>/ {goal} cards</span>
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
  icon, label, cardsDue, score, isStrength, isNext,
}: {
  icon: string; label: string; cardsDue: number; score: number;
  isStrength: boolean; isNext: boolean;
}) {
  const color  = isStrength ? EMERALD : isNext ? AMBER : FOCUS;
  const mins   = minsForCards(cardsDue);
  const badge  = isStrength ? '⭐ Ponto Forte' : isNext ? '💡 Destaque de Aprendizado' : null;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
      style={{
        background: `${color}0A`,
        border:     `1px solid ${color}${isStrength || isNext ? '40' : '22'}`,
        boxShadow:  isStrength || isNext ? `0 0 16px ${color}12` : 'none',
      }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-sm font-bold text-white leading-tight truncate">{label}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {cardsDue > 0 ? `${cardsDue} cards · ~${mins} min` : 'Em dia ✓'}
        </span>
        {score > 0 && (
          <span
            className="text-xs font-bold tabular-nums rounded-full px-2 py-0.5"
            style={{ background: `${color}18`, color }}
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
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-0.5"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, minWidth: 62 }}
    >
      <span className="text-lg font-black tabular-nums leading-none" style={{ color }}>{value}</span>
      <span
        className="text-center leading-tight uppercase tracking-wider"
        style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)', whiteSpace: 'pre-line' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentDashboard({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const [state,       setState]  = useState<State>({ status: 'loading' });
  const [showUpgrade, setUpgrade] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState({ status: 'ready', data: emptyData() }); return; }

      const [planInfo, cardsRes, progressRes, countRes, profileRes] = await Promise.all([
        fetchUserPlan(user.id),
        supabase.from('cards').select('id, decks(id, subject_id, subjects(id, category))'),
        supabase.from('user_progress').select('card_id, interval_days, next_review, history').eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('target_course, target_university, difficulty_subjects, daily_card_goal, full_name')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      const plan  = planInfo.plan;
      const rows  = progressRes.data ?? [];
      const total = countRes.count ?? 0;
      const today = new Date().toISOString().split('T')[0];

      type ProfileRow = {
        target_course?:       string | null;
        target_university?:   string | null;
        difficulty_subjects?: string[] | null;
        daily_card_goal?:     number | null;
        full_name?:           string | null;
      } | null;
      const pd = profileRes.data as ProfileRow;

      const dailyGoal = pd?.daily_card_goal ?? 50;
      const userName  = firstName(pd?.full_name ?? user.user_metadata?.full_name ?? user.email);
      const profile   = {
        target_course:       pd?.target_course       ?? null,
        target_university:   pd?.target_university   ?? null,
        difficulty_subjects: pd?.difficulty_subjects ?? [],
      };

      // ── maturePct ────────────────────────────────────────────────────────────
      const maturePct = total > 0
        ? Math.round((rows.filter(r => (r.interval_days ?? 0) > 21).length / total) * 100)
        : 0;

      // ── Normalize cards (com categoria) ──────────────────────────────────────
      type NormCard = { id: string; deckId: string; subjectId: string; category: string | null };
      const normCards: NormCard[] = [];
      for (const rawCard of (cardsRes.data ?? []) as Array<{ id: string; decks: unknown }>) {
        const rd = Array.isArray(rawCard.decks) ? rawCard.decks[0] : rawCard.decks as { id: string; subject_id: string; subjects: unknown } | null;
        if (!rd) continue;
        const d  = rd as { id: string; subject_id: string; subjects: unknown };
        const rs = Array.isArray(d.subjects) ? d.subjects[0] : d.subjects as { id: string; category: string | null } | null;
        if (!rs) continue;
        const s  = rs as { id: string; category: string | null };
        normCards.push({ id: rawCard.id, deckId: d.id, subjectId: d.subject_id, category: s.category });
      }

      // ── Cards disponíveis hoje (total + por área) ─────────────────────────────
      const nrMap     = new Map(rows.map(r => [r.card_id, r.next_review as string | null]));
      const areaCards: Record<string, number> = {};
      let cardsToday = 0;

      for (const c of normCards) {
        const nr    = nrMap.get(c.id);
        const isDue = nr === undefined || (nr !== null && nr <= today);
        if (!isDue) continue;
        cardsToday++;
        const area = getCategoryShort(c.category);
        if (area) areaCards[area] = (areaCards[area] ?? 0) + 1;
      }

      // ── Cards revisados hoje (da history) ────────────────────────────────────
      const dailyCounts = new Map<string, number>();
      let totalReviews       = 0;
      let cardsReviewedToday = 0;
      for (const row of rows) {
        for (const entry of (row.history as Array<{ reviewed_at: string }> | null) ?? []) {
          const day = entry.reviewed_at?.slice(0, 10);
          if (!day) continue;
          dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
          totalReviews++;
          if (day === today) cardsReviewedToday++;
        }
      }
      const streak     = calcStreak(dailyCounts);
      const hasHistory = totalReviews > 0;

      // ── Area scores ───────────────────────────────────────────────────────────
      const domainMap = buildDomainMap(
        normCards.map(c => ({ id: c.id, decks: { subject_id: c.subjectId } })),
        rows.map(r => ({ card_id: r.card_id, interval_days: r.interval_days ?? 0 })),
      );
      const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.category)]));

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

      // Deck IDs with due cards in the suggested next area (for "Iniciar Sessão")
      const nextAreaDeckSet = new Set<string>();
      if (nextArea) {
        for (const c of normCards) {
          if (getCategoryShort(c.category) !== nextArea) continue;
          const nr    = nrMap.get(c.id);
          const isDue = nr === undefined || (nr !== null && nr <= today);
          if (isDue) nextAreaDeckSet.add(c.deckId);
        }
      }
      const nextAreaDeckIds = [...nextAreaDeckSet];

      setState({
        status: 'ready',
        data: {
          userName, maturePct, streak, dailyGoal, cardsReviewedToday,
          cardsToday, areaCards, topStrength, nextArea,
          plan, profile, areaScores, hasHistory, nextAreaDeckIds,
        },
      });
    }
    load();
  }, []);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (state.status === 'loading') {
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
    areaCards, topStrength, nextArea, plan, profile, areaScores, hasHistory,
    nextAreaDeckIds,
  } = state.data;

  const isPro        = plan === 'panteao_elite';
  const tutor        = getFlashTutor();
  const focusStatus  = buildFocusStatus({ hasHistory, streak, cardsReviewedToday, dailyGoal, nextArea, maturePct });
  const copilotMsg   = buildCopilotMsg({ name: userName, hasHistory, cardsReviewedToday, dailyGoal, nextArea, topStrength, maturePct, streak });

  return (
    <>
      {showUpgrade && <AiProUpgradeModal onClose={() => setUpgrade(false)} />}

      {/* ════ Header "Meu Foco" ════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: EMERALD }}>
            FlashAprova
          </p>
          <div className="flex items-center gap-3">
            <StreakBadge />
            <EnemCountdown />
            <UserMenu />
          </div>
        </div>

        <h1 className="text-4xl font-bold leading-tight" style={{ color: 'var(--fa-text)' }}>Meu Foco</h1>

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
      <div className="mb-10">
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
                {isPro ? 'AiPro+ Ativo' : 'Plano Flash'}
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
                {isPro ? (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--fa-text-2)' }}>
                    {copilotMsg}
                  </p>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-white font-medium">
                      {/* Mostra só a primeira frase para o plano flash */}
                      {copilotMsg.split('?')[0] + (copilotMsg.includes('?') ? '?' : '')}
                    </p>
                    <div className="relative mt-1">
                      <p className="text-sm leading-relaxed select-none"
                        style={{ color: 'rgba(255,255,255,0.55)', filter: 'blur(3px)', userSelect: 'none' }}
                        aria-hidden
                      >
                        {copilotMsg.split('?').slice(1).join('?')}
                      </p>
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(10,12,20,0.65))' }}
                      />
                    </div>
                  </>
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
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
                        border:     `1px solid ${EMERALD}60`,
                        boxShadow:  `0 0 14px ${EMERALD}28`,
                        color:      'white',
                      }}
                    >
                      ⚡ Iniciar Sessão Sugerida
                      {nextArea && <span style={{ opacity: 0.75 }}>· {nextArea}</span>}
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

            {/* Stats pills (sm+) */}
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

          {/* ════ Seleção de Áreas ENEM ═══════════════════════════════════════ */}
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Áreas disponíveis para estudar
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
                />
              ))}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="relative z-10 flex gap-3 mt-5">
            <Link
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
                🗓️ Cronograma Semanal IA
              </Link>
            ) : (
              <button
                onClick={() => setUpgrade(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: `${FOCUS}08`,
                  border:     `1px solid ${FOCUS}18`,
                  color:      'rgba(255,255,255,0.35)',
                }}
              >
                🔒 Cronograma Semanal IA
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

function emptyData(): DashData {
  return {
    userName: '', maturePct: 0, streak: 0, dailyGoal: 50,
    cardsReviewedToday: 0, cardsToday: 0, areaCards: {},
    topStrength: null, nextArea: null, plan: 'aceleracao',
    profile: {}, areaScores: {}, hasHistory: false, nextAreaDeckIds: [],
  };
}
