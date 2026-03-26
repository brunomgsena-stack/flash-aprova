'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import katex from 'katex';
import { updateStreak } from '@/lib/streak';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#00FF73';

// ─── LaTeX renderer ──────────────────────────────────────────────────────────

function renderMath(formula: string, displayMode: boolean): string {
  return katex.renderToString(formula, { displayMode, throwOnError: false });
}

const MATH_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/;

function MathText({ text }: { text: string }) {
  const parts = text.split(MATH_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$'))
          return <span key={i} className="block my-2" dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }} />;
        if (part.startsWith('\\[') && part.endsWith('\\]'))
          return <span key={i} className="block my-2" dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }} />;
        if (part.startsWith('$') && part.endsWith('$'))
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(part.slice(1, -1), false) }} />;
        if (part.startsWith('\\(') && part.endsWith('\\)'))
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), false) }} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Card = {
  id:       string;
  question: string;
  answer:   string;
  deckId:   string;
  isNew:    boolean;  // true = never studied before
};

type UserProgress = {
  id:            string;
  ease_factor:   number;
  lapses:        number;
  interval_days: number;
  next_review:   string;
  history:       ReviewEntry[];
};

type ReviewEntry = {
  reviewed_at:   string;
  rating:        number;
  interval_days: number;
};

// ─── SRS Algorithm (same as turbo) ───────────────────────────────────────────

function calcNextReview(rating: number, prev: UserProgress | null) {
  const ef     = prev?.ease_factor   ?? 2.5;
  const lapses = prev?.lapses        ?? 0;
  const prevI  = prev?.interval_days ?? 0;
  const baseI  = prevI > 0 ? prevI : 1;

  let newEf = ef, newLapses = lapses, newInterval: number;

  if (rating === 1) {
    newLapses   = lapses + 1;
    newInterval = 1;
  } else {
    if (rating === 2) newEf = Math.max(1.3, ef - 0.2);
    if (rating === 4) newEf = ef + 0.15;
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

// ─── Shuffle helper ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: VIOLET, borderTopColor: 'transparent' }}
        />
        <p className="text-slate-400 text-sm">Montando sua RevisãoFlash…</p>
      </div>
    </main>
  );
}

// ─── Completion Modal ─────────────────────────────────────────────────────────

