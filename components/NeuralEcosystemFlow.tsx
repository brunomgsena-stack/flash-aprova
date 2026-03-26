'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, RefreshCw } from 'lucide-react';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const VIOLET  = '#7C3AED';
const EMERALD = '#10b981';

// Hex SVG viewBox: 100×88 units — wide flat-top hex
const HEX_POINTS = '12,2 88,2 98,44 88,86 12,86 2,44';

// ─── Column config ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id:      'input',
    number:  '01',
    header:  '🎯 O INPUT',
    label:   'O Diagnóstico',
    Icon:    Target,
    color:   VIOLET,
    tag:     'ESTADO: MAPEANDO',
    bullets: [
      { icon: '🧠', text: 'Scan de Nível: A IA entende onde você está.' },
      { icon: '⚖️', text: 'Ponderação Sisu: Pesos de Medicina/Direito.' },
      { icon: '📉', text: 'Detecção de Gaps: Mapeamento das suas falhas.' },
    ],
    flowIcons: ['📡', '🧬'],
  },
  {
    id:      'motor',
    number:  '02',
    header:  '⚡ O MOTOR',
    label:   'Flashcards 80/20',
    Icon:    Zap,
    color:   NEON,
    tag:     'ESTADO: PRIORIZANDO',
    bullets: [
      { icon: '📦', text: 'Decks Prontos: Zero esforço. Só estude.' },
      { icon: '🧬', text: 'Conteúdo Curado: Só o que realmente cai.' },
      { icon: '⏳', text: 'Repetição Espaçada: Blinda sua memória.' },
    ],
    flowIcons: ['⚡', '📊'],
  },
  {
    id:      'feedback',
    number:  '03',
    header:  '🔄 O FEEDBACK',
    label:   'Inteligência Recursiva',
    Icon:    RefreshCw,
    color:   EMERALD,
    tag:     'ESTADO: APRENDENDO',
    bullets: [
      { icon: '📡', text: 'Radar de Falhas: detecta onde você vacilou.' },
      { icon: '🩺', text: 'Prescrição do Remédio: cards exatos para seu erro.' },
      { icon: '🔁', text: 'Re-calibragem: edital dominado por correção automática.' },
    ],
    flowIcons: [],
  },
] as const;

// ─── Neural mesh background ───────────────────────────────────────────────────
// Predefined node grid — no JS randomness, deterministic render
const MESH_NODES: [number, number][] = [
  [4,8],[14,18],[24,6],[36,14],[48,5],[60,17],[72,8],[84,22],[95,12],
  [6,38],[18,48],[30,32],[42,52],[54,38],[66,55],[78,42],[90,35],
  [3,70],[16,80],[28,65],[40,82],[52,70],[64,78],[76,62],[88,75],[96,85],
  [22,26],[46,28],[70,30],[22,58],[68,60],
];
const MESH_EDGES: [number,number][] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],
  [9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],
  [17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],
  [0,9],[1,9],[2,10],[3,11],[4,12],[5,13],[6,14],[7,15],[8,16],
  [9,17],[10,18],[11,19],[12,20],[13,21],[14,22],[15,23],[16,25],
  [26,10],[26,11],[27,12],[27,13],[28,14],[28,15],[29,20],[30,21],
];

function NeuralMesh() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Synaptic connections */}
      {MESH_EDGES.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={MESH_NODES[a][0]} y1={MESH_NODES[a][1]}
          x2={MESH_NODES[b][0]} y2={MESH_NODES[b][1]}
          stroke="rgba(255,255,255,0.055)"
          strokeWidth="0.18"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 3 + (i % 4),
            delay: (i % 7) * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Synaptic nodes */}
      {MESH_NODES.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r={0.5}
          fill="rgba(255,255,255,0.20)"
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: 2 + (i % 3),
            delay: (i % 5) * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}

// ─── Animated status tag ──────────────────────────────────────────────────────
function StatusTag({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <motion.span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        style={{
          fontFamily:    'ui-monospace, monospace',
          fontSize:      '9px',
          color,
          opacity:       0.72,
          letterSpacing: '0.10em',
        }}
      >
        [ {label} ]
      </span>
    </div>
  );
}

