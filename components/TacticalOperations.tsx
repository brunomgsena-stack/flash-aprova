'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Design tokens ──────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const EMERALD = '#10b981';
const CYAN    = '#06b6d4';
const VIOLET  = '#7C3AED';
const SILVER  = '#cbd5e1';

// ─── Radar config ────────────────────────────────────────────────────────────
const CX = 100, CY = 100, R_MAX = 72;
const toRad = (d: number) => (d * Math.PI) / 180;
const polarPt = (r: number, deg: number) => ({
  x: CX + r * Math.cos(toRad(deg)),
  y: CY + r * Math.sin(toRad(deg)),
});
const AXES = [
  { label: 'LING', deg: -90, v: 0.72 },
  { label: 'MAT',  deg: -18, v: 0.58 },
  { label: 'CN',   deg:  54, v: 0.65 },
  { label: 'CH',   deg: 126, v: 0.85 },
  { label: 'RED',  deg: 198, v: 0.90 },
];
const toPoly  = (pts: { x: number; y: number }[]) =>
  pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const dataPts  = AXES.map(a => polarPt(a.v * R_MAX, a.deg));
const ringPts  = (r: number) => AXES.map(a => polarPt(r, a.deg));
const axisEnds = AXES.map(a => polarPt(R_MAX, a.deg));
const labelPts = AXES.map(a => polarPt(R_MAX + 14, a.deg));

// ─── Bar data ────────────────────────────────────────────────────────────────
const BARS = [
  { day: 'S', v: 0.65 },
  { day: 'T', v: 0.82 },
  { day: 'Q', v: 0.48 },
  { day: 'Q', v: 0.91 },
  { day: 'S', v: 0.73 },
  { day: 'S', v: 0.58 },
  { day: 'D', v: 0.78 },
];
const MAX_BAR_H = 68;

// ─── Metrics ─────────────────────────────────────────────────────────────────
const METRICS = [
  { label: 'Cards',   sub: 'estudados', value: 2847, suffix: '',  icon: '🃏', color: SILVER,  borderT: `${SILVER}45`  },
  { label: 'Domínio', sub: 'TRI',       value: 73,   suffix: '%', icon: '🧠', color: EMERALD, borderT: `${EMERALD}60` },
  { label: 'Top',     sub: 'vagas',     value: 12,   suffix: '%', icon: '🏆', color: VIOLET,  borderT: `${VIOLET}60`  },
];

// ─── Right-panel blocks ───────────────────────────────────────────────────────
type Bullet = { icon: string; bold: string; rest: string };
type Block  = { icon: string; tag: string; color: string; widget: string | null; bullets: Bullet[] };

const BLOCKS: Block[] = [
  {
    icon: '⚡', tag: 'SÍNTESE DE DOMÍNIO', color: NEON, widget: 'radar',
    bullets: [
      { icon: '🎯', bold: 'Foco no Erro',  rest: 'Identificamos exatamente onde a TRI te penaliza.' },
      { icon: '🧠', bold: 'Mapeamento',    rest: 'O sistema prioriza a correção de lacunas fatais.' },
      { icon: '🛡️', bold: 'Blindagem',     rest: 'Estudo focado em coerência pedagógica.' },
    ],
  },
  {
    icon: '🔄', tag: 'CALIBRAGEM RECURSIVA', color: CYAN, widget: 'bars',
    bullets: [
      { icon: '📈', bold: 'Frequência Inteligente', rest: 'Algoritmo ajustado à sua memória.'                      },
      { icon: '⏱️', bold: 'Timing Perfeito',        rest: 'Cards revisados no momento exato do esquecimento.'      },
      { icon: '🚀', bold: 'Zero Sobrecarga',         rest: 'Só o que você precisa para evoluir hoje.'              },
    ],
  },
  {
    icon: '📈', tag: 'PREVISÃO DE MATURIDADE', color: VIOLET, widget: 'metrics',
    bullets: [
      { icon: '🧬', bold: 'Previsão Matemática', rest: 'Saiba quando estará pronto para Medicina.'                  },
      { icon: '🏆', bold: 'Posicionamento',      rest: 'Gráficos de evolução comparativos de elite.'               },
      { icon: '💎', bold: 'Rumo ao Topo',         rest: 'Acompanhe sua subida para o 1% dos candidatos.'           },
    ],
  },
  {
    icon: '🎯', tag: 'SISTEMA PRONTO', color: NEON, widget: null,
    bullets: [
      { icon: '⚡', bold: 'Setup Flash', rest: 'Seu painel personalizado em menos de 60 segundos.' },
    ],
  },
];

