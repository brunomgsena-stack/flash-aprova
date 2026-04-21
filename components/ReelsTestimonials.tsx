'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useInView } from 'framer-motion';
import { REELS, type Reel } from '@/lib/reels-data';

// ─── Design tokens ──────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const EMERALD = '#10b981';

// ─── Ticker items (20) ────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'BRUNO • MEDICINA • UFPE',
  'VICTOR • DIREITO • USP',
  'CECÍLIA • BIOMEDICINA • UNICAMP',
  'LÍVIA • PSICOLOGIA • UFRJ',
  'GABRIEL • MEDICINA • UNIFESP',
  'FERNANDA • DIREITO • PUC-SP',
  'PEDRO • ENGENHARIA • IME',
  'ISABELA • ODONTOLOGIA • UNESP',
  'THIAGO • FÍSICA • ITA',
  'AMANDA • ENFERMAGEM • UNIFESP',
  'BRENO • MEDICINA • UFMG',
  'LETÍCIA • FARMÁCIA • USP',
  'MARIANA • MEDICINA VET. • UNESP',
  'CAIO • ENG. AEROESPACIAL • ITA',
  'LUÍSA • NUTRIÇÃO • UNIFESP',
  'LUCAS • ENG. MECATRÔNICA • USP',
  'ANA • MEDICINA • UFPE',
  'RAFAEL • MEDICINA • FUVEST',
  'BEATRIZ • DIREITO • UNICAMP',
  'HENRIQUE • BIOMÉDICAS • USP',
] as const;

// ─── Mask style (applied to both scroll containers) ───────────────────────────
const EDGE_MASK = {
  maskImage:          'linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)',
  WebkitMaskImage:    'linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)',
} as const;

