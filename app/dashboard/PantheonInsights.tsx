'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan } from '@/lib/plan';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryShort, ENEM_AREAS } from '@/lib/categories';
import {
  getFlashTutor,
  getSpecialistForArea,
  getTutorById,
  type TutorConfig,
} from '@/lib/tutor-config';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const NEON_PURPLE = '#a855f7';
const NEON_CYAN   = '#22d3ee';
const NEON_ORANGE = '#f97316';
const NEON_GREEN  = '#00ff80';
const RED_ALERT   = '#ef4444';

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLE = `
@keyframes ft-scan {
  0%   { transform: translateY(-100%); opacity: 0.45; }
  100% { transform: translateY(600%);  opacity: 0; }
}
@keyframes ft-pulse {
  0%,100% { opacity: 0.45; }
  50%      { opacity: 1; }
}
@keyframes ft-pop {
  0%   { transform: scale(0.88); opacity: 0; }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes ft-appear {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ─── Streak helpers ───────────────────────────────────────────────────────────

function calcStreak(dailyCounts: Map<string, number>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d   = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    if ((dailyCounts.get(iso) ?? 0) > 0) { streak++; } else { break; }
  }
  return streak;
}

function streakFire(n: number): string {
  if (n >= 30) return '🔥🔥🔥';
  if (n >= 14) return '🔥🔥';
  if (n >= 7)  return '🔥';
  return '';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightType = 'no-edital' | 'no-consistency' | 'weak-area' | 'streak-high' | 'lapses' | 'positive';

type FlashInsight = {
  type:       InsightType;
  line1:      string;
  line2:      string;
  specialist: TutorConfig | null;
  ctaLabel:   string;
  ctaHref:    string;
};

/** Single state shape — all plans now get real data. */
type InsightData = {
  insight:   FlashInsight;
  maturePct: number;
  streak:    number;
  plan:      Plan;
};

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: InsightData };

// ─── Insight generator ────────────────────────────────────────────────────────

function generateInsight(params: {
  maturePct:     number;
  areaScores:    Map<string, number>;
  topLapseDeck:  { deckId: string; deckTitle: string; subjectCategory: string | null; lapses: number } | null;
  totalDue:      number;
  streak:        number;
  totalReviews:  number;
  hasAnyHistory: boolean;
}): FlashInsight {
  const { maturePct, areaScores, topLapseDeck, totalDue, streak, totalReviews, hasAnyHistory } = params;

  // Cenário D — zero edital
  if (maturePct === 0 && totalDue > 0) {
    return {
      type:       'no-edital',
      line1:      'O tempo é o único recurso que não recuperamos.',
      line2:      'Cada minuto de indecisão é um ponto a menos na sua média. Escolha uma frente e avance. ⚔️',
      specialist: null,
      ctaLabel:   'Escolher Frente de Ataque',
      ctaHref:    '/dashboard',
    };
  }

  // Cenário A — streak perdido
  if (streak === 0 && hasAnyHistory) {
    return {
      type:       'no-consistency',
      line1:      'Soldado, seu radar está perdendo sinal.',
      line2:      'A aprovação não é um evento, é um hábito. Sem consistência, o Dr. Chronos não pode salvar sua nota. Comece sua fila de hoje AGORA. 🛡️',
      specialist: getTutorById('dr-chronos'),
      ctaLabel:   'Retomar Sequência Agora',
      ctaHref:    '/dashboard',
    };
  }

  // Cenário B — ponto cego no radar (< 20%)
  let weakestArea: string | null = null;
  let weakestScore = 101;
  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < 20 && score < weakestScore) { weakestArea = area.short; weakestScore = score; }
  }
  if (weakestArea) {
    const specialist = getSpecialistForArea(weakestArea);
    const areaIcon   = ENEM_AREAS.find(a => a.short === weakestArea)?.icon ?? '📚';
    return {
      type:       'weak-area',
      line1:      `Analisando suas lacunas: sua defesa em ${weakestArea} está rompida. ${areaIcon}`,
      line2:      specialist
        ? `Estudar o que você já sabe é conforto, estudar o que falta é estratégia. O ${specialist.name} está de prontidão para fechar esse buraco.`
        : `Estudar o que você já sabe é conforto, estudar o que falta é estratégia. Foque em ${weakestArea} agora.`,
      specialist,
      ctaLabel:   specialist ? `Chamar ${specialist.name}` : `Atacar ${weakestArea}`,
      ctaHref:    '/dashboard',
    };
  }

  // Cenário C — streak alta
  if (streak >= 7) {
    return {
      type:       'streak-high',
      line1:      `Excelente ritmo, ⚡. Você está construindo o terreno da sua aprovação.`,
      line2:      'Não deixe a guarda baixar; o topo é o lugar mais escorregadio. Qual o próximo objetivo? 🎯',
      specialist: null,
      ctaLabel:   'Ver Próximo Objetivo',
      ctaHref:    '/dashboard',
    };
  }

  // Lapsos — reforço
  if (topLapseDeck && topLapseDeck.lapses >= 3) {
    const areaShort  = getCategoryShort(topLapseDeck.subjectCategory);
    const specialist = getSpecialistForArea(areaShort) ?? null;
    return {
      type:       'lapses',
      line1:      `${topLapseDeck.lapses} lapso${topLapseDeck.lapses !== 1 ? 's' : ''} detectado${topLapseDeck.lapses !== 1 ? 's' : ''} em "${topLapseDeck.deckTitle}".`,
      line2:      'Esse ponto fraco drena sua nota. Precisa de reforço hoje — não amanhã.',
      specialist,
      ctaLabel:   'Reforçar Agora',
      ctaHref:    `/dashboard/deck/${topLapseDeck.deckId}/pre-study`,
    };
  }

  // Positivo rotativo — muda a cada revisão concluída
  const positives: [string, string][] = [
    ['Consistência ativa. Ritmo dentro do esperado.',        'Continue o ciclo — a aprovação é construída revisão a revisão. ⚡'],
    ['Nenhuma brecha crítica detectada no radar.',           'Mantenha a frequência. A memória se consolida com repetição, não com intensidade. 🧠'],
    ['Sua base está sendo erguida tijolo a tijolo.',         'Cada card revisado hoje é uma questão garantida no dia da prova. 🏹'],
    ['Operação em andamento. Sem alertas no momento.',       'O General aguarda seu próximo movimento. Avance para o próximo deck. ⚔️'],
  ];
  const [l1, l2] = positives[totalReviews % positives.length];
  return { type: 'positive', line1: l1, line2: l2, specialist: null, ctaLabel: 'Ir para Fila de Revisão', ctaHref: '/dashboard' };
}

// ─── Accent color ─────────────────────────────────────────────────────────────

function accentColor(type: InsightType): string {
  switch (type) {
    case 'no-edital':      return NEON_ORANGE;
    case 'no-consistency': return RED_ALERT;
    case 'weak-area':      return RED_ALERT;
    case 'streak-high':    return NEON_GREEN;
    case 'lapses':         return NEON_ORANGE;
    case 'positive':       return NEON_GREEN;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div
      className="max-w-5xl mx-auto mb-10 rounded-2xl animate-pulse"
      style={{ height: '160px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.12)' }}
    />
  );
}

// ─── Speech Bubble ────────────────────────────────────────────────────────────
// Wraps insight content in a modern, minimalist speech bubble with a left tail.

function SpeechBubble({
  insight,
  isPro,
  onUpgrade,
}: {
  insight:   FlashInsight;
  isPro:     boolean;
  onUpgrade: () => void;
}) {
  const color = accentColor(insight.type);

  const bubbleBg     = 'rgba(255,255,255,0.055)';
  const bubbleBorder = isPro
    ? `1px solid ${color === NEON_GREEN ? 'rgba(0,255,128,0.22)' : color + '44'}`
    : '1px solid rgba(168,85,247,0.20)';

  return (
    <div className="relative flex-1 min-w-0" style={{ animation: 'ft-appear 0.3s ease-out both' }}>
      {/* Left tail */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          left:          '-7px',
          top:           '20px',
          width:         0,
          height:        0,
          borderTop:     '7px solid transparent',
          borderBottom:  '7px solid transparent',
          borderRight:   `7px solid ${bubbleBg}`,
          filter:        'drop-shadow(-1px 0 0 rgba(168,85,247,0.18))',
        }}
      />

      {/* Bubble */}
      <div
        className="rounded-2xl px-4 py-3.5 flex flex-col gap-2.5"
        style={{ background: bubbleBg, border: bubbleBorder, backdropFilter: 'blur(8px)' }}
      >
        {/* Name + badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: NEON_PURPLE }}>
            {getFlashTutor().name}
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {getFlashTutor().title}
          </span>
          {(insight.type === 'weak-area' || insight.type === 'no-consistency') && (
            <span className="rounded-full px-2 py-0.5" style={{ background: `${RED_ALERT}20`, border: `1px solid ${RED_ALERT}50`, color: RED_ALERT, fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>
              ALERTA
            </span>
          )}
          {insight.type === 'streak-high' && (
            <span className="rounded-full px-2 py-0.5" style={{ background: `${NEON_GREEN}18`, border: `1px solid ${NEON_GREEN}44`, color: NEON_GREEN, fontSize: '9px', fontWeight: 700 }}>
              EM CHAMAS
            </span>
          )}
        </div>

        {/* Line 1 — always visible */}
        <p className="text-sm font-semibold leading-snug" style={{ color: color === NEON_GREEN ? 'white' : color }}>
          {insight.line1}
        </p>

        {/* Line 2 — full for pro, blurred teaser for flash */}
        {isPro ? (
          <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {insight.line2}
          </p>
        ) : (
          <div className="relative">
            <p
              className="text-sm leading-snug select-none"
              style={{ color: 'rgba(255,255,255,0.62)', filter: 'blur(4px)', userSelect: 'none' }}
              aria-hidden
            >
              {insight.line2}
            </p>
            {/* Fade overlay on blur */}
            <div
              className="absolute inset-0 flex items-center"
              style={{ background: 'linear-gradient(90deg, transparent 20%, rgba(15,15,25,0.6))' }}
            />
          </div>
        )}

        {/* CTA row */}
        <div className="flex items-center gap-3 flex-wrap pt-0.5">
          {/* Specialist badge — pro only */}
          {isPro && insight.specialist && (
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: `${NEON_PURPLE}1A`, border: `1px solid ${NEON_PURPLE}44` }}
            >
              <div className="rounded-full overflow-hidden shrink-0"
                style={{ width: 16, height: 16, border: `1px solid ${NEON_PURPLE}55` }}>
                <Image src={insight.specialist.avatar_url} alt={insight.specialist.name} width={16} height={16} unoptimized />
              </div>
              <span className="text-xs font-semibold" style={{ color: NEON_PURPLE }}>
                {insight.specialist.name}
              </span>
            </div>
          )}

          {isPro ? (
            /* Pro CTA */
            <Link
              href={insight.ctaHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 hover:brightness-110"
              style={{
                background:     `linear-gradient(135deg, ${NEON_PURPLE}44, ${NEON_CYAN}28)`,
                border:         `1px solid ${NEON_PURPLE}66`,
                boxShadow:      `0 0 14px ${NEON_PURPLE}22`,
                color:          'white',
                textDecoration: 'none',
              }}
            >
              ⚡ {insight.ctaLabel}
            </Link>
          ) : (
            /* Teaser CTA — upgrade gate */
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${NEON_PURPLE}55, ${NEON_CYAN}33)`,
                border:     `1px solid ${NEON_PURPLE}66`,
                boxShadow:  `0 0 14px ${NEON_PURPLE}22`,
                color:      'white',
                cursor:     'pointer',
              }}
            >
              🔒 Ver Estratégia Completa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats badges (right column) ─────────────────────────────────────────────

