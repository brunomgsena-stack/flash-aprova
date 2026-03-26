'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Target, Zap, RefreshCw } from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const VIOLET  = '#7C3AED';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';

// ─── Column data ──────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id:       'input',
    number:   '01',
    header:   '🎯 O INPUT',
    label:    'O Diagnóstico',
    Icon:     Target,
    color:    VIOLET,
    tag:      'Sincronizando Perfil',
    tagColor: VIOLET,
    bullets:  [
      { icon: '🧠', text: 'Scan de Nível: A IA entende onde você está.' },
      { icon: '⚖️', text: 'Ponderação Sisu: Pesos de Medicina/Direito.' },
      { icon: '📉', text: 'Detecção de Gaps: Mapeamento das suas falhas.' },
    ],
    flowColor:  [VIOLET, NEON],         // gradient of outgoing arrow
  },
  {
    id:       'motor',
    number:   '02',
    header:   '⚡ O MOTOR',
    label:    'Flashcards 80/20',
    Icon:     Zap,
    color:    NEON,
    tag:      'Processando Cards Prioritários',
    tagColor: NEON,
    bullets:  [
      { icon: '📦', text: 'Decks Prontos: Zero esforço. Só estude.' },
      { icon: '🧬', text: 'Conteúdo Curado: Só o que realmente cai.' },
      { icon: '⏳', text: 'Repetição Espaçada: Blinda sua memória.' },
    ],
    flowColor:  [NEON, EMERALD],
  },
  {
    id:       'feedback',
    number:   '03',
    header:   '🔄 O FEEDBACK',
    label:    'Inteligência',
    Icon:     RefreshCw,
    color:    EMERALD,
    tag:      'Loop de Melhoria Ativo',
    tagColor: EMERALD,
    bullets:  [
      { icon: '📡', text: 'Radar de Falhas: detecta onde você vacilou.' },
      { icon: '🩺', text: 'Prescrição do Remédio: cards exatos para seu erro.' },
      { icon: '🔁', text: 'Re-calibragem: edital dominado por correção automática.' },
    ],
    flowColor: [EMERALD, VIOLET],       // recursive: back to 01
  },
] as const;

// ─── Pulsing flow line (SVG animated) ─────────────────────────────────────────

