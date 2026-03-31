'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';

// ─── Design tokens ────────────────────────────────────────────────────────────
const CYAN    = '#06b6d4';
const EMERALD = '#10b981';
const VIOLET  = '#7C3AED';
const NEON    = '#00FF73';

// ─── SVG layout ───────────────────────────────────────────────────────────────
const VW = 560, VH = 210;
// Plot area: x: CX1→CX2, y: CY1(score=1000)→CY2(score=480)
const CX1 = 52, CX2 = 524, CY1 = 18, CY2 = 192;
const LINE_W = CX2 - CX1; // 472 — used in dasharray/dashoffset

// Score → Y coordinate
function sy(score: number): number {
  return Math.round(CY1 + (1000 - score) / 520 * (CY2 - CY1));
}

// ─── Waypoints (precomputed) ──────────────────────────────────────────────────
// sy(650)=135  sy(760)=98  sy(920)=45
const WP = {
  R1: { x:  80, y: sy(650) },
  R3: { x: 296, y: sy(760) },
  R5: { x: 506, y: sy(920) },
} as const;

// ─── SVG paths ────────────────────────────────────────────────────────────────
// Trajectory — cubic beziers crafted for "acceleration snap" near each waypoint:
//   before R3: control pt overshoots ABOVE R3.y → line snaps down to R3 (momentum)
//   after  R3: control pt dips BELOW R3.y briefly → elastic rebound effect
//   before R5: control pt surges well ABOVE R5.y → final upward burst
const TRAJ = [
  `M${WP.R1.x},${WP.R1.y}`,
  `C148,131 214,89 ${WP.R3.x},${WP.R3.y}`,
  `C358,103 422,48 ${WP.R5.x},${WP.R5.y}`,
].join(' ');

const TRAJ_AREA = `${TRAJ} L${WP.R5.x},${CY2} L${WP.R1.x},${CY2} Z`;

// Baseline — flat improvement, no method
const BASE = `M${WP.R1.x},${WP.R1.y} C190,140 372,148 ${WP.R5.x},152`;

// Grid
const GRID_SCORES = [1000, 900, 800, 700, 600, 500] as const;
const X_LABELS = [
  { x:  80, label: 'R#1' },
  { x: 185, label: 'R#2' },
  { x: 296, label: 'R#3' },
  { x: 401, label: 'R#4' },
  { x: 506, label: 'R#5' },
] as const;

// ─── Node timing (seconds after path animation starts at delay=0.35) ──────────
// Total path duration 2.2s: R1≈start, R3≈45% through, R5≈end
const NODE_DELAYS = { R1: 0.52, R3: 1.34, R5: 2.54 } as const;

// ─── Tooltip data ─────────────────────────────────────────────────────────────
type TipDef = {
  icon:  string;
  title: string;
  score: string;
  desc:  string;
  color: string;
  large?: boolean;
};
const TIPS: Record<'R1' | 'R3' | 'R5', TipDef> = {
  R1: {
    icon:  '⚠',
    title: 'Ponto de Partida',
    score: '650 pts',
    desc:  'Falhas Estruturais Detectadas',
    color: CYAN,
  },
  R3: {
    icon:  '✓',
    title: 'Evolução Intermediária',
    score: '750 pts',
    desc:  'Melhoria em Argumentação e Repertório',
    color: EMERALD,
  },
  R5: {
    icon:  '👑',
    title: 'O 1000 ESTÁ PRÓXIMO',
    score: '900+ pts',
    desc:  'Técnica Refinada — Norma Approved',
    color: EMERALD,
    large: true,
  },
};

