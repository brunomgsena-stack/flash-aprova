'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const CYAN   = '#06b6d4';
const VIOLET = '#7C3AED';

// ─── CountUp hook ─────────────────────────────────────────────────────────────
function useCountUp(
  target: number,
  durationMs: number,
  started: boolean,
  delayMs = 0,
  fastEase = true,
): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf: number;
    const timer = setTimeout(() => {
      let t0: number | null = null;
      function tick(ts: number) {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / durationMs, 1);
        // fastEase: cubic ease-out (snappy 97%); slow: quad ease-in-out (laboured 40%)
        const e = fastEase
          ? 1 - Math.pow(1 - p, 3)
          : p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setVal(Math.round(e * target));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setVal(target);
      }
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [started, target, durationMs, delayMs, fastEase]);
  return val;
}

// ─── Stagger variants ─────────────────────────────────────────────────────────
// Cast bezier tuples to satisfy strict Variants type
type AnyEase = [number, number, number, number];
const SWIFT: AnyEase = [0.22, 1, 0.36, 1];

const listWrap: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.10, delayChildren: 0.20 } },
};

const rowAnki: Variants = {
  hidden:  { opacity: 0, x: -14 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: SWIFT as any } },
};

const rowFlash: Variants = {
  hidden:  { opacity: 0, x: 14, scale: 0.94 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.40, ease: SWIFT as any } },
};

// Spring-pop for the 🧠🎯📚 icons — natural overshoot without keyframe arrays
const iconPop: Variants = {
  hidden:  { scale: 0, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { type: 'spring', stiffness: 420, damping: 13, mass: 0.6 },
  },
};

