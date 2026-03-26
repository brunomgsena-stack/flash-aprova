'use client';

import { useEffect, useState } from 'react';
import { useRouter }            from 'next/navigation';
import { supabase }             from '@/lib/supabaseClient';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#10B981';

// ─── Quiz data ────────────────────────────────────────────────────────────────

const OBJETIVOS = [
  { id: 'enem',       icon: '🎓', label: 'ENEM',                    sub: 'Quero passar no ENEM' },
  { id: 'vestibular', icon: '🏛️', label: 'Vestibular Específico',   sub: 'FUVEST, UNICAMP, UFPE...' },
  { id: 'concurso',   icon: '⚖️', label: 'Concurso Público',        sub: 'TRT, Receita, PRF...' },
];

const CURSOS = [
  { id: 'Medicina',         icon: '🩺', label: 'Medicina / Odonto' },
  { id: 'Direito',          icon: '⚖️', label: 'Direito' },
  { id: 'Engenharia',       icon: '⚙️', label: 'Engenharia' },
  { id: 'Administração',    icon: '📊', label: 'Administração / Economia' },
  { id: 'Humanas',          icon: '🏛️', label: 'Humanas / Sociais' },
  { id: 'Outro',            icon: '✏️', label: 'Outro curso...' },
];

const DIFICULDADES = [
  { id: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza', sub: 'Biologia, Física, Química' },
  { id: 'Humanas',    icon: '🏛️', label: 'Ciências Humanas',    sub: 'História, Geografia, Filosofia' },
  { id: 'Linguagens', icon: '📚', label: 'Linguagens',           sub: 'Português, Literatura, Artes' },
  { id: 'Matemática', icon: '📐', label: 'Matemática',           sub: 'Álgebra, Geometria, Estatística' },
];

const METAS = [
  { id: 25,  label: '25 cards',  sub: 'Constância acima de tudo ⚡' },
  { id: 50,  label: '50 cards',  sub: 'Equilíbrio perfeito 🎯' },
  { id: 75,  label: '75 cards',  sub: 'Gás total! ☕🔥' },
  { id: 100, label: '100 cards', sub: 'Modo aprovação 💀' },
];

const AI_MSGS = [
  'Calculando pesos por área do ENEM...',
  'Mapeando lacunas críticas para seu curso...',
  'Aplicando metodologia 80/20...',
  'Gerando cronograma personalizado...',
  'Plano quase pronto...',
];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: VIOLET }}>
          Pergunta {step} de {total}
        </span>
        <span className="text-xs text-slate-500">{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:      `${(step / total) * 100}%`,
            background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
            boxShadow:  `0 0 8px ${NEON}60`,
          }}
        />
      </div>
    </div>
  );
}

