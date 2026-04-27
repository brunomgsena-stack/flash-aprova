'use client';

import { useEffect, useState } from 'react';
import { useRouter }            from 'next/navigation';
import { supabase }             from '@/lib/supabaseClient';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#10B981';
const CYAN   = '#06b6d4';

// ─── Quiz data ─────────────────────────────────────────────────────────────────

// Grid simétrico 2 colunas × 3 linhas — todos os cards idênticos
const CURSOS = [
  { id: 'medicina',   emoji: '🩺', label: 'Medicina',    sub: 'Foco total nos pesos de Natureza e TRI.' },
  { id: 'psicologia', emoji: '🧠', label: 'Psicologia',  sub: 'Equilíbrio entre Humanas e Biológicas.' },
  { id: 'direito',    emoji: '⚖️', label: 'Direito',     sub: 'Humanas + Redação como prioridade.' },
  { id: 'saude',      emoji: '🏥', label: 'Saúde',       sub: 'Enfermagem, Odonto, Fisioterapia e mais.' },
  { id: 'exatas',     emoji: '📐', label: 'Exatas',      sub: 'Matemática e Física no topo da estratégia.' },
  { id: 'outro',      emoji: '🎓', label: 'Outro Curso', sub: 'Me conte qual é o seu alvo.' },
];

const BASES = [
  { id: 'zero',     icon: '🌱', label: 'Começando do zero',         sub: 'Ainda não estudei muito' },
  { id: 'basico',   icon: '📖', label: 'Base básica',                sub: 'Vi o conteúdo mas esqueci bastante' },
  { id: 'medio',    icon: '📚', label: 'Base intermediária',         sub: 'Sei o básico de cada área' },
  { id: 'avancado', icon: '🚀', label: 'Base avançada',              sub: 'Só preciso de revisão estratégica' },
];

const TEMPOS = [
  { id: 2, icon: '⚡', label: '1-2h por dia',  sub: 'Estudo focado e constante' },
  { id: 4, icon: '🎯', label: '3-4h por dia',  sub: 'Ritmo equilibrado' },
  { id: 6, icon: '🔥', label: '5-6h por dia',  sub: 'Alta intensidade' },
  { id: 8, icon: '💀', label: '7h+ por dia',   sub: 'Modo vestibulando 100%' },
];

const DIFICULDADES = [
  { id: 'Matemática', icon: '📐', label: 'Matemática',           sub: 'Álgebra, Geometria, Estatística' },
  { id: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza', sub: 'Física, Química, Biologia' },
  { id: 'Humanas',    icon: '🏛️', label: 'Ciências Humanas',    sub: 'História, Geografia, Filosofia' },
  { id: 'Linguagens', icon: '📚', label: 'Linguagens',           sub: 'Português, Literatura, Inglês' },
  { id: 'Redação',    icon: '✍️', label: 'Redação',              sub: 'Estrutura, argumentação, repertório' },
];

const EXPERIENCIAS = [
  { id: 'treineiro', icon: '🏃', label: 'Treineiro',          sub: 'Ainda no ensino médio' },
  { id: 'primeira',  icon: '🎓', label: 'Primeira tentativa', sub: 'Vou fazer o ENEM pela 1ª vez' },
  { id: 'segunda',   icon: '🔁', label: 'Segunda tentativa',  sub: 'Já fiz uma vez, quero melhorar' },
  { id: 'veterano',  icon: '⚔️', label: 'Veterano',           sub: 'Já fiz 3x ou mais' },
];

const AI_MSGS = [
  'Consultando pesos do SISU para o seu curso...',
  'Analisando a TRI e distribuição de questões por área...',
  'Calculando a regra 80/20 para a sua realidade...',
  'Mapeando os temas de maior impacto na sua nota...',
  'Montando sua rota personalizada de aprovação...',
  'Ajustando o cronograma para as próximas 4 semanas...',
  'Seu plano está quase pronto...',
];

const QUESTIONS = [
  { emoji: '🎯', title: 'Qual curso você quer fazer?',           sub: 'Isso define os pesos do SISU para a sua estratégia.' },
  { emoji: '📊', title: 'Como está sua base de estudos hoje?',   sub: 'Seja honesto — isso calibra o nível do seu plano.' },
  { emoji: '⏱️', title: 'Quanto tempo você tem por dia?',        sub: 'Constância bate maratona. Escolha o que você consegue manter.' },
  { emoji: '⚡', title: 'Qual é sua maior dificuldade?',          sub: 'Vamos atacar o elo mais fraco com foco 80/20.' },
  { emoji: '🏆', title: 'Qual é a sua experiência com o ENEM?',  sub: 'Sua história importa para calibrar a estratégia.' },
];

// ─── Progress Bar ──────────────────────────────────────────────────────────────

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
          className="h-full rounded-full transition-all duration-700"
          style={{
            width:     `${(step / total) * 100}%`,
            background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
            boxShadow:  `0 0 8px ${NEON}60`,
          }}
        />
      </div>
    </div>
  );
}

