'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, animate, useMotionValue, useInView } from 'framer-motion';
import Image from 'next/image';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GOLD    = '#FFD700';
const NEON    = '#00FF73';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';
const ORANGE  = '#f97316';
const RED     = '#ef4444';

const NORMA_AVATAR =
  'https://api.dicebear.com/9.x/lorelei/svg?seed=ProfNorma&backgroundColor=0d0a1e&hair=variant19&earrings=variant02';

// ─── Competências TRI ──────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'C1', label: 'Norma Culta',            score: 160, max: 200, color: EMERALD },
  { id: 'C2', label: 'Tema e Argumentação',     score: 140, max: 200, color: NEON   },
  { id: 'C3', label: 'Organização Textual',     score: 160, max: 200, color: AMBER  },
  { id: 'C4', label: 'Coesão e Conectivos',     score: 120, max: 200, color: ORANGE },
  { id: 'C5', label: 'Proposta de Intervenção', score: 200, max: 200, color: NEON   },
] as const;

const TOTAL_SCORE = COMPETENCIAS.reduce((s, c) => s + c.score, 0); // 780

// ─── Evolution milestones ──────────────────────────────────────────────────────
const EVO = [680, 720, 760, 800, 840, 880, 920, 960, 1000] as const;

// ─── Floating annotation balloons ─────────────────────────────────────────────
const BALLOONS = [
  { top: '11%', text: '✓ CITAÇÃO RELEVANTE',   color: EMERALD, right: true,  delay: 0    },
  { top: '29%', text: '✗ ERRO FATÍDERO',        color: RED,     right: false, delay: 0.4  },
  { top: '52%', text: '⚠ DESENVOLVER C3',       color: AMBER,   right: true,  delay: 0.8  },
  { top: '72%', text: '💡 FORTALECER C5',        color: GOLD,    right: false, delay: 1.2  },
] as const;

// ══════════════════════════ SUB-COMPONENTS ════════════════════════════════════

// ── Counter-up ────────────────────────────────────────────────────────────────
function CountUp({ target, color, size = 'xl' }: { target: number; color: string; size?: 'xl' | 'lg' | 'sm' }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv     = useMotionValue(0);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, target, {
      duration: 1.4, ease: [0.22, 0.61, 0.36, 1],
      onUpdate: v => setN(Math.floor(v)),
    });
    return () => ctrl.stop();
  }, [inView, target]); // eslint-disable-line react-hooks/exhaustive-deps

  const sz = size === 'xl' ? 'text-5xl sm:text-6xl' : size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span ref={ref} className={`${sz} font-black tabular-nums`}
      style={{ color, fontFamily: 'ui-monospace, monospace' }}>
      {n}
    </span>
  );
}

