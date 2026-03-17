'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  AREA_MAP,
  SUBJECT_META,
  buildTestDeck,
  type DiagnosticCard,
  type SubjectId,
} from './flashcardData';

// ─── Design tokens ─────────────────────────────────────────────────────────
const GREEN  = '#22c55e';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const RED    = '#ef4444';
const ORANGE = '#f97316';

// ─── Phone mask ────────────────────────────────────────────────────────────
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <=  2) return `(${d}`;
  if (d.length <=  7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

// ─── Step indicator ─────────────────────────────────────────────────────────
const STEP_LABELS = ['Matéria', 'Diagnóstico', 'Resultado'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={{
                  background: n <= current
                    ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                    : 'rgba(255,255,255,0.07)',
                  color: n <= current ? '#fff' : 'rgba(255,255,255,0.25)',
                  boxShadow: n === current ? `0 0 16px ${VIOLET}80` : 'none',
                }}
              >
                {n < current ? '✓' : n}
              </div>
              <span className="text-xs hidden sm:block"
                style={{ color: n === current ? '#a78bfa' : 'rgba(255,255,255,0.20)' }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-14 sm:w-24 h-px mx-1 mb-4 sm:mb-0 transition-all duration-500"
                style={{ background: n < current ? `linear-gradient(90deg,${VIOLET},${CYAN})` : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Memory health bar ──────────────────────────────────────────────────────
function HealthBar({ health }: { health: number }) {
  const color = health > 65 ? GREEN : health > 35 ? ORANGE : RED;
  const label = health > 65 ? 'Saudável' : health > 35 ? 'Em Risco' : 'Crítico';
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Saúde da Memória
        </span>
        <span className="text-xs font-black tabular-nums" style={{ color }}>
          {health}% · {label}
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${health}%`,
            background: health > 65
              ? `linear-gradient(90deg, #16a34a, ${GREEN})`
              : health > 35
              ? `linear-gradient(90deg, #c2410c, ${ORANGE})`
              : `linear-gradient(90deg, #991b1b, ${RED})`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

// ─── System alert toast ──────────────────────────────────────────────────────
function LacunaAlert({ msg }: { msg: string | null }) {
  if (!msg) return null;
  const color = msg.startsWith('🔴') ? RED : RED;
  return (
    <div
      className="lacuna-alert fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm max-w-sm w-full"
      style={{
        transform: 'translateX(-50%)',
        background: `rgba(15,5,5,0.96)`,
        border: `1px solid ${color}45`,
        boxShadow: `0 0 32px ${color}25, 0 8px 32px rgba(0,0,0,0.60)`,
        color,
        backdropFilter: 'blur(16px)',
      }}
    >
      <span className="inline-block w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
      <span className="font-mono text-xs leading-tight">{msg}</span>
    </div>
  );
}

// ─── AI loading animation ────────────────────────────────────────────────────
const ANALYSIS_MSGS = [
  'Mapeando padrões de resposta...',
  'Calculando índice de retenção...',
  'Identificando lacunas críticas...',
  'Gerando Radar ENEM personalizado...',
  'Diagnóstico quase pronto...',
];

function AnalysisLoader() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % ANALYSIS_MSGS.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8 fade-up">
      {/* Pulsing brain icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: `rgba(124,58,237,0.18)`,
            border: `1px solid rgba(124,58,237,0.40)`,
            boxShadow: `0 0 40px rgba(124,58,237,0.30)`,
            animation: 'cta-pulse 1.6s ease-in-out infinite',
          }}>
          🧠
        </div>
        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid transparent`,
            borderTopColor: VIOLET,
            borderRightColor: CYAN,
            animation: 'spin 1s linear infinite',
          }} />
      </div>

      <div className="text-center">
        <p className="text-white font-black text-xl mb-2">
          IA analisando seus padrões de resposta...
        </p>
        <p className="font-mono text-sm transition-all duration-300" style={{ color: CYAN }}>
          {ANALYSIS_MSGS[msgIdx]}
          <span className="cursor-blink">_</span>
        </p>
      </div>

      {/* Fake progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
              animation: 'progress-fill 2.5s ease-out forwards',
            }} />
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────
const cardStyle = {
  background:           'rgba(10,5,20,0.88)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               `1px solid rgba(124,58,237,0.28)`,
  boxShadow:            `0 0 60px rgba(124,58,237,0.10)`,
};
const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border:     '1px solid rgba(255,255,255,0.10)',
};
const topShimmer = (
  <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
    style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}80, ${CYAN}50, transparent)` }} />
);

// ─── Types ──────────────────────────────────────────────────────────────────
type Rating = 'facil' | 'medio' | 'dificil';
interface CardResult { cardId: string; subject: SubjectId; rating: Rating; seconds: number; }

const SCORE_MAP: Record<Rating, number> = { facil: 100, medio: 50, dificil: 10 };

function buildAlertMsg(health: number, rating: Rating, subject: SubjectId, secs: number): string | null {
  if (rating === 'dificil') return `❌ Lacuna detectada em ${SUBJECT_META[subject].name} — IA registrando falha`;
  if (secs > 12)            return `⚠ Instabilidade Sináptica em ENEM — tempo de processamento crítico`;
  if (health < 35)          return `🔴 Alerta máximo: múltiplas lacunas críticas identificadas`;
  if (health < 55)          return `⚠ Instabilidade Sináptica em ENEM — reforço necessário`;
  return null;
}

function calcRadar(results: CardResult[]): Record<string, number> {
  const totals: Record<string, number[]> = {};
  results.forEach(r => {
    const area  = AREA_MAP[r.subject];
    const score = r.rating === 'dificil' || r.seconds > 12 ? 10 : SCORE_MAP[r.rating];
    totals[area] = [...(totals[area] ?? []), score];
  });
  return Object.fromEntries(
    Object.entries(totals).map(([area, scores]) => [
      area,
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    ]),
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const router = useRouter();

  // Step 1 — subject
  const [subject,  setSubject]  = useState<SubjectId | null>(null);

  // Step 2 — quiz
  const [testDeck,   setTestDeck]   = useState<DiagnosticCard[]>([]);
  const [cardIndex,  setCardIndex]  = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results,    setResults]    = useState<CardResult[]>([]);
  const [health,     setHealth]     = useState(100);
  const [alertMsg,   setAlertMsg]   = useState<string | null>(null);
  const [elapsed,    setElapsed]    = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTime = useRef<number>(0);
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — lead (shown after loading animation)
  const [analyzing,  setAnalyzing]  = useState(false); // loading screen
  const [finalData,  setFinalData]  = useState<{ results: CardResult[]; health: number } | null>(null);
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');

  // Navigation
  const [step, setStep] = useState(1);

  useEffect(() => () => {
    if (timerRef.current)   clearInterval(timerRef.current);
    if (alertTimer.current) clearTimeout(alertTimer.current);
  }, []);

  const currentCard = testDeck[cardIndex];

  function showAlert(msg: string) {
    if (alertTimer.current) clearTimeout(alertTimer.current);
    setAlertMsg(msg);
    alertTimer.current = setTimeout(() => setAlertMsg(null), 2800);
  }

  // ── Step 1 → 2: pick subject, build deck ──
  function startQuiz(chosen: SubjectId) {
    const deck = buildTestDeck(chosen);
    setSubject(chosen);
    setTestDeck(deck);
    setCardIndex(0);
    setShowAnswer(false);
    setResults([]);
    setHealth(100);
    setElapsed(0);
    setStep(2);
  }

  // ── Step 2: reveal answer ──
  function handleRevealAnswer() {
    setShowAnswer(true);
    revealTime.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }

  // ── Step 2: rate card ──
  function handleRate(rating: Rating) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const secs = Math.round((Date.now() - revealTime.current) / 1000);

    let delta = 0;
    if (rating === 'dificil') delta -= 20;
    else if (rating === 'medio') delta -= 6;
    if (secs > 12) delta -= 8;
    else if (secs > 8) delta -= 3;

    const newHealth  = Math.max(0, Math.min(100, health + delta));
    const newResult: CardResult = { cardId: currentCard.id, subject: currentCard.subject, rating, seconds: secs };
    const newResults = [...results, newResult];

    setHealth(newHealth);
    setResults(newResults);

    const msg = buildAlertMsg(newHealth, rating, currentCard.subject, secs);
    if (msg) showAlert(msg);

    const next = cardIndex + 1;
    if (next < testDeck.length) {
      setCardIndex(next);
      setShowAnswer(false);
      setElapsed(0);
    } else {
      // Quiz done → show loading animation then lead form
      setFinalData({ results: newResults, health: newHealth });
      setAnalyzing(true);
      setStep(3);
      setTimeout(() => setAnalyzing(false), 3000);
    }
  }

  // ── Step 3: submit lead → checkout ──
  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || whatsapp.replace(/\D/g,'').length < 10) {
      setSaveErr('Preencha todos os campos.'); return;
    }
    setSaving(true); setSaveErr('');

    supabase.from('leads').insert({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      whatsapp: whatsapp.replace(/\D/g,''),
    }).then(() => {/* fire-and-forget */});

    const radar = calcRadar(finalData!.results);
    localStorage.setItem('flashAprovaOnboarding', JSON.stringify({
      subject,
      results:      finalData!.results,
      memoryHealth: finalData!.health,
      radar,
    }));

    router.push('/checkout');
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen px-4 py-10 sm:px-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px', zIndex: 0,
        }} />

      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full orb-a"
          style={{ width:500, height:500, top:'-10%', right:'-5%',
            background:`radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)` }} />
        <div className="absolute rounded-full orb-b"
          style={{ width:400, height:400, bottom:'5%', left:'-5%',
            background:`radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)` }} />
      </div>

      <LacunaAlert msg={alertMsg} />

      <div className="relative max-w-2xl mx-auto" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="font-black text-white text-xl">
            Flash<span style={{
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </a>
        </div>

        <StepIndicator current={step} />

        {/* Step content */}
        <div key={step} className="fade-up">

          {/* ══ STEP 1: Escolha a matéria ══ */}
          {step === 1 && (
            <div>
              <div className="text-center mb-10">
                <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
                  Diagnóstico Personalizado por IA
                </p>
                <h1 className="text-white font-black text-3xl sm:text-4xl leading-tight mb-3">
                  Vamos começar por onde dói mais no{' '}
                  <span style={{ color: GREEN, textShadow: `0 0 20px ${GREEN}80` }}>ENEM?</span>
                </h1>
                <p className="text-slate-400 text-base max-w-md mx-auto">
                  Escolha a matéria que mais te preocupa e vamos testar sua retenção agora.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(Object.entries(SUBJECT_META) as [SubjectId, typeof SUBJECT_META[SubjectId]][]).map(([id, meta]) => (
                  <button key={id}
                    onClick={() => startQuiz(id)}
                    className="relative rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 active:scale-95 overflow-hidden group"
                    style={{
                      background: 'rgba(10,5,20,0.85)',
                      border: `1px solid rgba(124,58,237,0.22)`,
                      boxShadow: '0 0 40px rgba(124,58,237,0.06)',
                    }}
                  >
                    {/* Top line per subject color */}
                    <div className="absolute inset-x-0 top-0 h-px transition-opacity duration-200"
                      style={{ background: `linear-gradient(90deg, transparent, ${meta.color}90, transparent)` }} />
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(ellipse at top left, ${meta.color}18 0%, transparent 60%)` }} />

                    <div className="text-4xl mb-3">{meta.icon}</div>
                    <p className="text-white font-black text-lg">{meta.name}</p>
                    <p className="text-slate-600 text-xs mt-1 mb-4">{meta.area}</p>

                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: VIOLET }} />
                      <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>
                        Testar agora →
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-slate-700 text-xs mt-6">
                10 questões · ~3 minutos · Resultado imediato
              </p>
            </div>
          )}

          {/* ══ STEP 2: Stress Test Quiz ══ */}
          {step === 2 && subject && currentCard && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: RED }}>
                    ● STRESS TEST ATIVO
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">Escaneamento de lacunas em tempo real</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Questão</p>
                  <p className="font-black text-white text-lg tabular-nums">
                    {cardIndex + 1}<span className="text-slate-700 font-normal text-sm">/10</span>
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(cardIndex / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
                    boxShadow: `0 0 8px ${CYAN}60`,
                  }} />
              </div>

              <HealthBar health={health} />

              {/* Subject badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${SUBJECT_META[currentCard.subject].color}18`,
                    border: `1px solid ${SUBJECT_META[currentCard.subject].color}35`,
                    color: SUBJECT_META[currentCard.subject].color,
                  }}>
                  {SUBJECT_META[currentCard.subject].icon} {SUBJECT_META[currentCard.subject].name}
                </div>
              </div>

              {/* Card */}
              <div className="relative rounded-3xl p-7 sm:p-9 mb-5 min-h-48 flex flex-col" style={cardStyle}>
                {topShimmer}

                {showAnswer && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: elapsed > 12 ? RED : elapsed > 8 ? ORANGE : GREEN }} />
                    <span className="text-xs font-bold tabular-nums font-mono"
                      style={{ color: elapsed > 12 ? RED : elapsed > 8 ? ORANGE : 'rgba(255,255,255,0.35)' }}>
                      {elapsed}s{elapsed > 12 ? ' ⚠' : ''}
                    </span>
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-xs font-bold tracking-widest uppercase mb-3"
                    style={{ color: showAnswer ? GREEN : VIOLET }}>
                    {showAnswer ? '// RESPOSTA:' : '// PERGUNTA:'}
                  </p>
                  <p className="text-white font-bold text-xl leading-relaxed">
                    {showAnswer ? currentCard.a : currentCard.q}
                  </p>
                  {!showAnswer && (
                    <p className="text-slate-700 text-xs font-mono mt-4">
                      — Tente recuperar antes de revelar. O tempo conta.
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {!showAnswer ? (
                <button onClick={handleRevealAnswer}
                  className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: `1px solid rgba(124,58,237,0.40)`,
                    color: '#c4b5fd',
                    boxShadow: '0 0 20px rgba(124,58,237,0.10)',
                  }}>
                  Revelar Resposta
                </button>
              ) : (
                <div>
                  <p className="text-center text-xs text-slate-700 font-mono mb-3">
                    Avalie com honestidade — a IA usa isso para calibrar seu plano:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label:'😅 Difícil', rating:'dificil' as Rating, color:RED,    bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.35)',  sub:'-20 pts' },
                      { label:'🤔 Médio',   rating:'medio'   as Rating, color:ORANGE, bg:'rgba(249,115,22,0.10)', border:'rgba(249,115,22,0.30)', sub:'-6 pts'  },
                      { label:'✅ Fácil',   rating:'facil'   as Rating, color:GREEN,  bg:`rgba(34,197,94,0.10)`,  border:`rgba(34,197,94,0.30)`,  sub:'OK'      },
                    ]).map(({ label, rating, color, bg, border, sub }) => (
                      <button key={rating} onClick={() => handleRate(rating)}
                        className="flex flex-col items-center py-3.5 rounded-xl font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                        style={{ background:bg, border:`1px solid ${border}`, color }}>
                        <span className="text-sm">{label}</span>
                        <span className="text-xs font-mono opacity-50 mt-0.5">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3: Loading → Lead form ══ */}
          {step === 3 && (
            analyzing ? (
              <AnalysisLoader />
            ) : (
              <div className="relative rounded-3xl p-7 sm:p-10 fade-up" style={cardStyle}>
                {topShimmer}

                {/* Header with result teaser */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{
                      background: finalData && finalData.health < 50
                        ? 'rgba(239,68,68,0.18)'
                        : 'rgba(34,197,94,0.18)',
                      border: `1px solid ${finalData && finalData.health < 50 ? RED : GREEN}40`,
                      boxShadow: `0 0 24px ${finalData && finalData.health < 50 ? RED : GREEN}25`,
                    }}>
                    {finalData && finalData.health < 50 ? '⚠️' : '📊'}
                  </div>
                  <div>
                    <p className="text-white font-black text-xl leading-tight">
                      Seu Diagnóstico de Retenção está pronto!
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Saúde da memória:{' '}
                      <span className="font-bold"
                        style={{ color: finalData && finalData.health < 50 ? RED : GREEN }}>
                        {finalData?.health ?? 0}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Blurred radar teaser */}
                <div className="my-6 rounded-2xl overflow-hidden relative"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.20)' }}>
                  <div className="flex items-center justify-center py-8 blur-sm select-none pointer-events-none">
                    <svg width="120" height="100" viewBox="0 0 120 100">
                      <polygon points="60,10 110,40 110,70 60,90 10,70 10,40"
                        fill="none" stroke={`${VIOLET}50`} strokeWidth="1" />
                      <polygon points="60,28 90,46 90,64 60,76 30,64 30,46"
                        fill="none" stroke={`${VIOLET}30`} strokeWidth="1" />
                      <polygon points="60,55 75,62 75,68 60,72 45,68 45,62"
                        fill={`${VIOLET}25`} stroke={CYAN} strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(124,58,237,0.30)', border: `1px solid ${VIOLET}50`, color: '#c4b5fd' }}>
                        🔒 Radar bloqueado — libere abaixo
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Preencha abaixo para liberar seu{' '}
                  <span className="text-white font-semibold">Radar ENEM</span>{' '}
                  e descobrir como blindar sua memória até o dia da prova.
                </p>

                <form onSubmit={handleLeadSubmit} noValidate className="flex flex-col gap-3">
                  {[
                    { label:'Seu nome', type:'text',  ph:'Como posso te chamar?', val:name,  set:setName,  ac:'name' },
                    { label:'E-mail',   type:'email', ph:'seu@email.com',          val:email, set:setEmail, ac:'email' },
                  ].map(({ label, type, ph, val, set, ac }) => (
                    <div key={label}>
                      <label className="text-xs text-slate-500 font-medium mb-1.5 block">{label}</label>
                      <input type={type} placeholder={ph} value={val}
                        onChange={e => set(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-slate-700 transition-all"
                        style={inputStyle} autoComplete={ac} required />
                    </div>
                  ))}

                  <div>
                    <label className="text-xs text-slate-500 font-medium mb-1.5 block">WhatsApp</label>
                    <input type="tel" placeholder="(11) 99999-9999" value={whatsapp}
                      onChange={e => setWhatsapp(maskPhone(e.target.value))}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-slate-700 transition-all"
                      style={inputStyle} autoComplete="tel" required />
                  </div>

                  {saveErr && <p className="text-red-400 text-xs text-center">{saveErr}</p>}

                  <button type="submit" disabled={saving}
                    className="mt-2 w-full py-4 rounded-xl font-black text-black text-base transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${GREEN}, #16a34a)`,
                      boxShadow: `0 0 28px ${GREEN}40`,
                    }}>
                    {saving ? 'Liberando...' : 'Liberar meu Radar e Plano de Ataque →'}
                  </button>

                  <p className="text-center text-slate-700 text-xs mt-1">
                    🔒 Seus dados são privados · Sem spam
                  </p>
                </form>
              </div>
            )
          )}

        </div>{/* end key={step} fade wrapper */}
      </div>

      {/* Inline keyframes for spin + progress-fill */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress-fill { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
