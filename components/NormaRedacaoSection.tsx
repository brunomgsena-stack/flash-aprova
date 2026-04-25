'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, animate, useMotionValue, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GOLD    = '#FFD700';
const NEON    = '#00FF73';
const PURPLE  = '#a855f7';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';
const ORANGE  = '#f97316';
const RED     = '#ef4444';
const MONO    = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

const NORMA_AVATAR = '/images/tutor-redacao.avif';

// ─── State Machine ─────────────────────────────────────────────────────────────
type Stage = 'WRITING' | 'UPLOAD' | 'PROCESSING' | 'VEREDITO';

const STAGE_DURATIONS: Record<Stage, number> = {
  WRITING:    5200,
  UPLOAD:     3000,
  PROCESSING: 5500,
  VEREDITO:   9000,
};

const NEXT_STAGE: Record<Stage, Stage> = {
  WRITING:    'UPLOAD',
  UPLOAD:     'PROCESSING',
  PROCESSING: 'VEREDITO',
  VEREDITO:   'WRITING',
};

const STAGE_LABELS: Record<Stage, string> = {
  WRITING:    '01 · SÍNTESE',
  UPLOAD:     '02 · ANÁLISE IA',
  PROCESSING: '03 · AUDITORIA COMPLETA',
  VEREDITO:   '03 · AUDITORIA COMPLETA',
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'C1', label: 'Norma Culta',   score: 200, max: 200, color: EMERALD },
  { id: 'C2', label: 'Tema / Argum.', score: 160, max: 200, color: NEON    },
  { id: 'C3', label: 'Organização',   score: 200, max: 200, color: AMBER   },
  { id: 'C4', label: 'Coesão',        score: 200, max: 200, color: ORANGE  },
  { id: 'C5', label: 'Intervenção',   score: 200, max: 200, color: NEON    },
] as const;

const TOTAL_SCORE = 960;
const EVOLUTION = [580, 620, 640, 700, 720, 740, 780, 960];

const ESSAY_TEXT =
  'O analfabetismo funcional no Brasil configura uma ferida estrutural que, ao privar milhões de cidadãos da leitura crítica do mundo, perpetua ciclos de exclusão social e econômica. Segundo o Indicador de Alfabetismo Funcional (INAF), cerca de 29% dos brasileiros adultos não conseguem interpretar textos além do nível mais elementar — cifra que expõe a fragilidade de décadas de política educacional.\n\nDo ponto de vista histórico, a pedagogia de Paulo Freire demonstrou que a leitura da palavra é inseparável da leitura do mundo. Quando o sistema escolar reduz o letramento a decodificação mecânica, reproduz a lógica que o sociólogo Florestan Fernandes chamou de "modernização conservadora": moderniza-se a economia sem redistribuir o capital cultural, mantendo as camadas populares à margem do poder simbólico e político.\n\nSob a ótica econômica, o analfabetismo funcional impacta diretamente a produtividade nacional. Pesquisas do Banco Mundial estimam que cada ano adicional de escolaridade efetiva eleva o PIB per capita em até 10%, evidenciando que o letramento pleno não é apenas direito individual, mas alavanca do desenvolvimento coletivo.\n\nDiante do exposto, é imperativo que o Estado brasileiro enfrente o problema em suas múltiplas dimensões. Urge que o Ministério da Educação, em parceria com municípios, implemente programas de letramento continuado para jovens e adultos, com material contextualizado à realidade local e avaliação diagnóstica semestral, a fim de garantir progressão real de habilidades. Paralelamente, plataformas digitais de acesso público — a exemplo da TV Escola expandida — devem ser fortalecidas para alcançar populações rurais e periféricas, assegurando que o direito à leitura crítica transcenda fronteiras geográficas e socioeconômicas.';

const SCAN_ERRORS: Array<{
  id: string;
  topPct: number;
  side: 'left' | 'right';
  code: string;
  label: string;
  detail: string;
  severity: 'WARNING' | 'OK' | 'CRITICAL';
  color: string;
}> = [
  { id: 'WRN_001', topPct: 28, side: 'right', code: 'C2 · REP-007', label: 'Dado sem precisão da fonte', detail: 'INAF citado sem edição/ano explícito', severity: 'WARNING',  color: ORANGE },
  { id: 'OK_002',  topPct: 52, side: 'left',  code: 'C3 · EST-001', label: 'Estrutura dissertativa ✓',   detail: 'Intro · 3 Des. · Conclusão OK',      severity: 'OK',       color: EMERALD },
  { id: 'OK_003',  topPct: 76, side: 'right', code: 'C5 · INT-001', label: 'Intervenção completa',        detail: 'Agente · Ação · Finalidade ✓',       severity: 'OK',       color: EMERALD },
];