function StatsBadges({ maturePct, streak }: { maturePct: number; streak: number }) {
  return (
    <div className="shrink-0 hidden sm:flex flex-col gap-2">
      <div
        className="flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-0.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minWidth: 62 }}
      >
        <span className="text-xl font-black tabular-nums leading-none"
          style={{ color: maturePct > 0 ? NEON_GREEN : 'rgba(255,255,255,0.20)' }}>
          {maturePct}%
        </span>
        <span className="text-center leading-tight"
          style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
          DO EDITAL<br/>DOMINADO
        </span>
      </div>

      {streak > 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-0.5"
          style={{
            background: streak >= 7 ? `${NEON_ORANGE}18` : 'rgba(255,255,255,0.04)',
            border:     streak >= 7 ? `1px solid ${NEON_ORANGE}44` : '1px solid rgba(255,255,255,0.07)',
            minWidth:   62,
            animation:  streak >= 7 ? 'ft-pop 0.4s ease-out both' : 'none',
          }}
        >
          <span className="font-black tabular-nums leading-none"
            style={{ fontSize: streak < 10 ? '1.25rem' : '1rem', color: streak >= 7 ? NEON_ORANGE : 'rgba(255,255,255,0.45)' }}>
            {streak}{streakFire(streak)}
          </span>
          <span className="text-center leading-tight"
            style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
            DIAS DE<br/>SEQUÊNCIA
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PantheonInsights() {
  const [state, setState]         = useState<State>({ status: 'loading' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState({ status: 'ready', data: { insight: fallbackInsight(), maturePct: 0, streak: 0, plan: 'flash' } }); return; }

      // Fetch plan + data in parallel for all users
      const [planInfo, cardsRes, progressRes, countRes] = await Promise.all([
        fetchUserPlan(user.id, user.email ?? undefined),
        supabase.from('cards').select('id, decks(id, title, subject_id, subjects(id, title, category))'),
        supabase.from('user_progress').select('card_id, lapses, interval_days, next_review, history').eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
      ]);

      const plan  = planInfo.plan;
      const rows  = progressRes.data ?? [];
      const total = countRes.count ?? 0;
      const today = new Date().toISOString().split('T')[0];

      // ── maturePct ────────────────────────────────────────────────────────
      const maturePct = total > 0
        ? Math.round((rows.filter(r => (r.interval_days ?? 0) > 21).length / total) * 100)
        : 0;

      // ── streak + totalReviews ─────────────────────────────────────────────
      const dailyCounts = new Map<string, number>();
      let totalReviews  = 0;
      for (const row of rows) {
        for (const entry of (row.history as Array<{ reviewed_at: string }> | null) ?? []) {
          const day = entry.reviewed_at?.slice(0, 10);
          if (day) { dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1); totalReviews++; }
        }
      }
      const streak       = calcStreak(dailyCounts);
      const hasAnyHistory = totalReviews > 0;

      // ── normalize cards ───────────────────────────────────────────────────
      type NormCard = { id: string; deckId: string; deckTitle: string; subjectId: string; category: string | null };
      const normCards: NormCard[] = [];
      for (const rawCard of (cardsRes.data ?? []) as Array<{ id: string; decks: unknown }>) {
        const rd = Array.isArray(rawCard.decks) ? (rawCard.decks[0] ?? null) : rawCard.decks as { id: string; title: string; subject_id: string; subjects: unknown } | null;
        if (!rd) continue;
        const d  = rd as { id: string; title: string; subject_id: string; subjects: unknown };
        const rs = Array.isArray(d.subjects) ? (d.subjects[0] ?? null) : d.subjects as { id: string; category: string | null } | null;
        if (!rs) continue;
        const s  = rs as { id: string; category: string | null };
        normCards.push({ id: rawCard.id, deckId: d.id, deckTitle: d.title, subjectId: s.id, category: s.category });
      }

      // ── area scores ───────────────────────────────────────────────────────
      const domainMap  = buildDomainMap(normCards.map(c => ({ id: c.id, decks: { subject_id: c.subjectId } })),
                                        rows.map(r => ({ card_id: r.card_id, interval_days: r.interval_days ?? 0 })));
      const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.category)]));

      const shortScore = new Map<string, { sum: number; count: number }>();
      for (const [sid, domain] of domainMap.entries()) {
        const area = subjAreaMap.get(sid);
        if (!area) continue;
        const s = shortScore.get(area) ?? { sum: 0, count: 0 };
        s.sum += domain.level; s.count++;
        shortScore.set(area, s);
      }
      const areaScores = new Map<string, number>(
        Array.from(shortScore.entries()).map(([a, s]) => [a, s.count > 0 ? Math.round((s.sum / s.count / 5) * 100) : 0]),
      );

      // ── top lapse deck ────────────────────────────────────────────────────
      const lapsesMap  = new Map(rows.map(r => [r.card_id, r.lapses as number]));
      const subjCatMap = new Map(normCards.map(c => [c.subjectId, c.category]));

      type DeckAgg = { deckTitle: string; subjectCategory: string | null; lapses: number };
      const deckAgg = new Map<string, DeckAgg>();
      for (const c of normCards) {
        const lapses = lapsesMap.get(c.id);
        if (!lapses) continue;
        const ex = deckAgg.get(c.deckId);
        if (ex) { ex.lapses += lapses; }
        else    { deckAgg.set(c.deckId, { deckTitle: c.deckTitle, subjectCategory: subjCatMap.get(c.subjectId) ?? null, lapses }); }
      }
      let topLapseDeck: { deckId: string; deckTitle: string; subjectCategory: string | null; lapses: number } | null = null;
      for (const [deckId, agg] of deckAgg.entries()) {
        if (!topLapseDeck || agg.lapses > topLapseDeck.lapses) topLapseDeck = { deckId, ...agg };
      }

      // ── totalDue ──────────────────────────────────────────────────────────
      const nrMap   = new Map(rows.map(r => [r.card_id, r.next_review as string | null]));
      let totalDue  = 0;
      for (const c of normCards) {
        const nr = nrMap.get(c.id);
        if (nr === undefined || (nr !== null && nr <= today)) totalDue++;
      }

      // ── generate insight ──────────────────────────────────────────────────
      const insight = generateInsight({ maturePct, areaScores, topLapseDeck, totalDue, streak, totalReviews, hasAnyHistory });
      setState({ status: 'ready', data: { insight, maturePct, streak, plan } });
    }
    load();
  }, []);

  if (state.status === 'loading') return <Skeleton />;

  const { insight, maturePct, streak, plan } = state.data;
  const isPro       = plan === 'proai_plus';
  const flashTutor  = getFlashTutor();
  const borderColor = isPro ? `${NEON_PURPLE}55` : `${NEON_PURPLE}28`;

  return (
    <>
      <style>{STYLE}</style>
      {showModal && <AiProUpgradeModal onClose={() => setShowModal(false)} />}

      <div className="max-w-5xl mx-auto mb-10">
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.025)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:               `1px solid ${borderColor}`,
            boxShadow:            `0 0 60px ${isPro ? NEON_PURPLE + '08' : 'transparent'}, inset 0 0 30px rgba(168,85,247,0.02)`,
          }}
        >
          {/* Top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background: isPro
                ? `linear-gradient(90deg, transparent, ${NEON_PURPLE}88, ${NEON_CYAN}55, transparent)`
                : `linear-gradient(90deg, transparent, ${NEON_PURPLE}44, transparent)`,
              animation: isPro ? 'ft-pulse 3s ease-in-out infinite' : 'none',
            }}
          />
          {/* Radial bg */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(168,85,247,0.055) 0%, transparent 58%)' }}
          />
          {/* Scan line */}
          {isPro && (
            <div className="absolute inset-x-0 pointer-events-none"
              style={{ height: '1px', top: '0', animation: 'ft-scan 5s linear infinite',
                background: `linear-gradient(90deg, transparent, ${NEON_PURPLE}55, ${NEON_CYAN}33, transparent)` }}
            />
          )}

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5 relative z-10">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NEON_PURPLE }}>
              Insights do Panteão 🏛️
            </p>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
              style={{
                background: isPro ? `${NEON_PURPLE}1A` : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${isPro ? NEON_PURPLE + '44' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: isPro ? NEON_PURPLE : 'rgba(255,255,255,0.18)', boxShadow: isPro ? `0 0 6px ${NEON_PURPLE}` : 'none' }}
              />
              <span className="text-xs font-semibold" style={{ color: isPro ? NEON_PURPLE : 'rgba(255,255,255,0.28)' }}>
                {isPro ? 'AiPro+ Ativo' : 'Plano Flash · Prévia'}
              </span>
            </div>
          </div>

          {/* ── Body: avatar + bubble + stats ─────────────────────────────── */}
          <div className="relative z-10 flex items-start gap-3">

            {/* Avatar column */}
            <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
              <div className="rounded-full overflow-hidden"
                style={{
                  width:     48,
                  height:    48,
                  border:    `2px solid ${isPro ? NEON_PURPLE + '99' : NEON_PURPLE + '44'}`,
                  boxShadow: isPro ? `0 0 18px ${NEON_PURPLE}55, 0 0 36px ${NEON_PURPLE}18` : 'none',
                }}
              >
                <Image src={flashTutor.avatar_url} alt={flashTutor.name} width={48} height={48} unoptimized />
              </div>
              <span style={{ color: isPro ? NEON_PURPLE : 'rgba(168,85,247,0.50)', fontSize: '8px', fontWeight: 700, letterSpacing: '0.06em' }}>
                {isPro ? 'ESTRATEGISTA' : 'FLASH'}
              </span>
            </div>

            {/* Speech bubble */}
            <SpeechBubble insight={insight} isPro={isPro} onUpgrade={() => setShowModal(true)} />

            {/* Stats — pro only */}
            {isPro && <StatsBadges maturePct={maturePct} streak={streak} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Fallback insight (unauthenticated) ──────────────────────────────────────

function fallbackInsight(): FlashInsight {
  return {
    type:       'positive',
    line1:      'Entre na Central de Operações para ativar seus insights.',
    line2:      'O FlashTutor analisa seus dados em tempo real. Faça login para começar.',
    specialist: null,
    ctaLabel:   'Entrar',
    ctaHref:    '/login',
  };
}
