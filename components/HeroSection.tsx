'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// ── Design tokens (mirrored from LandingPage) ──────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';
const GREEN  = '#22c55e';

// ── Boot sequence: staggered "system load" entrance ───────────────────────
const bootContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.2 },
  },
};
const bootItem = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ── Deterministic particle generator (prevents SSR/hydration mismatch) ────
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = lcg(0xdeadbeef);
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  x: rng() * 100,           // % from left
  size: rng() * 2.5 + 1,    // 1–3.5 px
  duration: rng() * 9 + 10, // 10–19 s
  delay: -(rng() * 16),     // staggered start offsets
  opacity: rng() * 0.32 + 0.08,
}));

// ── HUD corner overlays ────────────────────────────────────────────────────
const HUD = [
  { cls: 'top-5 left-5 sm:top-7 sm:left-8',         label: 'SYSTEM_STATUS: ACTIVE' },
  { cls: 'top-5 right-5 sm:top-7 sm:right-8',        label: 'NEURAL_SYNC: 100%' },
  { cls: 'bottom-5 left-5 sm:bottom-7 sm:left-8',    label: 'DATA_STREAM: SYNCED' },
  { cls: 'bottom-5 right-5 sm:bottom-7 sm:right-8',  label: 'MEMORY_SHIELD: ACTIVE' },
];

// ── Neon-pulse animation props (textShadow keyframes) ─────────────────────
const neonPulse = (color: string, delay = 0) => ({
  animate: {
    textShadow: [
      `0 0 18px ${color}80, 0 0 36px ${color}40`,
      `0 0 32px ${color}cc, 0 0 64px ${color}60, 0 0 90px ${color}28`,
      `0 0 18px ${color}80, 0 0 36px ${color}40`,
    ],
  },
  transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay } as const,
});

