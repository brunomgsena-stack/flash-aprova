'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const NEON      = '#00FF73';
const VIOLET    = '#7C3AED';
const CYAN      = '#06b6d4';
const JETBRAINS = "'JetBrains Mono', ui-monospace, monospace";

// ─── Left: Linhas roxas orgânicas e instáveis → convergindo para o centro ────
function OrganicInputLines({ inView }: { inView: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    type Line = {
      yRatio:     number;
      amp:        number;
      freq:       number;
      phase:      number;
      phaseSpeed: number;
      width:      number;
      alpha:      number;
    };

    const COUNT = 9;
    const lines: Line[] = Array.from({ length: COUNT }, (_, i) => ({
      yRatio:     (i + 0.5) / COUNT,
      amp:        12 + Math.random() * 20,
      freq:       0.028 + Math.random() * 0.038,
      phase:      Math.random() * Math.PI * 2,
      phaseSpeed: 0.014 + Math.random() * 0.016,
      width:      0.8 + Math.random() * 1.3,
      alpha:      0.40 + Math.random() * 0.55,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      lines.forEach(line => {
        const baseY = line.yRatio * H;

        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          // Amplitude afunila à medida que se aproxima do centro (borda direita)
          const taper = 1 - (x / W) * 0.72;
          const y = baseY
            + Math.sin(x * line.freq + line.phase) * line.amp * taper
            + Math.sin(x * line.freq * 1.9 + line.phase * 1.5) * (line.amp * 0.38) * taper
            + Math.sin(x * line.freq * 0.55 + line.phase * 0.7) * (line.amp * 0.22) * taper;

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.strokeStyle = VIOLET;
        ctx.lineWidth   = line.width;
        ctx.globalAlpha = line.alpha;
        ctx.shadowColor = VIOLET;
        ctx.shadowBlur  = 6;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;

        line.phase += line.phaseSpeed;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [inView]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}

// ─── Right: Linhas verdes retas, sólidas e brilhantes → saindo do centro ─────
function StraightOutputLines({ inView }: { inView: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    type Packet = {
      yRatio: number;
      offset: number;
      speed:  number;
      len:    number;
      width:  number;
      alpha:  number;
    };

    const COUNT = 10;
    const packets: Packet[] = Array.from({ length: COUNT }, (_, i) => ({
      yRatio: (i + 0.5) / COUNT,
      offset: Math.random() * 240,
      speed:  2.2 + Math.random() * 2.4,
      len:    70  + Math.random() * 110,
      width:  1.2 + Math.random() * 1.4,
      alpha:  0.65 + Math.random() * 0.35,
    }));

    const toHex = (v: number) =>
      Math.round(v * 255).toString(16).padStart(2, '0');

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      packets.forEach(pkt => {
        pkt.offset = (pkt.offset + pkt.speed) % (W + pkt.len);
        const y  = pkt.yRatio * H;
        const x0 = pkt.offset - pkt.len;
        const x1 = pkt.offset;
        const cx0 = Math.max(0, x0);
        const cx1 = Math.min(W, x1);
        if (cx0 >= cx1) return;

        const grad = ctx.createLinearGradient(x0, y, x1, y);
        grad.addColorStop(0,    `${NEON}00`);
        grad.addColorStop(0.15, `${NEON}${toHex(pkt.alpha)}`);
        grad.addColorStop(0.85, `${NEON}${toHex(pkt.alpha)}`);
        grad.addColorStop(1,    `${NEON}00`);

        ctx.beginPath();
        ctx.moveTo(cx0, y);
        ctx.lineTo(cx1, y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = pkt.width;
        ctx.shadowColor = NEON;
        ctx.shadowBlur  = 12;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [inView]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}

// ─── Center: CPU chip processor visual ───────────────────────────────────────
function NucleusCore({ inView }: { inView: boolean }) {
  // Pin rows on each edge
  const PIN_COUNT = 5;
  const pins = Array.from({ length: PIN_COUNT }, (_, i) => i);

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center shrink-0"
      style={{ width: 120, height: 120 }}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Outer breath ring ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -8,
          border: `1px solid ${NEON}18`,
          borderRadius: 10,
        }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.93, 1.07, 0.93] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── CPU package (outer shell) ── */}
      <div
        className="relative"
        style={{
          width: 100, height: 100,
          background: 'linear-gradient(145deg, #1a1f2e 0%, #0d1117 60%, #161b27 100%)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: 6,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.6), 0 0 32px ${VIOLET}22, 0 8px 32px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Corner alignment marks */}
        {([['0','0'], ['auto','0'], ['0','auto'], ['auto','auto']] as [string,string][]).map(([b,r], idx) => (
          <div key={idx} className="absolute pointer-events-none"
            style={{
              width: 7, height: 7,
              top:    idx < 2 ? 5 : undefined, bottom:  idx >= 2 ? 5 : undefined,
              left:   idx % 2 === 0 ? 5 : undefined, right: idx % 2 === 1 ? 5 : undefined,
              borderTop:    idx < 2  ? `1.5px solid ${NEON}60` : undefined,
              borderBottom: idx >= 2 ? `1.5px solid ${NEON}60` : undefined,
              borderLeft:   idx % 2 === 0 ? `1.5px solid ${NEON}60` : undefined,
              borderRight:  idx % 2 === 1 ? `1.5px solid ${NEON}60` : undefined,
            }} />
        ))}

        {/* ── Die (inner chip) ── */}
        <div
          className="absolute"
          style={{
            inset: 16,
            background: 'linear-gradient(135deg, #0f1520 0%, #0a0e18 100%)',
            border: `1px solid ${VIOLET}40`,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Grid of micro-cells */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${VIOLET}15 1px, transparent 1px),
                linear-gradient(90deg, ${VIOLET}15 1px, transparent 1px)
              `,
              backgroundSize: '8px 8px',
            }} />

          {/* Central die label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[6px] tracking-[0.2em] uppercase"
              style={{ fontFamily: JETBRAINS, color: `${NEON}50` }}>
              BLINDAGEM
            </span>
            <span className="text-[7px] font-black tracking-[0.15em] uppercase"
              style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.75)',
                textShadow: `0 0 10px ${NEON}60` }}>
              ENGINE
            </span>
            {/* Status dot */}
            <motion.div
              className="mt-1 w-1.5 h-1.5 rounded-full"
              style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }}
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </div>

          {/* Scanning line */}
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${NEON}70, transparent)` }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* ── Pins: top & bottom ── */}
        {(['top', 'bottom'] as const).map(side => (
          <div key={side} className="absolute inset-x-0 flex justify-center gap-[5px]"
            style={{ [side]: -6 }}>
            {pins.map(i => (
              <div key={i} style={{
                width: 3, height: 6,
                background: `linear-gradient(${side === 'top' ? '180deg' : '0deg'}, #8b92a0, #4a5060)`,
                borderRadius: 1,
                boxShadow: `0 0 3px ${NEON}20`,
              }} />
            ))}
          </div>
        ))}

        {/* ── Pins: left & right ── */}
        {(['left', 'right'] as const).map(side => (
          <div key={side} className="absolute inset-y-0 flex flex-col justify-center gap-[5px]"
            style={{ [side]: -6 }}>
            {pins.map(i => (
              <div key={i} style={{
                width: 6, height: 3,
                background: `linear-gradient(${side === 'left' ? '90deg' : '270deg'}, #8b92a0, #4a5060)`,
                borderRadius: 1,
                boxShadow: `0 0 3px ${NEON}20`,
              }} />
            ))}
          </div>
        ))}

        {/* Pulsing border glow */}
        <motion.div
          className="absolute inset-0 rounded-[6px] pointer-events-none"
          style={{ border: `1px solid ${NEON}25`, boxShadow: `inset 0 0 20px ${VIOLET}15` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TacticalRecovery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ── */}
      <div className="text-center mb-12">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: NEON, fontFamily: JETBRAINS }}
        >
          &gt; RECUPERAÇÃO TÁTICA
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Lembre{' '}
          <span style={{
            background:            `linear-gradient(90deg, ${NEON}, ${CYAN})`,
            WebkitBackgroundClip:  'text',
            WebkitTextFillColor:   'transparent',
          }}>
            97%
          </span>
          {' '}na hora do ENEM.
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Esqueça apenas a concorrência. Nossa tecnologia garante que a resposta correta salte na sua mente no momento de maior pressão:{' '}
          <span className="text-white font-semibold">na hora da prova</span>.
        </p>
      </div>

      {/* ── Kinetic Visual ── */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:          'rgba(18,18,18,0.92)',
          border:              '1px solid rgba(255,255,255,0.07)',
          boxShadow:           '0 0 80px rgba(0,0,0,0.35)',
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Main flow row */}
        <div
          className="flex items-stretch"
          style={{ height: 240 }}
        >

          {/* ── Left: INPUT — linhas orgânicas roxas ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Canvas area */}
            <div className="relative flex-1 overflow-hidden">
              <OrganicInputLines inView={inView} />
              {/* Right edge fade (blends into center) */}
              <div
                className="absolute inset-y-0 right-0 w-16 pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.85))' }}
              />
            </div>
            {/* Label */}
            <motion.div
              className="flex items-center justify-center py-3 border-t"
              style={{ borderColor: `${VIOLET}20` }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
            >
              <span
                className="text-[9px] tracking-[0.18em] uppercase"
                style={{ fontFamily: JETBRAINS, color: `${VIOLET}80` }}
              >
                [ INPUT: ESFORÇO BRUTO ]
              </span>
            </motion.div>
          </div>

          {/* ── Center: Blindagem Engine Nucleus ── */}
          <div className="flex flex-col shrink-0 px-3 sm:px-5">
            <div className="flex-1 flex items-center justify-center">
              <NucleusCore inView={inView} />
            </div>
            {/* Spacer matching the label height on left/right columns */}
            <div className="py-3 border-t" style={{ borderColor: 'transparent' }} />
          </div>

          {/* ── Right: OUTPUT — linhas retas verdes ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Canvas area */}
            <div className="relative flex-1 overflow-hidden">
              <StraightOutputLines inView={inView} />
              {/* Left edge fade (blends from center) */}
              <div
                className="absolute inset-y-0 left-0 w-16 pointer-events-none"
                style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.85))' }}
              />
            </div>
            {/* Label */}
            <motion.div
              className="flex items-center justify-center py-3 border-t"
              style={{ borderColor: `${NEON}20` }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.9 }}
            >
              <span
                className="text-[9px] tracking-[0.18em] uppercase"
                style={{ fontFamily: JETBRAINS, color: `${NEON}80` }}
              >
                [ OUTPUT: MEMÓRIA DEFINITIVA ]
              </span>
            </motion.div>
          </div>

        </div>

        {/* ── Bottom stat bar ── */}
        <motion.div
          className="flex items-center justify-between px-5 sm:px-8 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }}
              animate={{ opacity: [1, 0.18, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <span
              className="text-[10px]"
              style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.25)' }}
            >
              Anos de estudos reduzidos ·{' '}
              <span style={{ color: NEON }}>Aprovação a caminho</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            {[
              { label: 'Retenção',   val: '97%',   color: NEON    },
              { label: 'Anti-Hesit', val: 'ON',    color: CYAN    },
              { label: 'Pressão',    val: 'CTRL',  color: VIOLET  },
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
        </motion.div>

      </motion.div>
    </section>
  );
}
