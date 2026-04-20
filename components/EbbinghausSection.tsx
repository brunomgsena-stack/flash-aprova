'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';

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

// ─── Pilares data ─────────────────────────────────────────────────────────────
const PILARES = [
  {
    id: 'ilusao',
    icon: '↻',
    label: 'O Ciclo da Ilusão',
    text: 'Você entende na aula, mas o cérebro trata como lixo e descarta em horas.',
    color: ORANGE,
  },
  {
    id: 'obesidade',
    icon: '≡',
    label: 'Obesidade Mental',
    text: 'Resumos e PDFs acumulados são apenas peso morto. Eles não viram memória.',
    color: RED,
  },
  {
    id: 'branco',
    icon: '□',
    label: 'O Branco Premonitório',
    text: 'O esquecimento ataca no momento mais caro: as 4 horas de ENEM.',
    color: VIOLET,
  },
] as const;

// ─── PilarCard — 3D tilt + cursor glow + icon neon toggle ────────────────────
function PilarCard({
  icon, label, text, color, index,
}: {
  icon: string; label: string; text: string; color: string; index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [mouse,   setMouse]   = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  }, []);

  const rotateY = hovered ? (mouse.x - 0.5) * 18 : 0;
  const rotateX = hovered ? -(mouse.y - 0.5) * 14 : 0;

  return (
    <motion.div
      ref={cardRef}
      className="relative rounded-2xl p-5 sm:p-6 cursor-default select-none"
      style={{
        background: 'rgba(255,255,255,0.035)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered
          ? `0 0 48px ${color}22, 0 0 0 1px ${color}35`
          : '0 0 0 0 transparent',
        transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.1s ease',
      }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 0.5, y: 0.5 }); }}
      onMouseMove={handleMouseMove}
    >
      {/* Cursor-tracked radial glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${color}20 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
        }}
      />
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${hovered ? '80' : '30'}, transparent)`,
          transition: 'opacity 0.25s',
        }} />

      {/* Icon */}
      <div
        className="text-3xl mb-3 leading-none font-black transition-all duration-300"
        style={{
          color: hovered ? color : 'rgba(255,255,255,0.18)',
          textShadow: hovered ? `0 0 18px ${color}, 0 0 36px ${color}80` : 'none',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {icon}
      </div>

      <p
        className="text-xs font-black uppercase tracking-widest mb-2 transition-colors duration-300"
        style={{
          color: hovered ? color : 'rgba(255,255,255,0.35)',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {label}
      </p>
      <p className="text-sm text-slate-500 leading-relaxed">{text}</p>
    </motion.div>
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
      className="relative max-w-5xl mx-auto px-5 sm:px-10 pb-28"
    >

      {/* ── Header ── */}
      <div className="text-center mb-12 relative z-10">
        <motion.p
          className="text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: ORANGE, fontFamily: 'ui-monospace, monospace' }}
          initial={{ opacity: 0, y: -8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          &gt; DIAGNÓSTICO DO SISTEMA
        </motion.p>

        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Seu cérebro foi programado para{' '}
          <motion.span
            style={{ color: ORANGE }}
            animate={{
              textShadow: [
                '0 0 0px transparent',
                `0 0 22px ${ORANGE}, 0 0 44px ${ORANGE}80`,
                `0 0 8px ${ORANGE}60`,
                `0 0 28px ${ORANGE}, 0 0 55px ${ORANGE}70`,
                '0 0 0px transparent',
              ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            esquecer.
          </motion.span>
        </motion.h2>

        <motion.p
          className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.22 }}
        >
          A ciência prova: sem engenharia, você aluga o conhecimento.{' '}
          <span className="text-white font-semibold">
            Em 24h, o proprietário (seu cérebro) deleta 70% do que você pagou com suor para aprender.
          </span>
        </motion.p>
      </div>

      {/* ── Chart card ── */}
      <motion.div
        className="relative rounded-3xl p-6 sm:p-8 mb-10 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
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
              ZONA DE ELIMINAÇÃO: 25% de retenção
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

      {/* ── Pilares do Desastre ── */}
      <div className="mb-14 relative z-10">
        <motion.p
          className="text-center text-xs font-bold tracking-widest uppercase mb-7"
          style={{ color: RED, fontFamily: 'ui-monospace, monospace' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          &gt; PILARES DO DESASTRE
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PILARES.map((p, i) => (
            <PilarCard key={p.id} {...p} index={i} />
          ))}
        </div>
      </div>

    </section>
  );
}