// ── Border-Beam CTA button ─────────────────────────────────────────────────
function HeroCTAButton() {
  return (
    <div className="relative w-full sm:w-auto inline-flex rounded-2xl p-[2px] overflow-hidden group">
      {/* Rotating conic gradient — visible as a 2 px animated border */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          background: `conic-gradient(
            from 0deg at 50% 50%,
            transparent   0deg,
            transparent  210deg,
            ${NEON}99    245deg,
            #ffffff       258deg,
            ${NEON}99    272deg,
            transparent  308deg,
            transparent  360deg
          )`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Emerald grid-glow on hover — lights up the surrounding area */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: `0 0 70px ${NEON}70, 0 0 120px ${NEON}30, 0 0 160px ${NEON}15`,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Button surface */}
      <Link
        href="/onboarding"
        className="relative flex w-full justify-center sm:w-auto sm:justify-start items-center gap-3 rounded-[14px] font-black text-black overflow-hidden px-8 py-5 text-lg transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.015] active:scale-[0.99]"
        style={{
          background: `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
          letterSpacing: '-0.01em',
          boxShadow: `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
        }}
      >
        {/* Shimmer sweep */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
            animation: 'shimmer 2.4s infinite',
          }}
        />
        <svg
          width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="relative"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <span className="relative">Gerar meu Diagnóstico IA</span>
      </Link>
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section
      className="relative max-w-4xl mx-auto px-6 sm:px-10 pt-10 pb-20 text-center"
      style={{ isolation: 'isolate', overflow: 'hidden' }}
    >
      {/* JetBrains Mono + local keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes hud-blink {
          0%, 100% { opacity: 1; }
          48%, 52% { opacity: 0.2; }
        }
        @keyframes hud-scan {
          0%, 100% { color: ${NEON}60; }
          50%      { color: ${NEON}b0; }
        }
      `}</style>

      {/* ────────────── Perspective 3D Grid ────────────── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0, perspective: '520px' }}
      >
        <div
          style={{
            position: 'absolute',
            width: '300%',
            height: '260%',
            left: '-100%',
            top: '8%',
            transformOrigin: '50% 0%',
            transform: 'rotateX(64deg)',
            backgroundImage: `
              linear-gradient(rgba(0,255,115,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,115,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '68px 68px',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 20%, rgba(0,0,0,0.25) 65%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 20%, rgba(0,0,0,0.25) 65%, transparent 100%)',
          }}
        />
      </div>

      {/* ────────────── Data Stream Particles ────────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              bottom: 0,
              width: p.size,
              height: p.size,
              background: NEON,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px ${NEON}90`,
            }}
            animate={{ y: [0, -1000] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* ────────────── HUD Corner Labels ────────────── */}
      {HUD.map(({ cls, label }, i) => (
        <motion.div
          key={label}
          className={`absolute ${cls} hidden sm:flex items-center gap-1`}
          style={{ zIndex: 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 + i * 0.12, duration: 0.5 }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
              fontSize: '9px',
              letterSpacing: '0.13em',
              color: `${NEON}65`,
              userSelect: 'none',
              animation: `hud-scan ${3 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            [ {label} ]
          </span>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '9px',
              color: `${NEON}55`,
              animation: `hud-blink ${1.2 + i * 0.3}s step-end infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          >
            ▮
          </span>
        </motion.div>
      ))}

      {/* ────────────── Boot-sequence content ────────────── */}
      <motion.div
        className="relative"
        style={{ zIndex: 1 }}
        variants={bootContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          variants={bootItem}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
          style={{
            background: `${NEON}14`,
            border: `1px solid ${NEON}35`,
            color: NEON,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: NEON }}
          />
          Retenção Cognitiva · IA Especialista · SRS Automático
        </motion.div>

        {/* H1 — gradient shimmer on base text, neon-glow pulse on keywords */}
        <motion.h1
          variants={bootItem}
          className="text-[clamp(1.85rem,6.5vw,3.75rem)] font-black leading-tight mb-6"
          style={{
            color: '#ffffff',
            textShadow: '0 2px 48px rgba(0,0,0,0.9)',
          }}
        >
          Pare de estudar
          <br />
          para{' '}
          <span
            style={{
              color: ORANGE,
              textShadow: `0 0 20px ${ORANGE}80, 0 0 40px ${ORANGE}40`,
            }}
          >
            esquecer.
          </span>
          <br />
          Garanta{' '}
          <motion.span
            style={{ color: NEON }}
            {...neonPulse(NEON, 0.8)}
          >
            97% de retenção
          </motion.span>{' '}
          <motion.span
            style={{ color: '#5F00F6' }}
            {...neonPulse('#5F00F6', 1.4)}
          >
            até o dia do ENEM.
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={bootItem}
          className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
        >
          A ciência prova: sem revisão espaçada, você esquece{' '}
          <span className="text-white font-semibold">
            70% do conteúdo em menos de 24h.
          </span>{' '}
          O FlashAprova usa IA + SRS para blindar sua memória — e seu nome na lista de
          aprovados.
        </motion.p>

        {/* CTA */}
        <motion.div variants={bootItem} className="w-full flex flex-col items-center gap-3">
          <div className="w-full sm:w-auto">
            <HeroCTAButton />
          </div>
          <p className="text-slate-700 text-xs">
            Sem cartão · Diagnóstico por IA em 3 min · Acesso imediato
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={bootItem}
          className="flex flex-wrap justify-center gap-8 mt-14"
        >
          {[
            { n: '97%',    label: 'retenção com SRS + IA',   color: NEON   },
            { n: '5.700+', label: 'flashcards táticos ENEM', color: VIOLET },
            { n: '24h',    label: 'para sentir a diferença', color: GREEN  },
          ].map(({ n, label, color }) => (
            <div key={n} className="text-center">
              <p
                className="text-3xl font-black"
                style={{ color, textShadow: `0 0 18px ${color}70` }}
              >
                {n}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
