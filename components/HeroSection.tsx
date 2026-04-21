'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

// ── Palette ───────────────────────────────────────────────────────────────────
const OBSIDIAN = '#0A0A0A';
const PURPLE   = '#7C3AED';
const PURPLE_L = '#a78bfa';
const EMERALD  = '#10B981';
const CYAN     = '#00e5ff';
const NEON_G   = '#00ff80';

// ── Flashcard data (from app study interface) ─────────────────────────────────
const FLASHCARDS = [
  {
    q: 'Qual é a função das mitocôndrias?',
    a: 'Produção de ATP via respiração celular aeróbica',
    subject: 'Biologia', color: '#34d399',
  },
  {
    q: 'Defina a 2ª Lei de Newton',
    a: 'F = m·a — força resultante é proporcional à aceleração',
    subject: 'Física', color: PURPLE_L,
  },
  {
    q: 'O que é o Iluminismo?',
    a: 'Movimento do séc. XVIII que valorizou a razão sobre a fé',
    subject: 'História', color: '#fb923c',
  },
  {
    q: 'Reação de fotossíntese (resumo)',
    a: '6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂',
    subject: 'Biologia', color: '#34d399',
  },
];

// ── Terminal log lines ────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  '> Inicializando FlashAprova v3.1...       ✅',
  '> Carregando curva de Ebbinghaus...       ✅',
  '> Otimizando SRS: Ciclo de Krebs...       ✅',
  '> Analisando lacunas: Eq. Químico...      ⚡',
  '> Agendando revisão: Leis de Newton...    ✅',
  '> Blindando memória: Rev. Francesa...     ✅',
  '> Otimizando: Funções Trigonométricas...  ⚡',
  '> Neural sync — 97% retenção garantida    ✅',
];

// ── Floating concepts ─────────────────────────────────────────────────────────
const CONCEPTS = [
  'Mitocôndria', 'Equilíbrio Químico', 'Orações Subordinadas',
  'Segunda Lei de Newton', 'Fotossíntese', 'Revolução Francesa',
  'Função Quadrática', 'Ciclo de Krebs', 'Imperialismo', 'Hidrólise',
];

// ── Deterministic particles ───────────────────────────────────────────────────
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = lcg(0xabcdef12);
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: rng() * 100,
  size: rng() * 2 + 1,
  duration: rng() * 12 + 8,
  delay: -(rng() * 15),
  opacity: rng() * 0.18 + 0.04,
}));

