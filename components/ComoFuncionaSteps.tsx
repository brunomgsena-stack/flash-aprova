'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// ─── Tokens (replicados da LandingPage pra manter o componente auto-contido) ──
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';

// ─── Data dos 4 passos ────────────────────────────────────────────────────────
const STEPS = [
  {
    id:     '01',
    title:  'DIAGNÓSTICO IA',
    time:   '3 min',
    copy:   'Responda 12 perguntas rápidas. A IA mapeia em quais tópicos do edital você está vulnerável.',
    badge:  'SEM CADASTRO · COMEÇA NA HORA',
    color:  NEON,
  },
  {
    id:     '02',
    title:  'PLANO PERSONALIZADO',
    time:   'auto',
    copy:   'Em segundos você recebe seu mapa de lacunas e um plano focado nos 20% que valem 80% da nota.',
    badge:  'GERADO PELA IA · SEM CONFIGURAR NADA',
    color:  ORANGE,
  },
  {
    id:     '03',
    title:  'REVISÃO DIÁRIA',
    time:   '15 min/dia',
    copy:   'Todo dia o app entrega só os flashcards que você está prestes a esquecer. Responde, marca a dificuldade, pronto.',
    badge:  'SÓ O QUE IMPORTA HOJE · ZERO PLANEJAMENTO',
    color:  NEON,
  },
  {
    id:     '04',
    title:  'ALGORITMO SRS BLINDA',
    time:   'automático, 24/7',
    copy:   'Acertou fácil? Volta daqui a 7 dias. Errou? Volta amanhã. O algoritmo calcula sozinho o intervalo perfeito pra cada card.',
    badge:  'BASEADO EM EBBINGHAUS · AJUSTE CONTÍNUO',
    color:  VIOLET,
  },
] as const;

// ─── Neon highlight helper ────────────────────────────────────────────────────
function Neon({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>
      {children}
    </span>
  );
}

