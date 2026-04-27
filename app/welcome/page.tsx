'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabaseClient';
import ConfettiEffect          from '@/components/ConfettiEffect';

// ─── Design tokens ─────────────────────────────────────────────────────────
const EMERALD = '#10B981';
const VIOLET  = '#8B5CF6';
const CYAN    = '#06b6d4';
const AMBER   = '#F59E0B';
const MONO    = '"JetBrains Mono", monospace';

type AiPlan = {
  prioridades: Array<{ area: string; peso: number; motivo: string }>;
  semanas: Array<{
    numero: number;
    tema: string;
    modulos: Array<{ area: string; topicos: string[]; cards_sugeridos: number; prioridade: string }>;
  }>;
};

type Profile = {
  target_course:      string | null;
  difficulty_subjects: string[] | null;
  daily_card_goal:    number | null;
  ai_study_plan:      AiPlan | null;
  full_name:          string | null;
};

const COURSE_EMOJIS: Record<string, string> = {
  medicina:   '🩺',
  psicologia: '🧠',
  direito:    '⚖️',
  saude:      '🏥',
  exatas:     '📐',
};

const PRIORIDADE_COLOR: Record<string, string> = {
  alta:   EMERALD,
  media:  CYAN,
  baixa:  VIOLET,
};

// ─── Cálculo de tempo: 10 flashcards = 1 minuto ───────────────────────────────
function minsForCards(n: number) {
  return Math.max(1, Math.round(n / 10));
}

function firstName(raw: string | null | undefined) {
  if (!raw) return '';
  return raw.trim().split(/\s+/)[0];
}

// ─── Week Card ─────────────────────────────────────────────────────────────

function WeekCard({ semana }: { semana: AiPlan['semanas'][0] }) {
  const color = semana.numero <= 2 ? EMERALD : CYAN;
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: `${color}0A`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-black rounded-full px-2 py-0.5"
          style={{ background: `${color}20`, color, fontFamily: MONO }}
        >
          Semana {semana.numero}
        </span>
        <span className="text-sm font-bold text-white truncate">{semana.tema}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {semana.modulos.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${PRIORIDADE_COLOR[m.prioridade] ?? VIOLET}15`,
                color:       PRIORIDADE_COLOR[m.prioridade] ?? VIOLET,
                border:      `1px solid ${PRIORIDADE_COLOR[m.prioridade] ?? VIOLET}30`,
              }}
            >
              {m.area} · {m.cards_sugeridos} cards
            </span>
          </div>
        ))}
      </div>
      {semana.modulos[0]?.topicos?.slice(0, 2).map((t, i) => (
        <p key={i} className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          · {t}
        </p>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('target_course, difficulty_subjects, daily_card_goal, ai_study_plan, full_name, first_session_completed')
        .eq('id', user.id)
        .maybeSingle();

      // If already did first session, go to dashboard
      if (data?.first_session_completed === true) {
        router.push('/dashboard');
        return;
      }

      setProfile(data as Profile | null);
      setLoading(false);
      setShowConfetti(true);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: VIOLET, borderTopColor: 'transparent' }}
        />
      </main>
    );
  }

  const plan      = profile?.ai_study_plan;
  const name      = firstName(profile?.full_name);
  const course    = profile?.target_course ?? '';
  const emoji     = COURSE_EMOJIS[course] ?? '🎓';
  const difficulty = profile?.difficulty_subjects?.[0] ?? null;
  const dailyGoal = profile?.daily_card_goal ?? 50;
  const dailyMins = minsForCards(dailyGoal);

  return (
    <main
      className="min-h-screen px-4 py-12 flex flex-col items-center"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      {showConfetti && <ConfettiEffect />}

      <div className="w-full max-w-lg flex flex-col gap-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center flex flex-col items-center gap-3">
          {/* Trophy */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: `radial-gradient(circle, ${EMERALD}20, ${EMERALD}08)`,
              border:     `2px solid ${EMERALD}50`,
              boxShadow:  `0 0 40px ${EMERALD}30, 0 0 80px ${EMERALD}10`,
            }}
          >
            🎯
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: EMERALD }}>
              Plano criado com sucesso
            </p>
            <h1 className="text-3xl font-black text-white leading-tight">
              {name ? `${name}, seu plano` : 'Seu plano'}{' '}
              <span style={{ color: EMERALD }}>está pronto!</span>
            </h1>
            {course && (
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {emoji} Rota personalizada para <span className="text-white font-semibold capitalize">{course}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Meta diária ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: `${VIOLET}10`,
            border:     `1px solid ${VIOLET}30`,
            boxShadow:  `0 0 24px ${VIOLET}12`,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${VIOLET}20`, border: `1px solid ${VIOLET}40` }}
          >
            ⚡
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>Sua meta diária</p>
            <p className="text-white font-black text-lg leading-tight">
              <span style={{ color: VIOLET }}>{dailyGoal} cards</span>
              <span className="text-sm font-normal ml-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
                (~{dailyMins} min/dia)
              </span>
            </p>
            {difficulty && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Foco nas primeiras 2 semanas: <span className="text-white">{difficulty}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Plano de 4 semanas ───────────────────────────────────────── */}
        {plan?.semanas && plan.semanas.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Seu plano — 4 semanas
            </p>
            {plan.semanas.map((s) => (
              <WeekCard key={s.numero} semana={s} />
            ))}
          </div>
        )}

        {/* ── Prioridades IA ───────────────────────────────────────────── */}
        {plan?.prioridades && plan.prioridades.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Pesos para o seu curso
            </p>
            <div className="grid grid-cols-2 gap-2">
              {plan.prioridades.map((p) => (
                <div
                  key={p.area}
                  className="rounded-xl p-3 flex flex-col gap-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{p.area}</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: EMERALD, fontFamily: MONO }}>
                      {p.peso}%
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {p.motivo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            onClick={() => router.push('/welcome/first-session')}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
              boxShadow:  `0 0 30px ${EMERALD}50, 0 4px 16px rgba(0,0,0,0.4)`,
            }}
          >
            ⚡ Começar minha primeira sessão
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-2xl text-sm transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.30)', background: 'transparent' }}
          >
            Pular por agora → ir ao dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
