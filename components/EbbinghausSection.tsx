'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ─── Design tokens (espelha LandingPage.tsx) ──────────────────────────────────
const ORANGE  = '#FF8A00';
const VIOLET  = '#7C3AED';
const NEON    = '#00FF73';
const GREEN   = '#22c55e';
const CARD_BG = 'rgba(255,255,255,0.05)';

// ─── SVG paths ────────────────────────────────────────────────────────────────
const FORGET_LINE = 'M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163';
const FORGET_AREA = `${FORGET_LINE} L380,170 L40,170 Z`;
const SRS_LINE    = 'M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18';
const SRS_AREA    = `${SRS_LINE} L380,170 L40,170 Z`;

// Review node positions + timing (synced to SRS line pathLength animation)
// Green line: delay=0.30s, duration=1.55s → nodes at ~21%, ~45%, ~74% of path
const REVIEW_NODES = [
  { cx: 112, cy: 16, delay: 0.62 },  // 0.30 + 1.55 * 0.21
  { cx: 194, cy: 16, delay: 1.00 },  // 0.30 + 1.55 * 0.45
  { cx: 292, cy: 16, delay: 1.45 },  // 0.30 + 1.55 * 0.74
] as const;

// ─── NodeDot — appear → pulse lifecycle ──────────────────────────────────────
function NodeDot({ cx, cy, delay, isInView }: {
  cx: number; cy: number; delay: number; isInView: boolean;
}) {
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'pulsing'>('hidden');

  useEffect(() => {
    if (!isInView) { setPhase('hidden'); return; }
    const t = setTimeout(() => setPhase('entering'), delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('pulsing'), 450);
    return () => clearTimeout(t);
  }, [phase]);

  const origin = `${cx}px ${cy}px`;

  return (
    <>
      {/* Core dot */}
      <motion.circle
        cx={cx} cy={cy} r="4.5"
        fill={`${NEON}22`}
        stroke={NEON}
        strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 'hidden'   ? { scale: 0, opacity: 0 } :
          phase === 'entering' ? { scale: 1, opacity: 1 } :
          // Continuous pulse once visible
          { scale: [1, 1.55, 1], opacity: [1, 0.85, 1] }
        }
        transition={
          phase === 'pulsing'
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }
            : { duration: 0.35, ease: 'backOut' }
        }
        style={{
          transformOrigin: origin,
          filter: `drop-shadow(0 0 5px ${NEON}cc)`,
        }}
      />
      {/* Expanding ring burst on enter */}
      {phase !== 'hidden' && (
        <motion.circle
          cx={cx} cy={cy} r="4.5"
          fill="none"
          stroke={NEON}
          strokeWidth="1.5"
          animate={{ scale: [1, 2.8], opacity: [0.9, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut', repeatDelay: 1.0 }}
          style={{ transformOrigin: origin }}
        />
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EbbinghausSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: '-120px' });

  const [hoveredLine, setHoveredLine] = useState<null | 'forget' | 'srs'>(null);
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent) {
    const el = svgWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-24" ref={sectionRef}>
      <div
        className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
        style={{
          background: CARD_BG,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${ORANGE}25`,
          boxShadow: `0 0 60px ${ORANGE}08, 0 0 0 1px rgba(124,58,237,0.08)`,
        }}
      >
        {/* Ambient overlays */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom left, rgba(124,58,237,0.10) 0%, transparent 60%)' }} />
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}50, rgba(124,58,237,0.30), transparent)` }} />

        {/* ── Header ── */}
        <div className="max-w-xl mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: ORANGE }}>
            A Dor Real do Estudante
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
            Você estuda horas. Amanhã,{' '}
            <span style={{ color: ORANGE }}>esqueceu quase tudo.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            A Curva de Ebbinghaus é implacável:{' '}
            <span className="text-white font-semibold">
              sem revisão, você perde 70% do conteúdo em menos de{' '}
              <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>24h</span>.
            </span>{' '}
            Não é falta de inteligência — é falta do método certo.
          </p>
        </div>

        {/* ── Chart + tooltip wrapper ── */}
        <div
          ref={svgWrapRef}
          className="relative select-none"
          onMouseMove={handleMouseMove}
        >
          <svg viewBox="0 0 440 190" className="w-full" style={{ maxHeight: 200, overflow: 'visible' }}>
            <defs>
              {/* Gradients */}
              <linearGradient id="eb-forget-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={ORANGE} />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="eb-srs-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={VIOLET} />
                <stop offset="55%"  stopColor={NEON}   />
                <stop offset="100%" stopColor={GREEN}   />
              </linearGradient>
              <linearGradient id="eb-forget-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={ORANGE} stopOpacity="0.18" />
                <stop offset="100%" stopColor={ORANGE} stopOpacity="0"    />
              </linearGradient>
              <linearGradient id="eb-srs-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={NEON} stopOpacity="0.22" />
                <stop offset="100%" stopColor={NEON} stopOpacity="0"    />
              </linearGradient>
              {/* Orange glow — moderate */}
              <filter id="eb-glow-o" x="-30%" y="-150%" width="160%" height="400%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              {/* Green glow — strong double-layer */}
              <filter id="eb-glow-g" x="-30%" y="-150%" width="160%" height="400%">
                <feGaussianBlur stdDeviation="3.5" result="b1"/>
                <feGaussianBlur stdDeviation="7"   result="b2" in="SourceGraphic"/>
                <feMerge>
                  <feMergeNode in="b2"/>
                  <feMergeNode in="b1"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Grid */}
            {[10, 50, 90, 130, 170].map(y => (
              <line key={y} x1="40" y1={y} x2="430" y2={y}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}

            {/* Y-axis labels */}
            {([[10,'100%'],[50,'75%'],[90,'50%'],[130,'25%'],[170,'0%']] as const).map(([y, l]) => (
              <text key={l} x="34" y={y + 4} textAnchor="end"
                fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
            ))}
            {/* X-axis labels */}
            {([[40,'Hoje'],[105,'1d'],[170,'3d'],[260,'1 sem'],[380,'1 mês']] as const).map(([x, l]) => (
              <text key={l} x={x} y="185" textAnchor="middle"
                fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
            ))}

            {/* ── Orange area fill ── */}
            <motion.path
              d={FORGET_AREA}
              fill="url(#eb-forget-area)"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            />

            {/* ── Orange line — rapid descent (fast ease-in: loss) ── */}
            <motion.path
              d={FORGET_LINE}
              fill="none"
              stroke="url(#eb-forget-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#eb-glow-o)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.72, ease: [0.08, 0, 0.45, 1], delay: 0.15 }}
            />

            {/* ── Green area fill ── */}
            <motion.path
              d={SRS_AREA}
              fill="url(#eb-srs-area)"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            />

            {/* ── Green line — sawtooth resilience pattern ── */}
            <motion.path
              d={SRS_LINE}
              fill="none"
              stroke="url(#eb-srs-line)"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#eb-glow-g)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.55, ease: 'easeInOut', delay: 0.30 }}
            />

            {/* ── Review nodes (pulsing, synced to line progress) ── */}
            {REVIEW_NODES.map(({ cx, cy, delay }) => (
              <NodeDot key={cx} cx={cx} cy={cy} delay={delay} isInView={isInView} />
            ))}

            {/* ── Invisible hit areas for tooltip detection ── */}
            <path
              d={FORGET_LINE} fill="none" stroke="transparent" strokeWidth="26"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredLine('forget')}
              onMouseLeave={() => setHoveredLine(null)}
            />
            <path
              d={SRS_LINE} fill="none" stroke="transparent" strokeWidth="26"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredLine('srs')}
              onMouseLeave={() => setHoveredLine(null)}
            />
          </svg>

          {/* ── Floating tooltip ── */}
          <AnimatePresence>
            {hoveredLine && (
              <motion.div
                className="absolute pointer-events-none z-10"
                style={{
                  left: Math.min(
                    mousePos.x + 14,
                    (svgWrapRef.current?.offsetWidth ?? 400) - 200,
                  ),
                  top: Math.max(mousePos.y - 46, 0),
                }}
                initial={{ opacity: 0, y: 5, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 3, scale: 0.93, transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <div
                  className="rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: hoveredLine === 'srs'
                      ? 'rgba(0,255,115,0.10)'
                      : 'rgba(255,138,0,0.10)',
                    border: `1px solid ${hoveredLine === 'srs' ? NEON : ORANGE}55`,
                    color:  hoveredLine === 'srs' ? NEON : ORANGE,
                    boxShadow: `0 0 18px ${hoveredLine === 'srs' ? NEON : ORANGE}28`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {hoveredLine === 'srs'
                    ? '✦ 97% de Retenção Ativa'
                    : '✕ Apenas 12% lembrado'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-5 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full" style={{ background: ORANGE }} />
            <span className="text-slate-500 text-xs">Sem revisão (método tradicional)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${VIOLET}, ${NEON})` }} />
            <span className="text-slate-500 text-xs">Com IA + SRS (FlashAprova)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