// ─── Particles ───────────────────────────────────────────────────────────────
const PARTICLES: { x: string[]; y: string[]; c: string; d: number; delay: number }[] = [
  { x: ['7%',  '50%', '7%'],  y: ['18%', '58%', '18%'], c: NEON,    d: 3.8, delay: 0.0 },
  { x: ['68%', '15%', '68%'], y: ['12%', '68%', '12%'], c: CYAN,    d: 3.2, delay: 1.1 },
  { x: ['84%', '36%', '84%'], y: ['74%', '22%', '74%'], c: VIOLET,  d: 4.5, delay: 0.5 },
  { x: ['25%', '80%', '25%'], y: ['82%', '14%', '82%'], c: EMERALD, d: 2.9, delay: 2.0 },
  { x: ['72%', '10%', '72%'], y: ['44%', '82%', '44%'], c: CYAN,    d: 3.6, delay: 1.7 },
  { x: ['42%', '88%', '42%'], y: ['90%', '35%', '90%'], c: VIOLET,  d: 4.1, delay: 0.9 },
];

// ─── Status pill ─────────────────────────────────────────────────────────────
function StatusPill({ label, color, delay = 0 }: { label: string; color: string; delay?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay }}
      />
      <span
        className="text-[9px] tracking-widest uppercase hidden sm:inline"
        style={{ fontFamily: 'ui-monospace, monospace', color, opacity: 0.65 }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({ to, suffix = '', duration = 1500 }: { to: number; suffix?: string; duration?: number }) {
  const ref  = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!seen) return;
    const start = performance.now();
    const tick  = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [seen, to, duration]);

  return <span ref={ref}>{val.toLocaleString('pt-BR')}{suffix}</span>;
}