// ─── NodeDot — hidden → pop → pulse lifecycle ─────────────────────────────────
function NodeDot({
  x, y, delay, isInView, color, r, extraGlow = false,
}: {
  x: number; y: number; delay: number; isInView: boolean;
  color: string; r: number; extraGlow?: boolean;
}) {
  const [phase, setPhase] = useState<'hidden' | 'pop' | 'pulse'>('hidden');

  useEffect(() => {
    if (!isInView) { setPhase('hidden'); return; }
    const t = setTimeout(() => setPhase('pop'), delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  useEffect(() => {
    if (phase !== 'pop') return;
    const t = setTimeout(() => setPhase('pulse'), 440);
    return () => clearTimeout(t);
  }, [phase]);

  const origin = `${x}px ${y}px`;
  const glow   = extraGlow
    ? `drop-shadow(0 0 10px ${color}dd) drop-shadow(0 0 24px ${color}88)`
    : `drop-shadow(0 0 6px ${color}cc)`;

  return (
    <>
      {/* Expanding ring burst */}
      {phase !== 'hidden' && (
        <motion.circle
          cx={x} cy={y} r={r}
          fill="none" stroke={color} strokeWidth={1.5}
          animate={{ scale: [1, 3.4], opacity: [0.7, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.8 }}
          style={{ transformOrigin: origin }}
        />
      )}
      {/* Core dot */}
      <motion.circle
        cx={x} cy={y} r={r}
        fill={`${color}28`} stroke={color} strokeWidth={2.5}
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 'hidden' ? { scale: 0, opacity: 0 }  :
          phase === 'pop'    ? { scale: 1, opacity: 1 }  :
          { scale: [1, 1.48, 1], opacity: [1, 0.84, 1] }
        }
        transition={
          phase === 'pulse'
            ? { duration: 1.9, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }
            : { duration: 0.4, ease: 'backOut' }
        }
        style={{ transformOrigin: origin, filter: glow }}
      />
    </>
  );
}

// ─── TooltipCard ─────────────────────────────────────────────────────────────
function TooltipCard({ tip, visible }: { tip: TipDef; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`rounded-xl px-3 py-2.5 ${tip.large ? 'w-52' : 'w-44'}`}
          style={{
            background: tip.large
              ? 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(6,182,212,0.07))'
              : 'rgba(4,7,22,0.96)',
            border:               `1px solid ${tip.color}52`,
            boxShadow: tip.large
              ? `0 0 36px ${EMERALD}40, 0 0 90px ${EMERALD}18, 0 4px 24px rgba(0,0,0,0.55)`
              : `0 0 20px ${tip.color}24, 0 4px 18px rgba(0,0,0,0.55)`,
            backdropFilter:       'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
          initial={{ opacity: 0, y: 8,  scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{ opacity: 0,    y: 4,  scale: 0.94, transition: { duration: 0.13 } }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] as any }}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-xl"
            style={{ background: `linear-gradient(90deg, transparent, ${tip.color}75, transparent)` }} />

          {/* Score + icon */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`font-black tabular-nums ${tip.large ? 'text-base' : 'text-sm'}`}
              style={{
                color: tip.color,
                textShadow: tip.large ? `0 0 20px ${EMERALD}95` : undefined,
              }}
            >
              {tip.score}
            </span>
            <span className="text-sm leading-none">{tip.icon}</span>
          </div>
          <p className="text-white font-bold text-[11px] leading-tight mb-0.5">{tip.title}</p>
          <p
            className={`text-[10px] leading-snug ${tip.large ? 'font-semibold' : ''}`}
            style={{ color: `${tip.color}99` }}
          >
            {tip.desc}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── EssayEvolutionSection ────────────────────────────────────────────────────
export default function EssayEvolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: '-80px' });

  const [hovered,  setHovered]  = useState<'R1' | 'R3' | 'R5' | null>(null);
  const [autoShow, setAutoShow] = useState({ R1: false, R3: false, R5: false });

  // Auto-show tooltips after the line "arrives" at each node
  useEffect(() => {
    if (!isInView) return;
    const timers = [
      setTimeout(() => setAutoShow(p => ({ ...p, R1: true })), (NODE_DELAYS.R1 + 0.62) * 1000),
      setTimeout(() => setAutoShow(p => ({ ...p, R3: true })), (NODE_DELAYS.R3 + 0.62) * 1000),
      setTimeout(() => setAutoShow(p => ({ ...p, R5: true })), (NODE_DELAYS.R5 + 0.62) * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-24" ref={sectionRef}>
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background:               'rgba(4,6,18,0.95)',
          backdropFilter:           'blur(24px)',
          WebkitBackdropFilter:     'blur(24px)',
          border:                   `1px solid ${CYAN}22`,
          boxShadow:                `0 0 80px ${CYAN}08, 0 0 0 1px rgba(124,58,237,0.05)`,
        }}
      >

        {/* ── CSS keyframes ── */}
        <style>{`
          @keyframes ee-radar {
            0%   { transform: translateX(-70px); opacity: 0; }
            6%   { opacity: 1; }
            94%  { opacity: 1; }
            100% { transform: translateX(${VW + 70}px); opacity: 0; }
          }
          @keyframes ee-stream-a {
            0%,  28% { stroke-dashoffset: ${LINE_W}; opacity: 0;    }
            29%      { stroke-dashoffset: ${LINE_W}; opacity: 0.06; }
            52%      { stroke-dashoffset: 0;         opacity: 0.06; }
            65%      { stroke-dashoffset: 0;         opacity: 0;    }
            66%, 100%{ stroke-dashoffset: ${LINE_W}; opacity: 0;    }
          }
          @keyframes ee-stream-b {
            0%,  54% { stroke-dashoffset: ${LINE_W}; opacity: 0;    }
            55%      { stroke-dashoffset: ${LINE_W}; opacity: 0.042;}
            72%      { stroke-dashoffset: 0;         opacity: 0.042;}
            83%      { stroke-dashoffset: 0;         opacity: 0;    }
            84%, 100%{ stroke-dashoffset: ${LINE_W}; opacity: 0;    }
          }
          @keyframes ee-grid-tick {
            0%, 86%, 100% { opacity: 1; }
            87%            { opacity: 2.8; }
            88%            { opacity: 0.5; }
            89%            { opacity: 1; }
          }
        `}</style>

        {/* Ambient overlays */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 78% 0%, ${CYAN}11 0%, transparent 52%)` }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 16% 100%, rgba(124,58,237,0.09) 0%, transparent 48%)` }} />
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${CYAN}55, ${VIOLET}35, transparent)` }} />

        {/* ── Header ── */}
        <div className="px-7 sm:px-10 pt-8 pb-5">
          <p className="text-xs font-bold tracking-[0.22em] uppercase mb-2.5" style={{ color: CYAN }}>
            SUA JORNADA ATÉ O 1000
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            EVOLUÇÃO TÁTICA NA{' '}
            <span style={{ color: NEON, textShadow: `0 0 24px ${NEON}70, 0 0 48px ${NEON}30` }}>
              REDAÇÃO
            </span>
          </h2>
        </div>

        {/* ── Chart (relative = tooltip anchor) ── */}
        <div className="relative px-3 sm:px-5" style={{ overflow: 'visible' }}>

          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full"
            style={{ maxHeight: 248, overflow: 'visible' }}
          >
            <defs>
              {/* Trajectory gradients */}
              <linearGradient id="ee-traj-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={CYAN}    />
                <stop offset="52%"  stopColor={EMERALD} />
                <stop offset="100%" stopColor={NEON}    />
              </linearGradient>
              <linearGradient id="ee-traj-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={CYAN} stopOpacity="0.18" />
                <stop offset="100%" stopColor={CYAN} stopOpacity="0"    />
              </linearGradient>
              {/* Radar sweep */}
              <linearGradient id="ee-radar-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={CYAN} stopOpacity="0"    />
                <stop offset="50%"  stopColor={CYAN} stopOpacity="0.07" />
                <stop offset="100%" stopColor={CYAN} stopOpacity="0"    />
              </linearGradient>
              {/* Glow filters */}
              <filter id="ee-glow-line" x="-20%" y="-200%" width="140%" height="500%">
                <feGaussianBlur stdDeviation="3"  result="b1" />
                <feGaussianBlur stdDeviation="8"  result="b2" in="SourceGraphic" />
                <feMerge>
                  <feMergeNode in="b2" />
                  <feMergeNode in="b1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Tactical grid (with flicker) ── */}
            <g style={{ animation: 'ee-grid-tick 14s 5s infinite' }}>
              {GRID_SCORES.map(s => (
                <line key={s}
                  x1={CX1} y1={sy(s)} x2={CX2} y2={sy(s)}
                  stroke="rgba(6,182,212,0.07)" strokeWidth="1"
                />
              ))}
              {X_LABELS.map(({ x }) => (
                <line key={x}
                  x1={x} y1={CY1 - 4} x2={x} y2={CY2}
                  stroke="rgba(6,182,212,0.045)" strokeWidth="1" strokeDasharray="3,5"
                />
              ))}
            </g>

            {/* ── Data stream lines (left-to-right sweep = data processing) ── */}
            <line
              x1={CX1} y1={sy(762)} x2={CX2} y2={sy(762)}
              stroke={CYAN}    strokeWidth="1"
              strokeDasharray={LINE_W} strokeDashoffset={LINE_W}
              style={{ animation: `ee-stream-a 9s 2.2s infinite` }}
            />
            <line
              x1={CX1} y1={sy(854)} x2={CX2} y2={sy(854)}
              stroke={EMERALD} strokeWidth="1"
              strokeDasharray={LINE_W} strokeDashoffset={LINE_W}
              style={{ animation: `ee-stream-b 13s 5.8s infinite` }}
            />

            {/* ── Radar sweep ── */}
            <rect
              x={CX1} y={CY1} width={74} height={CY2 - CY1}
              fill="url(#ee-radar-grad)"
              style={{ animation: 'ee-radar 5.2s 2.4s infinite linear' }}
            />

            {/* ── 1000 target line ── */}
            <line
              x1={CX1} y1={sy(1000)} x2={CX2} y2={sy(1000)}
              stroke={NEON} strokeWidth="1" strokeDasharray="6,5" opacity={0.20}
            />
            <text
              x={CX2 + 5} y={sy(1000) + 3.5}
              fill={NEON} fontSize="8" fontWeight="700" opacity={0.40}
              fontFamily="ui-monospace,monospace"
            >
              1000
            </text>

            {/* ── Y-axis score labels ── */}
            {GRID_SCORES.map(s => (
              <text key={s}
                x={CX1 - 5} y={sy(s) + 3.5} textAnchor="end"
                fill="rgba(255,255,255,0.18)" fontSize="9"
                fontFamily="ui-monospace,monospace"
              >
                {s}
              </text>
            ))}

            {/* ── X-axis revision labels ── */}
            {X_LABELS.map(({ x, label }) => (
              <text key={label}
                x={x} y={CY2 + 14} textAnchor="middle"
                fill="rgba(255,255,255,0.22)" fontSize="9"
                fontFamily="ui-monospace,monospace"
              >
                {label}
              </text>
            ))}

            {/* ── Baseline (no method) ── */}
            <motion.path
              d={BASE} fill="none"
              stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.20 }}
            />

            {/* ── Trajectory area fill ── */}
            <motion.path
              d={TRAJ_AREA} fill="url(#ee-traj-area)"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.60 }}
            />

            {/* ── Trajectory line — live self-drawing ── */}
            {/* ease [0.4,0,0.2,1]: fast start, smooth end — mimics "surge to goal" */}
            <motion.path
              d={TRAJ} fill="none"
              stroke="url(#ee-traj-line)"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              filter="url(#ee-glow-line)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] as any, delay: 0.35 }}
            />

            {/* ── Waypoint nodes ── */}
            <NodeDot
              x={WP.R1.x} y={WP.R1.y}
              delay={NODE_DELAYS.R1} isInView={isInView}
              color={CYAN} r={5.5}
            />
            <NodeDot
              x={WP.R3.x} y={WP.R3.y}
              delay={NODE_DELAYS.R3} isInView={isInView}
              color={CYAN} r={5.5}
            />
            <NodeDot
              x={WP.R5.x} y={WP.R5.y}
              delay={NODE_DELAYS.R5} isInView={isInView}
              color={EMERALD} r={7.5} extraGlow
            />

            {/* ── Hover hit zones ── */}
            {(['R1', 'R3', 'R5'] as const).map(id => (
              <circle
                key={id}
                cx={WP[id].x} cy={WP[id].y} r={20}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          {/* ────────────────── HTML tooltip overlays ────────────────── */}

          {/* R1 — anchor bottom-left aligned to node */}
          <div
            className="absolute pointer-events-none"
            style={{
              left:      `${WP.R1.x / VW * 100}%`,
              top:       `${WP.R1.y / VH * 100}%`,
              transform: 'translate(3%, calc(-100% - 15px))',
            }}
          >
            <TooltipCard tip={TIPS.R1} visible={autoShow.R1 || hovered === 'R1'} />
          </div>

          {/* R3 — centered above node */}
          <div
            className="absolute pointer-events-none"
            style={{
              left:      `${WP.R3.x / VW * 100}%`,
              top:       `${WP.R3.y / VH * 100}%`,
              transform: 'translate(-50%, calc(-100% - 15px))',
            }}
          >
            <TooltipCard tip={TIPS.R3} visible={autoShow.R3 || hovered === 'R3'} />
          </div>

          {/* R5 — shifted left (near right edge) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left:      `${WP.R5.x / VW * 100}%`,
              top:       `${WP.R5.y / VH * 100}%`,
              transform: 'translate(-90%, calc(-100% - 15px))',
            }}
          >
            <TooltipCard tip={TIPS.R5} visible={autoShow.R5 || hovered === 'R5'} />
          </div>
        </div>

        {/* ── Legend row ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-7 sm:px-10 pt-3 pb-5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-px rounded-full"
              style={{ background: `linear-gradient(90deg, ${CYAN}, ${NEON})` }}
            />
            <span className="text-[11px] text-slate-500">FlashAprova + Norma</span>
          </div>
          <div className="flex items-center gap-2">
            {/* CSS dashed line */}
            <div
              className="w-7 h-px"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.22) 60%, transparent 60%)',
                backgroundSize: '6px 1px',
              }}
            />
            <span className="text-[11px] text-slate-700">Sem método</span>
          </div>
          <span
            className="ml-auto text-[10px] font-bold tracking-widest uppercase hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.16)' }}
          >
            SEU DESEMPENHO ATUAL VS O PANTHEON
          </span>
        </div>

        {/* ── CTA strip — slides in after R5 tooltip appears ── */}
        <div className="px-7 sm:px-10 pb-8">
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(16,185,129,0.10), rgba(6,182,212,0.05))`,
              border:     `1px solid ${EMERALD}34`,
              boxShadow:  `0 0 52px ${EMERALD}12`,
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transition={{ duration: 0.58, delay: 3.4, ease: [0.22, 1, 0.36, 1] as any }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${EMERALD}68, transparent)` }}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5">
              {/* Text side */}
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.20em] uppercase mb-1.5 sm:hidden"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  SEU DESEMPENHO ATUAL VS O PANTHEON
                </p>
                <p className="text-white font-black text-lg sm:text-xl leading-tight">
                  O 1000 VEM COM O{' '}
                  <span style={{ color: EMERALD, textShadow: `0 0 24px ${EMERALD}90` }}>
                    PANTHEON ELITE
                  </span>
                </p>
                <p className="text-slate-600 text-xs mt-1 hidden sm:block">
                  Norma corrige, IA retroalimenta, SRS consolida. Método completo.
                </p>
              </div>

              {/* CTA button with pulsing arrow */}
              <Link
                href="/checkout?plan=proai_plus"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-black text-sm
                           shrink-0 transition-all duration-200 hover:-translate-y-0.5
                           hover:scale-[1.04] active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${EMERALD} 0%, #059669 100%)`,
                  color:      '#000',
                  boxShadow:  `0 0 28px ${EMERALD}55, 0 4px 20px ${EMERALD}30`,
                }}
              >
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-base font-black"
                >
                  →
                </motion.span>
                Garantir Minha Vaga
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
