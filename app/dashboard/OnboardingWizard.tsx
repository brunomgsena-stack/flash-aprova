'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#10B981';

// ─── Config ───────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<number, { label: string; msg: string }> = {
  25:  { label: '25 cards',  msg: 'Para manter a constância! ⚡ Pequeno e poderoso.' },
  50:  { label: '50 cards',  msg: 'O equilíbrio perfeito. Consistência + volume. 🎯' },
  75:  { label: '75 cards',  msg: 'Gás total! Prepare o café. 🔥' },
  100: { label: '100 cards', msg: 'Nível Faca na Caveira! 💀 Maratona modo ON.' },
};

const AREAS = [
  { id: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza', sub: 'Biologia, Física, Química' },
  { id: 'Humanas',    icon: '🏛️', label: 'Ciências Humanas',     sub: 'História, Geografia, Filosofia' },
  { id: 'Linguagens', icon: '📚', label: 'Linguagens',            sub: 'Português, Literatura, Artes' },
  { id: 'Matemática', icon: '📐', label: 'Matemática',            sub: 'Álgebra, Geometria, Estatística' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  target_course?:       string | null;
  target_university?:   string | null;
  daily_card_goal?:     number | null;
  difficulty_subjects?: string[] | null;
  onboarding_completed?: boolean | null;
};

// ─── Progress dots ────────────────────────────────────────────────────────────

function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3, 4].map(s => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width:      s === step ? 20 : 8,
            height:     8,
            background: s === step ? VIOLET : s < step ? `${NEON}80` : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Tutor bubble ─────────────────────────────────────────────────────────────

function TutorBubble({ msg }: { msg: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 mb-5 text-sm font-semibold leading-snug"
      style={{
        background:   `${VIOLET}12`,
        border:       `1px solid ${VIOLET}35`,
        color:        'rgba(255,255,255,0.80)',
        borderRadius: '4px 18px 18px 18px',
      }}
    >
      <span className="text-xs font-bold mr-1.5" style={{ color: VIOLET }}>FlashTutor:</span>
      {msg}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const [visible, setVisible] = useState(false);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);

  // Form state
  const [course,       setCourse]       = useState('');
  const [university,   setUniversity]   = useState('');
  const [goal,         setGoal]         = useState(50);
  const [difficulties, setDifficulties] = useState<string[]>([]);

  // Check if onboarding is needed
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed, target_course, target_university, daily_card_goal, difficulty_subjects')
        .eq('id', user.id)
        .single();

      const profile = data as Profile | null;
      if (!profile || !profile.onboarding_completed) {
        // Pre-fill if partially saved
        if (profile?.target_course)       setCourse(profile.target_course);
        if (profile?.target_university)   setUniversity(profile.target_university);
        if (profile?.daily_card_goal)     setGoal(profile.daily_card_goal);
        if (profile?.difficulty_subjects) setDifficulties(profile.difficulty_subjects ?? []);
        setVisible(true);
      }
    }
    check();
  }, []);

  function toggleArea(id: string) {
    setDifficulties(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id],
    );
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id:                   userId,
      target_course:        course.trim()      || null,
      target_university:    university.trim()  || null,
      daily_card_goal:      goal,
      difficulty_subjects:  difficulties,
      onboarding_completed: true,
    }, { onConflict: 'id' });
    setSaving(false);
    setVisible(false);
  }

  if (!visible) return null;

  const canProceed1 = course.trim().length > 1;
  const tutorMsgs: Record<number, string> = {
    1: 'Qual é sua vaga nos sonhos? 🎯 Define o alvo antes de atirar.',
    2: 'Quantos cards por dia você consegue manter? Constância bate maratona.',
    3: 'Honestidade é a primeira vantagem. Onde você sente mais dificuldade?',
    4: `Tudo pronto! Tracei sua rota para ${course || 'seu curso'} na ${university || 'sua universidade'}. Vamos buscar essa vaga? 🚀`,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: '#07040f',
          border:     `1px solid ${VIOLET}50`,
          boxShadow:  `0 0 80px ${VIOLET}20, 0 0 160px ${VIOLET}08`,
        }}
      >
        {/* Top accent */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${NEON}60, transparent)` }}
        />

        <div className="p-7">
          {/* Badge */}
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
            🤖 FlashTutor · Setup Inicial
          </p>

          <Dots step={step} />
          <TutorBubble msg={tutorMsgs[step]} />

          {/* ── Step 1: O Alvo ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  Curso dos Sonhos *
                </label>
                <input
                  autoFocus
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="Ex: Medicina, Direito, Engenharia..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                  style={{
                    background:   'rgba(255,255,255,0.05)',
                    border:       `1px solid ${course.length > 1 ? VIOLET + '70' : 'rgba(255,255,255,0.12)'}`,
                    caretColor:   VIOLET,
                  }}
                  onKeyDown={e => e.key === 'Enter' && canProceed1 && setStep(2)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  Universidade dos Sonhos
                </label>
                <input
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="Ex: USP, UFPE, UNICAMP..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border:     `1px solid ${university.length > 1 ? VIOLET + '70' : 'rgba(255,255,255,0.12)'}`,
                    caretColor: VIOLET,
                  }}
                  onKeyDown={e => e.key === 'Enter' && canProceed1 && setStep(2)}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: O Ritmo ── */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              {([25, 50, 75, 100] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between transition-all duration-200"
                  style={
                    goal === g
                      ? { background: `${VIOLET}20`, border: `1px solid ${VIOLET}70`, boxShadow: `0 0 16px ${VIOLET}25` }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }
                  }
                >
                  <span className="font-bold text-sm text-white">{GOAL_LABELS[g].label}</span>
                  {goal === g && (
                    <span className="text-xs" style={{ color: NEON }}>✓</span>
                  )}
                </button>
              ))}
              <p className="text-xs text-center mt-1 font-semibold" style={{ color: NEON }}>
                {GOAL_LABELS[goal].msg}
              </p>
            </div>
          )}

          {/* ── Step 3: O Diagnóstico ── */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 mb-1">Selecione todas que se aplicam:</p>
              {AREAS.map(area => {
                const selected = difficulties.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-all duration-200"
                    style={
                      selected
                        ? { background: `${VIOLET}20`, border: `1px solid ${VIOLET}70` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }
                    }
                  >
                    <span className="text-xl">{area.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white">{area.label}</p>
                      <p className="text-xs text-slate-500">{area.sub}</p>
                    </div>
                    {selected && <span className="text-sm" style={{ color: NEON }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 4: O Pacto ── */}
          {step === 4 && (
            <div className="flex flex-col gap-3">
              {/* Summary */}
              <div
                className="rounded-2xl px-4 py-4 flex flex-col gap-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Row label="Curso" value={course || '—'} />
                <Row label="Universidade" value={university || '—'} />
                <Row label="Meta Diária" value={`${goal} cards/dia`} />
                <Row
                  label="Dificuldades"
                  value={difficulties.length > 0 ? difficulties.join(', ') : 'Nenhuma selecionada'}
                />
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border:     '1px solid rgba(255,255,255,0.10)',
                  color:      'rgba(255,255,255,0.50)',
                }}
              >
                ← Voltar
              </button>
            )}

            <button
              onClick={() => step < 4 ? setStep(s => s + 1) : finish()}
              disabled={(step === 1 && !canProceed1) || saving}
              className="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40"
              style={{
                background: step === 4
                  ? `linear-gradient(135deg, ${NEON}, #059669)`
                  : `linear-gradient(135deg, ${VIOLET}, #6d28d9)`,
                boxShadow: step === 4 ? `0 0 24px ${NEON}40` : `0 0 20px ${VIOLET}40`,
              }}
            >
              {saving ? 'Salvando…' : step === 4 ? '🚀 Bora Aprovar!' : 'Continuar →'}
            </button>
          </div>

          {/* Skip */}
          {step < 4 && (
            <button
              onClick={() => setStep(4)}
              className="w-full mt-3 text-xs text-center transition-opacity hover:opacity-100"
              style={{ color: 'rgba(255,255,255,0.20)', opacity: 0.7 }}
            >
              Pular configuração
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-white text-right truncate">{value}</span>
    </div>
  );
}
