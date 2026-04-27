'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter }                         from 'next/navigation';
import { supabase }                          from '@/lib/supabaseClient';
import { updateStreak }                      from '@/lib/streak';
import katex                                 from 'katex';

// ─── Design tokens ─────────────────────────────────────────────────────────
const EMERALD    = '#10B981';
const VIOLET     = '#8B5CF6';
const CYAN       = '#06b6d4';
const NEON       = '#00ff80';
const AMBER      = '#F59E0B';
const MONO       = '"JetBrains Mono", monospace';
const SESSION_SIZE = 5;

// ─── LaTeX renderer ─────────────────────────────────────────────────────────
const MATH_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/;

function MathText({ text }: { text: string }) {
  const parts = text.split(MATH_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$'))
          return <span key={i} className="block my-2" dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }) }} />;
        if (part.startsWith('\\[') && part.endsWith('\\]'))
          return <span key={i} className="block my-2" dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }) }} />;
        if (part.startsWith('$') && part.endsWith('$'))
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }) }} />;
        if (part.startsWith('\\(') && part.endsWith('\\)'))
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2), { displayMode: false, throwOnError: false }) }} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
type Card = { id: string; question: string; answer: string };
type UserProgress = {
  id: string; ease_factor: number; lapses: number;
  interval_days: number; next_review: string;
  history: Array<{ reviewed_at: string; rating: number; interval_days: number }>;
};