// ─── Single Reel Card ─────────────────────────────────────────────────────────
function ReelCard({ reel }: { reel: Reel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden cursor-pointer select-none flex-shrink-0 w-52 sm:w-56"
      style={{
        aspectRatio: '9 / 16',
        boxShadow: hovered
          ? `0 0 40px ${reel.tagColor}35, 0 24px 60px rgba(0,0,0,0.55)`
          : '0 12px 40px rgba(0,0,0,0.45)',
        transition: 'box-shadow 0.3s ease',
      }}
      animate={{
        y:      [0, -reel.floatY, 0, reel.floatY, 0],
        rotate: [-reel.floatRot, 0, reel.floatRot, 0, -reel.floatRot],
      }}
      transition={{
        duration:  reel.floatDur,
        delay:     reel.floatDelay,
        repeat:    Infinity,
        ease:      'easeInOut',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${reel.gradA} 0%, ${reel.gradB} 100%)` }}
      />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${reel.tagColor}18 0%, transparent 60%),
            radial-gradient(circle at 75% 80%, ${reel.tagColor}10 0%, transparent 50%)`,
        }}
      />
      {/* Photo — graceful fallback */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reel.img}
        alt={reel.handle}
        className="absolute inset-0 w-full h-full object-cover object-top"
        loading="lazy"
        decoding="async"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.12) 65%, transparent 100%)' }}
      />

      {/* Stories bar */}
      <div className="absolute top-0 inset-x-0 flex gap-0.5 px-2.5 pt-2 z-20">
        {reel.stories.map((filled, j) => (
          <div
            key={j}
            className="h-0.5 flex-1 rounded-full"
            style={{ background: filled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)' }}
          />
        ))}
      </div>

      {/* Status tag + handle */}
      <div className="absolute top-5 left-3 flex flex-col gap-1 z-20">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: reel.tagColor }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          <span
            className="text-[8px] font-bold tracking-widest uppercase"
            style={{ color: reel.tagColor, fontFamily: 'ui-monospace, monospace' }}
          >
            [ {reel.tag} ]
          </span>
        </div>
        <span className="text-[9px] text-white/50" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {reel.handle}
        </span>
      </div>


      {/* Bottom caption */}
      <div className="absolute inset-x-0 bottom-2 px-3 pb-1 z-20">
        <p
          className="font-black text-base leading-none mb-0.5"
          style={{ color: reel.tagColor, fontFamily: 'ui-monospace, monospace', filter: `drop-shadow(0 0 6px ${reel.tagColor}60)` }}
        >
          {reel.score}
        </p>
        <p
          className="text-[9px] font-bold tracking-widest uppercase mb-2 text-white/65"
          style={{ fontFamily: 'ui-monospace, monospace' }}
        >
          {reel.course}
        </p>
        <ul className="flex flex-col gap-0.5">
          {reel.bullets.map((b, j) => (
            <li key={j} className="text-[10px] text-white/80 leading-snug">{b}</li>
          ))}
        </ul>
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15 z-30">
        <motion.div
          className="h-full rounded-full"
          style={{ background: reel.tagColor }}
          animate={{ width: ['0%', '100%', '0%'] }}
          transition={{
            duration:    8,
            delay:       reel.floatDelay * 2,
            repeat:      Infinity,
            ease:        'linear',
            times:       [0, 0.92, 1],
            repeatDelay: 0.3,
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── Infinite auto-scroll carousel ────────────────────────────────────────────
// Halves speed on hover. Seamless loop via doubled items + scrollWidth reset.
function InfiniteCarousel() {
  const x         = useMotionValue(0);
  const trackRef  = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const SPEED = 0.055; // px/ms ≈ 55 px/s

  useAnimationFrame((_, delta) => {
    const px      = paused ? SPEED * 0.5 : SPEED;
    const current = x.get();
    const half    = (trackRef.current?.scrollWidth ?? 0) / 2;
    let   next    = current - px * delta;
    if (half > 0 && Math.abs(next) >= half) next += half;
    x.set(next);
  });

  // Render cards twice for seamless loop
  const doubled = [...REELS, ...REELS];

  return (
    <div
      className="overflow-hidden"
      style={EDGE_MASK}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        ref={trackRef}
        className="flex gap-4 py-6 px-2"
        style={{ x, willChange: 'transform' }}
      >
        {doubled.map((reel, i) => (
          <ReelCard key={`${reel.handle}-${i}`} reel={reel} />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Approved Ticker ─────────────────────────────────────────────────────────
function ApprovedTicker() {
  const x        = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const SPEED    = 0.11; // px/ms ≈ 110 px/s

  useAnimationFrame((_, delta) => {
    const current = x.get();
    const half    = (trackRef.current?.scrollWidth ?? 0) / 2;
    let   next    = current - SPEED * delta;
    if (half > 0 && Math.abs(next) >= half) next += half;
    x.set(next);
  });

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="overflow-hidden border-y py-3"
      style={{
        background:   'rgba(9,9,11,0.80)',
        borderColor:  'rgba(16,185,129,0.18)',
        backdropFilter: 'blur(8px)',
        ...EDGE_MASK,
      }}
    >
      <motion.div
        ref={trackRef}
        className="flex items-center gap-12 whitespace-nowrap"
        style={{ x, willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-[10px] font-bold tracking-[0.18em] shrink-0"
            style={{
              color:      NEON,
              opacity:    0.65,
              fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
            }}
          >
            ✦ {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function ReelsTestimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="pb-28 pt-4">

      {/* Header */}
      <motion.div
        className="text-center mb-12 px-6 sm:px-10"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}
        >
          [ VEREDITO DOS APROVADOS ]
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Aprovação não é sorte.{' '}
          <span style={{
            background:           `linear-gradient(90deg, ${EMERALD}, ${NEON})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
          }}>
            É algoritmo.
          </span>
        </h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto mb-8">
          O próximo desse mural pode ser você. Toque no botão abaixo.
        </p>
        <a
          href="/onboarding"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-sm text-sm font-black tracking-widest uppercase transition-all duration-200"
          style={{
            background:  NEON,
            color:       '#000',
            fontFamily:  "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
            boxShadow:   `0 0 24px ${NEON}50, 0 0 48px ${NEON}20`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 40px ${NEON}80, 0 0 80px ${NEON}30`;
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 24px ${NEON}50, 0 0 48px ${NEON}20`;
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
          }}
        >
          <span>▶</span>
          [ DETECTAR VAZAMENTO DE NOTA ]
        </a>
      </motion.div>

      {/* Infinite reel carousel */}
      <InfiniteCarousel />

      {/* Approval ticker — appears after carousel */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ApprovedTicker />
      </motion.div>

      {/* Social proof strip */}
      <motion.div
        className="max-w-3xl mx-auto mt-10 px-6 sm:px-10"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
      >
        <div
          className="rounded-2xl px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          style={{
            background:     'rgba(255,255,255,0.03)',
            border:         '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {[
            { value: '+8.000', label: 'alunos ativos'     },
            { value: '94%',    label: 'taxa de retenção'  },
            { value: '4.9★',   label: 'avaliação média'   },
            { value: '3x',     label: 'mais acertos TRI'  },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-lg font-black leading-none"
                style={{
                  color:      NEON,
                  filter:     `drop-shadow(0 0 8px ${NEON}40)`,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {value}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5 tracking-wide uppercase">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

    </section>
  );
}