// ─── AI Loading screen ───────────────────────────────────────────────────────
function AiLoader({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: `${VIOLET}18`,
            border:     `1px solid ${VIOLET}40`,
            boxShadow:  `0 0 60px ${VIOLET}30`,
          }}
        >
          🧠
        </div>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border:           '2px solid transparent',
            borderTopColor:   VIOLET,
            borderRightColor: NEON,
            animation:        'spin 1s linear infinite',
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl mb-3">
          IA gerando seu plano de estudos...
        </p>
        <p className="text-sm font-mono transition-all duration-300" style={{ color: NEON }}>
          {msg}
          <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
        </p>
      </div>
      <div className="w-64 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
            animation:  'fill 4s ease-out forwards',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,          setStep]          = useState(1);
  const [objetivo,      setObjetivo]      = useState('');
  const [curso,         setCurso]         = useState('');
  const [cursoCustom,   setCursoCustom]   = useState('');
  const [universidade,  setUniversidade]  = useState('');
  const [dificuldades,  setDificuldades]  = useState<string[]>([]);
  const [meta,          setMeta]          = useState(50);
  const [loading,       setLoading]       = useState(false);
  const [aiMsg,         setAiMsg]         = useState(AI_MSGS[0]);
  const [error,         setError]         = useState('');

  // ── Auth guard (if already setup, go to dashboard) ────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      if (user.user_metadata?.onboarding_completed === true) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  // ── AI msg rotation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % AI_MSGS.length;
      setAiMsg(AI_MSGS[i]);
    }, 900);
    return () => clearInterval(t);
  }, [loading]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function toggleDiff(id: string) {
    setDificuldades(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id],
    );
  }

  function next() { setStep(s => s + 1); }

  async function finish(finalMeta: number) {
    setLoading(true);
    setError('');

    const cursoFinal = curso === 'Outro' ? (cursoCustom.trim() || 'Outro') : curso;

    try {
      const res = await fetch('/api/onboarding/generate-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          objetivo,
          curso:        cursoFinal,
          universidade: universidade.trim() || null,
          dificuldades,
          metaDiaria:   finalMeta,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Refresh JWT so middleware sees onboarding_completed = true
      await supabase.auth.refreshSession();
      router.push('/dashboard');
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Erro ao gerar plano. Tente novamente.');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen px-4 py-12 sm:px-8 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${VIOLET}08 1px, transparent 1px), linear-gradient(90deg, ${VIOLET}08 1px, transparent 1px)`,
          backgroundSize:  '48px 48px',
        }}
      />

      <div className="relative w-full max-w-lg" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-emerald-400 text-sm font-bold tracking-widest uppercase mb-1">FlashAprova</p>
          <h1 className="text-2xl font-black text-white">Configurando sua rota de aprovação</h1>
          <p className="text-slate-500 text-sm mt-1">5 perguntas · menos de 1 minuto</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7 relative overflow-hidden"
          style={{
            background: 'rgba(7,4,15,0.95)',
            border:     `1px solid ${VIOLET}35`,
            boxShadow:  `0 0 80px ${VIOLET}12`,
          }}
        >
          {/* Top accent */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${NEON}60, transparent)` }}
          />

          {loading ? (
            <AiLoader msg={aiMsg} />
          ) : (
            <div key={step} style={{ animation: 'fadeUp 0.25s ease-out' }}>
              <ProgressBar step={step} total={5} />

              {/* ── Q1: Objetivo ── */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Qual é o seu objetivo principal?</h2>
                  <p className="text-slate-500 text-sm mb-6">Vamos calibrar seu plano para o alvo certo.</p>
                  <div className="flex flex-col gap-3">
                    {OBJETIVOS.map(o => (
                      <button
                        key={o.id}
                        onClick={() => { setObjetivo(o.id); next(); }}
                        className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                          background: objetivo === o.id ? `${VIOLET}20` : 'rgba(255,255,255,0.04)',
                          border:     `1px solid ${objetivo === o.id ? VIOLET + '60' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <span className="text-3xl">{o.icon}</span>
                        <div>
                          <p className="text-white font-bold text-base">{o.label}</p>
                          <p className="text-slate-500 text-xs">{o.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Q2: Curso ── */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Qual curso você sonha?</h2>
                  <p className="text-slate-500 text-sm mb-6">Isso define o peso de cada área no seu plano.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CURSOS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCurso(c.id);
                          if (c.id !== 'Outro') next();
                        }}
                        className="flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                          background: curso === c.id ? `${VIOLET}20` : 'rgba(255,255,255,0.04)',
                          border:     `1px solid ${curso === c.id ? VIOLET + '60' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <span className="text-white font-semibold text-sm leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  {curso === 'Outro' && (
                    <div className="mt-4 flex gap-2">
                      <input
                        autoFocus
                        value={cursoCustom}
                        onChange={e => setCursoCustom(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && cursoCustom.trim() && next()}
                        placeholder="Qual curso? Ex: Psicologia, Pedagogia..."
                        className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
                        style={{
                          background:  'rgba(255,255,255,0.05)',
                          border:      `1px solid ${VIOLET}50`,
                          caretColor:  VIOLET,
                        }}
                      />
                      <button
                        onClick={() => cursoCustom.trim() && next()}
                        disabled={!cursoCustom.trim()}
                        className="px-4 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-30"
                        style={{ background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)` }}
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Q3: Universidade ── */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Qual universidade você quer?</h2>
                  <p className="text-slate-500 text-sm mb-6">Opcional — mas ajuda a personalizar ainda mais.</p>
                  <input
                    autoFocus
                    value={universidade}
                    onChange={e => setUniversidade(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && next()}
                    placeholder="Ex: USP, UNICAMP, UFPE, ITA..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border:     `1px solid rgba(255,255,255,0.12)`,
                      caretColor: VIOLET,
                    }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={next}
                      className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                      Pular →
                    </button>
                    <button
                      onClick={next}
                      className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)` }}
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Q4: Dificuldades ── */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Onde você sente mais dificuldade?</h2>
                  <p className="text-slate-500 text-sm mb-6">Selecione todas que se aplicam. Honestidade = vantagem.</p>
                  <div className="flex flex-col gap-3 mb-6">
                    {DIFICULDADES.map(d => {
                      const sel = dificuldades.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleDiff(d.id)}
                          className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150"
                          style={{
                            background: sel ? `${VIOLET}20` : 'rgba(255,255,255,0.04)',
                            border:     `1px solid ${sel ? VIOLET + '60' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <span className="text-2xl">{d.icon}</span>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">{d.label}</p>
                            <p className="text-slate-500 text-xs">{d.sub}</p>
                          </div>
                          {sel && <span className="text-xs font-bold" style={{ color: NEON }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={next}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)`, boxShadow: `0 0 20px ${VIOLET}40` }}
                  >
                    Continuar →
                  </button>
                </div>
              )}

              {/* ── Q5: Meta diária ── */}
              {step === 5 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Qual seu ritmo diário?</h2>
                  <p className="text-slate-500 text-sm mb-6">Constância bate maratona. Escolha o que você consegue manter.</p>
                  <div className="flex flex-col gap-3">
                    {METAS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMeta(m.id); finish(m.id); }}
                        className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                          background: meta === m.id ? `${NEON}18` : 'rgba(255,255,255,0.04)',
                          border:     `1px solid ${meta === m.id ? NEON + '50' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <div className="text-left">
                          <p className="text-white font-black text-base">{m.label}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{m.sub}</p>
                        </div>
                        <span className="text-2xl">
                          {m.id === 25 ? '⚡' : m.id === 50 ? '🎯' : m.id === 75 ? '🔥' : '💀'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {error && (
                    <p className="text-red-400 text-xs text-center mt-4">{error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back button */}
        {!loading && step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="mt-4 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Voltar
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fill    { from { width: 0; } to { width: 100%; } }
        @keyframes blink   { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