// ─── SRS ────────────────────────────────────────────────────────────────────
function calcNextReview(rating: number, prev: UserProgress | null) {
  const ef = prev?.ease_factor ?? 2.5, lapses = prev?.lapses ?? 0;
  const baseI = (prev?.interval_days ?? 0) > 0 ? prev!.interval_days : 1;
  let newEf = ef, newLapses = lapses, newInterval: number;
  if (rating === 1) { newLapses = lapses + 1; newInterval = 1; }
  else {
    if (rating === 2) newEf = Math.max(1.3, ef - 0.2);
    if (rating === 4) newEf = ef + 0.15;
    newInterval = Math.max(1, Math.round(baseI * newEf * Math.pow(0.85, newLapses)));
  }
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  return { ease_factor: Math.round(newEf * 100) / 100, lapses: newLapses, interval_days: newInterval, next_review: nextDate.toISOString().split('T')[0] };
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl text-sm font-medium text-white text-center max-w-xs whitespace-normal pointer-events-none"
      style={{
        bottom: 'calc(100% + 10px)',
        background: `${VIOLET}ee`, border: `1px solid ${VIOLET}80`,
        boxShadow: `0 0 20px ${VIOLET}40`, backdropFilter: 'blur(8px)',
      }}
    >
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${VIOLET}ee` }} />
    </div>
  );
}

const CARD_TOOLTIPS = [
  'Leia a pergunta e tente responder mentalmente antes de virar.',
  'Agora veja a resposta — sem julgamentos, só absorção.',
  'Avalie sua confiança. Isso calibra o algoritmo para você.',
];

const RATING_BUTTONS = [
  { rating: 1, label: '1 – Errei',   color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
  { rating: 2, label: '2 – Difícil', color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  { rating: 3, label: '3 – Bom',     color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  { rating: 4, label: '4 – Fácil',   color: NEON,      glow: 'rgba(0,255,128,0.35)' },
];

// ─── Achievement Screen ──────────────────────────────────────────────────────
function AchievementScreen({ correctCount, incorrectCount, elapsedMs, onContinue }: {
  correctCount: number; incorrectCount: number; elapsedMs: number; onContinue: () => void;
}) {
  const elapsedSec  = Math.round(elapsedMs / 1000);
  const elapsedMin  = Math.floor(elapsedSec / 60);
  const elapsedRem  = elapsedSec % 60;
  const timeLabel   = elapsedMin > 0 ? `${elapsedMin}min ${elapsedRem}s` : `${elapsedSec}s`;
  const total       = correctCount + incorrectCount;
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const badge =
    accuracyPct >= 80 ? { emoji: '🏆', label: 'Incrível!',       color: NEON }
    : accuracyPct >= 50 ? { emoji: '🥇', label: 'Ótimo começo!',  color: CYAN }
    :                     { emoji: '💪', label: 'Você começou!',  color: VIOLET };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: `${badge.color}10`, border: `2px solid ${badge.color}50`, boxShadow: `0 0 40px ${badge.color}30` }}
      >
        {badge.emoji}
      </div>

      <div className="text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: badge.color }}>
          Primeira Sessão Concluída
        </p>
        <h2 className="text-2xl font-black text-white">{badge.label}</h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          O algoritmo SRS registrou seus {SESSION_SIZE} cards.<br />
          Ele já sabe quando te mostrar cada um de novo.
        </p>
      </div>

      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: 'Tempo',  value: timeLabel,          icon: '⏱',  color: CYAN },
          { label: 'Cards',  value: `${SESSION_SIZE}`,  icon: '🃏',  color: badge.color },
          { label: 'Acerto', value: `${accuracyPct}%`,  icon: '🎯',  color: accuracyPct >= 70 ? NEON : VIOLET },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
            <span className="text-xl">{s.icon}</span>
            <span className="text-lg font-black" style={{ color: s.color, fontFamily: MONO }}>{s.value}</span>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: `${EMERALD}12`, border: `1px solid ${EMERALD}30` }}>
        <span className="text-2xl">🌱</span>
        <div>
          <p className="text-sm font-bold text-white">Badge: Primeira Sessão</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Você já tem progresso real. O SRS trabalha por você agora.
          </p>
        </div>
      </div>

      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: `${AMBER}10`, border: `1px solid ${AMBER}25` }}>
        <span className="text-xl">🔥</span>
        <div>
          <p className="text-sm font-bold text-white">Sequência iniciada: 1 dia</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Volte amanhã para manter a chama acesa.
          </p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, ${EMERALD}, #059669)`, boxShadow: `0 0 24px ${EMERALD}50` }}
      >
        Conhecer meu dashboard →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function FirstSessionPage() {
  const router = useRouter();

  const [cards,          setCards]          = useState<Card[]>([]);
  const [progressMap,    setProgressMap]    = useState<Record<string, UserProgress>>({});
  const [index,          setIndex]          = useState(0);
  const [flipped,        setFlipped]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [done,           setDone]           = useState(false);
  const [correctCount,   setCorrectCount]   = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [sessionStart]                      = useState(() => Date.now());
  const [noCards,        setNoCards]        = useState(false);
  const [tipPhase,       setTipPhase]       = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('difficulty_subjects, first_session_completed')
        .eq('id', user.id)
        .maybeSingle();

      if ((profile as { first_session_completed?: boolean } | null)?.first_session_completed === true) {
        router.push('/dashboard');
        return;
      }

      const difficulty = (profile as { difficulty_subjects?: string[] } | null)?.difficulty_subjects?.[0] ?? null;

      let cardsData: Card[] | null = null;
      if (difficulty) {
        const { data } = await supabase
          .from('cards')
          .select('id, question, answer, decks!inner(subject_id, subjects!inner(category))')
          .ilike('decks.subjects.category', `%${difficulty}%`)
          .limit(SESSION_SIZE);
        cardsData = (data as unknown as Card[]) ?? null;
      }
      if (!cardsData || cardsData.length < SESSION_SIZE) {
        const { data } = await supabase.from('cards').select('id, question, answer').limit(SESSION_SIZE);
        cardsData = (data as Card[]) ?? [];
      }
      if (!cardsData || cardsData.length === 0) { setNoCards(true); setLoading(false); return; }

      const shuffled = [...cardsData].sort(() => Math.random() - 0.5).slice(0, SESSION_SIZE);
      const ids = shuffled.map(c => c.id);
      const { data: progRows } = await supabase
        .from('user_progress')
        .select('id, card_id, ease_factor, lapses, interval_days, next_review, history')
        .eq('user_id', user.id).in('card_id', ids);
      const pmap: Record<string, UserProgress> = {};
      for (const p of (progRows ?? []) as (UserProgress & { card_id: string })[]) pmap[p.card_id] = p;

      setCards(shuffled);
      setProgressMap(pmap);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (!done || !userId) return;
    supabase.from('profiles').update({ first_session_completed: true }).eq('id', userId)
      .then(({ error }) => { if (error) console.error('[FirstSession]', error.message); });
    updateStreak(userId);
  }, [done, userId]);

  const handleReveal = useCallback(() => {
    if (!flipped) {
      setFlipped(true);
      if (tipPhase === 0) setTipPhase(1);
    }
  }, [flipped, tipPhase]);

  const handleRating = useCallback(async (rating: number) => {
    if (saving || !cards[index]) return;
    setSaving(true);
    if (tipPhase <= 2) setTipPhase(p => p + 1);

    const card = cards[index];
    const prevProg = progressMap[card.id] ?? null;
    const next = calcNextReview(rating, prevProg);
    const history = [...(prevProg?.history ?? []), { reviewed_at: new Date().toISOString(), rating, interval_days: next.interval_days }];

    if (rating === 1) setIncorrectCount(c => c + 1); else setCorrectCount(c => c + 1);

    if (userId) {
      await supabase.from('user_progress').upsert(
        { ...(prevProg?.id ? { id: prevProg.id } : {}), user_id: userId, card_id: card.id, ...next, history },
        { onConflict: 'user_id,card_id' }
      );
    }
    setProgressMap(prev => ({ ...prev, [card.id]: { ...(prev[card.id] ?? { id: '' }), ...next, history } }));
    setFlipped(false);
    setSaving(false);

    setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= cards.length) { setDone(true); }
      else { setIndex(nextIndex); setTipPhase(nextIndex < 3 ? 0 : 99); }
    }, 200);
  }, [saving, cards, index, progressMap, userId, tipPhase]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050b14' }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: EMERALD, borderTopColor: 'transparent' }} />
      </main>
    );
  }

  if (noCards) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050b14' }}>
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <span className="text-4xl">📭</span>
          <p className="text-white font-bold">Ainda não há cards disponíveis</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>O conteúdo está sendo preparado. Volte em breve!</p>
          <button onClick={() => router.push('/dashboard?tour=1')}
            className="mt-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${EMERALD}, #059669)` }}>
            Ir ao Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ── Achievement screen ─────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}>
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${EMERALD}06 0%, transparent 65%)` }}
        />
        <AchievementScreen
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          elapsedMs={Date.now() - sessionStart}
          onContinue={() => router.push('/dashboard?tour=1')}
        />
      </main>
    );
  }

  // ── Study screen ───────────────────────────────────────────────────────────
  const card     = cards[index];
  const progress = cards.length > 0 ? (index / cards.length) * 100 : 0;
  const showTips    = index < 3;
  const showQTip    = showTips && !flipped && tipPhase === 0;
  const showRTip    = showTips && flipped  && tipPhase === 1;
  const showRatingTip = showTips && flipped && tipPhase === 1;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 gap-8" style={{ background: '#050b14' }}>
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: EMERALD }}>Primeira Sessão</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${VIOLET}20`, color: VIOLET, border: `1px solid ${VIOLET}40` }}>
            Guiada
          </span>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: MONO }}>
          <span className="text-white font-bold">{index + 1}</span> / {cards.length}
        </p>
      </div>

      {/* Progress bar + dots */}
      <div className="w-full max-w-2xl">
        <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${EMERALD}, ${CYAN})`, boxShadow: `0 0 8px ${EMERALD}80` }} />
        </div>
        <div className="flex justify-between">
          {cards.map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300"
              style={{
                background: i < index ? EMERALD : i === index ? `${EMERALD}40` : 'rgba(255,255,255,0.06)',
                border:     `1px solid ${i <= index ? EMERALD : 'rgba(255,255,255,0.12)'}`,
                color:      i < index ? '#000' : 'rgba(255,255,255,0.40)', fontWeight: 700,
              }}>
              {i < index ? '✓' : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Flip Card */}
      <div
        className="w-full max-w-2xl cursor-pointer select-none relative"
        style={{ perspective: '1200px', minHeight: '280px' }}
        onClick={handleReveal}
      >
        <div className="relative">
          <Tooltip text={CARD_TOOLTIPS[0]} visible={showQTip} />
        </div>
        <div className="relative w-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '280px' }}>
          {/* Front */}
          <div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: 'rgba(0,229,255,0.25)', borderStyle: 'solid', borderWidth: 1 }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: CYAN }}>Pergunta</span>
            <p className="text-white text-xl font-medium leading-relaxed"><MathText text={card.question} /></p>
            <div className="relative mt-4">
              <Tooltip text={CARD_TOOLTIPS[1]} visible={showRTip} />
              <p className="text-slate-500 text-sm">Clique para revelar a resposta</p>
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${EMERALD}30` }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: EMERALD }}>Resposta</span>
            <p className="text-white text-xl font-medium leading-relaxed"><MathText text={card.answer} /></p>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="w-full max-w-2xl flex flex-col gap-3">
          <div className="relative">
            <Tooltip text={CARD_TOOLTIPS[2]} visible={showRatingTip} />
            <p className="text-xs font-semibold text-center mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Como foi?</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map(btn => (
              <button key={btn.rating} onClick={() => handleRating(btn.rating)} disabled={saving}
                className="rounded-xl py-3 text-xs font-black transition-all duration-150 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                style={{ background: `${btn.color}20`, border: `1px solid ${btn.color}50`, boxShadow: `0 0 12px ${btn.glow}`, color: btn.color }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
