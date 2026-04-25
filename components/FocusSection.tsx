'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, type Easing } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const EMERALD = '#10b981';
const CYAN    = '#06b6d4';
const VIOLET  = '#7C3AED';
const ORANGE  = '#f97316';
const JETBRAINS = "'JetBrains Mono', 'ui-monospace', monospace";

// ─── Stagger variants ─────────────────────────────────────────────────────────
const grid = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.16, delayChildren: 0.15 },
  },
};
const card = {
  hidden:  { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as Easing } },
};

// ─── Shared card shell ────────────────────────────────────────────────────────
function Card({
  children, color, tooltip, className = '',
}: {
  children: React.ReactNode;
  color: string;
  tooltip?: string;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={card}
      className={`relative rounded-2xl p-5 sm:p-6 overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(ellipse at top left, ${color}1a 0%, rgba(12,12,16,0.97) 65%)`,
        border: `1px solid ${hovered ? color + '70' : color + '28'}`,
        boxShadow: hovered
          ? `0 0 48px ${color}35, 0 0 0 1px ${color}45, inset 0 1px 0 ${color}20`
          : `0 0 20px ${color}12, inset 0 1px 0 ${color}12`,
        transition: 'border-color 0.28s ease, box-shadow 0.28s ease',
      }}
      whileHover={{ scale: 1.018 }}
      transition={{ duration: 0.22 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${hovered ? 'cc' : '70'}, transparent)`,
          transition: 'opacity 0.28s',
        }} />

      {children}

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && tooltip && (
          <motion.div
            className="absolute bottom-3 right-3 pointer-events-none z-20"
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92, transition: { duration: 0.13 } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div
              className="rounded-xl px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}45`,
                color,
                boxShadow: `0 0 14px ${color}28`,
              }}
            >
              {tooltip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 1 — Heatmap de Fragilidades (Radar + Scan Line)
// ─────────────────────────────────────────────────────────────────────────────
const toRad = (d: number) => (d * Math.PI) / 180;
const CX = 90, CY = 90, R = 68;
const FRAG_AXES = [
  { label: 'Química',   deg: -90, v: 0.35, color: ORANGE  },
  { label: 'Física',    deg:  -2, v: 0.48, color: CYAN    },
  { label: 'Biologia',  deg:  70, v: 0.72, color: EMERALD },
  { label: 'História',  deg: 142, v: 0.80, color: VIOLET  },
  { label: 'Geografia', deg: 214, v: 0.68, color: '#a78bfa' },
];
const polar  = (r: number, deg: number) => ({
  x: CX + r * Math.cos(toRad(deg)),
  y: CY + r * Math.sin(toRad(deg)),
});
const toPoly = (pts: { x: number; y: number }[]) =>
  pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

function HeatmapRadar({ inView }: { inView: boolean }) {
  const rings    = [0.25, 0.5, 0.75, 1.0];
  const dataPts  = FRAG_AXES.map(a => polar(a.v * R, a.deg));
  const axisEnds = FRAG_AXES.map(a => polar(R, a.deg));
  const labelPts = FRAG_AXES.map(a => polar(R + 16, a.deg));

  return (
    <div className="relative w-full" style={{ maxWidth: 200, margin: '0 auto' }}>
      {/* Scanning line */}
      <motion.div
        className="absolute pointer-events-none z-10"
        style={{
          left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 5%, ${NEON}55 40%, ${NEON}80 50%, ${NEON}55 60%, transparent 95%)`,
          borderRadius: 1,
        }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
      />

      <svg viewBox="0 0 180 180" className="w-full" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="frag-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Rings */}
        {rings.map(r => (
          <polygon key={r} points={toPoly(FRAG_AXES.map(a => polar(r * R, a.deg)))}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        ))}
        {/* Axes */}
        {axisEnds.map((end, i) => (
          <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
        ))}

        {/* Data polygon — grows from center */}
        <motion.polygon
          points={toPoly(dataPts)}
          fill={`${ORANGE}22`}
          stroke={ORANGE}
          strokeWidth="1.8"
          strokeLinejoin="round"
          filter="url(#frag-glow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.2 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {/* Data dots */}
        {dataPts.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={FRAG_AXES[i].color}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.35, ease: 'backOut' }}
            style={{
              transformOrigin: `${p.x}px ${p.y}px`,
              filter: `drop-shadow(0 0 4px ${FRAG_AXES[i].color})`,
            }}
          />
        ))}

        {/* Labels */}
        {FRAG_AXES.map((axis, i) => (
          <text key={i} x={labelPts[i].x} y={labelPts[i].y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill="rgba(255,255,255,0.55)"
            fontFamily="ui-monospace, monospace">
            {axis.label}
          </text>
        ))}

        {/* Center */}
        <motion.circle cx={CX} cy={CY} r="3" fill={NEON}
          animate={{ r: [3, 5, 3], opacity: [1, 0.3, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${NEON})` }}
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 2 — Cronograma Preditivo
// ─────────────────────────────────────────────────────────────────────────────
const DAYS = [
  { label: 'SEG', status: 'done',     subject: 'Bio',  subject2: 'Mat',  subject3: 'Port', color: EMERALD  },
  { label: 'TER', status: 'done',     subject: 'Quím', subject2: 'Hist', subject3: 'Fís',  color: CYAN     },
  { label: 'QUA', status: 'done',     subject: 'Mat',  subject2: 'Geo',  subject3: 'Bio',  color: '#a78bfa'},
  { label: 'QUI', status: 'done',     subject: 'Fís',  subject2: 'Bio',  subject3: 'Quím', color: ORANGE   },
  { label: 'SEX', status: 'deadline', subject: 'RED',  subject2: 'Port', subject3: 'Mat',  color: NEON     },
  { label: 'SÁB', status: 'upcoming', subject: 'Hist', subject2: 'Quím', subject3: 'Geo',  color: VIOLET   },
  { label: 'DOM', status: 'upcoming', subject: 'Geo',  subject2: 'Fís',  subject3: 'Hist', color: '#34d399'},
] as const;

function CalendarBlock({ day, index, inView }: {
  day: typeof DAYS[number]; index: number; inView: boolean;
}) {
  const done     = day.status === 'done';
  const deadline = day.status === 'deadline';
  const upcoming = day.status === 'upcoming';

  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.07, ease: 'easeOut' }}
    >
      {/* Day label */}
      <span className="text-[9px] font-bold tracking-widest"
        style={{
          fontFamily: JETBRAINS,
          color: deadline ? NEON : done ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
        }}>
        {day.label}
      </span>

      {/* Block 1 — subject */}
      <div
        className="w-full rounded-lg flex items-center justify-center relative"
        style={{
          height: 44,
          background: done ? `${day.color}22` : deadline ? `${NEON}18` : 'rgba(255,255,255,0.02)',
          border: done ? `1px solid ${day.color}50` : deadline ? `1px solid ${NEON}70` : '1px solid rgba(255,255,255,0.06)',
          boxShadow: deadline ? `0 0 16px ${NEON}35` : 'none',
        }}
      >
        <span className="text-[10px] font-black"
          style={{
            color: done ? day.color : deadline ? NEON : 'rgba(255,255,255,0.14)',
            fontFamily: JETBRAINS,
            filter: (done || deadline) ? `drop-shadow(0 0 4px ${done ? day.color : NEON})` : 'none',
          }}>
          {upcoming ? '···' : day.subject}
        </span>

        {/* Done checkmark */}
        {done && (
          <motion.div
            className="absolute -top-2 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: day.color, fontSize: 8 }}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.35 + index * 0.07, type: 'spring', stiffness: 400, damping: 18 }}
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Block 2 — subject2 */}
      <div
        className="w-full rounded-lg flex items-center justify-center"
        style={{
          height: 44,
          background: done ? `${day.color}12` : deadline ? `${NEON}0e` : 'rgba(255,255,255,0.02)',
          border: done ? `1px solid ${day.color}30` : deadline ? `1px solid ${NEON}40` : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-black"
          style={{
            color: done ? `${day.color}bb` : deadline ? `${NEON}bb` : 'rgba(255,255,255,0.14)',
            fontFamily: JETBRAINS,
          }}>
          {upcoming ? '···' : day.subject2}
        </span>
      </div>

      {/* Block 3 — subject3 */}
      <div
        className="w-full rounded-lg flex items-center justify-center"
        style={{
          height: 44,
          background: done ? `${day.color}08` : deadline ? `${NEON}08` : 'rgba(255,255,255,0.02)',
          border: done ? `1px solid ${day.color}20` : deadline ? `1px solid ${NEON}28` : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-black"
          style={{
            color: done ? `${day.color}88` : deadline ? `${NEON}88` : 'rgba(255,255,255,0.14)',
            fontFamily: JETBRAINS,
          }}>
          {upcoming ? '···' : day.subject3}
        </span>
      </div>
    </motion.div>
  );
}

function CalendarWidget({ inView }: { inView: boolean }) {
  // Deadline line slides to Friday (index 4 = 4/6 = ~62.5%)
  const deadlineX = `calc(${(4 / 6) * 100}% + 0px)`;

  return (
    <div className="relative">
      {/* Sliding deadline needle */}
      <motion.div
        className="absolute top-4 bottom-4 w-px pointer-events-none z-10"
        style={{
          background: `linear-gradient(to bottom, transparent, ${NEON}90, ${NEON}, ${NEON}90, transparent)`,
          boxShadow: `0 0 8px ${NEON}`,
        }}
        initial={{ left: '0%', opacity: 0 }}
        animate={inView ? { left: deadlineX, opacity: 1 } : { left: '0%', opacity: 0 }}
        transition={{ duration: 1.1, delay: 0.45, ease: [0.34, 1.2, 0.64, 1] }}
      />

      {/* Days grid */}
      <div className="flex gap-1.5">
        {DAYS.map((day, i) => (
          <CalendarBlock key={day.label} day={day} index={i} inView={inView} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ background: EMERALD }} />
          <span className="text-[9px] text-slate-400" style={{ fontFamily: JETBRAINS }}>Concluído</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ background: NEON }} />
          <span className="text-[9px] text-slate-400" style={{ fontFamily: JETBRAINS }}>Deadline IA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
          <span className="text-[9px] text-slate-400" style={{ fontFamily: JETBRAINS }}>Agendado</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 3 — Nivelamento Inteligente (Animated Progress Bars + Counter)
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = [
  { label: 'Ciências da Natureza', pct: 65, color: '#22c55e',  level: 'Intermediário' },
  { label: 'Ciências Humanas',     pct: 74, color: VIOLET,     level: 'Avançado'      },
  { label: 'Linguagens',           pct: 82, color: CYAN,       level: 'Avançado'      },
  { label: 'Matemática',           pct: 58, color: ORANGE,     level: 'Básico'        },
];

function ProgressBar({ label, pct, color, level, index, inView }: {
  label: string; pct: number; color: string; level: string;
  index: number; inView: boolean;
}) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const delay = 300 + index * 120;
    const duration = 900;
    let timeout: ReturnType<typeof setTimeout>;

    timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * pct));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, pct, index]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 leading-tight">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: `${color}18`, color, fontFamily: JETBRAINS }}>
            {level}
          </span>
          <span className="text-sm font-black tabular-nums"
            style={{ color, fontFamily: JETBRAINS, minWidth: 38, textAlign: 'right',
              textShadow: `0 0 10px ${color}80` }}>
            {count}%
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.09)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}70`,
          }}
          initial={{ width: '0%' }}
          animate={inView ? { width: `${pct}%` } : { width: '0%' }}
          transition={{ duration: 0.9, delay: 0.3 + index * 0.12, ease: [0.34, 1.1, 0.64, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FocusSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="isolate relative max-w-6xl mx-auto px-5 sm:px-10 pt-10 sm:pt-0 pb-24">
      {/* Ambient color blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', left: '-5%', width: 480, height: 480,
          background: `radial-gradient(circle, ${VIOLET}55 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '15%', right: '-5%', width: 420, height: 420,
          background: `radial-gradient(circle, ${CYAN}44 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 500, height: 320,
          background: `radial-gradient(circle, ${NEON}33 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '40%', width: 300, height: 300,
          background: `radial-gradient(circle, ${ORANGE}33 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      {/* ── Header ── */}
      <div className="relative text-center mb-12" style={{ zIndex: 1 }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: NEON, fontFamily: JETBRAINS, textShadow: `0 0 16px ${NEON}80` }}>
          &gt; Mapeamento de Ameaças
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Radar de{' '}
          <span style={{
            background: `linear-gradient(90deg, ${NEON}, ${CYAN}, ${EMERALD})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px ${NEON}50)`,
          }}>
            Lacunas
          </span>
        </h2>
        <p className="text-slate-400 text-base max-w-2xl mx-auto">
          O fim do estudo às cegas. O Radar utiliza a nossa Engenharia de Retenção para encontrar as falhas invisíveis que a TRI do ENEM não perdoa — antes que elas te reprovem.
        </p>
      </div>

      {/* ── 3-card grid ── */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Radar scan — purple horizontal beam cycling over the full grid */}
        {inView && (
          <motion.div
            className="absolute inset-x-0 pointer-events-none z-20"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${VIOLET}30 20%, ${VIOLET}90 50%, ${VIOLET}30 80%, transparent 100%)`,
              boxShadow: `0 0 18px 2px ${VIOLET}50, 0 0 40px 6px ${VIOLET}20`,
              borderRadius: 1,
            }}
            initial={{ top: '-2px', opacity: 0 }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1.2,
              times: [0, 0.05, 0.95, 1],
            }}
          />
        )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch"
        variants={grid}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >

        {/* ── Card 1: Heatmap de Fragilidades ── */}
        <Card color={ORANGE} tooltip="IA detectou falha em Estequiometria.">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: ORANGE, fontFamily: JETBRAINS }}>
                Visão de Raio-X
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily: JETBRAINS }}>Radar de competências ENEM</p>
            </div>
            {/* Live dot */}
            <motion.span className="ml-auto w-2 h-2 rounded-full shrink-0"
              style={{ background: ORANGE }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }} />
          </div>

          <HeatmapRadar inView={inView} />

          <div className="mt-3 grid grid-cols-5 gap-1">
            {FRAG_AXES.map(a => (
              <div key={a.label} className="flex flex-col items-center gap-0.5">
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
                <span className="hidden sm:inline text-[8px] text-slate-700" style={{ fontFamily: JETBRAINS }}>
                  {Math.round(a.v * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Card 2: Nivelamento Inteligente ── */}
        <Card color={CYAN} tooltip="Conteúdo adaptado para nível Intermediário.">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <div>
              <p className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: CYAN, fontFamily: JETBRAINS }}>
                Domínio do Edital
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily: JETBRAINS }}>Progresso por área ENEM</p>
            </div>
            <motion.span className="ml-auto w-2 h-2 rounded-full shrink-0"
              style={{ background: CYAN }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }} />
          </div>

          <div className="flex flex-col gap-4">
            {LEVELS.map((lvl, i) => (
              <ProgressBar
                key={lvl.label}
                {...lvl}
                index={i}
                inView={inView}
              />
            ))}
          </div>

          <div className="mt-4 px-3 py-2.5 rounded-xl"
            style={{ background: `${CYAN}14`, border: `1px solid ${CYAN}40` }}>
            <p className="text-[11px] font-semibold" style={{ color: CYAN }}>
              🧬 Nível geral: <span className="font-black">Intermediário+</span> — subindo
            </p>
          </div>
        </Card>

        {/* ── Card 3: Cronograma Preditivo ── */}
        <Card color={NEON}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: NEON, fontFamily: JETBRAINS }}>
                Diretriz de Ataque
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily: JETBRAINS }}>Agendamento tático pela IA</p>
            </div>
            <motion.span className="ml-auto w-2 h-2 rounded-full shrink-0"
              style={{ background: NEON }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
          </div>

          <CalendarWidget inView={inView} />

          <div className="mt-4 px-3 py-2.5 rounded-xl"
            style={{ background: `${NEON}14`, border: `1px solid ${NEON}40` }}>
            <p className="text-[11px] font-semibold" style={{ color: NEON }}>
              ⏱ Próxima revisão: <span className="font-black">Química</span> — hoje 19h
            </p>
          </div>
        </Card>

      </motion.div>
      </div>
    </section>
  );
}