// ── Competência progress bar ───────────────────────────────────────────────────
function CompBar({ score, max, color, delay }: { score: number; max: number; color: string; delay: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}CC, ${color})`, boxShadow: `0 0 8px ${color}70` }}
        initial={{ width: '0%' }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1], delay }}
      />
    </div>
  );
}

// ── Scanner panel (left) ───────────────────────────────────────────────────────
function ScannerPanel() {
  const [scanPct, setScanPct] = useState(0);

  // Simulate scan progress cycling
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const CYCLE = 6000; // ms per full sweep

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % CYCLE;
      const pct = elapsed < CYCLE / 2
        ? (elapsed / (CYCLE / 2)) * 100
        : 100 - ((elapsed - CYCLE / 2) / (CYCLE / 2)) * 100;
      setScanPct(Math.round(pct));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        minHeight:            580,
        background:           'rgba(6,8,16,0.70)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               `1px solid ${GOLD}22`,
        boxShadow:            `0 0 60px ${GOLD}0a`,
      }}
    >
      {/* Gold shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)` }} />

      {/* ── Window chrome ── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[RED, AMBER, EMERALD].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[9px] text-slate-600 hidden sm:block"
            style={{ fontFamily: 'ui-monospace, monospace' }}>
            norma.scanner · redacao_alfab_002.txt
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan progress bar */}
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ width: `${scanPct}%`, background: `linear-gradient(90deg, ${GOLD}80, ${GOLD})` }}
            />
          </div>
          <motion.span
            className="text-[9px] font-bold"
            style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            ● ANALISANDO
          </motion.span>
        </div>
      </div>

      {/* ── Essay text area ── */}
      <div className="relative flex-1 px-5 sm:px-7 pt-6 pb-4">

        {/* Scan line */}
        <motion.div
          className="absolute inset-x-0 pointer-events-none z-20"
          style={{ height: 1 }}
          animate={{ top: ['12%', '88%'] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        >
          <div className="w-full h-px" style={{
            background: `linear-gradient(90deg, transparent 0%, ${GOLD}CC 30%, ${GOLD} 50%, ${GOLD}CC 70%, transparent 100%)`,
            boxShadow:  `0 0 14px ${GOLD}AA, 0 0 28px ${GOLD}50`,
          }} />
          {/* Ambient glow */}
          <div className="absolute inset-x-0 pointer-events-none" style={{
            height: 56, top: -28,
            background: `linear-gradient(180deg, transparent, ${GOLD}07, transparent)`,
          }} />
        </motion.div>

        {/* Floating annotation balloons */}
        {BALLOONS.map((b, i) => (
          <motion.div
            key={i}
            className="absolute z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black tracking-wider whitespace-nowrap"
            style={{
              top:        b.top,
              ...(b.right ? { right: '0.75rem' } : { left: '0.75rem' }),
              color:      b.color,
              background: `${b.color}14`,
              border:     `1px solid ${b.color}38`,
              boxShadow:  `0 0 10px ${b.color}20`,
              fontFamily: 'ui-monospace, monospace',
            }}
            initial={{ opacity: 0, x: b.right ? 10 : -10 }}
            animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.4, delay: b.delay },
              x:       { duration: 0.4, delay: b.delay },
              y:       { duration: 2.8 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: b.delay + 0.5 },
            }}
          >
            {b.text}
          </motion.div>
        ))}

        {/* Essay — 4 paragraphs in serif */}
        <div
          className="relative z-10 flex flex-col gap-4 pr-2"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.78rem', lineHeight: '1.85', color: 'rgba(226,232,240,0.85)' }}
        >
          {/* ¶1 — Introdução */}
          <p>
            A{' '}
            <span style={{ color: EMERALD, borderBottom: `1px solid ${EMERALD}50` }}>alfabetização funcional</span>
            {' '}representa, no contexto brasileiro, um desafio estrutural que compromete o pleno exercício da cidadania. Segundo dados da{' '}
            <span style={{ color: NEON }} className="font-semibold">UNESCO</span>
            , cerca de 29% dos brasileiros adultos são considerados analfabetos funcionais — indivíduos capazes de decodificar símbolos, mas incapazes de interpretar informações do cotidiano de forma eficaz.
          </p>

          {/* ¶2 — Desenvolvimento I */}
          <p>
            Historicamente, a fragilidade do sistema educacional público tem sido apontada como causadora desse cenário. O sociólogo{' '}
            <span style={{ color: EMERALD }} className="font-semibold">Florestan Fernandes</span>
            , em sua análise das desigualdades brasileiras, evidenciou que a educação foi usada como instrumento de manutenção das elites,{' '}
            <span style={{ color: RED, textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: RED + '70' }}>
              excluindo sistematicamente
            </span>
            {' '}as camadas populares do acesso ao conhecimento formal e à mobilidade social.
          </p>

          {/* ¶3 — Desenvolvimento II */}
          <p>
            Além disso, a{' '}
            <span style={{ color: ORANGE, textDecoration: 'underline dotted', textDecorationColor: ORANGE + '80' }}>
              precarização do trabalho docente
            </span>
            {' '}e a ausência de políticas públicas continuadas de letramento contribuem para a perpetuação desse quadro. Estudos do IBGE revelam que municípios com menor investimento per capita apresentam índices{' '}
            <span className="text-white font-semibold">alarmantes</span>
            {' '}de analfabetismo, demonstrando a correlação direta entre recurso financeiro e qualidade do aprendizado.
          </p>

          {/* ¶4 — Conclusão */}
          <p>
            Portanto, para superar esse desafio histórico, é imprescindível que o{' '}
            <span className="text-white">Estado brasileiro</span>
            {' '}implemente políticas integradas de letramento ao longo da vida, articulando o{' '}
            <span style={{ color: AMBER }} className="font-medium">Ministério da Educação</span>
            , organizações da sociedade civil e empresas por meio de programas de qualificação, visando garantir o pleno exercício da cidadania a todos os brasileiros.
          </p>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="px-5 py-3 shrink-0 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[9px] text-slate-700" style={{ fontFamily: 'ui-monospace, monospace' }}>
          340 PALAVRAS · 4 PARÁGRAFOS
        </span>
        <span className="text-[9px] font-bold" style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}>
          ANÁLISE COMPLETA
        </span>
      </div>
    </div>
  );
}