const PROCESS_LOG = [
  { text: '> init motor TRI v4.2...',              color: 'dim'    },
  { text: '> carregando padrão INEP 2024...',      color: 'dim'    },
  { text: '> tokenizando estrutura textual...',    color: 'dim'    },
  { text: '> C1 — Norma Culta...',                 color: 'dim'    },
  { text: '  ✓ C1 200/200 NOMINAL',               color: EMERALD  },
  { text: '> C2 — Argumentação...',               color: 'dim'    },
  { text: '  ! C2 160/200 WARN: REP-007',         color: ORANGE   },
  { text: '> C3 — Organização...',                color: 'dim'    },
  { text: '  ✓ C3 200/200 NOMINAL',               color: EMERALD  },
  { text: '> C4 — Coesão...',                     color: 'dim'    },
  { text: '  ✓ C4 200/200 NOMINAL',               color: EMERALD  },
  { text: '> C5 — Intervenção...',                color: 'dim'    },
  { text: '  ✓ C5 200/200 NOMINAL',               color: EMERALD  },
  { text: '> calculando score TRI...',             color: 'dim'    },
  { text: '> SCORE FINAL: 960 / 1000',            color: GOLD     },
] as const;

// ══════════════════════════ SUB-COMPONENTS ════════════════════════════════════

// ── Counter-up ─────────────────────────────────────────────────────────────────
function CountUp({
  target,
  color,
  size = 'xl',
}: {
  target: number;
  color: string;
  size?: 'xl' | 'lg' | 'sm';
}) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const mv     = useMotionValue(0);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, target, {
      duration: 1.6,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: v => setN(Math.floor(v)),
    });
    return () => ctrl.stop();
  }, [inView, target]); // eslint-disable-line

  const sz =
    size === 'xl' ? 'text-5xl sm:text-6xl' :
    size === 'lg' ? 'text-2xl' : 'text-sm';

  return (
    <span ref={ref} className={`${sz} font-black tabular-nums`} style={{ color, fontFamily: MONO }}>
      {n}
    </span>
  );
}

// ── CPU Status Module ──────────────────────────────────────────────────────────
function StatusModule({ c, staggerDelay }: { c: typeof COMPETENCIAS[number]; staggerDelay: number }) {
  const pct    = Math.round((c.score / c.max) * 100);
  const needsOpt = c.score < 200;
  const filled = Math.round(pct / 10);

  return (
    <motion.div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{
        background: needsOpt ? `${ORANGE}08` : 'rgba(6,8,16,0.55)',
        border: needsOpt ? `1px solid ${ORANGE}45` : '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: staggerDelay, duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <span
        className="text-[8px] font-black shrink-0 px-1.5 py-0.5 rounded w-8 text-center"
        style={{ color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}35`, fontFamily: MONO }}
      >
        {c.id}
      </span>

      <div className="flex gap-[2px] flex-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: 4,
              background: i < filled ? c.color : 'rgba(255,255,255,0.06)',
              boxShadow: i < filled ? `0 0 4px ${c.color}60` : 'none',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: staggerDelay + i * 0.04, duration: 0.15 }}
          />
        ))}
      </div>

      <div className="shrink-0 flex items-baseline gap-0.5">
        <CountUp target={c.score} color={c.color} size="sm" />
        <span className="text-[7px] text-slate-700" style={{ fontFamily: MONO }}>/200</span>
      </div>

      <div className="shrink-0 w-24 text-right">
        {needsOpt ? (
          <motion.span
            className="text-[7px] font-black"
            style={{ color: ORANGE, fontFamily: MONO }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            [!] OPT. REQUIRED
          </motion.span>
        ) : (
          <span className="text-[7px] font-bold" style={{ color: `${c.color}80`, fontFamily: MONO }}>
            ✓ NOMINAL
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Evolution Sparkline ─────────────────────────────────────────────────────────
function EvolutionSparkline() {
  const W = 240, H = 40, pad = 4;
  const min = Math.min(...EVOLUTION);
  const max = Math.max(...EVOLUTION);
  const pts = EVOLUTION.map((v, i) => {
    const x = pad + (i / (EVOLUTION.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = (pad + (W - pad * 2)).toFixed(1);
  const lastY = pad.toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 40, overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity={0.25} />
          <stop offset="100%" stopColor={NEON} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.3, 0.6].map((f, i) => (
        <line key={i} x1={pad} y1={pad + f * (H - pad * 2)} x2={W - pad} y2={pad + f * (H - pad * 2)}
          stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
      ))}
      <polyline points={`${pad},${H - pad} ${pts} ${W - pad},${H - pad}`} fill="url(#sparkGrad)" stroke="none" />
      <polyline points={pts} fill="none" stroke={NEON} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${NEON}80)` }} />
      <circle cx={lastX} cy={lastY} r={3} fill={NEON} style={{ filter: `drop-shadow(0 0 5px ${NEON})` }} />
    </svg>
  );
}

