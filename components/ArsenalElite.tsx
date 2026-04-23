'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const NEON      = '#00FF73';
const VIOLET    = '#7C3AED';
const ORANGE    = '#FF8A00';
const CYAN      = '#06b6d4';
const JETBRAINS = "'JetBrains Mono', ui-monospace, monospace";

// ─── Arsenal items ────────────────────────────────────────────────────────────
const ITEMS = [
  {
    id: 'DECK-001',
    icon: '⚡',
    name: 'Flashcards Táticos',
    desc: 'Cada card calibrado para a TRI — sem enrolação, só o que cai.',
    stat: '5.807',
    statLabel: 'CARDS',
    color: NEON,
  },
  {
    id: 'MOD-002',
    icon: '🗺️',
    name: 'Mapas de Domínio',
    desc: 'Radiografia em tempo real de onde você perde pontos — por disciplina.',
    stat: '6',
    statLabel: 'DISCS',
    color: VIOLET,
  },
  {
    id: 'SIM-003',
    icon: '🎯',
    name: 'Simulados TRI',
    desc: 'Questões ponderadas pelo peso real da TRI para maximizar sua nota.',
    stat: '100%',
    statLabel: 'TRI',
    color: ORANGE,
  },
  {
    id: 'TUT-004',
    icon: '🤖',
    name: 'Tutores IA Especialistas',
    desc: 'Explica, corrige e adapta a linguagem ao seu nível — a qualquer hora.',
    stat: '24/7',
    statLabel: 'ONLINE',
    color: CYAN,
  },
  {
    id: 'RED-005',
    icon: '✍️',
    name: 'Correção de Redação',
    desc: 'Feedback instantâneo nas 5 competências do ENEM com nota preditiva.',
    stat: '+900',
    statLabel: 'PTS',
    color: '#eab308',
  },
  {
    id: 'SRS-006',
    icon: '🧠',
    name: 'Algoritmo SRS Elite',
    desc: 'Revisões espaçadas que dobram a retenção em 15 min por dia.',
    stat: '97%',
    statLabel: 'RETEN.',
    color: NEON,
  },
] as const;

// ─── Single arsenal card ──────────────────────────────────────────────────────
function ArsenalCard({
  item,
  index,
  inView,
}: {
  item: (typeof ITEMS)[number];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background:          'rgba(255,255,255,0.025)',
        border:              `1px solid rgba(255,255,255,0.07)`,
        backdropFilter:      'blur(14px)',
        WebkitBackdropFilter:'blur(14px)',
      }}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top shimmer */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${item.color}50, transparent)`,
        }}
      />

      {/* Stat — most prominent */}
      <div className="mb-4 flex items-baseline gap-1.5">
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: item.color, fontFamily: JETBRAINS }}
        >
          {item.stat}
        </span>
        <span
          className="text-[9px] font-bold tracking-[0.2em] uppercase"
          style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.20)' }}
        >
          {item.statLabel}
        </span>
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${item.color}12`, border: `1px solid ${item.color}28` }}
        >
          {item.icon}
        </div>
        <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
      </div>

      {/* Description */}
      <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>

      {/* System tag */}
      <div className="absolute bottom-3 right-4">
        <span
          className="text-[8px] tracking-widest uppercase"
          style={{ fontFamily: JETBRAINS, color: item.color, opacity: 0.35 }}
        >
          [ {item.id} ]
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ArsenalElite() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ── */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
          style={{
            background: `${NEON}10`,
            border:     `1px solid ${NEON}30`,
          }}
        >
          <span
            className="text-[9px] font-bold tracking-[0.22em] uppercase"
            style={{ fontFamily: JETBRAINS, color: NEON }}
          >
            ARSENAL DE ELITE
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
          A{' '}
          <span style={{
            background:           `linear-gradient(90deg, ${NEON}, ${CYAN})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
          }}>
            Infraestrutura de Guerra
          </span>
        </h2>

        <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
          Delegue o <span className="text-white font-semibold">esforço braçal</span> para o nosso sistema. Pare de{' '}
          <span className="text-white font-semibold">perder meses</span> fabricando materiai. Tudo o que você precisa para ser aprovado:
        </p>
      </motion.div>

      {/* ── Arsenal grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ITEMS.map((item, i) => (
          <ArsenalCard key={item.id} item={item} index={i} inView={inView} />
        ))}
      </div>

      {/* ── Bottom stat bar ── */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:          'rgba(255,255,255,0.018)',
          border:              '1px solid rgba(255,255,255,0.06)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}40, transparent)` }} />

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }}
              animate={{ opacity: [1, 0.18, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span
              className="text-[10px]"
              style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.25)' }}
            >
              Preparar intervenção ·{' '}
              <span style={{ color: NEON }}>ARSENAL COMPLETO</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-5">
            {[
              { label: 'Cards',    val: '5.807', color: NEON    },
              { label: 'Matérias', val: '6',     color: VIOLET  },
              { label: 'TRI',      val: '100%',  color: ORANGE  },
            ].map(stat => (
              <span
                key={stat.label}
                className="text-[9px] tabular-nums"
                style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.22)' }}
              >
                {stat.label}:{' '}
                <span style={{ color: stat.color, fontWeight: 700 }}>
                  {stat.val}
                </span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