// ── TRI Dossier panel (right) ──────────────────────────────────────────────────
function TriDossier() {
  return (
    <div className="flex flex-col gap-4">

      {/* ── Total Score badge ── */}
      <div
        className="relative rounded-2xl p-5 flex flex-col items-center text-center overflow-hidden"
        style={{
          background: 'rgba(6,8,16,0.70)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${NEON}30`,
          boxShadow: `0 0 50px ${NEON}18, 0 0 100px ${NEON}0a`,
        }}
      >
        {/* Radial ambient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${NEON}10 0%, transparent 65%)` }} />
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}60, transparent)` }} />

        <p className="text-[9px] font-bold tracking-[0.25em] text-slate-500 mb-1 relative z-10"
          style={{ fontFamily: 'ui-monospace, monospace' }}>
          DOSSIÊ TRI · TOTAL SCORE
        </p>

        <div className="relative z-10 my-1">
          <CountUp target={TOTAL_SCORE} color={NEON} size="xl" />
          <span className="text-2xl font-black text-slate-600 ml-1"
            style={{ fontFamily: 'ui-monospace, monospace' }}>/1000</span>
        </div>

        <div className="flex items-center gap-1.5 mt-1 relative z-10">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: NEON }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }} />
          <span className="text-[9px] font-bold tracking-widest"
            style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}>
            ANÁLISE CONCLUÍDA
          </span>
        </div>
      </div>

      {/* ── Competências widget ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(6,8,16,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p className="text-[9px] font-bold tracking-[0.22em] text-slate-600 mb-4 uppercase"
          style={{ fontFamily: 'ui-monospace, monospace' }}>
          Breakdown por Competência
        </p>

        <div className="flex flex-col gap-3.5">
          {COMPETENCIAS.map((c, i) => (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{
                      color: c.color, background: `${c.color}18`,
                      border: `1px solid ${c.color}35`,
                      fontFamily: 'ui-monospace, monospace',
                    }}>
                    {c.id}
                  </span>
                  <span className="text-[11px] text-slate-500">{c.label}</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <CountUp target={c.score} color={c.color} size="sm" />
                  <span className="text-[9px] text-slate-700">/200</span>
                </div>
              </div>
              <CompBar score={c.score} max={c.max} color={c.color} delay={i * 0.1} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Norma feedback box — terminal style ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(4,6,14,0.92)',
          border: `1px solid ${GOLD}30`,
          boxShadow: `0 0 28px ${GOLD}10, inset 0 0 40px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Terminal chrome bar */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: `${GOLD}0c`, borderBottom: `1px solid ${GOLD}20` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full overflow-hidden shrink-0"
              style={{ border: `1.5px solid ${GOLD}50`, background: '#0d0a1e' }}
            >
              <Image src={NORMA_AVATAR} alt="Prof. Norma" width={32} height={32} className="w-full h-full object-cover" unoptimized />
            </div>
            <span
              className="text-[9px] font-black tracking-widest"
              style={{ color: GOLD, fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" }}
            >
              norma@flashaprova ~ veredito
            </span>
          </div>
          <motion.span
            className="text-[8px] font-bold px-2 py-0.5 rounded"
            style={{
              color: GOLD,
              background: `${GOLD}18`,
              border: `1px solid ${GOLD}35`,
              fontFamily: 'ui-monospace, monospace',
            }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            ● VEREDITO
          </motion.span>
        </div>

        {/* Terminal body */}
        <div className="px-4 py-3">
          {/* Prompt line */}
          <p
            className="text-[9px] mb-2"
            style={{
              color: `${GOLD}60`,
              fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
            }}
          >
            $ analyze --student=alfab_002 --deep=true
          </p>
          {/* Output */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
              fontSize: '0.70rem',
              lineHeight: '1.75',
              color: 'rgba(226,232,240,0.88)',
            }}
          >
            <span style={{ color: `${GOLD}90` }}>&gt; </span>
            Cuidado:{' '}
            <span style={{ color: ORANGE, fontWeight: 700 }}>repertório sociocultural mal legitimado</span>
            {' '}na Competência 2 derrubou sua nota.
            <br />
            <span style={{ color: `${GOLD}90` }}>&gt; </span>
            Além disso, o uso excessivo de{' '}
            <span style={{ color: AMBER, fontWeight: 700 }}>orações intercaladas</span>
            {' '}está prejudicando a coesão em C4.
            <br />
            <span style={{ color: `${GOLD}90` }}>&gt; </span>
            <span style={{ color: EMERALD }}>
              C5 PERFEITA — proposta de intervenção completa e detalhada.
            </span>
            <span className="cursor-blink" style={{ color: GOLD }}> ▮</span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Evolution timeline ─────────────────────────────────────────────────────────
function EvolutionTimeline() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView  = useInView(wrapRef, { once: true, margin: '-80px' });

  return (
    <div
      ref={wrapRef}
      className="rounded-2xl p-5 sm:p-7"
      style={{
        background: 'rgba(6,8,16,0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Label */}
      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-6 text-center"
        style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}>
        ▸ SUA JORNADA ATÉ O 1000
      </p>

      {/* Nodes + connectors — horizontally scrollable on mobile */}
      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center" style={{ minWidth: 'max-content', gap: 0 }}>
          {EVO.map((score, i) => {
            const isLast   = i === EVO.length - 1;
            const progress = (score - 680) / (1000 - 680); // 0-1
            const nodeColor = isLast ? GOLD
              : progress > 0.6 ? NEON
              : progress > 0.3 ? AMBER
              : 'rgba(255,255,255,0.25)';

            return (
              <div key={score} className="flex items-center">
                {/* Node */}
                <motion.div
                  className="relative flex flex-col items-center gap-1.5 shrink-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: i * 0.1, ease: 'easeOut' }}
                >
                  {/* Hexagon SVG */}
                  <div className="relative">
                    <svg width={isLast ? 64 : 52} height={isLast ? 56 : 46} viewBox="0 0 64 56" style={{ overflow: 'visible' }}>
                      <path
                        d="M32 2 L62 18 L62 38 L32 54 L2 38 L2 18 Z"
                        fill={`${nodeColor}16`}
                        stroke={nodeColor}
                        strokeWidth={isLast ? 1.8 : 1.2}
                        style={isLast ? { filter: `drop-shadow(0 0 6px ${GOLD}) drop-shadow(0 0 14px ${GOLD}80)` } : {}}
                      />
                      <text
                        x="32" y="32"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isLast ? 11 : 9}
                        fontWeight="900"
                        fill={nodeColor}
                        fontFamily="ui-monospace, monospace"
                      >
                        {score}
                      </text>
                    </svg>
                    {/* Pulse ring on 1000 */}
                    {isLast && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ borderRadius: '0' }}
                        animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <svg width={64} height={56} viewBox="0 0 64 56">
                          <path
                            d="M32 2 L62 18 L62 38 L32 54 L2 38 L2 18 Z"
                            fill="none"
                            stroke={GOLD}
                            strokeWidth="1.5"
                            opacity="0.5"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  {/* Label below node */}
                  {isLast && (
                    <span className="text-[8px] font-black tracking-wider"
                      style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}>
                      META
                    </span>
                  )}
                </motion.div>

                {/* Connector line between nodes */}
                {!isLast && (
                  <motion.div
                    className="shrink-0 h-px"
                    style={{
                      width: 28,
                      background: progress > 0.5
                        ? `linear-gradient(90deg, ${NEON}80, ${AMBER}80)`
                        : `rgba(255,255,255,0.12)`,
                    }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={inView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.3, delay: i * 0.1 + 0.15, ease: 'easeOut' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center mt-4 pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Redações enviadas', value: '5',   color: NEON  },
          { label: 'Nota média',        value: '780', color: AMBER },
          { label: 'Melhor nota',       value: '880', color: GOLD  },
          { label: 'Progresso',         value: '+29%', color: EMERALD },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-xs font-black" style={{ color: s.color, fontFamily: 'ui-monospace, monospace' }}>
              {s.value}
            </p>
            <p className="text-[9px] text-slate-700 mt-0.5" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function NormaRedacaoSection() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ── */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-[9px] font-black tracking-[0.28em] uppercase"
          style={{
            fontFamily: 'ui-monospace, monospace',
            color:      GOLD,
            background: `${GOLD}10`,
            border:     `1px solid ${GOLD}35`,
          }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: GOLD }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          MENTORIA DE ELITE
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight tracking-tight uppercase">
          Análise Cirúrgica de Redação{' '}
          <span
            style={{
              background:           `linear-gradient(90deg, ${GOLD}, #FFA500, ${NEON})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
            }}
          >
            com I.A. baseada no ENEM
          </span>
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
          Tenha a opinião de um especialista em tempo real e{' '}
          <span className="text-white font-semibold">elimine seus erros fatais</span>
          {' '}para o 1000.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 mb-5">
        <ScannerPanel />
        <TriDossier />
      </div>

      {/* ── Evolution timeline ── */}
      <EvolutionTimeline />

    </section>
  );
}