// ── Stage Indicator ─────────────────────────────────────────────────────────────
function StageIndicator({ stage }: { stage: Stage }) {
  const stages: Stage[] = ['WRITING', 'UPLOAD', 'PROCESSING'];
  const displayStage: Stage = stage === 'VEREDITO' ? 'PROCESSING' : stage;
  const currentIdx = stages.indexOf(displayStage);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
      {stages.map((s, i) => {
        const isActive = s === displayStage;
        const isPast   = i < currentIdx;
        return (
          <div key={s} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div className="w-4 sm:w-8 h-px" style={{ background: isPast ? `${PURPLE}50` : 'rgba(255,255,255,0.08)' }} />
            )}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full"
              style={{
                background: isActive ? `${PURPLE}20` : isPast ? `${NEON}08` : 'transparent',
                border: isActive
                  ? `1px solid ${PURPLE}55`
                  : isPast
                  ? `1px solid ${NEON}25`
                  : '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.5s ease',
              }}
            >
              {isPast && <span style={{ color: NEON, fontSize: '0.5rem', lineHeight: 1 }}>✓</span>}
              {isActive && (
                <motion.span
                  className="w-1 h-1 rounded-full inline-block shrink-0"
                  style={{ background: PURPLE }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
              <span
                className="text-[7px] sm:text-[8px] font-black tracking-wider"
                style={{
                  fontFamily: MONO,
                  color: isActive ? PURPLE : isPast ? `${NEON}70` : 'rgba(255,255,255,0.18)',
                }}
              >
                {STAGE_LABELS[s]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════ STAGE COMPONENTS ═════════════════════════════════

// ── Stage 1: WRITING ────────────────────────────────────────────────────────────
function WritingStage() {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      if (idxRef.current < ESSAY_TEXT.length) {
        setDisplayed(ESSAY_TEXT.slice(0, idxRef.current + 1));
        idxRef.current++;
      } else {
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
  }, []);

  const wordCount = displayed.trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        minHeight: 580,
        background: 'rgba(6,8,16,0.95)',
        border: `1px solid ${PURPLE}28`,
        boxShadow: `0 0 70px ${PURPLE}0a`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}55, transparent)` }} />

      {/* Chrome */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[RED, AMBER, EMERALD].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          </div>
          <span className="text-[9px] text-slate-600 hidden sm:block" style={{ fontFamily: MONO }}>
            redacao_draft.txt — nova redação
          </span>
        </div>
        <motion.span
          className="text-[9px] font-bold"
          style={{ color: PURPLE, fontFamily: MONO }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ● DIGITANDO
        </motion.span>
      </div>

      {/* Text area */}
      <div className="flex-1 px-6 sm:px-8 py-6">
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.78rem',
            lineHeight: '1.95',
            color: 'rgba(226,232,240,0.87)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {displayed}
          <motion.span
            style={{ color: PURPLE, fontWeight: 900 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.65, repeat: Infinity }}
          >
            ▮
          </motion.span>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[9px] text-slate-700" style={{ fontFamily: MONO }}>{wordCount} PALAVRAS</span>
        <motion.span className="text-[9px] font-bold" style={{ color: PURPLE, fontFamily: MONO }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
          INSERINDO...
        </motion.span>
      </div>
    </motion.div>
  );
}

// ── Stage 2: UPLOAD ────────────────────────────────────────────────────────────
function UploadStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const W = wrap.clientWidth  || 640;
    const H = wrap.clientHeight || 580;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = [PURPLE, NEON, GOLD, '#ffffff', EMERALD, ORANGE, '#c084fc'];

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; life: number; decay: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 160 }, () => ({
      x:       W * 0.08 + Math.random() * W * 0.84,
      y:       H * 0.25 + Math.random() * H * 0.65,
      vx:      (Math.random() - 0.5) * 2.2,
      vy:      -(Math.random() * 2.8 + 0.7),
      size:    Math.random() * 2.4 + 0.4,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      life:    Math.random(),
      decay:   Math.random() * 0.009 + 0.004,
      opacity: Math.random() * 0.85 + 0.15,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          p.x     = W * 0.08 + Math.random() * W * 0.84;
          p.y     = H * 0.25 + Math.random() * H * 0.65;
          p.life  = Math.random() * 0.5 + 0.5;
          p.vy    = -(Math.random() * 2.8 + 0.7);
          p.vx    = (Math.random() - 0.5) * 2.2;
        }
        ctx.globalAlpha = Math.max(0, p.life) * p.opacity;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ minHeight: 580, background: 'rgba(4,6,14,0.97)', border: `1px solid ${PURPLE}30` }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 84, height: 84, borderRadius: '50%',
            background: `radial-gradient(circle, ${PURPLE}22, transparent)`,
            border: `1.5px solid ${PURPLE}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 48px ${PURPLE}35`,
          }}
        >
          <motion.span
            style={{ fontSize: '2rem', color: PURPLE, display: 'block', lineHeight: 1 }}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↑
          </motion.span>
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: PURPLE, letterSpacing: '0.32em', fontWeight: 900 }}>
            TRANSFERINDO DADOS
          </span>
          <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em' }}>
            redacao_alfab_002.txt → BANCA.IA
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: 220, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: `linear-gradient(90deg, ${PURPLE}, ${NEON})`, borderRadius: 999 }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.8, ease: 'linear' }}
          />
        </div>

        <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: `${PURPLE}70`, letterSpacing: '0.2em' }}>
          CRIPTOGRAFANDO · AES-256
        </span>
      </div>
    </motion.div>
  );
}

// ── Stage 3: PROCESSING ────────────────────────────────────────────────────────
function ProcessingStage() {
  const [scanPct, setScanPct] = useState(0);
  const [log, setLog]         = useState<typeof PROCESS_LOG[number][]>([]);
  const logRef                = useRef<HTMLDivElement>(null);
  const prevPctRef            = useRef(-1);

  useEffect(() => {
    // Scan line loop
    let frame: number;
    let start: number | null = null;
    const CYCLE = 2600;
    const tick  = (ts: number) => {
      if (!start) start = ts;
      const e       = (ts - start) % CYCLE;
      const pct     = e < CYCLE / 2 ? (e / (CYCLE / 2)) * 100 : 100 - ((e - CYCLE / 2) / (CYCLE / 2)) * 100;
      const rounded = Math.round(pct);
      if (rounded !== prevPctRef.current) {
        prevPctRef.current = rounded;
        setScanPct(rounded);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Log lines — capture entry before incrementing i so the updater
    // closure never reads a stale / out-of-bounds index (React 18 concurrent
    // mode can invoke updater functions more than once).
    let i  = 0;
    const id = setInterval(() => {
      if (i < PROCESS_LOG.length) {
        const entry = PROCESS_LOG[i]; // snapshot at call-time
        i++;
        if (entry) {
          setLog(prev => [...prev, entry]);
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }
    }, 310);

    return () => { cancelAnimationFrame(frame); clearInterval(id); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        minHeight: 580,
        background: 'rgba(4,6,14,0.98)',
        border: `1px solid ${PURPLE}38`,
        boxShadow: `0 0 70px ${PURPLE}14`,
      }}
    >
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Scan lines (3, staggered) */}
      {[0, 38, 70].map((offset, i) => (
        <div
          key={i}
          className="absolute inset-x-0 pointer-events-none z-20"
          style={{
            top: `${(scanPct + offset) % 100}%`,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${PURPLE}${['80', '55', '35'][i]}, ${PURPLE}${['CC', '99', '66'][i]}, ${PURPLE}${['80', '55', '35'][i]}, transparent)`,
            boxShadow: `0 0 ${[18, 11, 6][i]}px ${PURPLE}${['90', '60', '35'][i]}`,
          }}
        />
      ))}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${PURPLE}18` }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[RED, AMBER, EMERALD].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          </div>
          <span className="text-[9px] text-slate-600 hidden sm:block" style={{ fontFamily: MONO }}>
            PROCESSADOR CENTRAL · MOTOR TRI v4.2
          </span>
        </div>
        <motion.span className="text-[9px] font-bold" style={{ color: ORANGE, fontFamily: MONO }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.75, repeat: Infinity }}>
          ● PROCESSANDO
        </motion.span>
      </div>

      {/* CPU visual */}
      <div className="relative z-10 flex-1 flex items-center justify-center flex-col gap-8">
        {/* Rotating rings */}
        <div style={{ position: 'relative', width: 150, height: 150 }}>
          {[
            { size: 150, dur: 11, op: '50' },
            { size: 110, dur:  7, op: '35' },
            { size:  72, dur:  4, op: '22' },
          ].map(({ size, dur, op }, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                top: (150 - size) / 2, left: (150 - size) / 2,
                width: size, height: size,
                border: `1px solid ${PURPLE}${op}`,
                borderRadius: '50%',
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          {/* Dashed orbit tick marks */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              style={{
                width: 34, height: 34,
                background: `${PURPLE}22`,
                border: `1px solid ${PURPLE}65`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2,
              }}
              animate={{ boxShadow: [`0 0 8px ${PURPLE}40`, `0 0 28px ${PURPLE}90`, `0 0 8px ${PURPLE}40`] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>⬡</span>
              <span style={{ fontFamily: MONO, fontSize: '0.38rem', color: `${PURPLE}90`, letterSpacing: '0.05em' }}>TRI</span>
            </motion.div>
          </div>
        </div>

        {/* Competency VU bars */}
        <div className="flex items-end gap-4">
          {COMPETENCIAS.map((c, i) => (
            <div key={c.id} className="flex flex-col items-center gap-1.5">
              <motion.div
                style={{ width: 6, background: c.color, borderRadius: 3, boxShadow: `0 0 6px ${c.color}70` }}
                animate={{ height: ['8px', '44px', '20px', '40px', '26px', '44px'] }}
                transition={{ duration: 1.9, delay: i * 0.28, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span style={{ fontFamily: MONO, fontSize: '0.42rem', color: `${c.color}80` }}>{c.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log terminal */}
      <div
        ref={logRef}
        className="relative z-10 shrink-0 px-5 py-3 flex flex-col gap-0.5 overflow-y-auto"
        style={{ maxHeight: 148, borderTop: `1px solid ${PURPLE}15`, scrollbarWidth: 'none' }}
      >
        {log.map((line, i) => {
          if (!line) return null; // guard against undefined during state-transition
          const textColor =
            line?.color === 'dim'
              ? 'rgba(255,255,255,0.28)'
              : (line?.color ?? 'rgba(255,255,255,0.28)');
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{ fontFamily: MONO, fontSize: '0.6rem', color: textColor }}
            >
              {line?.text}
            </motion.div>
          );
        })}
        {log.length < PROCESS_LOG.length && (
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
            style={{ color: PURPLE, fontFamily: MONO, fontSize: '0.6rem' }}>▮</motion.span>
        )}
      </div>
    </motion.div>
  );
}

// ── Stage 4: VEREDITO — Scanner Panel ─────────────────────────────────────────
function ScannerPanel() {
  const [scanPct, setScanPct]   = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const prevPctRef              = useRef(-1);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const CYCLE = 7000;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % CYCLE;
      const pct =
        elapsed < CYCLE / 2
          ? (elapsed / (CYCLE / 2)) * 100
          : 100 - ((elapsed - CYCLE / 2) / (CYCLE / 2)) * 100;
      const rounded = Math.round(pct);

      if (rounded !== prevPctRef.current) {
        const prev = prevPctRef.current;
        prevPctRef.current = rounded;

        // Reset revealed set when scan restarts from top
        if (rounded < 3 && prev > 90) {
          setRevealed(new Set());
        }

        // Reveal errors as scan line passes over them
        const panelY = 12 + (rounded / 100) * 78;
        SCAN_ERRORS.forEach(err => {
          if (panelY >= err.topPct - 2) {
            setRevealed(r => r.has(err.id) ? r : new Set([...r, err.id]));
          }
        });

        setScanPct(rounded);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const scanLineTop = `${12 + (scanPct / 100) * 78}%`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        minHeight: 580,
        background: 'rgba(6,8,16,0.95)',
        border: `1px solid ${PURPLE}25`,
        boxShadow: `0 0 60px ${PURPLE}0a`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}80, transparent)` }} />

      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[RED, AMBER, EMERALD].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          </div>
          <span className="text-[9px] text-slate-600 hidden sm:block" style={{ fontFamily: MONO }}>
            banca.examinadora · redacao_alfab_002.txt
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-[width] duration-150" style={{
              width: `${scanPct}%`,
              background: `linear-gradient(90deg, ${PURPLE}80, ${PURPLE})`,
            }} />
          </div>
          <motion.span className="text-[9px] font-bold" style={{ color: PURPLE, fontFamily: MONO }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
            ● ESCANEANDO
          </motion.span>
        </div>
      </div>

      {/* Essay area */}
      <div className="relative flex-1 px-5 sm:px-7 pt-6 pb-4">
        {/* Scan line */}
        <div className="absolute inset-x-0 pointer-events-none z-20" style={{ top: scanLineTop, height: 1 }}>
          <div className="w-full h-px" style={{
            background: `linear-gradient(90deg, transparent 0%, ${PURPLE}CC 30%, ${PURPLE} 50%, ${PURPLE}CC 70%, transparent 100%)`,
            boxShadow: `0 0 14px ${PURPLE}AA, 0 0 28px ${PURPLE}50`,
          }} />
          <div className="absolute inset-x-0 pointer-events-none" style={{
            height: 64, top: -32,
            background: `linear-gradient(180deg, transparent, ${PURPLE}07, transparent)`,
          }} />
        </div>

        {/* Scan popovers */}
        {SCAN_ERRORS.map(err => (
          <motion.div
            key={err.id}
            className="absolute z-30"
            style={{
              top: `${err.topPct}%`,
              ...(err.side === 'right' ? { right: '0.5rem' } : { left: '0.5rem' }),
              maxWidth: 192,
            }}
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={revealed.has(err.id) ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="rounded-xl p-2.5" style={{
              background: 'rgba(5,7,14,0.97)',
              border: `1px solid ${err.color}40`,
              boxShadow: `0 0 18px ${err.color}18, 0 4px 24px rgba(0,0,0,0.65)`,
            }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <motion.div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: err.color }}
                  animate={err.severity === 'CRITICAL' ? { opacity: [1, 0.15, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-[8px] font-black tracking-wider" style={{ color: err.color, fontFamily: MONO }}>
                  [{err.severity}]
                </span>
                <span className="text-[7px] text-slate-600 ml-auto" style={{ fontFamily: MONO }}>{err.code}</span>
              </div>
              <p className="text-[9px] font-bold text-white leading-tight mb-0.5">{err.label}</p>
              <p className="text-[7px] text-slate-500" style={{ fontFamily: MONO }}>{err.detail}</p>
            </div>
          </motion.div>
        ))}

        {/* Essay ghost text */}
        <div className="relative z-10 flex flex-col gap-4 pr-2" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '0.78rem', lineHeight: '1.85',
          color: 'rgba(226,232,240,0.85)',
        }}>
          <p>
            A{' '}
            <span style={{ color: EMERALD, borderBottom: `1px solid ${EMERALD}50` }}>alfabetização funcional</span>{' '}
            representa, no contexto brasileiro, um desafio estrutural que compromete o pleno exercício da cidadania.
            Segundo dados da{' '}
            <span style={{ color: NEON }} className="font-semibold">UNESCO</span>, cerca de 29% dos brasileiros
            adultos são considerados analfabetos funcionais — indivíduos capazes de decodificar símbolos, mas
            incapazes de interpretar informações do cotidiano de forma eficaz.
          </p>
          <p>
            Historicamente, a fragilidade do sistema educacional público tem sido apontada como causadora desse
            cenário. O sociólogo{' '}
            <span style={{ color: EMERALD }} className="font-semibold">Florestan Fernandes</span>, em sua análise
            das desigualdades brasileiras, evidenciou que a educação foi usada como instrumento de manutenção das
            elites,{' '}
            <span style={{ color: RED, textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: RED + '70' }}>
              excluindo sistematicamente
            </span>{' '}
            as camadas populares do acesso ao conhecimento formal e à mobilidade social.
          </p>
          <p>
            Além disso, a{' '}
            <span style={{ color: ORANGE, textDecoration: 'underline dotted', textDecorationColor: ORANGE + '80' }}>
              precarização do trabalho docente
            </span>{' '}
            e a ausência de políticas públicas continuadas de letramento contribuem para a perpetuação desse quadro.
          </p>
          <p>
            Portanto, é imprescindível que o{' '}
            <span className="text-white">Estado brasileiro</span> implemente políticas integradas de letramento ao
            longo da vida, articulando o{' '}
            <span style={{ color: AMBER }} className="font-medium">Ministério da Educação</span>, organizações da
            sociedade civil e empresas por meio de programas de qualificação, visando garantir o pleno exercício
            da cidadania.
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[9px] text-slate-700" style={{ fontFamily: MONO }}>340 PALAVRAS · 4 PARÁGRAFOS</span>
        <span className="text-[9px] font-bold" style={{ color: PURPLE, fontFamily: MONO }}>SCAN ATIVO</span>
      </div>
    </div>
  );
}