// ─── Flow connector with travelling particles ─────────────────────────────────
function FlowConnector({
  fromColor,
  toColor,
  icons,
}: {
  fromColor: string;
  toColor:   string;
  icons:     readonly string[];
}) {
  const gradId = `fg-${fromColor.replace('#', '')}-${toColor.replace('#', '')}`;

  return (
    <div
      className="hidden lg:flex items-center justify-center shrink-0 relative"
      style={{ width: 72, marginTop: 120 }}
    >
      <svg width="72" height="32" viewBox="0 0 72 32" fill="none" overflow="visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={fromColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={toColor}   stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Static track */}
        <path
          d="M4 16 H62 M54 9 L62 16 L54 23"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neon pulse dot */}
        <motion.circle
          r="3.5" cy="16" fill={toColor}
          style={{ filter: `drop-shadow(0 0 5px ${toColor})` }}
          animate={{ cx: [4, 62], opacity: [0, 1, 0] }}
          transition={{
            duration:    1.6,
            repeat:      Infinity,
            ease:        'linear',
            repeatDelay: 0.9,
          }}
        />

        {/* Emoji particles */}
        {icons.map((emoji, i) => (
          <motion.text
            key={i}
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="middle"
            cy="16"
            fill="white"
            opacity="0"
            animate={{ x: [4, 62], opacity: [0, 0.85, 0] }}
            transition={{
              duration:    2.0,
              repeat:      Infinity,
              delay:       i * 1.1,
              ease:        'linear',
              repeatDelay: 0.6,
            }}
          >
            {emoji}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}

// ─── Recursive arc (03 → 01) ──────────────────────────────────────────────────
function RecursiveArc() {
  // Points along the quadratic bezier M 92% 6 Q 92% 40 50% 40 Q 8% 40 8% 6
  // For viewBox 0 0 1000 48, the path is:
  // M 940 6 Q 940 42 500 42 Q 60 42 60 6
  const dotKeyframes = {
    cx: [940, 820, 500, 180, 60],
    cy: [6, 40, 42, 40, 6],
    opacity: [0, 0.9, 1, 0.9, 0],
  };

  return (
    <div
      className="hidden lg:block absolute -bottom-12 left-0 right-0 pointer-events-none"
      aria-hidden
    >
      <svg
        width="100%"
        height="52"
        viewBox="0 0 1000 52"
        preserveAspectRatio="none"
        overflow="visible"
      >
        <defs>
          <linearGradient id="arc-ng" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={VIOLET}  stopOpacity="0.7" />
            <stop offset="45%"  stopColor={EMERALD} stopOpacity="0.9" />
            <stop offset="100%" stopColor={VIOLET}  stopOpacity="0.7" />
          </linearGradient>
          <filter id="arc-blur">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
        </defs>

        {/* Shadow glow arc */}
        <path
          d="M 940 6 Q 940 46 500 46 Q 60 46 60 6"
          stroke={EMERALD}
          strokeWidth="4"
          strokeDasharray="8 5"
          fill="none"
          opacity="0.12"
          filter="url(#arc-blur)"
        />

        {/* Main arc */}
        <path
          d="M 940 6 Q 940 42 500 42 Q 60 42 60 6"
          stroke="url(#arc-ng)"
          strokeWidth="1.5"
          strokeDasharray="7 5"
          fill="none"
          opacity="0.65"
          filter="url(#arc-blur)"
        />

        {/* Arrowhead: back into column 01 */}
        <path
          d="M48 12 L60 6 L72 12"
          stroke={VIOLET}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />

        {/* Travelling emerald dot */}
        <motion.circle
          r="5"
          fill={EMERALD}
          style={{ filter: 'drop-shadow(0 0 7px #10b981)' }}
          animate={dotKeyframes}
          transition={{
            duration:    3.8,
            repeat:      Infinity,
            ease:        'easeInOut',
            repeatDelay: 1.2,
          }}
        />

        {/* Loop label */}
        <text
          x="500" y="50"
          textAnchor="middle"
          fontSize="9"
          fill={EMERALD}
          opacity="0.38"
          fontFamily="ui-monospace, monospace"
          letterSpacing="4"
        >
          ↺ FEEDBACK LOOP RECURSIVO
        </text>
      </svg>
    </div>
  );
}

// ─── Hexagonal card ────────────────────────────────────────────────────────────
function HexCard({
  col,
  hovered,
  onEnter,
  onLeave,
  index,
}: {
  col:     typeof COLUMNS[number];
  hovered: string | null;
  onEnter: () => void;
  onLeave: () => void;
  index:   number;
}) {
  const isActive = hovered === col.id;
  const isDimmed = hovered !== null && !isActive;
  const isMotor  = col.id === 'motor';

  return (
    <motion.div
      className="flex-1 relative"
      style={{
        minHeight: 280,
        // drop-shadow respects clip-path and gives the hex its outer glow
        filter: isActive
          ? isMotor
            ? `drop-shadow(0 0 28px ${col.color}70) drop-shadow(0 0 55px ${col.color}30)`
            : `drop-shadow(0 0 20px ${col.color}55)`
          : `drop-shadow(0 0 6px ${col.color}20)`,
      }}
      animate={{ opacity: isDimmed ? 0.22 : 1, y: isActive ? -6 : 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: isDimmed ? 0.22 : 1, y: isActive ? -6 : 0 }}
      viewport={{ once: true, amount: 0.3 }}
      // stagger via transition delay on entrance
      onAnimationComplete={() => {}}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* ── SVG hex shell (border + fill) ───────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 88"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Top shimmer line — active only */}
        {isActive && (
          <motion.line
            x1="12" y1="2" x2="88" y2="2"
            stroke={col.color}
            strokeWidth="0.8"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Border hex */}
        <polygon
          points={HEX_POINTS}
          fill="rgba(9,9,11,0.88)"
          stroke={col.color}
          strokeWidth={isActive ? 0.8 : 0.4}
          strokeOpacity={isActive ? 0.75 : 0.28}
        />

        {/* Corner accent dots */}
        {[
          [12, 2], [88, 2], [98, 44], [88, 86], [12, 86], [2, 44],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r={isActive ? 1.4 : 0.7}
            fill={col.color}
            opacity={isActive ? 0.9 : 0.3}
            animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </svg>

      {/* ── Content (safe zone: px-[17%] keeps text inside hex) ─── */}
      <div className="relative z-10 flex flex-col gap-3.5 py-7 px-[17%]" style={{ minHeight: 280 }}>

        {/* Status tag */}
        <StatusTag label={col.tag} color={col.color} />

        {/* Number + icon + title */}
        <div className="flex items-center gap-2.5">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width:     38,
              height:    38,
              background:`${col.color}18`,
              border:    `1px solid ${col.color}40`,
              boxShadow: isActive ? `0 0 16px ${col.color}40` : 'none',
            }}
          >
            <col.Icon size={16} style={{ color: col.color }} strokeWidth={1.8} />
          </div>
          <div>
            <p
              style={{
                fontFamily:    'ui-monospace, monospace',
                fontSize:      '9px',
                color:          col.color,
                opacity:        0.48,
                letterSpacing:  '0.08em',
              }}
            >
              {col.number}
            </p>
            <p className="text-sm font-bold text-white leading-tight">{col.header}</p>
          </div>
        </div>

        {/* Bullets */}
        <ul className="flex flex-col gap-2 mt-1">
          {col.bullets.map((b, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-1.5"
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 + i * 0.08 }}
            >
              <span className="text-sm shrink-0 leading-snug">{b.icon}</span>
              <span className="text-xs text-slate-400 leading-snug">{b.text}</span>
            </motion.li>
          ))}
        </ul>

        {/* Footer divider + label */}
        <div className="mt-auto pt-3 border-t border-white/5">
          <p
            className="text-xs font-semibold text-center"
            style={{ color: col.color, opacity: 0.42 }}
          >
            {col.label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NeuralEcosystemFlow() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-28 pt-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ fontFamily: 'ui-monospace, monospace', color: NEON }}
        >
          &gt;_ O Processo
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Do diagnóstico à aprovação:{' '}
          <span
            style={{
              background:           `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
            }}
          >
            O Ciclo FlashAprova
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Enquanto outros apps são estáticos, nós construímos o seu{' '}
          <span className="text-slate-300 font-semibold">Segundo Cérebro Pedagógico</span>.
          Um ecossistema vivo que evolui com você.
        </p>
      </motion.div>

      {/* ── Engine wrapper: neural mesh + hexagons + arcs ──────────────────── */}
      <div className="relative">

        {/* Neural mesh lives behind everything */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <NeuralMesh />
        </div>

        {/* Hex grid row */}
        <div className="relative flex flex-col lg:flex-row items-stretch gap-5 lg:gap-0 py-4 px-2">
          {COLUMNS.map((col, i) => (
            <div key={col.id} className="contents">
              <HexCard
                col={col}
                hovered={hovered}
                onEnter={() => setHovered(col.id)}
                onLeave={() => setHovered(null)}
                index={i}
              />
              {i < COLUMNS.length - 1 && (
                <FlowConnector
                  fromColor={col.color}
                  toColor={COLUMNS[i + 1].color}
                  icons={col.flowIcons}
                />
              )}
            </div>
          ))}
        </div>

        {/* Recursive arc under the hexagons */}
        <RecursiveArc />
      </div>

      {/* ── Loop hint label (mobile) ────────────────────────────────────────── */}
      <p
        className="lg:hidden text-center mt-6 text-xs"
        style={{ fontFamily: 'ui-monospace, monospace', color: EMERALD, opacity: 0.40 }}
      >
        ↺ feedback loop recursivo — p3 alimenta p1 continuamente
      </p>

    </section>
  );
}