// ─── Radar chart ─────────────────────────────────────────────────────────────
function RadarChart({ inView, glowing }: { inView: boolean; glowing: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1.0].map((r, i) => (
        <polygon key={i} points={toPoly(ringPts(r * R_MAX))}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      ))}
      {axisEnds.map((end, i) => (
        <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y}
          stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
      ))}

      {/* Data polygon */}
      <motion.polygon
        points={toPoly(dataPts)}
        fill={glowing ? `${EMERALD}30` : `${EMERALD}18`}
        stroke={EMERALD}
        strokeWidth={glowing ? 2 : 1.5}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
        style={{ transformOrigin: `${CX}px ${CY}px`, transition: 'fill 0.35s, stroke-width 0.35s' }}
      />

      {/* Pulse overlay */}
      <motion.polygon
        points={toPoly(dataPts)} fill="none"
        stroke={`${NEON}90`} strokeWidth="0.8"
        animate={{ opacity: glowing ? [0.7, 0.1, 0.7] : [0.45, 0, 0.45] }}
        transition={{ duration: glowing ? 1.2 : 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
      />

      {/* Data-point dots */}
      {dataPts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={3} fill={EMERALD}
          initial={{ r: 0, opacity: 0 }}
          animate={inView ? { r: glowing ? 4 : 3, opacity: 1 } : { r: 0, opacity: 0 }}
          transition={{ delay: 0.55 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 ${glowing ? 8 : 4}px ${EMERALD})` }}
        />
      ))}

      {/* Axis labels */}
      {AXES.map((axis, i) => (
        <text key={i} x={labelPts[i].x} y={labelPts[i].y}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fill="rgba(255,255,255,0.35)"
          fontFamily="ui-monospace, monospace">
          {axis.label}
        </text>
      ))}

      {/* Center pulse */}
      <motion.circle cx={CX} cy={CY} r={3} fill={NEON}
        animate={{ r: [3, 5, 3], opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: `drop-shadow(0 0 8px ${NEON})` }}
      />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ inView, glowing }: { inView: boolean; glowing: boolean }) {
  return (
    <div className="flex gap-1.5" style={{ height: 88 }}>
      {BARS.map((bar, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex-1 w-full flex items-end">
            <motion.div
              className="w-full rounded-sm"
              style={{
                background: `linear-gradient(to top, ${CYAN}${glowing ? 'ee' : 'cc'}, #3b82f6${glowing ? '40' : '22'})`,
                boxShadow:  `0 0 ${glowing ? 12 : 6}px ${CYAN}${glowing ? '60' : '35'}`,
                transition: 'box-shadow 0.35s, background 0.35s',
              }}
              initial={{ height: 0 }}
              animate={{ height: inView ? bar.v * MAX_BAR_H : 0 }}
              transition={{ duration: 0.7, delay: 0.45 + i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
          <span className="text-[9px] shrink-0"
            style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.25)' }}>
            {bar.day}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TacticalOperations() {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const inView       = useInView(sectionRef, { once: true, margin: '-80px' });
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const radarGlow   = activeWidget === 'radar';
  const barsGlow    = activeWidget === 'bars';
  const metricsGlow = activeWidget === 'metrics';

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-5 sm:px-10 pb-28 pt-4">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="text-center mb-14">
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: EMERALD, fontFamily: 'ui-monospace, monospace' }}>
          &gt; O Painel
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          A Central de Operações{' '}
          <span style={{
            background: `linear-gradient(90deg, ${EMERALD}, ${NEON})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            da Sua Aprovação.
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Enquanto outros apps te dão estatísticas mortas, o{' '}
          <span className="text-slate-300 font-medium">Panteão de Elite</span>
          {' '}executa um Comando Tático de Dados em tempo real, calibrado pela TRI.
        </p>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

        {/* ── Dashboard console ─────────────────────────────────────────────── */}
        <motion.div
          className="lg:col-span-3 rounded-2xl relative overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.025)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               '1px solid rgba(255,255,255,0.08)',
            boxShadow:            `0 0 60px rgba(16,185,129,0.07), 0 0 120px rgba(16,185,129,0.03)`,
          }}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${EMERALD}55, transparent)` }} />

          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none z-10"
            style={{ background: `linear-gradient(90deg, transparent, ${NEON}28, transparent)` }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: NEON, opacity: 0.4 }} />
            <div className="absolute top-0 left-0 w-px h-full" style={{ background: NEON, opacity: 0.4 }} />
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-px" style={{ background: EMERALD, opacity: 0.4 }} />
            <div className="absolute bottom-0 right-0 w-px h-full" style={{ background: EMERALD, opacity: 0.4 }} />
          </div>

          {/* Floating particles */}
          {PARTICLES.map((p, i) => (
            <motion.div key={i}
              className="absolute w-1 h-1 rounded-full pointer-events-none z-20"
              style={{ background: p.c, boxShadow: `0 0 5px ${p.c}` }}
              animate={{ left: p.x, top: p.y, opacity: [0, 0.65, 0] }}
              transition={{ duration: p.d, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          <div className="p-5 sm:p-6 relative z-0">

            {/* Status bar */}
            <div className="flex items-center gap-4 mb-5 pb-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <StatusPill label="SISTEMA ATIVO"  color={NEON}    delay={0}   />
              <StatusPill label="TRI CALIBRANDO" color={EMERALD} delay={0.4} />
              <StatusPill label="SINCRONIZANDO"  color={CYAN}    delay={0.8} />
              <div className="ml-auto">
                <span className="text-[9px] tabular-nums"
                  style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.18)' }}>
                  v2.4.1 · LIVE
                </span>
              </div>
            </div>

            {/* Top row: Radar + Bar chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

              {/* ── Radar widget ── */}
              <div
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  background:  'rgba(255,255,255,0.02)',
                  border:      `1px solid ${radarGlow ? EMERALD + '45' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow:   radarGlow ? `0 0 28px ${EMERALD}30, inset 0 0 20px ${EMERALD}06` : 'none',
                  transition:  'border-color 0.35s ease, box-shadow 0.35s ease',
                }}
              >
                {/* Emerald top accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${EMERALD}${radarGlow ? 'cc' : '55'}, transparent)`, transition: 'opacity 0.35s' }} />

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: EMERALD, fontFamily: 'ui-monospace, monospace' }}>
                    Radar de Competências
                  </span>
                  <motion.span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: EMERALD }}
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: radarGlow ? 0.6 : 1.4, repeat: Infinity }} />
                </div>
                <div className="w-full aspect-square max-w-[175px] mx-auto">
                  <RadarChart inView={inView} glowing={radarGlow} />
                </div>
              </div>

              {/* ── Bar chart widget ── */}
              <div
                className="rounded-xl p-3 flex flex-col relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border:     `1px solid ${barsGlow ? CYAN + '45' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow:  barsGlow ? `0 0 28px ${CYAN}30, inset 0 0 20px ${CYAN}06` : 'none',
                  transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
                }}
              >
                {/* Cyan top accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${CYAN}${barsGlow ? 'cc' : '55'}, transparent)`, transition: 'opacity 0.35s' }} />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: CYAN, fontFamily: 'ui-monospace, monospace' }}>
                    Evolução Semanal
                  </span>
                  <motion.span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: CYAN }}
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: barsGlow ? 0.6 : 1.6, repeat: Infinity, delay: 0.4 }} />
                </div>
                <div className="flex-1 flex items-end">
                  <div className="w-full">
                    <BarChart inView={inView} glowing={barsGlow} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Metric cards ── */}
            <div
              className="grid grid-cols-3 gap-3 rounded-xl p-1"
              style={{
                boxShadow:  metricsGlow ? `0 0 30px ${VIOLET}20` : 'none',
                transition: 'box-shadow 0.35s ease',
              }}
            >
              {METRICS.map((m, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl p-3 text-center relative overflow-hidden"
                  style={{
                    background:      `${m.color}07`,
                    borderLeft:      `1px solid ${m.color}18`,
                    borderRight:     `1px solid ${m.color}18`,
                    borderBottom:    `1px solid ${m.color}18`,
                    borderTop:       `2px solid ${metricsGlow ? m.borderT.replace(/[0-9a-f]{2}$/, 'aa') : m.borderT}`,
                    transition:      'border-top-color 0.35s ease',
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                  transition={{ duration: 0.5, delay: 0.65 + i * 0.1, ease: 'easeOut' }}
                >
                  <div className="text-base mb-1.5">{m.icon}</div>
                  <div
                    className="text-xl sm:text-2xl font-black tabular-nums leading-none mb-1"
                    style={{ color: m.color, filter: `drop-shadow(0 0 ${metricsGlow ? 12 : 8}px ${m.color}60)`, transition: 'filter 0.35s' }}
                  >
                    <CountUp to={m.value} suffix={m.suffix} />
                  </div>
                  <div className="text-[10px] text-white/40 leading-tight"
                    style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {m.label}<br />{m.sub}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </motion.div>

        {/* ── Right panel — Command blocks ─────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {BLOCKS.map((b, i) => (
            <motion.div
              key={i}
              className="rounded-xl p-4 cursor-default"
              style={{
                background:           activeWidget === b.widget && b.widget
                  ? `${b.color}08`
                  : 'rgba(255,255,255,0.025)',
                backdropFilter:       'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border:               `1px solid ${activeWidget === b.widget && b.widget ? b.color + '30' : b.color + '15'}`,
                borderTop:            `2px solid ${b.color}40`,
                boxShadow:            activeWidget === b.widget && b.widget ? `0 0 20px ${b.color}15` : 'none',
                transition:           'background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
              onMouseEnter={() => b.widget && setActiveWidget(b.widget)}
              onMouseLeave={() => setActiveWidget(null)}
            >
              {/* Terminal tag */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm leading-none">{b.icon}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: b.color, fontFamily: 'ui-monospace, monospace' }}>
                  [ {b.tag} ]
                </span>
              </div>

              {/* Bullet list */}
              <ul className="flex flex-col gap-2">
                {b.bullets.map((bullet, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-sm shrink-0 leading-snug">{bullet.icon}</span>
                    <span className="text-xs leading-snug">
                      <span className="text-white/80 font-semibold">{bullet.bold}:</span>
                      {' '}
                      <span className="text-slate-500">{bullet.rest}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* Bottom accent */}
              <div className="mt-3 h-px"
                style={{ background: `linear-gradient(90deg, ${b.color}30, transparent)` }} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