// ─── AnkiComparison ───────────────────────────────────────────────────────────
export default function AnkiComparison() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapRef, { once: true, margin: '-80px' });

  // 40 %: slow quad ease-in-out, 300 ms delay
  const ankiPct  = useCountUp(40,  1200, isInView, 300,  false);
  // 97 %: fast cubic ease-out (spring feel), 500 ms delay
  const flashPct = useCountUp(97,  750,  isInView, 500,  true);

  const [ankiHover,  setAnkiHover]  = useState(false);
  const [flashHover, setFlashHover] = useState(false);

  return (
    <div ref={wrapRef} className="relative">

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes anki-glitch {
          0%, 88%, 100% { opacity: 1;    transform: translate(0,0)   skewX(0deg);   }
          89%            { opacity: 0.82; transform: translate(-3px,0) skewX(-0.6deg); }
          90%            { opacity: 0.94; transform: translate( 3px,0) skewX( 0.4deg); }
          91%            { opacity: 0.88; transform: translate(-1px,-1px);             }
          92%            { opacity: 1;    transform: translate(0,0);                   }
        }
        @keyframes scanline-drift {
          from { background-position: 0 0;    }
          to   { background-position: 0 48px; }
        }
      `}</style>

      {/* ── VS badge — desktop only, floats in the gap ── */}
      <motion.div
        className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                   items-center justify-center"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
        transition={{ delay: 0.68, type: 'spring', stiffness: 300, damping: 18 }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center
                     text-[11px] font-black tracking-widest"
          style={{
            background: 'rgba(10,10,16,0.98)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.28)',
            boxShadow: '0 0 0 5px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.7)',
          }}
        >
          VS
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ════════════════════ ANKI CARD ════════════════════ */}
        <motion.div
          className="relative rounded-2xl p-6 overflow-hidden cursor-default"
          style={{
            background: 'rgba(10,5,20,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.18)',
            // Hover: desaturate + dim to reinforce "obsolete"
            filter: ankiHover
              ? 'saturate(0.28) brightness(0.68)'
              : 'saturate(1) brightness(1)',
            transition: 'filter 0.35s ease',
          }}
          initial={{ opacity: 0, x: -32 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition={{ duration: 0.55, ease: SWIFT as any }}
          onMouseEnter={() => setAnkiHover(true)}
          onMouseLeave={() => setAnkiHover(false)}
        >
          {/* Ambient violet glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.07) 0%, transparent 65%)' }} />
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.30), transparent)' }} />

          {/* ── Tactical noise / glitch layers ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
            {/* Drifting CRT scanlines */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.016) 3px, rgba(255,255,255,0.016) 4px)',
              backgroundSize: '100% 4px',
              animation: 'scanline-drift 10s linear infinite',
            }} />
            {/* Horizontal glitch stripe (synced to keyframe) */}
            <div style={{
              position: 'absolute', inset: 0,
              animation: 'anki-glitch 7s 1.5s infinite',
              background: `linear-gradient(0deg, transparent 46%, rgba(124,58,237,0.045) 50%, transparent 54%)`,
            }} />
          </div>

          {/* Header */}
          <div className="relative flex items-center gap-3 mb-5" style={{ zIndex: 2 }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
              🃏
            </div>
            <div>
              <p className="text-white font-bold text-sm">Anki</p>
              <p className="text-xs" style={{ color: 'rgba(124,58,237,0.60)' }}>Método tradicional</p>
            </div>
            <span
              className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              MANUAL &amp; GENÉRICO
            </span>
          </div>

          {/* Staggered pain points */}
          <motion.div
            className="relative flex flex-col gap-3"
            style={{ zIndex: 2 }}
            variants={listWrap}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {[
              { icon: '⏳', text: 'Horas configurando decks e intervalos manualmente' },
              { icon: '😵', text: 'Nenhuma análise de lacunas — você não sabe o que está esquecendo' },
              { icon: '📭', text: 'Sem conteúdo ENEM-específico. Você cria tudo do zero' },
              { icon: '🔇', text: 'Sem tutor. Quando trava numa questão, fica sozinho' },
              { icon: '📉', text: 'Taxa de abandono >60% após 2 semanas' },
            ].map(({ icon, text }) => (
              <motion.div key={text} variants={rowAnki} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5 opacity-50">{icon}</span>
                <p className="text-slate-600 text-sm leading-snug">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Retention score — slow counter */}
          <div className="relative mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', zIndex: 2 }}>
            <p className="text-xs text-slate-700 uppercase tracking-wider mb-1">Retenção média</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black tabular-nums" style={{ color: 'rgba(239,68,68,0.58)' }}>
                ~{ankiPct}%
              </p>
              <p className="text-slate-700 text-xs mb-1">após 1 semana sem revisão forçada</p>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════ FLASHAPROVA CARD ════════════════════ */}
        <motion.div
          className="relative rounded-2xl p-6 overflow-hidden cursor-default"
          style={{
            background: 'rgba(5,8,20,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${flashHover ? CYAN + '65' : CYAN + '35'}`,
            boxShadow: flashHover
              ? `0 0 80px ${CYAN}30, 0 0 160px ${CYAN}14, 0 0 0 1px ${CYAN}22`
              : `0 0 60px ${CYAN}12, 0 0 120px ${CYAN}06`,
            transition: 'border-color 0.28s ease, box-shadow 0.28s ease',
          }}
          initial={{ opacity: 0, x: 32, scale: 0.92 }}
          animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition={{ duration: 0.55, ease: SWIFT as any, delay: 0.50 }}
          whileHover={{
            scale: 1.022,
            transition: { type: 'spring', stiffness: 280, damping: 22 },
          }}
          onMouseEnter={() => setFlashHover(true)}
          onMouseLeave={() => setFlashHover(false)}
        >
          {/* Ambient cyan glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top right, ${CYAN}14 0%, transparent 65%)` }} />
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${CYAN}70, ${VIOLET}40, transparent)` }} />

          {/* "System activated" pulsing border on hover */}
          {flashHover && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: `1px solid ${CYAN}55` }}
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Header */}
          <div className="relative flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${CYAN}18`, border: `1px solid ${CYAN}35`, boxShadow: `0 0 12px ${CYAN}20` }}
            >
              ⚡
            </div>
            <div>
              <p className="text-white font-bold text-sm">FlashAprova</p>
              <p className="text-xs" style={{ color: `${CYAN}90` }}>IA + SRS integrado</p>
            </div>
            <span
              className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${VIOLET}30, ${CYAN}25)`,
                color: CYAN,
                border: `1px solid ${CYAN}35`,
                boxShadow: `0 0 8px ${CYAN}15`,
              }}
            >
              IA ESPECIALISTA
            </span>
          </div>

          {/* Staggered wins — icons 🧠🎯📚 spring-pop */}
          <motion.div
            className="relative flex flex-col gap-3"
            variants={listWrap}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {[
              { icon: '🧠', text: 'Algoritmo SRS automático — zero configuração, máxima retenção', pop: true  },
              { icon: '🎯', text: 'Radar de lacunas por IA: sabe exatamente o que revisar hoje',   pop: true  },
              { icon: '📚', text: '+5.700 flashcards ENEM-específicos prontos para usar',           pop: true  },
              { icon: '🤖', text: '7 tutores IA especialistas por disciplina — suporte 24h',        pop: false },
              { icon: '📈', text: 'Heatmap de evolução: visualize seu progresso semana a semana',   pop: false },
            ].map(({ icon, text, pop }) => (
              <motion.div key={text} variants={rowFlash} className="flex items-start gap-3">
                <motion.span
                  className="text-base shrink-0 mt-0.5"
                  variants={pop ? iconPop : undefined}
                >
                  {icon}
                </motion.span>
                <p className="text-slate-300 text-sm leading-snug">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Retention score — fast spring counter */}
          <div className="relative mt-6 pt-4 border-t" style={{ borderColor: `${CYAN}15` }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: `${CYAN}60` }}>
              Retenção média
            </p>
            <div className="flex items-end gap-2">
              <p
                className="text-3xl font-black tabular-nums"
                style={{ color: CYAN, textShadow: `0 0 20px ${CYAN}70` }}
              >
                {flashPct}%
              </p>
              <p className="text-slate-500 text-xs mb-1">com revisões espaçadas por IA</p>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${CYAN}40, transparent)` }} />
        </motion.div>

      </div>
    </div>
  );
}
