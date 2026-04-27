'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams }        from 'next/navigation';
import DashboardBootUp                       from '@/components/DashboardBootUp';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const EMERALD = '#10B981';
const VIOLET  = '#8B5CF6';
const CYAN    = '#06b6d4';
const MONO    = '"JetBrains Mono", monospace';

// ─── Tour step type ──────────────────────────────────────────────────────────
type TourStep = {
  targetId:     string;
  emoji:        string;
  title:        string;
  description:  string;
  color:        string;
  isFinal?:     boolean;
  isOverlay?:   boolean;         // full-screen overlay instead of element highlight
  navigateTo?:  string;          // cross-page navigation
  scrollBlock?: ScrollLogicalPosition;
};

// ─── Tour steps ─────────────────────────────────────────────────────────────
const STEPS: TourStep[] = [
  // 1 — Copiloto (dashboard)
  {
    targetId:    'tour-copilot',
    emoji:       '💡',
    title:       'Seu Copiloto',
    description: 'Ele analisa seu progresso e sugere o que estudar hoje. Veja os botões abaixo para o Relatório de Progresso e o Cronograma IA.',
    color:       EMERALD,
  },
  // 2 — Relatório de Progresso (botão dentro do copiloto)
  {
    targetId:    'tour-report-btn',
    emoji:       '📊',
    title:       'Relatório de Progresso',
    description: 'Diagnóstico semanal completo: afinidade com o curso, pirâmide de retenção, meta do dia e análise de performance por área.',
    color:       EMERALD,
  },
  // 3 — Cronograma IA (botão dentro do copiloto)
  {
    targetId:    'tour-schedule-btn',
    emoji:       '🗓️',
    title:       'Cronograma IA',
    description: 'O FlashTutor monta seu cronograma semanal automático com base nas suas áreas fracas, cards pendentes e horas de estudo.',
    color:       EMERALD,
  },
  // 4 — Frentes de Ataque (dashboard)
  {
    targetId:    'tour-areas',
    emoji:       '⚡',
    title:       'Frentes de Ataque',
    description: 'Siga a sugestão do FlashTutor para uma sessão turbo automática, ou clique em qualquer área para ir direto ao deck.',
    color:       EMERALD,
  },
  // 5 — Radar ENEM (gráfico radar)
  {
    targetId:    'tour-radar',
    emoji:       '📊',
    title:       'Radar ENEM',
    description: 'Seu diagnóstico visual por área. Cada sessão de estudo melhora a cobertura automaticamente.',
    color:       CYAN,
  },
  // 6 — Previsão de Revisão (gráfico de retenção)
  {
    targetId:    'tour-retention',
    emoji:       '📈',
    title:       'Previsão de Revisão',
    description: 'Quantos cards vencem por dia nos próximos 7 dias. Use para planejar suas sessões e não acumular revisões.',
    color:       EMERALD,
  },
  // 7 — Foco Aprovação (card com sessão focada + heatmap + arsenal)
  {
    targetId:    'tour-foco',
    emoji:       '🎯',
    title:       'Foco Aprovação',
    description: 'Sessão focada por área, heatmap de constância e arsenal de revisão. Seu painel tático para a aprovação.',
    color:       EMERALD,
  },
  // 8 — Meu Mentor IA (card de insights no dashboard)
  {
    targetId:    'tour-mentor',
    emoji:       '🧠',
    title:       'Meu Mentor IA',
    description: 'Insights personalizados do FlashTutor: sugestão de estudo do dia, micro-KPIs de performance e relatório profundo com análise completa.',
    color:       CYAN,
  },
  // 9 — Suas Matérias (lista de matérias)
  {
    targetId:    'tour-subjects',
    emoji:       '📚',
    title:       'Suas Matérias',
    description: 'Todas as matérias do ENEM organizadas por área. Clique em qualquer uma para estudar deck a deck. Redação com IA fica aqui também.',
    color:       VIOLET,
    scrollBlock: 'start',
  },
  // 10 — Tutor Especialista (dentro de um deck)
  {
    targetId:    'tour-tutor-chat',
    emoji:       '💬',
    title:       'Tutor Especialista',
    description: 'Dentro de cada deck, você tem um tutor IA especialista na matéria. Pergunte qualquer dúvida e ele responde na hora.',
    color:       VIOLET,
    navigateTo:  '/dashboard/deck/__FIRST_DECK__/pre-study',
  },
  // 11 — Corretor de Redação (página de redação)
  {
    targetId:    'tour-redacao',
    emoji:       '✒️',
    title:       'Corretor de Redação',
    description: 'Escreva sua redação, envie para a Norma.AI e receba nota detalhada nas 5 competências do ENEM com feedback e sugestões de melhoria.',
    color:       CYAN,
    navigateTo:  '/dashboard/content/redacao',
    scrollBlock: 'start',
  },
  // 12 — Instalar PWA
  {
    targetId:    '',
    emoji:       '📱',
    title:       'Instale o App',
    description: '',
    color:       EMERALD,
    isFinal:     true,
    isOverlay:   true,
  },
];