function FlowLine({ from, to }: { from: string; to: string }) {
  return (
    <div className="hidden lg:flex items-center justify-center w-16 shrink-0 relative" style={{ marginTop: 72 }}>
      <svg width="64" height="24" viewBox="0 0 64 24" fill="none" overflow="visible">
        <defs>
          <linearGradient id={`grad-${from}-${to}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        {/* Static base line */}
        <path d="M4 12 H52 M44 6 L52 12 L44 18" stroke={`url(#grad-${from}-${to})`}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />

        {/* Animated pulse dot travelling the line */}
        <motion.circle
          r="3"
          fill={to}
          cy="12"
          filter={`drop-shadow(0 0 4px ${to})`}
          animate={{ cx: [4, 52, 4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 0.3 }}
          opacity={0.9}
        />
      </svg>
    </div>
  );
}

// ─── Recursive arc (03 → 01, desktop only) ────────────────────────────────────

function RecursiveArc() {
  return (
    <div className="hidden lg:block absolute -bottom-10 left-0 right-0 pointer-events-none" aria-hidden>
      <svg width="100%" height="36" viewBox="0 0 900 36" preserveAspectRatio="none" overflow="visible">
        <defs>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={EMERALD} />
            <stop offset="50%" stopColor={AMBER} stopOpacity="0.6" />
            <stop offset="100%" stopColor={VIOLET} />
          </linearGradient>
        </defs>

        {/* Curved path */}
        <path d="M870 4 Q870 32 450 32 Q30 32 30 4"
          stroke="url(#arc-grad)" strokeWidth="1" strokeDasharray="5 4"
          fill="none" opacity="0.40" />

        {/* Arrowhead at left end → pointing up back into step 01 */}
        <path d="M24 8 L30 4 L36 8"
          stroke={VIOLET} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />

        {/* Animated travelling dot */}
        <motion.circle r="3" fill={EMERALD} cy="32"
          filter={`drop-shadow(0 0 5px ${EMERALD})`}
          animate={{
            cx:      [870, 450, 30],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        />
      </svg>
    </div>
  );
}

// ─── Status Tag ───────────────────────────────────────────────────────────────

function StatusTag({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Blinking indicator */}
      <motion.span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        className="text-[10px] tracking-widest uppercase"
        style={{ fontFamily: 'ui-monospace, monospace', color, opacity: 0.75 }}
      >
        [ {label} ]
      </span>
    </div>
  );
}

// ─── Single card ──────────────────────────────────────────────────────────────

function EngCard({
  col,
  hovered,
  isMotor,
  onEnter,
  onLeave,
}: {
  col:      typeof COLUMNS[number];
  hovered:  string | null;
  isMotor:  boolean;
  onEnter:  () => void;
  onLeave:  () => void;
}) {
  const dimmed = hovered !== null && hovered !== col.id;
  const active = hovered === col.id;

  return (
    <motion.div
      className="flex-1 rounded-2xl p-5 flex flex-col gap-4 cursor-default relative overflow-hidden"
      style={{
        background:         'rgba(9,9,11,0.60)',       // zinc-950/60
        backdropFilter:     'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:             `1px solid ${active ? col.color + '55' : 'rgba(255,255,255,0.07)'}`,
        boxShadow:          active
          ? isMotor
            ? `0 0 60px ${col.color}35, 0 0 120px ${col.color}15, inset 0 0 30px ${col.color}08`
            : `0 0 32px ${col.color}25`
          : 'none',
      }}
      animate={{ opacity: dimmed ? 0.30 : 1, y: active ? -4 : 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Top shimmer on active */}
      {active && (
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${col.color}88, transparent)` }} />
      )}

      {/* Status tag */}
      <StatusTag label={col.tag} color={col.tagColor} />

      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${col.color}15`,
            border:     `1px solid ${col.color}35`,
            boxShadow:  active ? `0 0 18px ${col.color}40` : 'none',
          }}
        >
          <col.Icon size={18} style={{ color: col.color }} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: col.color, opacity: 0.55, fontFamily: 'ui-monospace, monospace' }}>
            {col.number}
          </p>
          <p className="text-sm font-bold text-white leading-tight">{col.header}</p>
        </div>
      </div>

      {/* Bullets */}
      <ul className="flex flex-col gap-2.5">
        {col.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-base shrink-0 leading-snug">{b.icon}</span>
            <span className="text-xs text-slate-400 leading-snug">{b.text}</span>
          </li>
        ))}
      </ul>

      {/* Bottom label */}
      <div className="mt-auto pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs font-semibold" style={{ color: col.color, opacity: 0.50 }}>
          {col.label}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EcosystemFlow() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-28 pt-4">

      {/* ── Sub-header ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-14">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}>
          &gt; O Processo
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Do diagnóstico à aprovação:{' '}
          <span style={{
            background:           `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
          }}>
            O Ciclo FlashAprova
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Enquanto outros apps são listas de cards, nós construímos um{' '}
          <span className="text-slate-300 font-medium">organismo vivo</span>{' '}
          que evolui com você.
        </p>
      </div>

      {/* ── 3-col engine grid ──────────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-0">

          {COLUMNS.map((col, i) => (
            <div key={col.id} className="contents">
              <EngCard
                col={col}
                hovered={hovered}
                isMotor={col.id === 'motor'}
                onEnter={() => setHovered(col.id)}
                onLeave={() => setHovered(null)}
              />
              {i < COLUMNS.length - 1 && (
                <FlowLine
                  from={col.flowColor[0]}
                  to={col.flowColor[1]}
                />
              )}
            </div>
          ))}
        </div>

        {/* Recursive arc: feedback → input */}
        <RecursiveArc />
      </div>

      {/* ── Loop label ─────────────────────────────────────────────────────── */}
      <p
        className="hidden lg:block text-center text-xs mt-14"
        style={{ fontFamily: 'ui-monospace, monospace', color: EMERALD, opacity: 0.40 }}
      >
        ↺ feedback loop — cada erro alimenta a próxima prescrição
      </p>

    </section>
  );
}
