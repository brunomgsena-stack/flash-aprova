'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CARDS, SUBJECT_META, UNIVERSITIES, type SubjectId } from './flashcardData';

// ─── Design tokens ─────────────────────────────────────────────────────────
const GREEN  = '#22c55e';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const RED    = '#ef4444';

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
  const color = health > 70 ? GREEN : health > 45 ? '#f97316' : RED;
  const label = health > 70 ? 'Saudável' : health > 45 ? 'Em Risco' : 'Crítico';
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Saúde da Memória
        </span>
        <span className="text-xs font-black" style={{ color }}>
          {health}% · {label}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${health}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Lacuna alert ───────────────────────────────────────────────────────────
function LacunaAlert({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="lacuna-alert fixed top-6 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(239,68,68,0.15)',
        border: `1px solid ${RED}60`,
        boxShadow: `0 0 24px ${RED}40`,
        color: RED,
      }}
    >
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: RED }} />
      ⚠ Lacuna Detectada — IA registrando falha de retenção
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────
const cardStyle = {
  background:           'rgba(10,5,20,0.85)',
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
interface CardResult { rating: Rating; seconds: number; }

// ─── Main component ─────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const router = useRouter();

  // Step 1 — lead
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [whatsapp,  setWhatsapp]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');

  // Step 2 — university
  const [university, setUniversity] = useState('');
  const [showSugg,   setShowSugg]   = useState(false);

  // Step 3 — subject
  const [subject, setSubject] = useState<SubjectId | null>(null);

  // Step 4 — quiz
  const [cardIndex,  setCardIndex]  = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results,    setResults]    = useState<CardResult[]>([]);
  const [health,     setHealth]     = useState(100);
  const [showLacuna, setShowLacuna] = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTime = useRef<number>(0);

  // Navigation
  const [step, setStep] = useState(1);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const filteredSugg = university.length > 0
    ? UNIVERSITIES.filter(u => u.toLowerCase().includes(university.toLowerCase())).slice(0, 6)
    : [];

  const cards      = subject ? CARDS[subject] : [];
  const currentCard = cards[cardIndex];

  // ── Step 1: save lead, advance immediately ──
  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || whatsapp.replace(/\D/g,'').length < 10) {
      setSaveErr('Preencha todos os campos.'); return;
    }
    setSaving(true); setSaveErr('');

    // Fire-and-forget — don't block the UX on DB response
    supabase.from('leads').insert({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      whatsapp: whatsapp.replace(/\D/g,''),
    }).then(() => {/* silent */});

    setStep(2);
    setSaving(false);
  }

  // ── Step 4: quiz logic ──
  function handleRevealAnswer() {
    setShowAnswer(true);
    revealTime.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }

  function handleRate(rating: Rating) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const secs = Math.round((Date.now() - revealTime.current) / 1000);

    let delta = 0;
    if (rating === 'dificil') delta -= 12;
    else if (rating === 'medio') delta -= 3;
    if (secs > 12) delta -= 6;

    const newHealth = Math.max(0, Math.min(100, health + delta));
    setHealth(newHealth);
    setResults(prev => [...prev, { rating, seconds: secs }]);

    if (rating === 'dificil' || delta < -10) {
      setShowLacuna(true);
      setTimeout(() => setShowLacuna(false), 3000);
    }

    const next = cardIndex + 1;
    if (next < 10) {
      setCardIndex(next);
      setShowAnswer(false);
      setElapsed(0);
    } else {
      // Quiz complete → persist and go to checkout
      localStorage.setItem('flashAprovaOnboarding', JSON.stringify({
        university,
        subject,
        results: [...results, { rating, seconds: secs }],
        memoryHealth: newHealth,
      }));
      router.push('/checkout');
    }
  }

  // ── Render ──
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

      <LacunaAlert show={showLacuna} />

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

        {/* Step content — key triggers fade-up on every step change */}
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
                  { label:'Nome completo', type:'text',  ph:'Seu nome',      val:name,     set:setName,     ac:'name' },
                  { label:'E-mail',        type:'email', ph:'seu@email.com', val:email,    set:setEmail,    ac:'email' },
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
                <p className="text-white font-black text-2xl mb-2">
                  Escolha a matéria para o diagnóstico
                </p>
                <p className="text-slate-500 text-sm">
                  A IA vai testar seu nível atual com 10 flashcards táticos
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(Object.entries(SUBJECT_META) as [SubjectId, typeof SUBJECT_META[SubjectId]][]).map(([id, meta]) => (
                  <button key={id}
                    onClick={() => {
                      setSubject(id);
                      setCardIndex(0);
                      setShowAnswer(false);
                      setResults([]);
                      setHealth(100);
                      setElapsed(0);
                      setStep(4);
                    }}
                    className="relative rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 overflow-hidden"
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
                      <span className="text-xs font-semibold" style={{ color:meta.color }}>10 cards · IA calibrada</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══ STEP 4: Quiz ══ */}
          {step === 4 && subject && currentCard && (
            <div>
              {/* Progress + health */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Card <span className="text-white font-bold">{cardIndex + 1}</span> de 10</span>
                  <span style={{ color:SUBJECT_META[subject].color }}>{SUBJECT_META[subject].name}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background:'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(cardIndex / 10) * 100}%`,
                      background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
                    }} />
                </div>
                <HealthBar health={health} />
              </div>

              {/* Card */}
              <div className="relative rounded-3xl p-7 sm:p-10 mb-5 min-h-48 flex flex-col" style={cardStyle}>
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
                  style={{ background:`linear-gradient(90deg, transparent, ${VIOLET}70, ${CYAN}40, transparent)` }} />

                {showAnswer && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: elapsed > 12 ? RED : elapsed > 8 ? '#f97316' : GREEN }} />
                    <span className="text-xs font-bold tabular-nums"
                      style={{ color: elapsed > 12 ? RED : elapsed > 8 ? '#f97316' : 'rgba(255,255,255,0.40)' }}>
                      {elapsed}s{elapsed > 12 ? ' ⚠' : ''}
                    </span>
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-5">
                    <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color:VIOLET }}>
                      {showAnswer ? 'Resposta:' : 'Pergunta:'}
                    </p>
                    <p className="text-white font-bold text-lg leading-relaxed">
                      {showAnswer ? currentCard.a : currentCard.q}
                    </p>
                  </div>
                  {!showAnswer && (
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-slate-600 text-xs italic">← Tente lembrar antes de revelar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              {!showAnswer ? (
                <button onClick={handleRevealAnswer}
                  className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(124,58,237,0.18)',
                    border: `1px solid rgba(124,58,237,0.40)`,
                    color: '#c4b5fd',
                    boxShadow: '0 0 20px rgba(124,58,237,0.12)',
                  }}>
                  Ver Resposta
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { label:'😅 Difícil', rating:'dificil' as Rating, color:RED,       bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.30)' },
                    { label:'🤔 Médio',   rating:'medio'   as Rating, color:'#f97316', bg:'rgba(249,115,22,0.10)', border:'rgba(249,115,22,0.28)' },
                    { label:'✅ Fácil',   rating:'facil'   as Rating, color:GREEN,     bg:`rgba(34,197,94,0.10)`,  border:`rgba(34,197,94,0.28)` },
                  ]).map(({ label, rating, color, bg, border }) => (
                    <button key={rating} onClick={() => handleRate(rating)}
                      className="py-3.5 rounded-xl text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                      style={{ background:bg, border:`1px solid ${border}`, color }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>{/* end key={step} fade wrapper */}
      </div>
    </div>
  );
}