// ─── AI Loader ─────────────────────────────────────────────────────────────────

function AiLoader({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-8">
      {/* Brain orb */}
      <div className="relative">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${VIOLET}40, ${VIOLET}10)`,
            border:     `1px solid ${VIOLET}50`,
            boxShadow:  `0 0 60px ${VIOLET}40, 0 0 120px ${VIOLET}15`,
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
        <div
          className="absolute rounded-full"
          style={{
            inset:            '-8px',
            border:           `1px solid ${VIOLET}20`,
            borderTopColor:   `${NEON}40`,
            animation:        'spin 3s linear infinite reverse',
          }}
        />
      </div>

      {/* Copy */}
      <div className="text-center max-w-xs">
        <p className="text-white font-black text-2xl mb-2 leading-tight">
          Montando sua rota de aprovação...
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          Nossa IA está analisando os{' '}
          <span className="font-bold" style={{ color: VIOLET }}>pesos do SISU</span>{' '}
          para o seu curso e montando sua{' '}
          <span className="font-bold" style={{ color: NEON }}>rota 80/20</span>{' '}
          personalizada.
        </p>
      </div>

      {/* Status message */}
      <div
        className="px-5 py-3 rounded-xl text-sm font-mono text-center max-w-sm w-full"
        style={{
          background: `${VIOLET}12`,
          border:     `1px solid ${VIOLET}30`,
          color:       NEON,
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-2 animate-pulse"
          style={{ background: NEON }}
        />
        {msg}
        <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
      </div>

      {/* Progress bar */}
      <div className="w-72 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
            animation:  'loadFill 7s ease-out forwards',
          }}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        {['TRI ENEM', 'Pesos SISU', '80/20', '4 Semanas', 'Personalizado'].map(tag => (
          <span
            key={tag}
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border:     '1px solid rgba(255,255,255,0.10)',
              color:      'rgba(255,255,255,0.40)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Option Button ─────────────────────────────────────────────────────────────

function OptionBtn({
  icon, label, sub, selected, onClick, accentColor = VIOLET,
}: {
  icon: string; label: string; sub: string; selected: boolean;
  onClick: () => void; accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] w-full"
      style={{
        background: selected ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
        border:     `1px solid ${selected ? accentColor + '70' : 'rgba(255,255,255,0.09)'}`,
        boxShadow:  selected ? `0 0 20px ${accentColor}25` : 'none',
      }}
    >
      <span className="text-3xl shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-white font-bold text-base leading-snug">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
      </div>
      {selected && (
        <span className="text-xs font-black shrink-0" style={{ color: accentColor }}>✓</span>
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  const [step,        setStep]        = useState(1);
  const [dir,         setDir]         = useState<'fwd' | 'bwd'>('fwd');
  const [animKey,     setAnimKey]     = useState(0);
  const [curso,       setCurso]       = useState('');
  const [cursoCustom, setCursoCustom] = useState('');
  const [base,        setBase]        = useState('');
  const [tempo,       setTempo]       = useState(4);
  const [dificuldade, setDificuldade] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [aiMsg,       setAiMsg]       = useState(AI_MSGS[0]);
  const [error,       setError]       = useState('');

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      if (user.user_metadata?.onboarding_completed === true) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  // ── AI msg rotation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % AI_MSGS.length;
      setAiMsg(AI_MSGS[i]);
    }, 900);
    return () => clearInterval(t);
  }, [loading]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function advance(next: number) {
    setDir('fwd');
    setAnimKey(k => k + 1);
    setStep(next);
  }

  // Bloqueia o "Voltar" enquanto a IA está gerando ou após a conclusão
  function back() {
    if (loading) return;
    setDir('bwd');
    setAnimKey(k => k + 1);
    setStep(s => s - 1);
  }

  // ── Finish → call API ───────────────────────────────────────────────────────
  async function finish(finalExp: string) {
    setLoading(true);
    setError('');

    // IDs dos cursos são todos lowercase; 'outro' dispara campo livre
    const cursoFinal = curso === 'outro' ? (cursoCustom.trim() || 'outro') : curso;

    try {
      // ── 1. Gera plano via API (OpenAI + upsert admin) ───────────────────────
      const res = await fetch('/api/onboarding/generate-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          curso:       cursoFinal,
          base,
          tempo,
          dificuldade,
          experiencia: finalExp,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[Setup] Erro detalhado:', body);
        throw new Error(
          body?.error ?? body?.message ?? `HTTP ${res.status} — verifique o terminal do servidor.`,
        );
      }

      console.log('[Setup] ✅ API confirmou onboarding_completed = true no banco.');

      // ── 2. RPC client-side (camada de segurança adicional) ──────────────────
      // A API já garantiu a gravação via admin client. Este RPC é redundante mas
      // mantido como fallback para o caso de o admin client ter falhado no servidor.
      const { error: rpcErr } = await supabase.rpc('complete_onboarding');
      if (rpcErr) {
        // Não é fatal — a API já gravou. Loga para diagnóstico.
        console.error('[Setup] RPC client-side falhou (non-fatal):', {
          message: rpcErr.message,
          code:    rpcErr.code,
          details: rpcErr.details,
          hint:    rpcErr.hint,
        });
      } else {
        console.log('[Setup] ✅ RPC client-side confirmado.');
      }

      // ── 3. Atualiza o JWT nos cookies e força releitura do banco ──────────
      const { error: sessionErr } = await supabase.auth.refreshSession().catch(e => ({ error: e }));
      if (sessionErr) {
        console.warn('[Setup] refreshSession falhou (non-fatal):', sessionErr);
      }

      // ── 4. Hard redirect — mata cache do Next.js e força o navegador a ────
      //       bater no banco do zero (window.location.href ignora cache de rota)
      window.location.href = '/welcome';
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Erro ao gerar plano. Tente novamente.');
    }
  }

  const q = QUESTIONS[step - 1];

  // ─── Render ────────────────────────────────────────────────────────────────
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
      {/* Ambient orbs */}
      <div className="fixed pointer-events-none" style={{ top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${VIOLET}12 0%, transparent 70%)` }} />
      <div className="fixed pointer-events-none" style={{ bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}08 0%, transparent 70%)` }} />

      <div className="relative w-full max-w-lg" style={{ zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: NEON }}>
            FlashAprova
          </p>
          <h1 className="text-2xl font-black text-white">Sua rota personalizada de aprovação</h1>
          <p className="text-slate-500 text-sm mt-1">5 perguntas · IA analisa · Plano em segundos</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7 relative overflow-hidden"
          style={{
            background: 'rgba(7,4,15,0.96)',
            border:     `1px solid ${VIOLET}35`,
            boxShadow:  `0 0 80px ${VIOLET}12, 0 32px 64px rgba(0,0,0,0.50)`,
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${NEON}60, transparent)` }}
          />

          {loading ? (
            <AiLoader msg={aiMsg} />
          ) : (
            <>
              <ProgressBar step={step} total={5} />

              {/* Animated question wrapper — key changes trigger slide */}
              <div
                key={animKey}
                style={{
                  animation: dir === 'fwd'
                    ? 'slideInRight 0.28s ease-out'
                    : 'slideInLeft 0.28s ease-out',
                }}
              >
                {/* Question header */}
                <div className="flex items-start gap-3 mb-6">
                  <span className="text-4xl mt-0.5 shrink-0">{q.emoji}</span>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">{q.title}</h2>
                    <p className="text-slate-500 text-sm mt-0.5">{q.sub}</p>
                  </div>
                </div>

                {/* ── Q1: Curso — grid simétrico 2×3 ── */}
                {step === 1 && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      {CURSOS.map(({ id, emoji, label, sub }) => {
                        const sel = curso === id;
                        return (
                          <button
                            key={id}
                            onClick={() => { setCurso(id); if (id !== 'outro') advance(2); }}
                            className="flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
                            style={{
                              background: sel ? `${VIOLET}22` : 'rgba(255,255,255,0.04)',
                              border:     `1px solid ${sel ? VIOLET + '70' : 'rgba(255,255,255,0.09)'}`,
                              boxShadow:  sel ? `0 0 20px ${VIOLET}25` : 'none',
                            }}
                          >
                            <span className="text-3xl">{emoji}</span>
                            <div>
                              <p className="text-white font-bold text-sm leading-snug">{label}</p>
                              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Campo livre para "Outro Curso" */}
                    {curso === 'outro' && (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={cursoCustom}
                          onChange={e => setCursoCustom(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && cursoCustom.trim() && advance(2)}
                          placeholder="Qual curso? Ex: Nutrição, Arquitetura..."
                          className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border:     `1px solid ${VIOLET}50`,
                            caretColor: VIOLET,
                          }}
                        />
                        <button
                          onClick={() => cursoCustom.trim() && advance(2)}
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

                {/* ── Q2: Base ── */}
                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    {BASES.map(b => (
                      <OptionBtn
                        key={b.id}
                        icon={b.icon} label={b.label} sub={b.sub}
                        selected={base === b.id}
                        onClick={() => { setBase(b.id); advance(3); }}
                      />
                    ))}
                  </div>
                )}

                {/* ── Q3: Tempo ── */}
                {step === 3 && (
                  <div className="flex flex-col gap-3">
                    {TEMPOS.map(t => (
                      <OptionBtn
                        key={t.id}
                        icon={t.icon} label={t.label} sub={t.sub}
                        selected={tempo === t.id}
                        onClick={() => { setTempo(t.id); advance(4); }}
                      />
                    ))}
                  </div>
                )}

                {/* ── Q4: Dificuldade ── */}
                {step === 4 && (
                  <div className="flex flex-col gap-3">
                    {DIFICULDADES.map(d => (
                      <OptionBtn
                        key={d.id}
                        icon={d.icon} label={d.label} sub={d.sub}
                        selected={dificuldade === d.id}
                        accentColor={VIOLET}
                        onClick={() => { setDificuldade(d.id); advance(5); }}
                      />
                    ))}
                  </div>
                )}

                {/* ── Q5: Experiência ── */}
                {step === 5 && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      {EXPERIENCIAS.map(e => (
                        <button
                          key={e.id}
                          onClick={() => { setExperiencia(e.id); finish(e.id); }}
                          className="flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
                          style={{
                            background: experiencia === e.id ? `${NEON}18` : 'rgba(255,255,255,0.04)',
                            border:     `1px solid ${experiencia === e.id ? NEON + '50' : 'rgba(255,255,255,0.09)'}`,
                            boxShadow:  experiencia === e.id ? `0 0 20px ${NEON}20` : 'none',
                          }}
                        >
                          <span className="text-2xl">{e.icon}</span>
                          <div>
                            <p className="text-white font-bold text-sm leading-snug">{e.label}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{e.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {error && (
                      <p className="text-red-400 text-xs text-center mt-4">{error}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Back button */}
        {!loading && step > 1 && (
          <button
            onClick={back}
            className="mt-4 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Voltar
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes blink        { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes loadFill     { from { width: 0; } to { width: 100%; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(36px);  } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
