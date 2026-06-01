'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ORANGE = '#FF8A00';
const VIOLET = '#7C3AED';
const NEON   = '#00FF73';
const GREEN  = '#22c55e';
const PURPLE = '#a855f7';
const RED    = '#ef4444';

// ─── SVG paths ────────────────────────────────────────────────────────────────
const FORGET_LINE = 'M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163';
const FORGET_AREA = `${FORGET_LINE} L380,170 L40,170 Z`;
const FLASH_LINE  = 'M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18';
const FLASH_AREA  = `${FLASH_LINE} L380,170 L40,170 Z`;

// ─── Review nodes (synced to FLASH_LINE pathLength animation) ─────────────────
const REVIEW_NODES = [
  { cx: 112, cy: 16, delay: 0.62 },
  { cx: 194, cy: 16, delay: 1.00 },
  { cx: 292, cy: 16, delay: 1.45 },
] as const;

// ─── NodeDot — appear → pulse lifecycle ──────────────────────────────────────
function NodeDot({ cx, cy, delay, isInView }: {
  cx: number; cy: number; delay: number; isInView: boolean;
}) {
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'pulsing'>('hidden');

  useEffect(() => {
    if (!isInView) { setPhase('hidden'); return; }
    const t = setTimeout(() => setPhase('entering'), delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('pulsing'), 450);
    return () => clearTimeout(t);
  }, [phase]);

  const origin = `${cx}px ${cy}px`;

  return (
    <>
      <motion.circle
        cx={cx} cy={cy} r="4.5"
        fill={`${NEON}22`} stroke={NEON} strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 'hidden'   ? { scale: 0, opacity: 0 } :
          phase === 'entering' ? { scale: 1, opacity: 1 } :
          { scale: [1, 1.55, 1], opacity: [1, 0.85, 1] }
        }
        transition={
          phase === 'pulsing'
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }
            : { duration: 0.35, ease: 'backOut' }
        }
        style={{ transformOrigin: origin, filter: `drop-shadow(0 0 5px ${NEON}cc)` }}
      />
      {phase !== 'hidden' && (
        <motion.circle
          cx={cx} cy={cy} r="4.5"
          fill="none" stroke={NEON} strokeWidth="1.5"
          animate={{ scale: [1, 2.8], opacity: [0.9, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut', repeatDelay: 1.0 }}
          style={{ transformOrigin: origin }}
        />
      )}
    </>
  );
}

// ─── Momentos data ────────────────────────────────────────────────────────────
const MOMENTOS = [
  {
    id: 'segunda',
    timestamp: 'SEGUNDA, 23h',
    narrativa: 'Fecho o último PDF. Sinto que produzi. Na quarta alguém comenta o tema — e dá branco. Releio o resumo. Não é o mesmo.',
    soco: 'Não é preguiça. É como o cérebro foi feito.',
    color: ORANGE,
  },
  {
    id: 'quinta',
    timestamp: 'QUINTA, 6h50',
    narrativa: 'Abro o caderno da semana passada. Os grifos coloridos parecem trabalho de outra pessoa. Tenho que reler do zero.',
    soco: 'A pilha de PDF cresce. A memória, não.',
    color: RED,
  },
  {
    id: 'domingo',
    timestamp: 'DOMINGO, prova rolando',
    narrativa: 'A questão é exatamente sobre aquele assunto. Estudei. Revi. Marquei. E agora não vem.',
    soco: 'Quatro meses inteiros, reféns de um instante de dúvida.',
    color: VIOLET,
  },
] as const;

// ─── Momento — uma estação do stack (nó pulsante + texto) ───────────────────
function Momento({
  timestamp, narrativa, soco, color, index,
}: {
  timestamp: string; narrativa: string; soco: string; color: string; index: number;
}) {
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } };

  return (
    <motion.div
      role="listitem"
      className="relative"
      {...enter}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: 0.15 * index, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Nó pulsante alinhado à linha vertical */}
      <span
        aria-hidden
        className="absolute -left-[18px] sm:-left-[26px] top-1.5 block rounded-full"
        style={{
          width: 10,
          height: 10,
          background: color,
          boxShadow: `0 0 0 3px rgba(18,18,18,0.95), 0 0 12px ${color}, 0 0 24px ${color}80`,
        }}
      />
      <p
        className="text-xs font-black uppercase tracking-widest mb-2"
        style={{
          color: color,
          textShadow: `0 0 12px ${color}, 0 0 24px ${color}80`,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {timestamp}
      </p>
      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{narrativa}</p>
      <p className="text-sm sm:text-base text-white font-bold mt-3 leading-relaxed">{soco}</p>
    </motion.div>
  );
}

