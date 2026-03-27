'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, animate, useMotionValue, useInView } from 'framer-motion';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GOLD    = '#FFD700';
const EMERALD = '#00F385';
const AMBER   = '#f59e0b';
const CYAN    = '#06b6d4';
const RED     = '#ef4444';

// ─── Competências ──────────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'C1', label: 'Norma Culta',             score: 180, max: 200, weak: false },
  { id: 'C2', label: 'Adequação ao Tema',        score: 160, max: 200, weak: false },
  { id: 'C3', label: 'Argumentação',             score: 140, max: 200, weak: false },
  { id: 'C4', label: 'Coesão Textual',           score: 120, max: 200, weak: false },
  { id: 'C5', label: 'Proposta de Intervenção',  score: 80,  max: 200, weak: true  },
] as const;

const TOTAL_SCORE = COMPETENCIAS.reduce((s, c) => s + c.score, 0); // 680

// ─── Essay segments ────────────────────────────────────────────────────────────
type SegType = 'normal' | 'highlight' | 'correct' | 'error';

const ESSAY: { text: string; type: SegType; marker?: string }[] = [
  { text: 'A questão da ',              type: 'normal' },
  { text: 'desigualdade social',        type: 'highlight' },
  { text: ' no Brasil é um ',           type: 'normal' },
  { text: 'problema estrutural',        type: 'correct', marker: '✓' },
  { text: ', afetando milhões de cidadãos. É ', type: 'normal' },
  { text: 'mister que',                 type: 'error', marker: '✗' },
  { text: ' o Estado implemente políticas públicas efetivas. ', type: 'normal' },
  { text: 'Djamila Ribeiro',            type: 'correct', marker: '✓' },
  { text: ', em "Lugar de Fala", defende a visibilidade das vozes marginalizadas como condição para a ', type: 'normal' },
  { text: 'democracia plena',           type: 'highlight' },
  { text: '. Portanto, ',               type: 'normal' },
  { text: 'o governo deve criar programas', type: 'error', marker: '⚠' },
  { text: ' de inclusão social.',       type: 'normal' },
];

// ─── Scan annotation cycle ─────────────────────────────────────────────────────
const SCAN_ANNOTS = [
  { id: 'C1', text: 'Verificando norma culta…',             color: GOLD    },
  { id: 'C3', text: 'Validando repertório bibliográfico…',   color: EMERALD },
  { id: 'C4', text: 'Analisando coesão e conectivos…',       color: CYAN    },
  { id: 'C5', text: 'Avaliando proposta de intervenção…',    color: AMBER   },
];

// ─── Repertório sugerido ───────────────────────────────────────────────────────
const REPERTORIO = [
  { name: 'Djamila Ribeiro',   work: '"Lugar de Fala"',            used: true  },
  { name: 'Silvio Almeida',    work: '"Racismo Estrutural"',        used: false },
  { name: 'Boaventura Sousa',  work: '"Epistemologias do Sul"',     used: false },
];

// ─── Evolution chart data ──────────────────────────────────────────────────────
const EVO_SCORES = [620, 680, 750, 820, 880];

// ══════════════════════════ SUB-COMPONENTS ════════════════════════════════════

// ── Score count-up ────────────────────────────────────────────────────────────
function ScoreCountUp({ target, color }: { target: number; color: string }) {
  const spanRef  = useRef<HTMLSpanElement>(null);
  const inView   = useInView(spanRef, { once: true, margin: '-50px' });
  const motionN  = useMotionValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(motionN, target, {
      duration: 1.2,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: v => setShown(Math.floor(v)),
    });
    return () => ctrl.stop();
  }, [inView, target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={spanRef} style={{ color, fontFamily: 'ui-monospace, monospace' }}>
      {shown}
    </span>
  );
}

