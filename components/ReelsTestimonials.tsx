'use client';

import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// ─── Design tokens ──────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const EMERALD = '#10b981';
const VIOLET  = '#7C3AED';
const CYAN    = '#06b6d4';

// ─── Dossiê data ─────────────────────────────────────────────────────────────
const REELS = [
  {
    img:       '/images/aprovado_1.jpg',
    tag:       'MAPEADO',
    tagColor:  NEON,
    score:     '940/1000',
    course:    'MEDICINA · UFPE',
    handle:    '@ana.med.ufpe',
    bullets:   ['🧠 TRI domada. Bio imbatível.', '🎯 4ª tentativa → 1ª aprovação.', '💊 Sistema foi cirúrgico.'],
    gradA:     '#0d2a14',
    gradB:     '#000810',
    floatY:    6, floatRot:  0.4, floatDur: 5.2, floatDelay: 0.0,
    stories:   [1, 0, 0, 0],
  },
  {
    img:       '/images/aprovado_2.jpg',
    tag:       'SINCRONIZADO',
    tagColor:  CYAN,
    score:     '920/1000',
    course:    'ENG. MECATRÔNICA · USP',
    handle:    '@carlos.eng.usp',
    bullets:   ['📡 Radar ENEM = GPS das falhas.', '📐 Mat+Fís: 40%→89% em 60d.', '⚡ 4h de estudo, não 8.'],
    gradA:     '#0a1830',
    gradB:     '#000810',
    floatY:    8, floatRot: -0.3, floatDur: 5.8, floatDelay: 0.35,
    stories:   [1, 1, 0, 0],
  },
  {
    img:       '/images/aprovado_3.jpg',
    tag:       'BLINDADO',
    tagColor:  VIOLET,
    score:     '910/1000',
    course:    'DIREITO · UNICAMP',
    handle:    '@beatriz.dir',
    bullets:   ['✍️ 30 feedbacks de IA na Red.', '🛡️ Terror→880pts. Redação.', '⚖️ 1ª tentativa. Unicamp.'],
    gradA:     '#180e38',
    gradB:     '#000810',
    floatY:    5, floatRot:  0.5, floatDur: 6.2, floatDelay: 0.70,
    stories:   [1, 1, 1, 0],
  },
  {
    img:       '/images/aprovado_4.jpg',
    tag:       'DOMINADO',
    tagColor:  EMERALD,
    score:     '935/1000',
    course:    'MEDICINA · USP',
    handle:    '@rafael.sisu1',
    bullets:   ['🔬 Bio+Quím zeradas na TRI.', '🧬 Memória neural blindada.', '🏆 Top 1% SISU — confirmado.'],
    gradA:     '#0a2818',
    gradB:     '#000810',
    floatY:    7, floatRot: -0.4, floatDur: 5.5, floatDelay: 1.05,
    stories:   [1, 1, 1, 1],
  },
] as const;

// ─── Single Reel Card ─────────────────────────────────────────────────────────
function ReelCard({
  reel, index, inView,
}: {
  reel: typeof REELS[number];
  index: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    /* Entrance wrapper */
    <motion.div
      className="flex-shrink-0 w-52 sm:w-56 lg:w-auto snap-start"
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay: 0.1 + index * 0.13, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Float + orbit */}
      <motion.div
        className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
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
          duration:   reel.floatDur,
          delay:      reel.floatDelay,
          repeat:     Infinity,
          ease:       'easeInOut',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Background: gradient fallback + image ── */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${reel.gradA} 0%, ${reel.gradB} 100%)` }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, ${reel.tagColor}18 0%, transparent 60%),
              radial-gradient(circle at 75% 80%, ${reel.tagColor}10 0%, transparent 50%)`,
          }}
        />
        {/* Photo (graceful fallback if missing) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reel.img}
          alt={reel.handle}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />

        {/* ── Dark gradient vignette for text readability ── */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.12) 65%, transparent 100%)',
          }}
        />

        {/* ── Stories bar (top) ── */}
        <div className="absolute top-0 inset-x-0 flex gap-0.5 px-2.5 pt-2 z-20">
          {reel.stories.map((filled, j) => (
            <div
              key={j}
              className="h-0.5 flex-1 rounded-full"
              style={{ background: filled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)' }}
            />
          ))}
        </div>

        {/* ── Status tag + handle (top-left) ── */}
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
          <span
            className="text-[9px] text-white/50"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            {reel.handle}
          </span>
        </div>

        {/* ── Centered play button ── */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="w-13 h-13 rounded-full flex items-center justify-center"
            style={{
              width: 52, height: 52,
              background:   'rgba(0,0,0,0.48)',
              backdropFilter: 'blur(4px)',
              border:       hovered ? `1.5px solid ${EMERALD}` : '1.5px solid rgba(255,255,255,0.28)',
              boxShadow:    hovered ? `0 0 28px ${EMERALD}80, 0 0 56px ${EMERALD}30` : 'none',
              transition:   'all 0.25s ease',
            }}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill={hovered ? EMERALD : 'white'}
              style={{ marginLeft: 3, transition: 'fill 0.25s' }}
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* ── Bottom caption block ── */}
        <div className="absolute inset-x-0 bottom-2 px-3 pb-1 z-20">
          {/* Score headline */}
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
          {/* Bullet captions */}
          <ul className="flex flex-col gap-0.5">
            {reel.bullets.map((b, j) => (
              <li key={j} className="text-[10px] text-white/80 leading-snug">{b}</li>
            ))}
          </ul>
        </div>

        {/* ── Progress bar (bottom edge) ── */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15 z-30">
          <motion.div
            className="h-full rounded-full"
            style={{ background: reel.tagColor }}
            initial={{ width: '0%' }}
            animate={inView ? { width: ['0%', '100%', '0%'] } : {}}
            transition={{
              duration:    7.5,
              delay:       0.8 + index * 1.6,
              repeat:      Infinity,
              ease:        'linear',
              times:       [0, 0.92, 1],
              repeatDelay: 0.4,
            }}
          />
        </div>

      </motion.div>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function ReelsTestimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="pb-28 pt-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center mb-12 px-5 sm:px-10">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}
        >
          EVIDÊNCIAS DE ELITE
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
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Testado e validado pelo{' '}
          <span className="text-slate-300 font-medium">Panteão de Elite</span>:{' '}
          veja os resultados reais.
        </p>
      </div>

      {/* ── Reel cards — horizontal scroll on mobile, 4-col grid on lg ─── */}
      {/* Bleed-to-edge wrapper for natural carousel feel */}
      <div className="max-w-6xl mx-auto px-5 sm:px-10">
        <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 lg:pb-0 -mx-5 sm:-mx-10 lg:mx-0 px-5 sm:px-10 lg:px-0">
          {REELS.map((reel, i) => (
            <ReelCard key={reel.handle} reel={reel} index={i} inView={inView} />
          ))}
        </div>
      </div>

      {/* ── Social proof strip ────────────────────────────────────────────── */}
      <motion.div
        className="max-w-3xl mx-auto mt-10 px-5 sm:px-10"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
      >
        <div
          className="rounded-2xl px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          style={{
            background:  'rgba(255,255,255,0.03)',
            border:      '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {[
            { value: '+8.000', label: 'alunos ativos' },
            { value: '94%',    label: 'taxa de retenção' },
            { value: '4.9★',   label: 'avaliação média' },
            { value: '3x',     label: 'mais acertos TRI' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-lg font-black leading-none"
                style={{ color: NEON, filter: `drop-shadow(0 0 8px ${NEON}40)`, fontFamily: 'ui-monospace, monospace' }}
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