// ── Stage 4: VEREDITO — Score Card ────────────────────────────────────────────
function DossierScoreCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: 'rgba(6,8,16,0.95)',
      border: `1px solid ${NEON}30`,
      boxShadow: `0 0 50px ${NEON}18, 0 0 100px ${NEON}0a`,
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 25%, ${NEON}10 0%, transparent 65%)`,
      }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${NEON}60, transparent)`,
      }} />

      <div className="flex items-center justify-between px-5 pt-5 pb-4 relative z-10">
        <div>
          <p className="text-[8px] font-bold tracking-[0.25em] text-slate-500 mb-1" style={{ fontFamily: MONO }}>
            DOSSIÊ TRI · TOTAL SCORE
          </p>
          <div className="flex items-baseline gap-1">
            <CountUp target={TOTAL_SCORE} color={NEON} size="xl" />
            <span className="text-2xl font-black text-slate-600 ml-1" style={{ fontFamily: MONO }}>/1000</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <motion.div className="flex items-center gap-1.5"
            animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: NEON }} />
            <span className="text-[8px] font-bold tracking-widest" style={{ color: NEON, fontFamily: MONO }}>ANÁLISE OK</span>
          </motion.div>
          <div className="px-2.5 py-1 rounded-lg" style={{ background: `${NEON}10`, border: `1px solid ${NEON}25` }}>
            <span className="text-[8px] font-black" style={{ color: NEON, fontFamily: MONO }}>TOP 5%</span>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      <div className="px-5 py-3 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[7px] font-bold tracking-[0.2em] text-slate-600 uppercase" style={{ fontFamily: MONO }}>
            Performance Log · 8 redações
          </span>
          <span className="text-[8px] font-black" style={{ color: NEON, fontFamily: MONO }}>↑ +380 pts</span>
        </div>
        <EvolutionSparkline />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[7px] text-slate-700" style={{ fontFamily: MONO }}>RED. #1 · 580</span>
          <span className="text-[7px] text-slate-700" style={{ fontFamily: MONO }}>ATUAL · 960</span>
        </div>
      </div>
    </div>
  );
}