const HIGHLIGHT_CLASS = 'tour-highlight';
const LS_KEY = 'fa-tour';

// ─── localStorage helpers ────────────────────────────────────────────────────

function saveTour(step: number) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ step, ts: Date.now() })); } catch {}
}
function loadTour(): number | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { step, ts } = JSON.parse(raw);
    // Expire after 10 min to avoid stale tours
    if (Date.now() - ts > 10 * 60 * 1000) { localStorage.removeItem(LS_KEY); return null; }
    return typeof step === 'number' ? step : null;
  } catch { return null; }
}
function clearTour() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ─── Resolve dynamic deck placeholder ────────────────────────────────────────

async function resolveFirstDeckId(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data } = await supabase
      .from('decks')
      .select('id')
      .limit(1)
      .single();
    return data?.id ?? null;
  } catch { return null; }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardTour() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [active,      setActive]      = useState(false);
  const [showIntro,   setShowIntro]   = useState(false);
  const [showBootUp,  setShowBootUp]  = useState(false);
  const [step,        setStep]        = useState(0);
  const [firstDeckId, setFirstDeckId] = useState<string | null>(null);

  // Resolve first deck id on mount (for tutor step)
  useEffect(() => {
    resolveFirstDeckId().then(setFirstDeckId);
  }, []);

  // Activate tour — from URL param OR resumed from localStorage
  useEffect(() => {
    const saved = loadTour();
    if (saved !== null) {
      // Resuming after cross-page navigation
      const t = setTimeout(() => { setStep(saved); setActive(true); }, 800);
      return () => clearTimeout(t);
    }
    if (searchParams.get('tour') === '1') {
      const t = setTimeout(() => setShowIntro(true), 800);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // Persist step to localStorage whenever it changes
  useEffect(() => {
    if (active) saveTour(step);
  }, [active, step]);

  // Scroll to target + highlight
  useEffect(() => {
    if (!active) return;

    const s = STEPS[step];
    if (!s || s.isOverlay) return;

    // Remove previous highlights
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el =>
      el.classList.remove(HIGHLIGHT_CLASS)
    );

    const el = document.getElementById(s.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: s.scrollBlock ?? 'center' });
      // Add highlight after scroll settles
      setTimeout(() => el.classList.add(HIGHLIGHT_CLASS), 400);
    }

    return () => {
      el?.classList.remove(HIGHLIGHT_CLASS);
    };
  }, [active, step]);

  const cleanUp = useCallback(() => {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el =>
      el.classList.remove(HIGHLIGHT_CLASS)
    );
    setActive(false);
    clearTour();
  }, []);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      const nextStep = step + 1;
      const next = STEPS[nextStep];

      // If the next step requires navigation to another page
      if (next.navigateTo) {
        let url = next.navigateTo;
        // Replace dynamic deck placeholder
        if (url.includes('__FIRST_DECK__')) {
          if (!firstDeckId) {
            // Skip this step if no deck available
            setStep(nextStep + 1 < STEPS.length ? nextStep + 1 : step);
            return;
          }
          url = url.replace('__FIRST_DECK__', firstDeckId);
        }
        saveTour(nextStep);
        router.push(url);
        return;
      }

      setStep(nextStep);
    } else {
      // Tour done — show boot-up animation
      cleanUp();
      setShowBootUp(true);
    }
  }, [step, router, firstDeckId, cleanUp]);

  const handleSkip = useCallback(() => {
    setShowIntro(false);
    cleanUp();
    router.replace('/dashboard', { scroll: false });
  }, [router, cleanUp]);

  const handleStartTour = useCallback(() => {
    setShowIntro(false);
    setActive(true);
    setStep(0);
  }, []);

  const handleBootUpComplete = useCallback(() => {
    setShowBootUp(false);
    router.replace('/dashboard', { scroll: false });
  }, [router]);

  if (!active && !showIntro && !showBootUp) return null;

  if (showBootUp) {
    return <DashboardBootUp onComplete={handleBootUpComplete} />;
  }

  if (showIntro) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: 'rgba(5,11,20,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full">
          <span style={{ fontSize: 52, lineHeight: 1 }}>🧭</span>
          <div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              Vamos conhecer seu painel de guerra?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Um tour rápido de 2 minutos pelo seu arsenal de estudos.
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${EMERALD}18`, border: `1px solid ${EMERALD}40`, color: EMERALD, fontFamily: MONO }}
          >
            {STEPS.length} etapas
          </div>
          <button
            onClick={handleStartTour}
            className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${EMERALD}, #059669)`, boxShadow: `0 0 24px ${EMERALD}40` }}
          >
            Iniciar Tour
          </button>
          <button
            onClick={handleSkip}
            className="text-xs transition-all hover:brightness-150"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Pular tour
          </button>
        </div>
      </div>
    );
  }

  const s = STEPS[step];

  // ── PWA overlay (step isOverlay) ──────────────────────────────────────────
  if (s.isOverlay) {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS     = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    const pwaSteps = isIOS
      ? [
          { icon: '1.', text: 'Abra este site no Safari (não Chrome)' },
          { icon: '2.', text: 'Toque no botão Compartilhar ⬆️ na barra inferior' },
          { icon: '3.', text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
          { icon: '4.', text: 'Toque em "Adicionar" no canto superior direito' },
        ]
      : isAndroid
      ? [
          { icon: '1.', text: 'Toque no menu ⋮ no canto superior direito do Chrome' },
          { icon: '2.', text: 'Toque em "Adicionar à tela inicial"' },
          { icon: '3.', text: 'Confirme tocando em "Adicionar"' },
        ]
      : [
          { icon: '1.', text: 'No Chrome, clique no ícone ⊕ na barra de endereço' },
          { icon: '2.', text: 'Ou clique em ⋮ → "Instalar FlashAprova"' },
        ];

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ background: 'rgba(5,11,20,0.96)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        {/* Dots + skip */}
        <div className="absolute top-6 inset-x-0 flex items-center justify-between px-6">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === step ? 18 : 6,
                  height:     6,
                  background: i === step ? EMERALD : i < step ? `${EMERALD}60` : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-xs transition-all hover:brightness-150"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Pular
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full">
          <span style={{ fontSize: 52, lineHeight: 1 }}>📱</span>
          <div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              Instale o App na Tela Inicial
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Acesse mais rápido, sem abrir o navegador. Funciona offline também.
            </p>
          </div>

          {/* Step-by-step instructions */}
          <div className="w-full flex flex-col gap-2.5 text-left">
            {pwaSteps.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: `${EMERALD}0A`, border: `1px solid ${EMERALD}22` }}
              >
                <span
                  className="shrink-0 font-black text-xs mt-0.5"
                  style={{ color: EMERALD, fontFamily: MONO, minWidth: 16 }}
                >
                  {item.icon}
                </span>
                <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${EMERALD}, #059669)`, boxShadow: `0 0 24px ${EMERALD}40` }}
          >
            Começar a usar o app →
          </button>

          {/* Step counter */}
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: MONO }}>
            {step + 1} de {STEPS.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global highlight styles */}
      <style>{`
        .${HIGHLIGHT_CLASS} {
          position: relative;
          z-index: 10;
          outline: 2px solid ${s.color}88 !important;
          outline-offset: 4px;
          border-radius: 16px;
          box-shadow: 0 0 30px ${s.color}30, 0 0 60px ${s.color}10 !important;
          transition: outline-color 0.3s, box-shadow 0.3s;
        }
      `}</style>

      {/* Floating tour card */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 px-4 pb-6 pt-2 pointer-events-none"
        style={{
          background: 'linear-gradient(transparent, rgba(5,11,20,0.95) 30%)',
        }}
      >
        <div
          className="pointer-events-auto w-full max-w-lg mx-auto rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background:     'rgba(20,25,40,0.97)',
            backdropFilter: 'blur(20px)',
            border:         `1px solid ${s.color}40`,
            boxShadow:      `0 -4px 30px ${s.color}20, 0 0 60px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:      i === step ? 18 : 6,
                    height:     6,
                    background: i === step ? s.color : i < step ? `${s.color}60` : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-xs transition-all hover:brightness-150"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              Pular tour
            </button>
          </div>

          {/* Content */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}
            >
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white mb-0.5">{s.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {s.description}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-black text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)`,
              boxShadow:  `0 0 20px ${s.color}40`,
            }}
          >
            {s.isFinal ? 'Começar a usar o app →' : `Próximo: ${STEPS[step + 1]?.title} →`}
          </button>

          {/* Step counter */}
          <p className="text-center" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: MONO }}>
            {step + 1} de {STEPS.length}
          </p>
        </div>
      </div>
    </>
  );
}