// ── Glass card ────────────────────────────────────────────────────────────────
function GlassCard({
  children, className = '', style = {},
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: 'rgba(12,8,24,0.84)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(124,58,237,0.28)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Float wrapper ─────────────────────────────────────────────────────────────
function FloatWrapper({ children, delay = 0, intensity = 10 }: {
  children: React.ReactNode; delay?: number; intensity?: number;
}) {
  return (
    <motion.div
      animate={{ y: [-intensity / 2, intensity / 2, -intensity / 2] }}
      transition={{ duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── AI Terminal widget (replaces Métricas de Retenção) ────────────────────────
function TerminalWidget({ className = 'w-60' }: { className?: string }) {
  const [lines, setLines] = useState<string[]>([TERMINAL_LINES[0]]);
  const idxRef = useRef(1);
  useEffect(() => {
    const iv = setInterval(() => {
      const next = TERMINAL_LINES[idxRef.current % TERMINAL_LINES.length];
      idxRef.current += 1;
      setLines((prev) => [...prev, next].slice(-5));
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <GlassCard className={className}>
      <div className="text-xs font-bold mb-2" style={{ color: PURPLE_L }}>
        ⚙️ AI Memory Engine
      </div>
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 8,
          padding: '8px 10px',
          fontFamily: "'JetBrains Mono','Courier New',ui-monospace,monospace",
          fontSize: '9px',
          border: '1px solid rgba(124,58,237,0.18)',
          minHeight: 96,
        }}
      >
        <div style={{ color: `${PURPLE_L}60`, marginBottom: 4 }}>// v3.1 · live</div>
        {lines.map((line, i) => (
          <motion.div
            key={`${i}-${line}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              color: line.includes('✅') ? '#34d399'
                : line.includes('⚡') ? PURPLE_L
                : 'rgba(255,255,255,0.5)',
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line}
          </motion.div>
        ))}
        <motion.span
          style={{ color: PURPLE_L }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >▮</motion.span>
      </div>
    </GlassCard>
  );
}

// ── Concepts widget ───────────────────────────────────────────────────────────
function ConceptsWidget() {
  const [visible, setVisible] = useState([0, 1, 2]);
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible((prev) => {
        const next = (prev[prev.length - 1] + 1) % CONCEPTS.length;
        return [...prev.slice(1), next];
      });
    }, 1800);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex flex-col gap-1.5" style={{ minHeight: 88 }}>
      {visible.map((ci) => (
        <motion.div
          key={ci}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45 }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold text-center"
          style={{
            background: `${PURPLE}1a`,
            border: `1px solid ${PURPLE}45`,
            color: PURPLE_L,
          }}
        >
          🔒 {CONCEPTS[ci]}
        </motion.div>
      ))}
    </div>
  );
}

// ── SVG connection lines ──────────────────────────────────────────────────────
const CONN_LINES = [
  { d: 'M 148,155 C 290,190 390,250 500,308', color: PURPLE_L,  delay: 0,    gradId: 'cg0', cx: 148, cy: 155 },
  { d: 'M 148,455 C 290,420 390,375 500,308', color: '#34d399', delay: 0.75, gradId: 'cg1', cx: 148, cy: 455 },
  { d: 'M 852,155 C 710,190 610,250 500,308', color: '#fb923c', delay: 1.5,  gradId: 'cg2', cx: 852, cy: 155 },
  { d: 'M 852,455 C 710,420 610,375 500,308', color: CYAN,      delay: 2.25, gradId: 'cg3', cx: 852, cy: 455 },
];
const PACKET_DUR   = 2.2; // seconds per packet to travel full path
const PACKETS      = [0, 1, 2]; // 3 staggered packets per line

function ConnectionLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {CONN_LINES.map((l) => (
          <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={l.color} stopOpacity="0.05" />
            <stop offset="45%"  stopColor={l.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </linearGradient>
        ))}
        {CONN_LINES.map((l) => (
          <filter key={`f-${l.gradId}`} id={`glow-${l.gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        {/* Soft glow for endpoint dots */}
        <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Center arrival burst filter */}
        <filter id="center-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {CONN_LINES.map((l, i) => (
        <g key={i}>
          {/* Hidden path reference for animateMotion */}
          <path id={`path-${i}`} d={l.d} fill="none" stroke="none" />

          {/* Static dim base cable */}
          <path
            d={l.d} fill="none"
            stroke={l.color} strokeWidth="0.7"
            strokeOpacity="0.18"
            strokeDasharray="3 9"
          />

          {/* 3 traveling pulse packets along the line */}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <motion.path
                key={`pkt-${p}`}
                d={l.d} fill="none"
                stroke={`url(#${l.gradId})`}
                strokeWidth="2.2"
                filter={`url(#glow-${l.gradId})`}
                initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
                animate={{
                  pathLength: [0, 0.32, 0],
                  pathOffset: [0, 0.68, 1],
                  opacity:    [0, 1,    0],
                }}
                transition={{
                  duration: PACKET_DUR,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: pktDelay,
                  repeatDelay: 0,
                }}
              />
            );
          })}

          {/* 3 bright dots traveling along the path */}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <g key={`dot-${p}`}>
                {/* Glow halo */}
                <circle r="4" fill={l.color} opacity="0.25" filter="url(#dot-glow)">
                  <animateMotion
                    dur={`${PACKET_DUR}s`}
                    repeatCount="indefinite"
                    begin={`${pktDelay}s`}
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1"
                    keyTimes="0;1"
                  >
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;0.35;0"
                    dur={`${PACKET_DUR}s`}
                    begin={`${pktDelay}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    keyTimes="0;0.5;1"
                  />
                </circle>
                {/* Core dot */}
                <circle r="2.2" fill={l.color}>
                  <animateMotion
                    dur={`${PACKET_DUR}s`}
                    repeatCount="indefinite"
                    begin={`${pktDelay}s`}
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1"
                    keyTimes="0;1"
                  >
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${PACKET_DUR}s`}
                    begin={`${pktDelay}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    keyTimes="0;0.5;1"
                  />
                </circle>
              </g>
            );
          })}

          {/* Pulsing origin dot at card corner */}
          <motion.circle
            cx={l.cx} cy={l.cy} r="4"
            fill={l.color}
            filter="url(#dot-glow)"
            animate={{ opacity: [0.25, 0.85, 0.25], r: [3, 5.5, 3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}
          />
          <circle cx={l.cx} cy={l.cy} r="2" fill={l.color} opacity="0.9" />
        </g>
      ))}

      {/* Center MacBook receiver glow — pulses when packets "arrive" */}
      <motion.circle
        cx="500" cy="308" r="7"
        fill={PURPLE_L}
        filter="url(#center-glow)"
        animate={{ opacity: [0.2, 0.75, 0.2], r: [5, 10, 5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Expanding ring */}
      <motion.circle
        cx="500" cy="308" r="14"
        fill="none"
        stroke={PURPLE_L}
        strokeWidth="1.2"
        animate={{ opacity: [0, 0.55, 0], r: [8, 26, 8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Second ring offset */}
      <motion.circle
        cx="500" cy="308" r="20"
        fill="none"
        stroke={PURPLE_L}
        strokeWidth="0.6"
        animate={{ opacity: [0, 0.25, 0], r: [14, 38, 14] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </svg>
  );
}

// ── Dashboard screen (mini replica of the real StudentDashboard) ──────────────
const DASH_AREAS = [
  { icon: '🏛️', label: 'Humanas',    score: 72, cards: 18, color: '#fb923c' },
  { icon: '🔬', label: 'Natureza',   score: 54, cards: 31, color: '#34d399' },
  { icon: '📚', label: 'Linguagens', score: 81, cards:  9, color: '#60a5fa' },
  { icon: '📐', label: 'Matemática', score: 45, cards: 42, color: PURPLE_L  },
];

function DashboardScreen() {
  const done = 32, goal = 50;
  const pct  = Math.round((done / goal) * 100);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: EMERALD, marginBottom: 3 }}>
          FLASHAPROVA
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Meu Foco</div>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: EMERALD, display: 'inline-block', boxShadow: `0 0 4px ${EMERALD}` }} />
          12 dias em sequência · Você está construindo um hábito real
        </div>
      </div>

      {/* Daily progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Meta de hoje</span>
          <span style={{ fontSize: 7, fontWeight: 800, color: CYAN }}>{done} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/ {goal} cards</span></span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: `linear-gradient(90deg, ${CYAN}, ${EMERALD})`, borderRadius: 2 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
          Faltam {goal - done} cards · ~10 min
        </div>
      </div>

      {/* Copiloto card */}
      <div style={{
        background: `${EMERALD}08`,
        border: `1px solid ${EMERALD}28`,
        borderRadius: 8,
        padding: '7px 9px',
        display: 'flex', gap: 6, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${EMERALD}60, ${CYAN}40)`,
          border: `1px solid ${EMERALD}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
        }}>💡</div>
        <div>
          <div style={{ fontSize: 7, fontWeight: 700, color: EMERALD, marginBottom: 2 }}>Copiloto · AiPro+</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Hoje vamos focar em ~10 min de Matemática? É o caminho mais tranquilo para a sua meta de hoje.
          </div>
          <div style={{
            marginTop: 5,
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
            border: `1px solid ${EMERALD}60`,
            borderRadius: 5, padding: '3px 7px',
            fontSize: 7, fontWeight: 700, color: '#fff',
          }}>⚡ Iniciar Sessão · Matemática</div>
        </div>
      </div>

      {/* Stats pills row */}
      <div style={{ display: 'flex', gap: 5 }}>
        {[
          { value: '61%', label: 'EDITAL\nDOMINADO', color: EMERALD },
          { value: '94%', label: 'RETENÇÃO',          color: CYAN    },
          { value: '12🔥', label: 'SEQUÊNCIA',         color: '#fb923c' },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, background: `${s.color}10`, border: `1px solid ${s.color}30`,
            borderRadius: 7, padding: '5px 4px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)', marginTop: 2, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ENEM Areas grid */}
      <div>
        <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 5 }}>
          ÁREAS DISPONÍVEIS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {DASH_AREAS.map((a) => (
            <div key={a.label} style={{
              background: `${a.color}08`,
              border: `1px solid ${a.color}28`,
              borderRadius: 7, padding: '6px 7px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 10 }}>{a.icon}</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#fff' }}>{a.label}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                <motion.div
                  style={{ height: '100%', background: `linear-gradient(90deg, ${a.color}80, ${a.color})`, borderRadius: 2 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${a.score}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)' }}>{a.cards} cards</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: a.color }}>{a.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── App dashboard rendered inside the MacBook screen ─────────────────────────
function AppScreen() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Estudar'>('Estudar');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Auto-switch tabs: 3.5 s on Estudar → 2.5 s on Dashboard → repeat
  useEffect(() => {
    const TAB_DURATIONS: Record<'Dashboard' | 'Estudar', number> = {
      Estudar: 3500,
      Dashboard: 2500,
    };
    const timer = setTimeout(() => {
      setActiveTab((t) => (t === 'Estudar' ? 'Dashboard' : 'Estudar'));
    }, TAB_DURATIONS[activeTab]);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'Estudar') return;
    const t1 = setTimeout(() => setFlipped(true), 2200);
    const t2 = setTimeout(() => {
      setCardIdx((i) => (i + 1) % FLASHCARDS.length);
      setFlipped(false);
    }, 4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cardIdx, activeTab]);

  const card = FLASHCARDS[cardIdx];

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)',
      overflow: 'hidden',
    }}>
      {/* ── macOS-style title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        {/* Tab bar */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {(['Dashboard', 'Estudar'] as const).map((tab) => {
            const isActive = tab === activeTab;
            return (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                  padding: '3px 9px', borderRadius: 6,
                  background: isActive ? 'rgba(124,58,237,0.25)' : 'transparent',
                  border: isActive ? `1px solid ${PURPLE}40` : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >{tab}</div>
            );
          })}
        </div>
        {/* Streak badge */}
        <div style={{
          fontSize: 9, color: '#fb923c', fontWeight: 700,
          background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)',
          padding: '2px 8px', borderRadius: 999, letterSpacing: '0.02em',
        }}>🔥 12</div>
      </div>

      {/* ── Body ── */}
      {activeTab === 'Dashboard' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DashboardScreen />
        </div>
      )}

      {activeTab === 'Estudar' && <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '88px 1fr',
        overflow: 'hidden',
      }}>

        {/* ── Left sidebar ── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '10px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,0.2)',
        }}>
          {/* Logo */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, marginBottom: 6,
            background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: `0 0 12px ${PURPLE}60`,
          }}>⚡</div>
          {/* Nav items */}
          {[
            { icon: '🏠', label: 'Home', active: false },
            { icon: '📚', label: 'Deck', active: true  },
            { icon: '📊', label: 'Stats', active: false },
            { icon: '🤖', label: 'IA', active: false },
          ].map((n) => (
            <div key={n.label} style={{
              width: 40, height: 34, borderRadius: 8,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: n.active ? `${PURPLE}22` : 'transparent',
              border: n.active ? `1px solid ${PURPLE}45` : '1px solid transparent',
              cursor: 'default',
            }}>
              <span style={{ fontSize: 11, color: n.active ? PURPLE_L : 'rgba(255,255,255,0.25)' }}>{n.icon}</span>
              <span style={{ fontSize: 7, color: n.active ? PURPLE_L : 'rgba(255,255,255,0.2)', marginTop: 1 }}>{n.label}</span>
            </div>
          ))}
          {/* ENEM countdown at bottom */}
          <div style={{ marginTop: 'auto', marginBottom: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_L, lineHeight: 1 }}>142</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>dias</div>
            <div style={{ fontSize: 6, color: `${PURPLE_L}80` }}>ENEM</div>
          </div>
        </div>

        {/* ── Main area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 10, gap: 8 }}>

          {/* Top stats row */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {[
              { label: 'Cards hoje', value: '32', sub: 'de 50', color: EMERALD },
              { label: 'Retenção', value: '94%', sub: '+3% semana', color: PURPLE_L },
              { label: 'Sequência', value: '12d', sub: 'recorde!', color: '#fb923c' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '6px 8px',
              }}>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 7, color: `${s.color}80`, marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Flashcard + subject mini-list */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 72px', gap: 8, minHeight: 0 }}>

            {/* 3-D flip card */}
            <div style={{ perspective: 800, minHeight: 0 }}>
              <motion.div
                style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: `linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(124,58,237,0.08) 100%)`,
                  border: `1px solid rgba(0,229,255,0.2)`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: CYAN,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}30`,
                      padding: '2px 6px', borderRadius: 4,
                    }}>PERGUNTA</span>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>{card.subject}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.5, fontWeight: 600, flex: 1 }}>
                    {card.q}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 8,
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>▶</span>
                    Toque para revelar
                  </div>
                </div>

                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(135deg, rgba(0,255,128,0.06) 0%, rgba(16,185,129,0.08) 100%)`,
                  border: `1px solid rgba(0,255,128,0.2)`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{
                    fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: NEON_G,
                    background: `${NEON_G}15`, border: `1px solid ${NEON_G}30`,
                    padding: '2px 6px', borderRadius: 4, marginBottom: 8, alignSelf: 'flex-start',
                  }}>RESPOSTA</span>
                  <div style={{ fontSize: 10, color: '#fff', lineHeight: 1.5, fontWeight: 500, flex: 1 }}>
                    {card.a}
                  </div>
                  {/* Rating row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginTop: 8 }}>
                    {[
                      { label: 'Errei', color: '#ef4444' },
                      { label: 'Hard',  color: '#f97316' },
                      { label: 'Bom',   color: '#3b82f6' },
                      { label: 'Fácil', color: NEON_G    },
                    ].map((b) => (
                      <div key={b.label} style={{
                        fontSize: 7, color: b.color, fontWeight: 700, textAlign: 'center',
                        background: `${b.color}14`, border: `1px solid ${b.color}35`,
                        borderRadius: 5, padding: '3px 2px',
                      }}>{b.label}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Subject mini-list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: '🧬', pct: 78, color: '#34d399' },
                { icon: '⚛️', pct: 54, color: PURPLE_L  },
                { icon: '🏛️', pct: 65, color: '#fb923c' },
                { icon: '🧪', pct: 41, color: CYAN      },
              ].map((s) => (
                <div key={s.icon} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.color}18`,
                  borderRadius: 7, padding: '5px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1,
                }}>
                  <span style={{ fontSize: 12 }}>{s.icon}</span>
                  {/* Radial arc substitute — simple pill bar */}
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, borderRadius: 2 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 1.4, delay: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span style={{ fontSize: 8, color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dot pagination */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
            {FLASHCARDS.map((fc, i) => (
              <motion.div
                key={i}
                animate={{ width: i === cardIdx ? 20 : 5, opacity: i === cardIdx ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                style={{ height: 3, borderRadius: 2, background: i === cardIdx ? fc.color : 'rgba(255,255,255,0.3)' }}
              />
            ))}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ── MacBook frame ─────────────────────────────────────────────────────────────
function MacBookMockup() {
  return (
    <div style={{ width: '100%', maxWidth: 560, position: 'relative' }}>
      {/* Lid */}
      <div style={{
        background: 'linear-gradient(175deg, #2c2c2e 0%, #1c1c1e 100%)',
        borderRadius: '14px 14px 4px 4px',
        padding: '10px 10px 6px',
        boxShadow: `0 0 80px ${PURPLE}28, 0 -2px 0 rgba(255,255,255,0.06) inset, 0 32px 80px rgba(0,0,0,0.8)`,
        border: '1px solid rgba(255,255,255,0.09)',
        borderBottom: 'none',
      }}>
        {/* Camera notch row */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#1a1a1c',
            boxShadow: 'inset 0 0 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          }} />
        </div>

        {/* Screen bezel */}
        <div className="macbook-screen" style={{
          background: '#050b14',
          borderRadius: 8,
          overflow: 'hidden',
          height: 320,
          border: '1px solid rgba(0,0,0,0.5)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          <AppScreen />
        </div>
      </div>

      {/* Hinge bar */}
      <div style={{
        height: 5,
        background: 'linear-gradient(180deg, #3a3a3c 0%, #2c2c2e 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }} />

      {/* Base / keyboard */}
      <div style={{
        background: 'linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%)',
        borderRadius: '2px 2px 14px 14px',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}>
        {/* Trackpad */}
        <div style={{
          width: 90, height: 18, borderRadius: 5,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }} />
      </div>
    </div>
  );
}

// ── Main HeroSection ──────────────────────────────────────────────────────────
export default function HeroSection() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ctaState, setCtaState] = useState<'idle' | 'loading'>('idle');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const handleCtaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (ctaState === 'loading') return;
    setCtaState('loading');
    setTimeout(() => router.push('/onboarding'), 820);
  }, [ctaState, router]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 18 });

  const tlX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const tlY = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);
  const blX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const blY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const trX = useTransform(smoothX, [-0.5, 0.5], [20, -20]);
  const trY = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);
  const brX = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const brY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const nbX = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const nbY = useTransform(smoothY, [-0.5, 0.5], [-3, 3]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set((e.clientX - r.left) / r.width - 0.5);
      mouseY.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @media (max-width: 640px) {
          .macbook-screen { height: 220px !important; }
        }
      `}</style>

      {/* ── Particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, bottom: 0,
              width: p.size, height: p.size,
              background: PURPLE_L, opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 4}px ${PURPLE}80`,
            }}
            animate={{ y: [0, -900] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* Headline block */}
        <motion.div
          className="text-center px-4 sm:px-6 pt-8 sm:pt-14 pb-2 sm:pb-4 mx-auto"
          style={{ maxWidth: 820 }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge */}
          <div
            className="inline-flex flex-wrap justify-center items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-4 sm:mb-8 text-[9px] sm:text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(0,255,115,0.08)', border: '1px solid rgba(0,255,115,0.28)', color: '#00FF73' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#00FF73' }} />
            PAINEL IA <span className="hidden sm:inline">INTELIGENTE</span> • TUTORES IA • <span className="hidden sm:inline">ENGENHARIA DE </span>RETENÇÃO
          </div>

          {/* Secondary header — Light / elegant */}
          <p
            className="font-light"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.45rem)',
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '-0.01em',
              marginBottom: '0.3em',
            }}
          >
            Pare de estudar para{' '}
            <motion.span
              style={{ color: '#7C3AED', fontWeight: 400 }}
              animate={{
                textShadow: [
                  '0 0 10px rgba(124,58,237,0.55), 0 0 28px rgba(124,58,237,0.28)',
                  '0 0 22px rgba(124,58,237,0.9),  0 0 55px rgba(124,58,237,0.45)',
                  '0 0 10px rgba(124,58,237,0.55), 0 0 28px rgba(124,58,237,0.28)',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              esquecer
            </motion.span>
            .
          </p>

          {/* Main headline — Extra Bold / Giant */}
          <h1
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(1.7rem, 4.6vw, 3.5rem)',
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            Não deixe 12 meses de esforço{' '}
            <motion.span
              style={{ color: '#FF8A00' }}
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,138,0,0.7), 0 0 28px rgba(255,138,0,0.35)',
                  '0 0 2px  rgba(255,138,0,0.2), 0 0 4px  rgba(255,138,0,0.1)',
                  '0 0 10px rgba(255,138,0,0.7), 0 0 28px rgba(255,138,0,0.35)',
                  '0 0 2px  rgba(255,138,0,0.1), 0 0 2px  rgba(255,138,0,0.05)',
                  '0 0 18px rgba(255,138,0,1.0), 0 0 50px rgba(255,138,0,0.55)',
                  '0 0 10px rgba(255,138,0,0.7), 0 0 28px rgba(255,138,0,0.35)',
                ],
                opacity: [1, 0.65, 1, 0.8, 1, 1],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.08, 0.14, 0.2, 0.52, 1],
              }}
            >
              sumirem
            </motion.span>
            {' '}em 4 horas de{' '}
            <motion.span
              style={{ color: '#00FF73' }}
              animate={{
                textShadow: [
                  '0 0 12px rgba(0,255,115,0.4),  0 0 32px rgba(0,255,115,0.2)',
                  '0 0 20px rgba(0,255,115,0.65), 0 0 55px rgba(0,255,115,0.3)',
                  '0 0 12px rgba(0,255,115,0.4),  0 0 32px rgba(0,255,115,0.2)',
                ],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            >
              ENEM
            </motion.span>
            .
          </h1>
        </motion.div>

        {/* ── Central scene ── */}
        <div className="relative mx-auto px-4 pb-2" style={{ maxWidth: 1160 }}>

          {/* SVG lines behind everything */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <ConnectionLines />
          </div>

          <div
            className="relative flex items-center justify-center"
            style={{ minHeight: 'clamp(280px, 55vw, 540px)', zIndex: 1 }}
          >

            {/* TL — Arsenal de Revisão */}
            <motion.div
              className="absolute hidden lg:block"
              style={{ left: 0, top: 30, x: tlX, y: tlY }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={0} intensity={10}>
                <GlassCard className="w-60">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    📚 Arsenal de Revisão
                  </div>
                  {[
                    { name: 'Biologia', pct: 78, color: '#34d399' },
                    { name: 'Química',  pct: 54, color: '#fb923c' },
                    { name: 'Física',   pct: 91, color: PURPLE_L  },
                  ].map((s) => (
                    <div key={s.name} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                          {s.name}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: `${s.color}1e`, color: s.color,
                            border: `1px solid ${s.color}48`,
                          }}
                        >
                          Revisão Pendente
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: s.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </FloatWrapper>
            </motion.div>

            {/* BL — AI Memory Engine (replaces Métricas de Retenção) */}
            <motion.div
              className="absolute hidden lg:block"
              style={{ left: 0, bottom: 30, x: blX, y: blY }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={1.4} intensity={8}>
                <TerminalWidget />
              </FloatWrapper>
            </motion.div>

            {/* MacBook center */}
            <motion.div
              className="relative max-w-[260px] sm:max-w-[380px] lg:max-w-[560px]"
              style={{ zIndex: 10, x: nbX, y: nbY, width: '100%' }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <MacBookMockup />
            </motion.div>

            {/* TR — Agenda IA */}
            <motion.div
              className="absolute hidden lg:block"
              style={{ right: 0, top: 30, x: trX, y: trY }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={0.8} intensity={9}>
                <GlassCard className="w-60">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    🤖 Agenda IA
                  </div>
                  {[
                    { time: '14:00', subject: 'Termodinâmica', icon: '⚛️' },
                    { time: '16:30', subject: 'Genética',       icon: '🧬' },
                    { time: '19:00', subject: 'Literatura',     icon: '📖' },
                  ].map((session) => (
                    <div key={session.time}
                      className="flex items-center gap-3 mb-2 p-2.5 rounded-xl"
                      style={{ background: `${PURPLE}12`, border: '1px solid rgba(124,58,237,0.18)' }}
                    >
                      <span className="text-xl">{session.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                          {session.subject}
                        </div>
                        <div className="text-[10px]" style={{ color: PURPLE_L }}>
                          {session.time} · IA otimizada
                        </div>
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </FloatWrapper>
            </motion.div>

            {/* BR — Conceitos Blindados */}
            <motion.div
              className="absolute hidden lg:block"
              style={{ right: 0, bottom: 30, x: brX, y: brY }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={2} intensity={11}>
                <GlassCard className="w-56">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    🔒 Conceitos Blindados
                  </div>
                  <ConceptsWidget />
                </GlassCard>
              </FloatWrapper>
            </motion.div>
          </div>

          {/* ── Mobile floating blocks 2×2 grid — hidden on lg+ ── */}
          <div className="lg:hidden grid grid-cols-2 gap-2 mt-3">
            {/* Arsenal de Revisão */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <GlassCard className="w-full h-full">
                <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>
                  📚 Arsenal de Revisão
                </div>
                {[
                  { name: 'Biologia', pct: 78, color: '#34d399' },
                  { name: 'Química',  pct: 54, color: '#fb923c' },
                  { name: 'Física',   pct: 91, color: PURPLE_L  },
                ].map((s) => (
                  <div key={s.name} className="mb-2">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded-full font-bold"
                        style={{ background: `${s.color}1e`, color: s.color, border: `1px solid ${s.color}48` }}>
                        Pendente
                      </span>
                    </div>
                    <div className="h-0.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </GlassCard>
            </motion.div>

            {/* Agenda IA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <GlassCard className="w-full h-full">
                <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>
                  🤖 Agenda IA
                </div>
                {[
                  { time: '14:00', subject: 'Termodinâmica', icon: '⚛️' },
                  { time: '16:30', subject: 'Genética',      icon: '🧬' },
                  { time: '19:00', subject: 'Literatura',    icon: '📖' },
                ].map((session) => (
                  <div key={session.time}
                    className="flex items-center gap-1.5 mb-1 p-1.5 rounded-xl"
                    style={{ background: `${PURPLE}12`, border: '1px solid rgba(124,58,237,0.18)' }}
                  >
                    <span className="text-sm">{session.icon}</span>
                    <div>
                      <div className="text-[9px] font-semibold" style={{ color: '#ffffff' }}>
                        {session.subject}
                      </div>
                      <div className="text-[8px]" style={{ color: PURPLE_L }}>
                        {session.time} · IA
                      </div>
                    </div>
                  </div>
                ))}
              </GlassCard>
            </motion.div>

            {/* AI Memory Engine */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              <TerminalWidget className="w-full h-full" />
            </motion.div>

            {/* Conceitos Blindados */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <GlassCard className="w-full h-full">
                <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>
                  🔒 Conceitos Blindados
                </div>
                <ConceptsWidget />
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Subheadline + CTA */}
        <motion.div
          className="text-center px-4 sm:px-6 pt-2 pb-8 sm:pb-12 mx-auto"
          style={{ maxWidth: 720 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-base sm:text-lg leading-relaxed mx-auto mb-6 sm:mb-10"
            style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 640 }}
          >
            Estudar por{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              resumos e apostilas
            </span>{' '}
            é o{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              erro que elimina 90% dos candidatos.
            </span>{' '}
            Use a{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              Engenharia de Retenção Ativa
            </span>{' '}
            para blindar sua memória — e garantir seu{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              nome na lista de aprovados.
            </span>
          </p>

          <div className="flex flex-col items-center gap-3">
            {/* ── Industrial High-Ticket CTA ── */}
            <style>{`
              @keyframes cta-scan {
                0%   { transform: translateX(-110%) skewX(-12deg); opacity: 0; }
                15%  { opacity: 0.55; }
                85%  { opacity: 0.55; }
                100% { transform: translateX(210%) skewX(-12deg); opacity: 0; }
              }
              @keyframes cta-pulse-border {
                0%, 100% { box-shadow: 0 0 0px #a855f7, 0 0 18px #a855f730, inset 0 0 0px #a855f700; }
                50%      { box-shadow: 0 0 14px #a855f7, 0 0 32px #a855f755, inset 0 0 8px #a855f715; }
              }
              .cta-scan-btn { animation: cta-pulse-border 2.8s ease-in-out infinite; }
              .cta-scan-btn:hover .cta-scan-line { animation: cta-scan 0.55s ease-in-out; }
              .cta-scan-btn.loading-state { animation: none; opacity: 0.7; cursor: not-allowed; }
            `}</style>
            <button
              onClick={handleCtaClick}
              className={`cta-scan-btn relative inline-flex items-center gap-2 sm:gap-3 overflow-hidden px-5 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]${ctaState === 'loading' ? ' loading-state' : ''}`}
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontWeight: 700,
                color: '#000000',
                background: `linear-gradient(135deg, ${NEON_G} 0%, #00cc5a 100%)`,
                border: 'none',
                borderRadius: '16px',
                boxShadow: `0 0 50px ${NEON_G}55, 0 10px 36px rgba(0,0,0,0.45)`,
              }}
              disabled={ctaState === 'loading'}
            >
              {/* scan line */}
              <span
                className="cta-scan-line pointer-events-none absolute inset-y-0 w-12"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.25), transparent)',
                  left: 0,
                }}
              />
              {/* icon: waveform / activity */}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: '#000000', flexShrink: 0 }}
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              {ctaState === 'loading' ? '[ ACESSANDO NÚCLEO... ]' : '[ DETECTAR VAZAMENTO DE NOTA ]'}
            </button>

            {/* micro-copy terminal */}
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: '10px',
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}
            >
              Acesse seu Raio-X de Memória IA — Diagnóstico dos seus pontos cegos em 3 min
              <span style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.08s' }}> _</span>
            </p>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="relative mx-auto px-4 pb-12 sm:pb-24" style={{ maxWidth: 1160 }}>
          <motion.div
            className="flex flex-wrap justify-center gap-5 sm:gap-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {[
              { n: '97%',    label: 'retenção com SRS + IA',   color: PURPLE_L  },
              { n: '5.700+', label: 'flashcards táticos ENEM', color: '#34d399' },
              { n: '24h',    label: 'para sentir a diferença', color: '#fb923c' },
            ].map(({ n, label, color }) => (
              <div key={n} className="text-center">
                <p className="text-3xl font-black"
                  style={{ color, textShadow: `0 0 20px ${color}60` }}>
                  {n}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

