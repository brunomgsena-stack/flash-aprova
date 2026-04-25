'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import katex from 'katex';
import { updateStreak } from '@/lib/streak';

// ─── LaTeX renderer ──────────────────────────────────────────────────────────
// Supports: $$...$$  $...$  \[...\]  \(...\)

function renderMath(formula: string, displayMode: boolean): string {
  return katex.renderToString(formula, { displayMode, throwOnError: false });
}

const MATH_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/;

function MathText({ text }: { text: string }) {
  const parts = text.split(MATH_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return (
            <span
              key={i}
              className="block my-2"
              dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return (
            <span
              key={i}
              className="block my-2"
              dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMath(part.slice(1, -1), false) }}
            />
          );
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), false) }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Card = {
  id: string;
  question: string;
  answer: string;
};

type UserProgress = {
  id: string;
  ease_factor: number;
  lapses: number;
  interval_days: number;
  next_review: string;
  history: ReviewEntry[];
};

type ReviewEntry = {
  reviewed_at: string;
  rating: number;
  interval_days: number;
};

// ─── SRS Algorithm ───────────────────────────────────────────────────────────
// I = (I_prev × EF) × (0.85 ^ lapses)

function calcNextReview(
  rating: number,
  prev: UserProgress | null
): { ease_factor: number; lapses: number; interval_days: number; next_review: string } {
  const ef       = prev?.ease_factor   ?? 2.5;
  const lapses   = prev?.lapses        ?? 0;
  const prevI    = prev?.interval_days ?? 0;
  const baseI    = prevI > 0 ? prevI : 1;

  let newEf     = ef;
  let newLapses = lapses;
  let newInterval: number;

  if (rating === 1) {
    // Errei – reset
    newLapses   = lapses + 1;
    newInterval = 1;
  } else {
    if (rating === 2) newEf = Math.max(1.3, ef - 0.2);   // Difícil
    if (rating === 4) newEf = ef + 0.15;                  // Fácil
    // Bom (3) – EF não muda
    newInterval = Math.max(1, Math.round(baseI * newEf * Math.pow(0.85, newLapses)));
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    ease_factor:   Math.round(newEf * 100) / 100,
    lapses:        newLapses,
    interval_days: newInterval,
    next_review:   nextDate.toISOString().split('T')[0],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router     = useRouter();

  const [queue,          setQueue]          = useState<Card[]>([]);
  const [initialTotal,   setInitialTotal]   = useState(0);
  const [progressMap,    setProgressMap]    = useState<Record<string, UserProgress>>({});
  const [index,          setIndex]          = useState(0);
  const [flipped,        setFlipped]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [deckTitle,      setDeckTitle]      = useState('');
  const [subjectTitle,   setSubjectTitle]   = useState('');
  const [subjectId,      setSubjectId]      = useState('');
  const [done,           setDone]           = useState(false);
  const [sessionStart]                      = useState(() => Date.now());
  const [correctCount,   setCorrectCount]   = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // ── Update streak once when session finishes ───────────────────────────────
  useEffect(() => {
    if (done && userId) updateStreak(userId);
  }, [done, userId]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Current user
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      // 2. Deck + subject info (for breadcrumbs)
      const { data: deck } = await supabase
        .from('decks')
        .select('title, subjects(id, title)')
        .eq('id', deckId)
        .single();
      const deckData = deck as { title: string; subjects: { id: string; title: string } | null } | null;
      setDeckTitle(deckData?.title ?? '');
      setSubjectTitle(deckData?.subjects?.title ?? '');
      setSubjectId(deckData?.subjects?.id ?? '');

      // 3. All cards in this deck
      const { data: cards } = await supabase
        .from('cards')
        .select('id, question, answer')
        .eq('deck_id', deckId);

      if (!cards || cards.length === 0) { setLoading(false); setDone(true); return; }

      // 4. User progress for these cards
      const today = new Date().toISOString().split('T')[0];
      let progMap: Record<string, UserProgress> = {};

      if (uid) {
        const { data: progressRows } = await supabase
          .from('user_progress')
          .select('id, card_id, ease_factor, lapses, interval_days, next_review, history')
          .eq('user_id', uid)
          .in('card_id', cards.map((c) => c.id));

        (progressRows ?? []).forEach((p: UserProgress & { card_id: string }) => {
          progMap[p.card_id] = p;
        });
      }

      // 5. Filter: new cards OR due today
      const due = cards.filter((c) => {
        const p = progMap[c.id];
        if (!p) return true;           // novo – nunca estudado
        return p.next_review <= today; // vence hoje ou atrasado
      });

      setProgressMap(progMap);
      setQueue(due);
      setInitialTotal(due.length);
      setLoading(false);
      if (due.length === 0) setDone(true);
    }

    load();
  }, [deckId]);

  // ── Rating handler ─────────────────────────────────────────────────────────
  const handleRating = useCallback(async (rating: number) => {
    if (saving || !queue[index]) return;
    setSaving(true);

    const card     = queue[index];
    const prevProg = progressMap[card.id] ?? null;
    const next     = calcNextReview(rating, prevProg);

    const newEntry: ReviewEntry = {
      reviewed_at:   new Date().toISOString(),
      rating,
      interval_days: next.interval_days,
    };

    const history = [...(prevProg?.history ?? []), newEntry];

    // Track correct/incorrect for session summary
    if (rating === 1) setIncorrectCount(c => c + 1);
    else              setCorrectCount(c => c + 1);

    if (userId) {
      await supabase.from('user_progress').upsert(
        {
          ...(prevProg?.id ? { id: prevProg.id } : {}),
          user_id:       userId,
          card_id:       card.id,
          ease_factor:   next.ease_factor,
          lapses:        next.lapses,
          interval_days: next.interval_days,
          next_review:   next.next_review,
          history,
        },
        { onConflict: 'user_id,card_id' }
      );
    }

    // Update local progress map so re-reviewed cards use updated SRS values
    setProgressMap(prev => ({
      ...prev,
      [card.id]: {
        ...(prev[card.id] ?? { id: '' }),
        ...next,
        history,
      },
    }));

    setFlipped(false);
    setSaving(false);

    setTimeout(() => {
      if (rating === 1) {
        // Re-learning: move card to the end of the current session queue
        setQueue(q => [...q, card]);
        setIndex(i => i + 1);
      } else {
        const nextIndex = index + 1;
        if (nextIndex >= queue.length) {
          setDone(true);
        } else {
          setIndex(nextIndex);
        }
      }
    }, 200);
  }, [saving, queue, index, progressMap, userId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#00ff80', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-400">Carregando cards…</p>
        </div>
      </main>
    );
  }

  // ── Done screen — Achievement Modal ────────────────────────────────────────
  if (done) {
    const elapsedSec  = Math.round((Date.now() - sessionStart) / 1000);
    const elapsedMin  = Math.floor(elapsedSec / 60);
    const elapsedRem  = elapsedSec % 60;
    const timeLabel   = elapsedMin > 0
      ? `${elapsedMin}min ${elapsedRem}s`
      : `${elapsedSec}s`;
    const totalRated  = correctCount + incorrectCount;
    const accuracyPct = totalRated > 0 ? Math.round((correctCount / totalRated) * 100) : 0;

    const NEON  = '#00FF73';
    const OCEAN = '#0EA5E9';
    const AMBER = '#F59E0B';

    const badge =
      accuracyPct >= 90 ? { emoji: '🏆', label: 'Excelência!',    color: NEON }
      : accuracyPct >= 70 ? { emoji: '🥇', label: 'Ótimo trabalho!', color: OCEAN }
      : accuracyPct >= 50 ? { emoji: '🥈', label: 'Bom esforço!',    color: AMBER }
      : totalRated === 0  ? { emoji: '📭', label: 'Sem novidades!',   color: OCEAN }
      :                     { emoji: '💪', label: 'Continue assim!',  color: AMBER };

    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#050b14' }}>

        {/* Overlay glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${badge.color}08 0%, transparent 65%)` }}
        />

        <div
          className="relative w-full max-w-md rounded-3xl p-8 flex flex-col items-center gap-6 card-in"
          style={{
            background:           'rgba(255,255,255,0.04)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:               `1px solid ${badge.color}30`,
            boxShadow:            `0 0 60px ${badge.color}14, 0 24px 80px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Top shimmer */}
          <div
            className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
            style={{ background: `linear-gradient(90deg, transparent, ${badge.color}80, transparent)` }}
          />

          {/* Medal */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-5xl"
            style={{
              background: `${badge.color}10`,
              border:     `2px solid ${badge.color}50`,
              boxShadow:  `0 0 40px ${badge.color}30, 0 0 80px ${badge.color}10`,
            }}
          >
            {badge.emoji}
          </div>

          {/* Title */}
          <div className="text-center">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: badge.color }}>
              Sessão Concluída
            </p>
            <h1 className="text-2xl font-black text-white">{badge.label}</h1>
            {deckTitle && (
              <p className="text-slate-500 text-sm mt-1">{deckTitle}</p>
            )}
          </div>

          {/* Stats grid */}
          <div className="w-full grid grid-cols-3 gap-3">
            {[
              { label: 'Tempo',         value: timeLabel,              icon: '⏱',  color: OCEAN },
              { label: 'Cards',         value: `${initialTotal}`,      icon: '🃏',  color: badge.color },
              { label: 'Acerto',        value: `${accuracyPct}%`,      icon: '🎯',  color: accuracyPct >= 70 ? NEON : AMBER },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl p-3 flex flex-col items-center gap-1"
                style={{
                  background: `${stat.color}08`,
                  border:     `1px solid ${stat.color}22`,
                }}
              >
                <span className="text-xl">{stat.icon}</span>
                <span className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Accuracy bar */}
          {totalRated > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>✅ {correctCount} certos</span>
                <span>❌ {incorrectCount} erros</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:      `${accuracyPct}%`,
                    background: `linear-gradient(90deg, ${NEON}, ${OCEAN})`,
                    boxShadow:  `0 0 8px ${NEON}60`,
                  }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${badge.color}cc, ${OCEAN}99)`,
              boxShadow:  `0 0 20px ${badge.color}40, 0 4px 16px rgba(0,0,0,0.4)`,
            }}
          >
            Concluir e Voltar ao Dashboard →
          </button>
        </div>
      </main>
    );
  }

  // ── Study screen ───────────────────────────────────────────────────────────
  const card = queue[index];

  // Progress bar advances only for the original cards (never goes backwards)
  const progress = initialTotal > 0 ? Math.min((index / initialTotal) * 100, 99) : 0;

  // Badge shown when the user is reviewing re-learning cards past the initial deck
  const isRelearning = index >= initialTotal;

  const ratingButtons = [
    { rating: 1, label: '1 – Errei',   color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
    { rating: 2, label: '2 – Difícil', color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
    { rating: 3, label: '3 – Bom',     color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
    { rating: 4, label: '4 – Fácil',   color: '#00ff80', glow: 'rgba(0,255,128,0.35)' },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 gap-8">

      {/* Breadcrumbs */}
      <nav className="w-full max-w-2xl flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
        <a href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</a>
        {subjectTitle && (
          <>
            <span className="opacity-40">›</span>
            <a
              href={`/dashboard/subject/${subjectId}`}
              className="hover:text-slate-400 transition-colors"
            >
              {subjectTitle}
            </a>
          </>
        )}
        <span className="opacity-40">›</span>
        <span className="text-slate-400">{deckTitle}</span>
      </nav>

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Voltar ao Dashboard
        </button>
        <p className="text-slate-400 text-sm font-medium">
          <span className="text-white font-bold">{deckTitle}</span>
        </p>
        <div className="flex items-center gap-2">
          {isRelearning && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: '#ef4444',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
              }}
            >
              reforço
            </span>
          )}
          <p className="text-slate-500 text-sm">
            {Math.min(index + 1, initialTotal)} / {initialTotal}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00ff80, #00e5ff)',
            boxShadow: '0 0 8px rgba(0,255,128,0.5)',
          }}
        />
      </div>

      {/* Flip Card */}
      <div
        className="w-full max-w-2xl cursor-pointer select-none"
        style={{ perspective: '1200px', minHeight: '320px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '320px',
          }}
        >
          {/* Front – Pergunta */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,229,255,0.25)',
              boxShadow: '0 0 40px rgba(0,229,255,0.06)',
            }}
          >
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#00e5ff' }}
            >
              Pergunta
            </span>
            <p className="text-white text-xl font-medium leading-relaxed">
              <MathText text={card.question} />
            </p>
            <p className="text-slate-500 text-sm mt-4">Clique para revelar a resposta</p>
          </div>

          {/* Back – Resposta */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,255,128,0.25)',
              boxShadow: '0 0 40px rgba(0,255,128,0.06)',
            }}
          >
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#00ff80' }}
            >
              Resposta
            </span>
            <p className="text-white text-xl font-medium leading-relaxed">
              <MathText text={card.answer} />
            </p>
          </div>
        </div>
      </div>

      {/* Rating buttons – só aparecem quando virado */}
      <div
        className="w-full max-w-2xl grid grid-cols-4 gap-3 transition-all duration-300"
        style={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? 'auto' : 'none' }}
      >
        {ratingButtons.map(({ rating, label, color, glow }) => (
          <button
            key={rating}
            onClick={() => handleRating(rating)}
            disabled={saving}
            className="py-3 px-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            style={{
              color,
              background: `${color}14`,
              border: `1px solid ${color}55`,
              boxShadow: `0 0 16px ${glow}`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px ${glow}`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}99`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${glow}`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}55`;
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hint */}
      {!flipped && (
        <p className="text-slate-600 text-xs">
          Clique no card para ver a resposta, depois avalie seu desempenho
        </p>
      )}
    </main>
  );
}