// ─── MomentoStack — container vertical com linha animada conectando momentos ──
function MomentoStack() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="list"
      aria-label="Três momentos de um estudante real"
      className="relative pl-7 sm:pl-10"
    >
      {/* Linha vertical contínua (gradient laranja → vermelho → violeta) */}
      <motion.div
        aria-hidden
        className="absolute left-2 sm:left-3 top-2 bottom-2 w-px"
        style={{
          background: `linear-gradient(180deg, ${ORANGE} 0%, ${RED} 50%, ${VIOLET} 100%)`,
          transformOrigin: 'top',
          boxShadow: `0 0 12px ${RED}55`,
        }}
        initial={reduceMotion ? { opacity: 0 } : { scaleY: 0 }}
        whileInView={reduceMotion ? { opacity: 1 } : { scaleY: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      <div className="space-y-8 sm:space-y-10">
        {MOMENTOS.map((m, i) => (
          <Momento
            key={m.id}
            timestamp={m.timestamp}
            narrativa={m.narrativa}
            soco={m.soco}
            color={m.color}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function EbbinghausSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: '-100px' });

  // Orange line: draw first, then flicker
  const [orangeDrawn,   setOrangeDrawn]   = useState(false);
  const [orangeFlicker, setOrangeFlicker] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setOrangeDrawn(true), 100); // trigger draw
    return () => clearTimeout(t);
  }, [isInView]);

  useEffect(() => {
    if (!orangeDrawn) return;
    const t = setTimeout(() => setOrangeFlicker(true), 1100); // after draw ~0.8+0.2s
    return () => clearTimeout(t);
  }, [orangeDrawn]);

  return (
    <section
      ref={sectionRef}
      className="relative max-w-5xl mx-auto px-2 sm:px-10 pb-6 sm:pb-28"
    >

      {/* ── Header ── */}
      <div className="text-center mb-6 sm:mb-12 relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Seu cérebro foi programado para{' '}
          <span style={{ color: ORANGE, textShadow: `0 0 22px ${ORANGE}, 0 0 44px ${ORANGE}80` }}>
            esquecer.
          </span>
        </motion.h2>

        <motion.p
          className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.22 }}
        >
          Você devora 8 horas de PDF por dia. Em 24h seu cérebro apaga 70% disso.{' '}
          <span className="text-white font-semibold">
            O problema nunca foi seu esforço — foi te entregarem um método que a ciência já provou que falha.
          </span>
        </motion.p>
      </div>

      {/* ── Chart label ── */}
      <motion.p
        className="text-center text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: ORANGE, fontFamily: 'ui-monospace, monospace' }}
        initial={{ opacity: 0, y: -8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        &gt; DIAGNÓSTICO DO SISTEMA
      </motion.p>

      {/* ── Chart card ── */}
      <motion.div
        className="relative rounded-3xl p-3 sm:p-8 mb-10 overflow-hidden"
        style={{
          background: 'rgba(18,18,18,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 0 80px rgba(124,58,237,0.07), 0 0 0 1px rgba(124,58,237,0.06)`,
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Card top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}55, ${VIOLET}40, transparent)` }} />

        <svg viewBox="0 0 440 200" className="w-full block mx-auto" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="ag-forget-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={ORANGE} />
              <stop offset="100%" stopColor={RED} />
            </linearGradient>
            <linearGradient id="ag-flash-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={VIOLET} />
              <stop offset="55%"  stopColor={NEON}   />
              <stop offset="100%" stopColor={GREEN}   />
            </linearGradient>
            <linearGradient id="ag-forget-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity="0.14" />
              <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ag-flash-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={NEON}   stopOpacity="0.22" />
              <stop offset="100%" stopColor={NEON}   stopOpacity="0"    />
            </linearGradient>
            <filter id="ag-glow-o" x="-30%" y="-200%" width="160%" height="500%">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="ag-glow-v" x="-30%" y="-200%" width="160%" height="500%">
              <feGaussianBlur stdDeviation="4" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid */}
          {[10, 50, 90, 130, 170].map(y => (
            <line key={y} x1="40" y1={y} x2="430" y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {/* Y-axis */}
          {([[10,'100%'],[50,'75%'],[90,'50%'],[130,'25%'],[170,'0%']] as const).map(([y, l]) => (
            <text key={l} x="34" y={y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily="ui-monospace, monospace">{l}</text>
          ))}
          {/* X-axis */}
          {([[40,'Hoje'],[105,'1d'],[170,'3d'],[260,'1 sem'],[380,'1 mês']] as const).map(([x, l]) => (
            <text key={l} x={x} y="190" textAnchor="middle"
              fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily="ui-monospace, monospace">{l}</text>
          ))}

          {/* ── Orange area ── */}
          <motion.path
            d={FORGET_AREA}
            fill="url(#ag-forget-area)"
            initial={{ opacity: 0 }}
            animate={orangeDrawn ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />

          {/* ── Orange line: draw phase ── */}
          {!orangeFlicker && (
            <motion.path
              d={FORGET_LINE}
              fill="none"
              stroke="url(#ag-forget-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#ag-glow-o)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={orangeDrawn ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.08, 0, 0.45, 1], delay: 0.15 }}
            />
          )}

          {/* ── Orange line: flicker phase (replaces draw) ── */}
          {orangeFlicker && (
            <motion.path
              d={FORGET_LINE}
              fill="none"
              stroke="url(#ag-forget-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#ag-glow-o)"
              initial={{ opacity: 1 }}
              animate={{
                opacity: [1, 0.25, 0.8, 0.05, 0.9, 0.35, 0.75, 0.1, 1, 0.7, 1],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 3.5,
                ease: 'linear',
              }}
            />
          )}

          {/* ── Purple area ── */}
          <motion.path
            d={FLASH_AREA}
            fill="url(#ag-flash-area)"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          />

          {/* ── Purple line — solid & stable ── */}
          <motion.path
            d={FLASH_LINE}
            fill="none"
            stroke="url(#ag-flash-line)"
            strokeWidth="2.8"
            strokeLinecap="round"
            filter="url(#ag-glow-v)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.35 }}
          />

          {/* ── Review nodes ── */}
          {REVIEW_NODES.map(({ cx, cy, delay }) => (
            <NodeDot key={cx} cx={cx} cy={cy} delay={delay} isInView={isInView} />
          ))}

          {/* ── Zone label: ELIMINAÇÃO ── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.4, duration: 0.45 }}
          >
            <rect x="215" y="148" width="165" height="19" rx="4"
              fill="rgba(255,138,0,0.10)" stroke={`${ORANGE}35`} strokeWidth="0.8" />
            <text x="297" y="161" textAnchor="middle"
              fill={ORANGE} fontSize="7.5" fontFamily="ui-monospace, monospace" fontWeight="700">
              Zona de esquecimento: 25% de retenção
            </text>
          </motion.g>

          {/* ── Zone label: APROVAÇÃO ── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.7, duration: 0.45 }}
          >
            <rect x="215" y="-5" width="165" height="19" rx="4"
              fill="rgba(124,58,237,0.14)" stroke={`${VIOLET}45`} strokeWidth="0.8" />
            <text x="297" y="8" textAnchor="middle"
              fill={PURPLE} fontSize="7.5" fontFamily="ui-monospace, monospace" fontWeight="700">
              ZONA DE APROVAÇÃO: 97% de retenção
            </text>
          </motion.g>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${ORANGE}, ${RED})` }} />
            <span className="text-slate-500 text-xs">Descarte (sem revisão)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${VIOLET}, ${NEON})` }} />
            <span className="text-slate-500 text-xs">FlashAprova (retenção ativa)</span>
          </div>
        </div>
      </motion.div>

      {/* ── Três momentos que você já viveu ── */}
      <div className="mb-4 sm:mb-14 relative z-10">
        <motion.p
          className="text-center text-xs font-bold tracking-widest uppercase mb-7"
          style={{ color: RED, fontFamily: 'ui-monospace, monospace' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          &gt; TRÊS MOMENTOS QUE VOCÊ JÁ VIVEU
        </motion.p>
        <MomentoStack />
      </div>

    </section>
  );
}
