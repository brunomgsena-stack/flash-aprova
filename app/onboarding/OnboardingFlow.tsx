'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  AREA_MAP,
  DIAGNOSTIC_DECK,
  SUBJECT_META,
  UNIVERSITIES,
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
const STEP_LABELS = ['Você', 'Objetivo', 'Matéria', 'Quiz'];

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
              <div className="w-12 sm:w-20 h-px mx-1 mb-4 sm:mb-0 transition-all duration-500"
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

// ─── Lacuna flash alert ──────────────────────────────────────────────────────
function LacunaAlert({ msg }: { msg: string | null }) {
  if (!msg) return null;
  const isError    = msg.startsWith('❌');
  const isCritical = msg.startsWith('🔴');
  const color      = isCritical ? RED : isError ? RED : ORANGE;
  return (
    <div
      className="lacuna-alert fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm max-w-sm w-full"
      style={{
        transform: 'translateX(-50%)',
        background: `rgba(15,5,5,0.95)`,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 32px ${color}30, 0 8px 32px rgba(0,0,0,0.60)`,
        color,
        backdropFilter: 'blur(16px)',
      }}
    >
      <span className="inline-block w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
      <span className="font-mono text-xs leading-tight">{msg}</span>
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

// ─── System alert messages ───────────────────────────────────────────────────
function buildAlertMsg(health: number, rating: Rating, subject: SubjectId, secs: number): string | null {
  if (rating === 'dificil') return `❌ Erro: Lacuna de Retenção Crítica em ${SUBJECT_META[subject].name}`;
  if (secs > 12)            return `⚠ Alerta: Tempo de Processamento Excedido — Instabilidade Detectada`;
  if (health < 35)          return `🔴 Sistema: Múltiplas Falhas — Intervenção da IA Necessária`;
  if (health < 55)          return `⚠ Alerta: Instabilidade Sináptica Detectada`;
  return null;
}

// ─── Radar calculation ───────────────────────────────────────────────────────
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

  // Step 1 — lead
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');

  // Step 2 — university
  const [university, setUniversity] = useState('');
  const [showSugg,   setShowSugg]   = useState(false);

  // Step 3 — subject
  const [subject, setSubject] = useState<SubjectId | null>(null);

  // Step 4 — quiz engine
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

  // Navigation
  const [step, setStep] = useState(1);

  useEffect(() => () => {
    if (timerRef.current)   clearInterval(timerRef.current);
    if (alertTimer.current) clearTimeout(alertTimer.current);
  }, []);

  const filteredSugg = university.length > 0
    ? UNIVERSITIES.filter(u => u.toLowerCase().includes(university.toLowerCase())).slice(0, 6)
    : [];

  const currentCard = testDeck[cardIndex];

  // ── Flash alert ──
  function showAlert(msg: string) {
    if (alertTimer.current) clearTimeout(alertTimer.current);
    setAlertMsg(msg);
    alertTimer.current = setTimeout(() => setAlertMsg(null), 2800);
  }

  // ── Step 1: save lead, advance immediately ──
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
    setStep(2);
    setSaving(false);
  }

  // ── Step 3 → 4: build deck ──
  function startQuiz(chosen: SubjectId) {
    const deck = buildTestDeck(chosen);
    setSubject(chosen);
    setTestDeck(deck);
    setCardIndex(0);
    setShowAnswer(false);
    setResults([]);
    setHealth(100);
    setElapsed(0);
    setStep(4);
  }

  // ── Reveal answer ──
  function handleRevealAnswer() {
    setShowAnswer(true);
    revealTime.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }

  // ── Rate card ──
  function handleRate(rating: Rating) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const secs = Math.round((Date.now() - revealTime.current) / 1000);

    // Health delta — aggressive drops to create urgency
    let delta = 0;
    if (rating === 'dificil') delta -= 20;
    else if (rating === 'medio') delta -= 6;
    if (secs > 12) delta -= 8;
    else if (secs > 8) delta -= 3;

    const newHealth  = Math.max(0, Math.min(100, health + delta));
    const newResult: CardResult = {
      cardId:  currentCard.id,
      subject: currentCard.subject,
      rating,
      seconds: secs,
    };
    const newResults = [...results, newResult];

    setHealth(newHealth);
    setResults(newResults);

    // System alert
    const msg = buildAlertMsg(newHealth, rating, currentCard.subject, secs);
    if (msg) showAlert(msg);

    const next = cardIndex + 1;
    if (next < testDeck.length) {
      setCardIndex(next);
      setShowAnswer(false);
      setElapsed(0);
    } else {
      // Quiz complete → compute radar and go to checkout
      const radar = calcRadar(newResults);
      localStorage.setItem('flashAprovaOnboarding', JSON.stringify({
        university,
        subject,
        results:      newResults,
        memoryHealth: newHealth,
        radar,
      }));
      router.push('/checkout');
    }
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

        {/* Step content — key triggers fade-up animation on every step change */}
        <div key={step} className="fade-up">

          {/* ══ STEP 1: Lead form ══ */}
          {step === 1 && (
            <div className="relative rounded-3xl p-7 sm:p-10" style={cardStyle}>
              {topShimmer}

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background:'rgba(124,58,237,0.18)', border:'1px solid rgba(124,58,237,0.35)' }}>
                  🎯
                </div>
                <div>
                  <p className="text-white font-black text-xl leading-tight">
                    Identificação de Combate
                  </p>
                  <p className="text-slate-500 text-sm mt-0.5">
                    A IA vai personalizar seu diagnóstico
                  </p>
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} noValidate className="flex flex-col gap-3">
                {[
                  { label:'Nome completo', type:'text',  ph:'Seu nome',      val:name,  set:setName,  ac:'name' },
                  { label:'E-mail',        type:'email', ph:'seu@email.com', val:email, set:setEmail, ac:'email' },
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
                  className="mt-3 w-full py-4 rounded-xl font-black text-black text-base transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${GREEN}, #16a34a)`,
                    boxShadow: `0 0 24px ${GREEN}40`,
                  }}>
                  {saving ? 'Salvando...' : 'Iniciar Diagnóstico por IA →'}
                </button>

                <p className="text-center text-slate-700 text-xs mt-1">
                  🔒 Seus dados são privados · Sem spam
                </p>
              </form>
            </div>
          )}

          {/* ══ STEP 2: Objetivo / Universidade ══ */}
          {step === 2 && (
            <div className="relative rounded-3xl p-7 sm:p-10" style={cardStyle}>
              {topShimmer}

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background:'rgba(124,58,237,0.18)', border:'1px solid rgba(124,58,237,0.35)' }}>
                  🏆
                </div>
                <div>
                  <p className="text-white font-black text-xl leading-tight">
                    Olá, {name.split(' ')[0]}! Qual é o seu objetivo?
                  </p>
                  <p className="text-slate-500 text-sm mt-0.5">
                    A IA calibra o diagnóstico com base na sua meta
                  </p>
                </div>
              </div>

              <label className="text-xs text-slate-500 font-medium mb-2 block">
                Universidade / Curso / Concurso
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: USP – Medicina, Concurso PRF..."
                  value={university}
                  onChange={e => { setUniversity(e.target.value); setShowSugg(true); }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none placeholder-slate-700 transition-all"
                  style={inputStyle}
                  autoComplete="off"
                  autoFocus
                />
                {showSugg && filteredSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                    style={{ background:'rgba(10,5,20,0.97)', border:`1px solid rgba(124,58,237,0.25)`, boxShadow:'0 8px 32px rgba(0,0,0,0.60)' }}>
                    {filteredSugg.map(u => (
                      <button key={u}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                        style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                        onMouseDown={() => { setUniversity(u); setShowSugg(false); }}>
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-slate-600 text-xs mt-2 mb-8">Ou escreva manualmente qualquer objetivo</p>

              <button
                onClick={() => { if (university.trim()) setStep(3); }}
                disabled={!university.trim()}
                className="w-full py-4 rounded-xl font-black text-base transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: university.trim() ? `linear-gradient(135deg, ${GREEN}, #16a34a)` : 'rgba(255,255,255,0.08)',
                  color:      university.trim() ? '#000' : 'rgba(255,255,255,0.25)',
                  boxShadow:  university.trim() ? `0 0 24px ${GREEN}40` : 'none',
                }}>
                Continuar →
              </button>
            </div>
          )}

          {/* ══ STEP 3: Matéria ══ */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
                  Escaneamento de Ponto Cego
                </p>
                <p className="text-white font-black text-2xl mb-2">
                  Qual matéria te preocupa mais?
                </p>
                <p className="text-slate-500 text-sm">
                  A IA vai stress-testar sua memória com{' '}
                  <span style={{ color: GREEN, fontWeight: 700 }}>10 cards de elite</span>{' '}
                  — priorizando sua maior fraqueza
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(Object.entries(SUBJECT_META) as [SubjectId, typeof SUBJECT_META[SubjectId]][]).map(([id, meta]) => {
                  const deckCount = DIAGNOSTIC_DECK.filter(c => c.subject === id).length;
                  return (
                    <button key={id}
                      onClick={() => startQuiz(id)}
                      className="relative rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 active:scale-95 overflow-hidden"
                      style={{ background:'rgba(10,5,20,0.85)', border:`1px solid rgba(124,58,237,0.22)`, boxShadow:'0 0 40px rgba(124,58,237,0.06)' }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px"
                        style={{ background:`linear-gradient(90deg, transparent, ${meta.color}70, transparent)` }} />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background:`radial-gradient(ellipse at top left, ${meta.color}12 0%, transparent 65%)` }} />
                      <div className="text-4xl mb-3">{meta.icon}</div>
                      <p className="text-white font-black text-base">{meta.name}</p>
                      <p className="text-slate-600 text-xs mt-1">{meta.area}</p>
                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:meta.color }} />
                        <span className="text-xs font-semibold" style={{ color:meta.color }}>
                          {deckCount} cards prioritários · IA calibrada
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ STEP 4: Stress Test Quiz ══ */}
          {step === 4 && subject && currentCard && (
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
                  <p className="text-xs text-slate-500">Card</p>
                  <p className="font-black text-white text-lg tabular-nums">
                    {cardIndex + 1}<span className="text-slate-700 font-normal text-sm">/10</span>
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background:'rgba(255,255,255,0.06)' }}>
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
                  <span>{SUBJECT_META[currentCard.subject].icon}</span>
                  {SUBJECT_META[currentCard.subject].name}
                </div>
                <span className="text-xs text-slate-700 font-mono">
                  {SUBJECT_META[currentCard.subject].area}
                </span>
              </div>

              {/* Card */}
              <div className="relative rounded-3xl p-7 sm:p-9 mb-5 min-h-52 flex flex-col" style={cardStyle}>
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
                  style={{ background:`linear-gradient(90deg, transparent, ${VIOLET}70, ${CYAN}40, transparent)` }} />

                {/* Timer */}
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
                  <div className="mb-5">
                    <p className="text-xs font-bold tracking-widest uppercase mb-3"
                      style={{ color: showAnswer ? GREEN : VIOLET }}>
                      {showAnswer ? '// RESPOSTA:' : '// PERGUNTA:'}
                    </p>
                    <p className="text-white font-bold text-lg leading-relaxed">
                      {showAnswer ? currentCard.a : currentCard.q}
                    </p>
                  </div>
                  {!showAnswer && (
                    <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-slate-700 text-xs font-mono">
                        — Tente recuperar antes de revelar. O tempo conta.
                      </p>
                    </div>
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
                    Avalie sua memória com honestidade — a IA depende disso:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label:'😅 Difícil', rating:'dificil' as Rating, color:RED,    bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.35)',   sub:'-20pts' },
                      { label:'🤔 Médio',   rating:'medio'   as Rating, color:ORANGE, bg:'rgba(249,115,22,0.10)', border:'rgba(249,115,22,0.30)',  sub:'-6pts'  },
                      { label:'✅ Fácil',   rating:'facil'   as Rating, color:GREEN,  bg:`rgba(34,197,94,0.10)`,  border:`rgba(34,197,94,0.30)`,   sub:'OK'     },
                    ]).map(({ label, rating, color, bg, border, sub }) => (
                      <button key={rating} onClick={() => handleRate(rating)}
                        className="flex flex-col items-center py-3.5 rounded-xl font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                        style={{ background:bg, border:`1px solid ${border}`, color }}>
                        <span className="text-sm">{label}</span>
                        <span className="text-xs font-mono opacity-60 mt-0.5">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>{/* end key={step} fade wrapper */}
      </div>
    </div>
  );
}