// ─── Mockup 01: Quiz Card ─────────────────────────────────────────────────────
function QuizMockup() {
  const alts = ['9.8 m/s²', '5.0 m/s²', '10 m/s²', '3.2 m/s²'];
  const selected = 0;

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${NEON}10`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }}
      />

      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ background: `${ORANGE}15`, border: `1px solid ${ORANGE}40`, color: ORANGE, fontFamily: "'JetBrains Mono', monospace" }}
        >
          FÍSICA · CINEMÁTICA
        </span>
        <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          04 / 12
        </span>
      </div>

      <p className="text-white text-xs leading-snug mb-3 font-medium">
        Qual a aceleração da gravidade na superfície da Terra (g)?
      </p>

      <div className="flex flex-col gap-1.5 mb-3">
        {alts.map((alt, i) => {
          const isSel = i === selected;
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
              style={{
                background:  isSel ? `${NEON}12` : 'rgba(255,255,255,0.03)',
                border:      `1px solid ${isSel ? `${NEON}50` : 'rgba(255,255,255,0.07)'}`,
                color:       isSel ? '#fff' : '#94a3b8',
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background:  isSel ? NEON : 'rgba(255,255,255,0.06)',
                  color:       isSel ? '#000' : '#64748b',
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span>{alt}</span>
            </div>
          );
        })}
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width:      `${(4 / 12) * 100}%`,
            background: `linear-gradient(90deg, ${NEON}, #00cc5a)`,
            boxShadow:  `0 0 8px ${NEON}80`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Mockup 02: Mini-Radar com lacunas ────────────────────────────────────────
function RadarLacunasMockup() {
  const cx = 100, cy = 100, R = 70;
  const angles = [-90, -30, 30, 90, 150, 210].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) =>
    `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  const dataR = [0.78, 0.32, 0.65, 0.85, 0.28, 0.72].map(p => p * R);
  const labels = ['Bio', 'Quím', 'Fís', 'Hist', 'Geo', 'Mat'];
  const isLacuna = [false, true, false, false, true, false];

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${ORANGE}10`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}50, transparent)` }}
      />

      <div
        className="absolute top-3 right-3 z-10 px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase"
        style={{
          background:  `${ORANGE}15`,
          border:      `1px solid ${ORANGE}50`,
          color:       ORANGE,
          fontFamily:  "'JetBrains Mono', monospace",
        }}
      >
        3 LACUNAS
      </div>

      <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: NEON, fontFamily: "'JetBrains Mono', monospace" }}>
        RADAR · MAPA DE FRAGILIDADES
      </p>

      <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 180 }}>
        {[0.25, 0.50, 0.75, 1.0].map((pct) => (
          <polygon key={pct}
            points={angles.map((_, i) => pt(pct * R, i)).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {angles.map((_, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        <polygon
          points={dataR.map((r, i) => pt(r, i)).join(' ')}
          fill={`${NEON}22`} stroke={NEON} strokeWidth="1.5"
        />
        {dataR.map((r, i) => (
          <g key={i}>
            <circle
              cx={cx + r * Math.cos(angles[i])}
              cy={cy + r * Math.sin(angles[i])}
              r={isLacuna[i] ? 5 : 3}
              fill={isLacuna[i] ? ORANGE : NEON}
            />
            {isLacuna[i] && (
              <circle
                cx={cx + r * Math.cos(angles[i])}
                cy={cy + r * Math.sin(angles[i])}
                r="9"
                fill="none"
                stroke={ORANGE}
                strokeWidth="1"
                opacity="0.5"
              >
                <animate attributeName="r" values="5;12;5" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}
        {angles.map((_, i) => {
          const lx = cx + (R + 14) * Math.cos(angles[i]);
          const ly = cy + (R + 14) * Math.sin(angles[i]);
          return (
            <text key={i} x={lx} y={ly + 3} textAnchor="middle"
              fill={isLacuna[i] ? ORANGE : 'rgba(255,255,255,0.6)'}
              fontSize="9" fontWeight="700" fontFamily="Inter,system-ui">
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Mockup 03: Flashcard com botões de dificuldade ───────────────────────────
function FlashcardMockup() {
  return (
    <div className="w-full max-w-[280px] relative">
      <div
        className="absolute inset-x-3 top-3 bottom-0 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border:     '1px solid rgba(255,255,255,0.05)',
          transform:  'translateY(8px) scale(0.96)',
        }}
      />

      <div
        className="relative rounded-2xl p-4"
        style={{
          background:    'rgba(9,9,11,0.95)',
          border:        '1px solid rgba(255,255,255,0.1)',
          boxShadow:     `0 0 32px ${NEON}12`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}60, transparent)` }}
        />

        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: `${NEON}12`, border: `1px solid ${NEON}40`, color: NEON, fontFamily: "'JetBrains Mono', monospace" }}
          >
            BIOLOGIA · CITOLOGIA
          </span>
          <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            #1247
          </span>
        </div>

        <p className="text-white text-xs leading-snug mb-3 font-medium">
          Qual organela é responsável pela produção de ATP na célula?
        </p>

        <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <p className="text-slate-400 text-[11px] leading-snug mb-3 italic">
          Mitocôndria — realiza a respiração celular oxidativa.
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Difícil', color: ORANGE, sub: '< 1d' },
            { label: 'Bom',     color: NEON,   sub: '3d'   },
            { label: 'Fácil',   color: NEON,   sub: '7d'   },
          ].map((btn, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{
                background: `${btn.color}10`,
                border:     `1px solid ${btn.color}30`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
              <span className="text-[8px]" style={{ color: `${btn.color}99`, fontFamily: "'JetBrains Mono', monospace" }}>
                {btn.sub}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-slate-600 text-center mt-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ≈ 30s por card
        </p>
      </div>
    </div>
  );
}

// ─── Mockup 04: Heatmap + timeline de intervalos ──────────────────────────────
function SRSIntervalMockup() {
  const grid = [
    [0,0,2,3,5,0,1],
    [0,4,5,2,0,3,1],
    [2,0,3,5,4,1,0],
    [0,1,5,3,2,0,4],
    [3,2,0,4,5,1,0],
    [0,5,3,1,0,4,2],
  ];
  const HEAT_ALPHA = [0.05, 0.20, 0.40, 0.65, 0.85, 1.0];
  const intervals = ['1d', '3d', '7d', '18d'];

  return (
    <div
      className="w-full max-w-[280px] rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:    'rgba(9,9,11,0.92)',
        border:        '1px solid rgba(255,255,255,0.08)',
        boxShadow:     `0 0 32px ${VIOLET}10`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}50, transparent)` }}
      />

      <p className="text-[9px] font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET, fontFamily: "'JetBrains Mono', monospace" }}>
        AGENDA NEURAL · ALGORITMO SRS
      </p>

      <div className="flex justify-center mb-4" style={{ gap: 3 }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((v, di) => (
              <div
                key={di}
                style={{
                  width:       12,
                  height:      12,
                  borderRadius: 2,
                  background:  v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(0,255,115,${HEAT_ALPHA[v]})`,
                  boxShadow:   v >= 4 ? `0 0 6px rgba(0,255,115,0.6)` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="pt-3" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
        <p className="text-[9px] mb-2 text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          CARD #A · PRÓXIMAS REVISÕES
        </p>
        <div className="flex items-center justify-between">
          {intervals.map((iv, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: NEON,
                    opacity:    0.4 + i * 0.2,
                    boxShadow:  i === intervals.length - 1 ? `0 0 6px ${NEON}` : 'none',
                  }}
                />
                <span
                  className="text-[10px] font-bold mt-1"
                  style={{ color: NEON, opacity: 0.6 + i * 0.13, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {iv}
                </span>
              </div>
              {i < intervals.length - 1 && (
                <div className="flex-1 h-px mx-1 mb-3" style={{ background: `linear-gradient(90deg, ${NEON}40, ${NEON}60)`, minWidth: 18 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA button (replica do que existe na LandingPage) ────────────────────────
function CTAButton({ label = 'GERAR MEU DIAGNÓSTICO IA' }: { label?: string }) {
  return (
    <Link
      href="/quizz"
      className="cta-pulse relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-2xl font-black text-black overflow-hidden whitespace-nowrap transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] px-8 py-5 text-lg"
      style={{
        background:    `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
        letterSpacing: '-0.01em',
        boxShadow:     `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
          animation:  'shimmer 2.4s infinite',
        }}
      />
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="relative">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
      <span className="relative">{label}</span>
    </Link>
  );
}

// ─── Step row (timeline + texto + mockup) ─────────────────────────────────────
function StepRow({
  step,
  index,
  isLast,
  mockup,
}: {
  step: typeof STEPS[number];
  index: number;
  isLast: boolean;
  mockup: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative flex gap-4 sm:gap-6 pb-10 sm:pb-14"
    >
      {/* Coluna timeline */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-black tabular-nums"
          style={{
            background:   'rgba(9,9,11,0.92)',
            border:       `1px solid ${step.color}45`,
            color:        step.color,
            fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
            fontSize:     '0.95rem',
            boxShadow:    `0 0 20px ${step.color}25`,
          }}
        >
          [{step.id}]
        </div>
        {!isLast && (
          <div
            className="flex-1 w-px mt-2"
            style={{
              background: `linear-gradient(180deg, ${step.color}60, ${STEPS[index + 1]?.color ?? NEON}30)`,
            }}
          />
        )}
      </div>

      {/* Coluna conteúdo */}
      <div className="flex-1 grid sm:grid-cols-2 gap-6 sm:gap-10 items-start">
        <div className="order-1 sm:order-2 flex justify-center sm:justify-start">
          {mockup}
        </div>

        <div className="order-2 sm:order-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">
              {step.title}
            </h3>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded"
              style={{
                background:   `${step.color}15`,
                border:       `1px solid ${step.color}40`,
                color:        step.color,
                fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {step.time}
            </span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            {step.copy}
          </p>
          <p
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{
              fontFamily:   "'JetBrains Mono', ui-monospace, monospace",
              color:        'rgba(255,255,255,0.45)',
            }}
          >
            › {step.badge}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ComoFuncionaSteps() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pt-12 sm:pt-24 pb-12 sm:pb-24">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: NEON, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          [ COMO FUNCIONA ]
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          Do zero ao primeiro flashcard em <Neon>3 minutos</Neon>.
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Sem deck, sem configuração, sem mentor.
        </p>
      </div>

      {/* Timeline + 4 passos */}
      <div className="relative mb-12">
        {STEPS.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            isLast={i === STEPS.length - 1}
            mockup={
              step.id === '01' ? <QuizMockup /> :
              step.id === '02' ? <RadarLacunasMockup /> :
              step.id === '03' ? <FlashcardMockup /> :
              <SRSIntervalMockup />
            }
          />
        ))}
      </div>

      {/* Microcopy de fechamento */}
      <div className="flex justify-center mb-10">
        <div
          className="max-w-md w-full text-center rounded-2xl py-6 px-8"
          style={{
            background: 'rgba(0,255,115,0.03)',
            border:     '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-sm text-slate-400 mb-1">
            Tempo total/dia depois do diagnóstico:
          </p>
          <p
            className="text-4xl font-black mb-2 leading-none"
            style={{ color: NEON, textShadow: `0 0 24px ${NEON}80, 0 0 48px ${NEON}40` }}
          >
            15 minutos
          </p>
          <p
            className="text-[10px] tracking-widest uppercase"
            style={{ color: `${NEON}80`, opacity: 0.55, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            [ menos que rolar o feed do Instagram ]
          </p>
        </div>
      </div>

      {/* CTA final */}
      <div className="flex flex-col items-center">
        <CTAButton />
        <p
          className="text-center text-xs mt-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          3 min · sem cadastro · sem cartão
        </p>
      </div>
    </section>
  );
}