// ── Competência progress bar ───────────────────────────────────────────────────
function CompBar({ score, max, color, delay }: { score: number; max: number; color: string; delay: number }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}70` }}
        initial={{ width: '0%' }}
        whileInView={{ width: `${(score / max) * 100}%` }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1], delay }}
      />
    </div>
  );
}

// ── SVG evolution chart ────────────────────────────────────────────────────────
function EvolutionChart() {
  const W = 280, H = 60;
  const PX = 8, PY = 6;
  const minS = 580, maxS = 920;

  const pts = EVO_SCORES.map((s, i) => ({
    x: PX + (i / (EVO_SCORES.length - 1)) * (W - PX * 2),
    y: H - PY - ((s - minS) / (maxS - minS)) * (H - PY * 2),
  }));

  const dLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dArea = `${dLine} L ${pts.at(-1)!.x},${H} L ${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="normaChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.22" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={dArea} fill="url(#normaChartFill)" />
      {/* Line */}
      <motion.path
        d={dLine}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${GOLD}80)` }}
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.1 }}
      />
      {/* Dots */}
      {pts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x} cy={p.y} r="2.8"
          fill={GOLD}
          style={{ filter: `drop-shadow(0 0 5px ${GOLD})` }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 1.7 + i * 0.07, ease: 'backOut' }}
        />
      ))}
    </svg>
  );
}

// ── Scanner Panel (left column) ────────────────────────────────────────────────
function ScannerPanel() {
  const [annotIdx, setAnnotIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAnnotIdx(p => (p + 1) % SCAN_ANNOTS.length), 2400);
    return () => clearInterval(t);
  }, []);

  const annot = SCAN_ANNOTS[annotIdx];

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        minHeight:            420,
        background:           'rgba(9,9,11,0.58)',
        backdropFilter:       'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border:               `1px solid ${GOLD}22`,
        boxShadow:            `0 0 48px ${GOLD}0a`,
      }}
    >
      {/* Gold shimmer top */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}70, transparent)` }} />

      {/* ── Traffic-light header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[RED, AMBER, '#22c55e'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px] text-slate-600" style={{ fontFamily: 'ui-monospace, monospace' }}>
            norma.scanner.v2 · redacao_001.txt
          </span>
        </div>
        <motion.div
          className="flex items-center gap-1.5 text-[10px] font-bold"
          style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          ANALISANDO
        </motion.div>
      </div>

      {/* ── Essay text + scan line ── */}
      <div className="relative flex-1 px-5 py-6">

        {/* Scan line — animated vertically */}
        <motion.div
          className="absolute inset-x-0 pointer-events-none z-20"
          style={{ height: 1 }}
          animate={{ top: ['18%', '86%'] }}
          transition={{ duration: 3.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        >
          <div
            className="w-full h-px"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${GOLD}CC 35%, ${GOLD} 50%, ${GOLD}CC 65%, transparent 100%)`,
              boxShadow:  `0 0 12px ${GOLD}90, 0 0 24px ${GOLD}40`,
            }}
          />
          {/* Ambient glow above/below the line */}
          <div
            className="absolute inset-x-0 pointer-events-none"
            style={{
              height: 40,
              top: -20,
              background: `linear-gradient(180deg, transparent, ${GOLD}08, transparent)`,
            }}
          />
        </motion.div>

        {/* Essay text (serif, handwritten feel) */}
        <p
          className="relative z-10 leading-[1.9] text-slate-300"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.82rem' }}
        >
          {ESSAY.map((seg, i) => {
            if (seg.type === 'normal') return <span key={i}>{seg.text}</span>;

            if (seg.type === 'highlight') return (
              <span key={i} className="text-white font-semibold">{seg.text}</span>
            );

            if (seg.type === 'correct') return (
              <span key={i} className="relative">
                <span style={{ color: EMERALD, borderBottom: `1px solid ${EMERALD}55` }}>
                  {seg.text}
                </span>
                <sup
                  className="ml-0.5 text-[7px] font-black px-0.5 py-px rounded"
                  style={{ color: EMERALD, background: `${EMERALD}20`, verticalAlign: 'super' }}
                >
                  {seg.marker}
                </sup>
              </span>
            );

            // error
            return (
              <span key={i} className="relative">
                <span style={{ color: '#fca5a5', borderBottom: `1px dashed ${RED}60` }}>
                  {seg.text}
                </span>
                <sup
                  className="ml-0.5 text-[7px] font-black px-0.5 py-px rounded"
                  style={{ color: RED, background: `${RED}20`, verticalAlign: 'super' }}
                >
                  {seg.marker}
                </sup>
              </span>
            );
          })}
        </p>
      </div>

      {/* ── Active annotation chip ── */}
      <div className="px-4 pb-4 shrink-0">
        <motion.div
          key={annotIdx}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: `${annot.color}0d`,
            border:     `1px solid ${annot.color}28`,
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: annot.color }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: annot.color, fontFamily: 'ui-monospace, monospace' }}
          >
            [{annot.id}] {annot.text}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Verdict Panel (right column) ───────────────────────────────────────────────
function VerdictPanel() {
  return (
    <div className="flex flex-col gap-4">

      {/* Competências widget */}
      <div
        className="rounded-2xl p-4"
        style={{
          background:           'rgba(9,9,11,0.58)',
          backdropFilter:       'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:               '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-[10px] font-bold tracking-widest uppercase text-slate-500"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            Análise de Competências
          </p>
          <p className="text-base font-black" style={{ fontFamily: 'ui-monospace, monospace' }}>
            <ScoreCountUp target={TOTAL_SCORE} color={GOLD} />
            <span className="text-slate-600 text-[10px] font-normal ml-0.5">/1000</span>
          </p>
        </div>

        {/* Bars */}
        <div className="flex flex-col gap-3">
          {COMPETENCIAS.map((c, i) => {
            const color = c.weak ? RED : GOLD;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        color,
                        background: `${color}18`,
                        border:     `1px solid ${color}30`,
                      }}
                    >
                      {c.id}
                    </span>
                    <span className="text-[11px] text-slate-500">{c.label}</span>
                    {c.weak && (
                      <span className="text-[8px] font-bold" style={{ color: RED }}>⚠ CRÍTICO</span>
                    )}
                  </div>
                  <span
                    className="text-xs font-black tabular-nums"
                    style={{ color, fontFamily: 'ui-monospace, monospace' }}
                  >
                    <ScoreCountUp target={c.score} color={color} />
                  </span>
                </div>
                <CompBar score={c.score} max={c.max} color={color} delay={i * 0.1} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Veredito da Norma */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${GOLD}08, rgba(9,9,11,0.72))`,
          border:     `1px solid ${GOLD}32`,
          boxShadow:  `0 0 20px ${GOLD}0c`,
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: `${GOLD}1a`, border: `1px solid ${GOLD}40` }}
          >
            ⚖️
          </div>
          <p
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}
          >
            Veredito da Norma
          </p>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {'"'}Sua{' '}
          <span className="text-white font-semibold">proposta de intervenção</span>{' '}
          carece de detalhamento. Foque nos{' '}
          <span style={{ color: GOLD }} className="font-semibold">5 elementos obrigatórios</span>
          {' '}— agente, ação, modo, finalidade e detalhamento — para garantir os{' '}
          <span style={{ color: GOLD }} className="font-bold">200 pontos</span> em C5.{'"'}
        </p>
      </div>

      {/* Repertório sugerido */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(9,9,11,0.45)',
          border:     'rgba(255,255,255,0.06) solid 1px',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💡</span>
          <p
            className="text-[10px] font-bold tracking-widest uppercase text-slate-500"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            Repertório Sugerido
          </p>
          <span
            className="ml-auto text-[8px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: EMERALD, background: `${EMERALD}18`, border: `1px solid ${EMERALD}30` }}
          >
            BLINDAGEM ATIVA
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {REPERTORIO.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: r.used ? EMERALD : 'rgba(255,255,255,0.18)' }}
              />
              <span
                className="text-xs font-semibold leading-none"
                style={{ color: r.used ? EMERALD : 'rgba(255,255,255,0.5)' }}
              >
                {r.name}
              </span>
              <span className="text-[10px] text-slate-700 leading-none">{r.work}</span>
              {r.used && (
                <span
                  className="ml-auto text-[7px] font-black px-1 py-0.5 rounded"
                  style={{ color: EMERALD, background: `${EMERALD}18`, border: `1px solid ${EMERALD}28` }}
                >
                  USADO
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Evolution strip ────────────────────────────────────────────────────────────
function EvolutionStrip() {
  const STATS = [
    { label: 'Redações',  value: '5',   unit: ''    },
    { label: 'Média',     value: '830', unit: 'pts' },
    { label: 'Melhor',    value: '880', unit: 'pts' },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background:           'rgba(9,9,11,0.50)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border:               '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">

        {/* Stats numbers */}
        <div className="flex gap-7 shrink-0">
          {STATS.map(s => (
            <div key={s.label}>
              <p
                className="text-[9px] text-slate-600 mb-0.5 uppercase tracking-widest"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {s.label}
              </p>
              <p
                className="text-xl font-black leading-none"
                style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}
              >
                {s.value}
                {s.unit && (
                  <span className="text-[10px] text-slate-600 font-normal ml-0.5">{s.unit}</span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Chart */}
        <div className="flex-1 w-full min-w-0">
          <p
            className="text-[9px] text-slate-600 mb-2 uppercase tracking-widest"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            Curva de Evolução
          </p>
          <EvolutionChart />
        </div>

        {/* Target badge */}
        <div className="shrink-0 hidden lg:flex flex-col items-center gap-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
              border:     `1px solid ${GOLD}40`,
              boxShadow:  `0 0 20px ${GOLD}20`,
            }}
          >
            <span className="text-2xl font-black" style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}>
              1K
            </span>
          </div>
          <p className="text-[8px] text-slate-600 text-center" style={{ fontFamily: 'ui-monospace, monospace' }}>
            META
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Pillars ───────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: '🖋️',
    title: 'Análise de Repertório',
    desc: 'Validação automática de citações e argumentos bibliográficos para blindar sua C3.',
  },
  {
    icon: '⚖️',
    title: 'Cálculo de Competências',
    desc: 'Nota instantânea baseada nos critérios oficiais da banca examinadora do ENEM.',
  },
  {
    icon: '🛡️',
    title: 'Blindagem de Erros',
    desc: 'Identificação cirúrgica de vícios de linguagem, falhas de coesão e proposta incompleta.',
  },
];

// ─── Main export ───────────────────────────────────────────────────────────────
export default function NormaRedacaoSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Section header ── */}
      <div className="text-center mb-12">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            fontFamily: 'ui-monospace, monospace',
            color:      GOLD,
            background: `${GOLD}10`,
            border:     `1px solid ${GOLD}32`,
          }}
        >
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: GOLD }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          REDAÇÃO NOTA 1000
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          A Prof. Norma não passa{' '}
          <span
            style={{
              background:           `linear-gradient(90deg, ${GOLD}, #FFA500)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
            }}
          >
            a mão na cabeça.
          </span>
        </h2>

        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          A única IA treinada com o rigor da banca examinadora oficial do ENEM.{' '}
          <span className="text-slate-300 font-medium">
            Transforme seu 600 em 1000 com uma análise cirúrgica das 5 competências.
          </span>
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 mb-5">
        <ScannerPanel />
        <VerdictPanel />
      </div>

      {/* ── Evolution strip ── */}
      <div className="mb-8">
        <EvolutionStrip />
      </div>

      {/* ── Pillars ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: 'rgba(9,9,11,0.45)',
              border:     '1px solid rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: i * 0.1, ease: 'easeOut' }}
          >
            <span className="text-xl mt-0.5 shrink-0">{p.icon}</span>
            <div>
              <p className="text-sm font-bold text-white mb-1">{p.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