// ── Stage 4: VEREDITO — Competency Modules ────────────────────────────────────
function DossierCompetencies() {
  return (
    <div>
      <p className="text-[8px] font-bold tracking-[0.22em] text-slate-600 mb-3 uppercase" style={{ fontFamily: MONO }}>
        Módulos de Competência
      </p>
      <div className="flex flex-col gap-2">
        {COMPETENCIAS.map((c, i) => (
          <StatusModule key={c.id} c={c} staggerDelay={i * 0.12} />
        ))}
      </div>
    </div>
  );
}

// ── Stage 4: VEREDITO — Norma Terminal ────────────────────────────────────────
function DossierNormaTerminal() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'rgba(4,6,14,0.92)',
      border: `1px solid ${GOLD}30`,
      boxShadow: `0 0 28px ${GOLD}10, inset 0 0 40px rgba(0,0,0,0.5)`,
    }}>
      <div className="flex items-center justify-between px-4 py-2" style={{
        background: `${GOLD}0c`, borderBottom: `1px solid ${GOLD}20`,
      }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ border: `1.5px solid ${GOLD}50`, background: '#0d0a1e' }}>
            <Image src={NORMA_AVATAR} alt="Prof.ª Norma" width={32} height={32} className="w-full h-full object-cover" unoptimized />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest" style={{ color: GOLD, fontFamily: MONO }}>
              VEREDITO IA
            </span>
            <span className="text-[7px] font-medium" style={{ color: `${GOLD}70`, fontFamily: MONO }}>
              Prof(a) Norma
            </span>
          </div>
        </div>
        <motion.span className="text-[8px] font-bold px-2 py-0.5 rounded" style={{
          color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}35`, fontFamily: MONO,
        }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
          ● VEREDITO
        </motion.span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[9px] mb-2" style={{ color: `${GOLD}60`, fontFamily: MONO }}>
          $ analyze --student=alfab_002 --deep=true
        </p>
        <div style={{ fontFamily: MONO, fontSize: '0.70rem', lineHeight: '1.75', color: 'rgba(226,232,240,0.88)' }}>
          <span style={{ color: `${GOLD}90` }}>&gt; </span>
          <span style={{ color: ORANGE, fontWeight: 700 }}>C2 REP-003</span>: repertório sem legitimação acadêmica.
          <br />
          <span style={{ color: `${GOLD}90` }}>&gt; </span>
          <span style={{ color: EMERALD }}>C5 PERFEITA — intervenção completa e detalhada.</span>
          <span style={{ color: GOLD }}> ▮</span>
        </div>
      </div>
    </div>
  );
}

// ── Stage 4: VEREDITO — TRI Dossier (desktop) ─────────────────────────────────
function TriDossier() {
  return (
    <div className="flex flex-col gap-4">
      <DossierScoreCard />
      <DossierCompetencies />
      <DossierNormaTerminal />
    </div>
  );
}

// ── Stage 4: VEREDITO wrapper ──────────────────────────────────────────────────
const DOSSIER_BLOCKS = [
  { key: 'score', Component: DossierScoreCard },
  { key: 'comp',  Component: DossierCompetencies },
  { key: 'norma', Component: DossierNormaTerminal },
];

function VeredityStage() {
  const [mobilePhase, setMobilePhase] = useState<'scan' | 'dossier'>('scan');

  useEffect(() => {
    const t = setTimeout(() => setMobilePhase('dossier'), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ height: '100%' }}
    >
      {/* Desktop: side-by-side grid */}
      <div className="hidden lg:grid lg:grid-cols-[1.15fr_1fr] gap-5">
        <ScannerPanel />
        <TriDossier />
      </div>

      {/* Mobile: scanner → veredito blocks (same viewport, no scroll needed) */}
      <div className="lg:hidden" style={{ height: 580, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {mobilePhase === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.4 }}
            >
              <ScannerPanel />
            </motion.div>
          ) : (
            <motion.div
              key="dossier"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {DOSSIER_BLOCKS.map(({ key, Component }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2, duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <Component />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────
export default function NormaRedacaoSection() {
  const [stage, setStage] = useState<Stage>('WRITING');

  useEffect(() => {
    const t = setTimeout(() => setStage(prev => NEXT_STAGE[prev]), STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-10 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: PURPLE, fontFamily: MONO }}>
          &gt; Corretor de Redação IA
        </p>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
          Seja Aprovado com{' '}
          <span style={{
            background: `linear-gradient(90deg, ${PURPLE}, #00FF73)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            +900
          </span>{' '}
          na Redação
        </h2>

        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Descubra <span className="text-white font-bold">falhas invisíveis</span> da sua redação em{' '}
          <span className="text-white font-bold">30 segundos</span>. Tenha um mentor especialista nas{' '}
          <span className="text-white font-bold">5 competências do INEP</span> e a inteligência de um banco de dados de{' '}
          <span className="text-white font-bold">+8.000 redações</span>.
        </p>
      </div>

      {/* Stage indicator */}
      <StageIndicator stage={stage} />

      {/* Animated demo area — fixed height to prevent layout shifts */}
      <div style={{ height: 580, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {stage === 'WRITING'    && <WritingStage    key="writing"    />}
          {stage === 'UPLOAD'     && <UploadStage     key="upload"     />}
          {stage === 'PROCESSING' && <ProcessingStage key="processing" />}
          {stage === 'VEREDITO'   && <VeredityStage   key="veredito"   />}
        </AnimatePresence>
      </div>
    </section>
  );
}