function CompletionModal({
  reviewedCount,
  newCount,
}: {
  reviewedCount: number;
  newCount:      number;
}) {
  const router = useRouter();
  const total  = reviewedCount + newCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(10,5,25,0.97)',
          border:     `1px solid ${VIOLET}50`,
          boxShadow:  `0 0 60px ${VIOLET}25, 0 0 120px ${VIOLET}10`,
        }}
      >
        {/* Top accent */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${NEON}60, transparent)` }}
        />

        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Trophy */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: `${VIOLET}18`, border: `1px solid ${VIOLET}50`, boxShadow: `0 0 32px ${VIOLET}30` }}
          >
            🏆
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: VIOLET }}>
              Meta Batida!
            </p>
            <h2 className="text-2xl font-black text-white leading-tight">
              Sessão concluída!
            </h2>
          </div>

          {/* Stats */}
          <div
            className="w-full rounded-2xl px-5 py-4 grid grid-cols-2 gap-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black" style={{ color: VIOLET }}>{reviewedCount}</span>
              <span className="text-xs text-slate-400">cards revisados</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black" style={{ color: NEON }}>{newCount}</span>
              <span className="text-xs text-slate-400">novos aprendidos</span>
            </div>
          </div>

          {/* FlashTutor message */}
          <p className="text-sm font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {total === 0
              ? 'Você está em dia! Nenhum card pendente agora. Continue assim. 🎉'
              : `Você está mais perto da sua aprovação! Cada card revisado é um ponto a mais na prova. 🚀`}
          </p>

          {/* CTA único */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)`,
              boxShadow:  `0 0 20px ${VIOLET}50`,
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function RevisaoFlashStudy() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const subjectId   = searchParams.get('subjectId') ?? '';
  const sessionSize = Math.max(1, parseInt(searchParams.get('size') ?? '50', 10));

  const [queue,         setQueue]         = useState<Card[]>([]);
  const [progressMap,   setProgressMap]   = useState<Record<string, UserProgress>>({});
  const [index,         setIndex]         = useState(0);
  const [flipped,       setFlipped]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [done,          setDone]          = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [newCount,      setNewCount]      = useState(0);
  const [isCatchup,     setIsCatchup]     = useState(false);
  const [initialTotal,  setInitialTotal]  = useState(0);

  // Update streak when session finishes
  useEffect(() => {
    if (done && userId) updateStreak(userId);
  }, [done, userId]);

  useEffect(() => {
    async function load() {
      if (!subjectId) { setLoading(false); setDone(true); return; }

      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const today = new Date().toISOString().split('T')[0];

      // 1. Get all deck IDs for this subject
      const { data: decks } = await supabase
        .from('decks')
        .select('id')
        .eq('subject_id', subjectId);

      if (!decks || decks.length === 0) { setLoading(false); setDone(true); return; }
      const deckIds = decks.map((d: { id: string }) => d.id);

      // 2. Get all cards in those decks
      const { data: rawCards } = await supabase
        .from('cards')
        .select('id, question, answer, deck_id')
        .in('deck_id', deckIds);

      if (!rawCards || rawCards.length === 0) { setLoading(false); setDone(true); return; }

      type RawCard = { id: string; question: string; answer: string; deck_id: string };
      const allCards: RawCard[] = rawCards as RawCard[];

      // 3. Fetch user progress for all these cards
      let progMap: Record<string, UserProgress> = {};
      if (user?.id) {
        const { data: progressRows } = await supabase
          .from('user_progress')
          .select('id, card_id, ease_factor, lapses, interval_days, next_review, history')
          .eq('user_id', user.id)
          .in('card_id', allCards.map(c => c.id));

        (progressRows ?? []).forEach((p: UserProgress & { card_id: string }) => {
          progMap[p.card_id] = p;
        });
      }
      setProgressMap(progMap);

      // 4. Separate into due (urgent) and new
      const dueCards = allCards.filter(c => {
        const p = progMap[c.id];
        return p && p.next_review <= today;
      });
      const newCards = allCards.filter(c => !progMap[c.id]);

      let sessionCards: Card[];

      {
        // ── Regra de preenchimento:
        //   1. Pega até 80% do total_objetivo em cards vencidos
        //   2. Completa o restante com cards novos
        //   3. Sessão sempre chega ao total_objetivo (a menos que faltem cards no banco)
        const maxUrgent  = Math.round(sessionSize * 0.8);
        const urgentPick = shuffle(dueCards).slice(0, maxUrgent);
        const newSlots   = sessionSize - urgentPick.length; // preenche o que faltou
        const newPick    = shuffle(newCards).slice(0, newSlots);

        // Ativa badge catch-up apenas visualmente quando a fila de atrasados é grande
        setIsCatchup(dueCards.length > sessionSize);

        // Interleave: intercala 1 novo a cada 4 urgentes para manter a saúde do algoritmo
        const urgentCards = urgentPick.map(c => ({
          id: c.id, question: c.question, answer: c.answer, deckId: c.deck_id, isNew: false,
        }));
        const freshCards = newPick.map(c => ({
          id: c.id, question: c.question, answer: c.answer, deckId: c.deck_id, isNew: true,
        }));

        sessionCards = [];
        let ni = 0;
        for (let i = 0; i < urgentCards.length; i++) {
          sessionCards.push(urgentCards[i]);
          if (ni < freshCards.length && (i + 1) % 4 === 0) {
            sessionCards.push(freshCards[ni++]);
          }
        }
        // Adiciona os novos restantes no final
        while (ni < freshCards.length) sessionCards.push(freshCards[ni++]);
}

      setQueue(sessionCards);
      setInitialTotal(sessionCards.length);
      setLoading(false);
      if (sessionCards.length === 0) setDone(true);
    }
    load();
  }, [subjectId, sessionSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRating = useCallback(async (rating: number) => {
    if (saving || !queue[index]) return;
    setSaving(true);

    const card     = queue[index];
    const prevProg = progressMap[card.id] ?? null;
    const next     = calcNextReview(rating, prevProg);
    const newEntry: ReviewEntry = { reviewed_at: new Date().toISOString(), rating, interval_days: next.interval_days };
    const history  = [...(prevProg?.history ?? []), newEntry];

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

    // Track stats
    if (card.isNew) setNewCount(n => n + 1);
    else            setReviewedCount(r => r + 1);

    setProgressMap(prev => ({
      ...prev,
      [card.id]: { ...(prev[card.id] ?? { id: '' }), ...next, history },
    }));

    setFlipped(false);
    setSaving(false);

    setTimeout(() => {
      if (rating === 1) {
        // Re-add to end of queue for relearning
        setQueue(q => [...q, card]);
        setIndex(i => i + 1);
      } else {
        const nextIndex = index + 1;
        if (nextIndex >= queue.length) setDone(true);
        else setIndex(nextIndex);
      }
    }, 200);
  }, [saving, queue, index, progressMap, userId]);

  if (loading) return <Spinner />;

  if (done) {
    return (
      <CompletionModal
        reviewedCount={reviewedCount}
        newCount={newCount}
      />
    );
  }

  // ── Study screen ────────────────────────────────────────────────────────────
  const card     = queue[index];
  const progress = initialTotal > 0 ? Math.min((index / initialTotal) * 100, 99) : 0;
  const isRelearning = index >= initialTotal;

  const ratingButtons = [
    { rating: 1, label: '1 – Errei',   color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
    { rating: 2, label: '2 – Difícil', color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
    { rating: 3, label: '3 – Bom',     color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
    { rating: 4, label: '4 – Fácil',   color: NEON,      glow: 'rgba(0,255,115,0.35)' },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 gap-8">

      {/* Breadcrumbs */}
      <nav className="w-full max-w-2xl flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
        <a href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</a>
        <span className="opacity-40">›</span>
        <span className="font-semibold" style={{ color: VIOLET }}>🤖 RevisãoFlash</span>
        {isCatchup && (
          <>
            <span className="opacity-40">›</span>
            <span className="font-semibold" style={{ color: '#f97316' }}>Modo Catch-up</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Sair
        </button>

        <div className="text-center">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: VIOLET }}>
            🤖 RevisãoFlash
          </p>
          {isCatchup && (
            <p className="text-xs font-semibold" style={{ color: '#f97316' }}>
              Modo Catch-up ativo
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Card type badge */}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={
              card.isNew
                ? { color: NEON,   background: 'rgba(0,255,115,0.10)', border: `1px solid ${NEON}35` }
                : { color: VIOLET, background: `${VIOLET}12`,          border: `1px solid ${VIOLET}35` }
            }
          >
            {card.isNew ? 'novo' : isRelearning ? 'reforço' : 'revisão'}
          </span>
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
            width:      `${progress}%`,
            background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
            boxShadow:  `0 0 8px ${VIOLET}60`,
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
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '320px' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${VIOLET}30`, boxShadow: `0 0 40px ${VIOLET}08`,
            }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: VIOLET }}>
              Pergunta
            </span>
            <p className="text-white text-xl font-medium leading-relaxed">
              <MathText text={card.question} />
            </p>
            <p className="text-slate-500 text-sm mt-4">Clique para revelar a resposta</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
            style={{
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${NEON}30`, boxShadow: `0 0 40px ${NEON}08`,
            }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: NEON }}>
              Resposta
            </span>
            <p className="text-white text-xl font-medium leading-relaxed">
              <MathText text={card.answer} />
            </p>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
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
            style={{ color, background: `${color}14`, border: `1px solid ${color}55`, boxShadow: `0 0 16px ${glow}` }}
          >
            {label}
          </button>
        ))}
      </div>

      {!flipped && (
        <p className="text-slate-600 text-xs">Clique no card para ver a resposta, depois avalie seu desempenho</p>
      )}
    </main>
  );
}

// ─── Export with Suspense boundary ───────────────────────────────────────────

function SpinnerFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
        <p className="text-slate-400 text-sm">Carregando…</p>
      </div>
    </main>
  );
}

export default function RevisaoFlashPage() {
  return (
    <Suspense fallback={<SpinnerFallback />}>
      <RevisaoFlashStudy />
    </Suspense>
  );
}
