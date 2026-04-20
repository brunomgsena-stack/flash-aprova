'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion, useInView, useMotionValue, useSpring, useTransform,
} from 'framer-motion';

// ── Design tokens ──────────────────────────────────────────────────────────────
const NEON   = '#00FF73';
const CYAN   = '#06b6d4';
const VIOLET = '#7C3AED';
const MONO   = "'JetBrains Mono', ui-monospace, monospace";

// ── Particle stream — purple light data flow ───────────────────────────────────
function ParticleStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf       = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setup = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; c: string };
    const pool: P[] = [];
    const COLS = [VIOLET, '#9333ea', '#a855f7', CYAN, '#6d28d9'];

    const spawn = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) return;
      pool.push({
        x: Math.random() * W * 0.5,
        y: H * (0.4 + Math.random() * 0.6),
        vx: 0.5 + Math.random() * 0.7,
        vy: -(0.15 + Math.random() * 0.45),
        life: 0,
        max: 110 + Math.random() * 90,
        r: Math.random() * 1.4 + 0.6,
        c: COLS[Math.floor(Math.random() * COLS.length)],
      });
    };

    let frame = 0;
    const tick = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { raf.current = requestAnimationFrame(tick); return; }

      ctx.clearRect(0, 0, W, H);
      if (frame % 3 === 0 && pool.length < 70) spawn();
      frame++;

      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        if (p.life > p.max || p.x > W + 20 || p.y < -20) { pool.splice(i, 1); continue; }

        const t = p.life / p.max;
        const a = t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle   = p.c;
        ctx.globalAlpha = a * 0.45;
        ctx.shadowColor = p.c;
        ctx.shadowBlur  = 10;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
      }

      raf.current = requestAnimationFrame(tick);
    };

    let started = false;
    const ro = new ResizeObserver(() => {
      setup();
      if (!started) { started = true; tick(); }
    });
    ro.observe(canvas);

    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}

// ── Flickering live metric ────────────────────────────────────────────────────
function LiveMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      key={value}
      className="text-right"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="text-[10px]" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.22)' }}>
        {label}
      </span>
      <span className="text-[10px]" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.22)' }}>
        {': '}
      </span>
      <span className="text-[10px] font-semibold tabular-nums" style={{ fontFamily: MONO, color }}>
        {value}
      </span>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TacticalOperations() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-100px' });

  // 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-200, 200], [3.5, -3.5]), { stiffness: 100, damping: 28 });
  const rotateY = useSpring(useTransform(mx, [-400, 400], [-3.5, 3.5]), { stiffness: 100, damping: 28 });

  // Spotlight
  const [spot, setSpot] = useState({ x: 0, y: 0, on: false });

  const onPanelMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mx.set(x - rect.width  / 2);
    my.set(y - rect.height / 2);
    setSpot({ x, y, on: true });
  }, [mx, my]);

  const onPanelLeave = useCallback(() => {
    mx.set(0); my.set(0);
    setSpot(s => ({ ...s, on: false }));
  }, [mx, my]);

  // Live metrics
  const [m, setM] = useState({
    retention: '97.4%',
    latency:   '0.021ms',
    sync:      '99.1%',
  });

  useEffect(() => {
    const iv = setInterval(() => {
      setM({
        retention: `${(97 + Math.random() * 0.9).toFixed(1)}%`,
        latency:   `${(0.017 + Math.random() * 0.009).toFixed(3)}ms`,
        sync:      `${(98.7 + Math.random() * 0.6).toFixed(1)}%`,
      });
    }, 2400);
    return () => clearInterval(iv);
  }, []);

  const FUNCS = [
    { name: 'INTERCEPTAÇÃO NEURAL', dot: NEON,   label: 'Retention_Rate', val: m.retention, color: `${NEON}cc` },
    { name: 'FILTRO TRI 80/20',     dot: CYAN,   label: 'Latency',        val: m.latency,   color: `${CYAN}cc` },
    { name: 'APROVAÇÃO PREVISÍVEL', dot: VIOLET, label: 'Neural_Sync',    val: m.sync,      color: `${VIOLET}ee` },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative max-w-7xl mx-auto px-5 sm:px-10 pb-32 pt-4 overflow-hidden"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '0%', left: '15%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${VIOLET}06 0%, transparent 65%)` }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}05 0%, transparent 65%)` }} />
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div
        className="mb-20 relative"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Label pill */}
        <div className="flex items-center gap-2.5 mb-10">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: CYAN, boxShadow: `0 0 6px ${CYAN}` }}
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          <span
            className="text-[10px] font-bold tracking-[0.28em] uppercase"
            style={{ color: CYAN, fontFamily: MONO }}
          >
            ⚡ ALGORITMO DE BLINDAGEM
          </span>
        </div>

        {/* Massive headline */}
        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-7 text-white">
          Sua memória no<br />
          <span style={{
            background: `linear-gradient(125deg, ${NEON} 0%, ${CYAN} 45%, ${VIOLET} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            piloto automático.
          </span>
        </h2>

        {/* Single-line subtext */}
        <p
          className="text-[11px] tracking-[0.18em] uppercase"
          style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.28)' }}
        >
          Enquanto você descansa — o sistema processa, prioriza e blinda.
        </p>
      </motion.div>

      {/* ── 3D Processing Unit Panel ─────────────────────────────────────── */}
      <motion.div
        style={{ perspective: 1400, zIndex: 1, position: 'relative' }}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(160deg, rgba(8,6,22,0.97) 0%, rgba(4,4,14,0.99) 55%, rgba(8,5,20,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '0.5px solid rgba(255,255,255,0.09)',
            boxShadow: `
              inset 0 0.5px 0 rgba(255,255,255,0.07),
              inset 0 -0.5px 0 rgba(255,255,255,0.03),
              0 50px 140px rgba(0,0,0,0.7),
              0 0 100px ${VIOLET}0a
            `,
          }}
          onMouseMove={onPanelMove}
          onMouseLeave={onPanelLeave}
        >
          {/* Grain noise */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            zIndex: 1,
            mixBlendMode: 'overlay',
          }} />

          {/* Spotlight — illuminates border nearest to cursor */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: spot.on
                ? `radial-gradient(480px circle at ${spot.x}px ${spot.y}px, rgba(124,58,237,0.07), transparent 55%)`
                : 'none',
              zIndex: 2,
              transition: 'background 0.08s',
            }}
          />

          {/* Hairline top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent 0%, ${VIOLET}55 25%, ${CYAN}45 65%, transparent 100%)`,
            zIndex: 3,
          }} />

          {/* Particle stream */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <ParticleStream />
          </div>

          {/* Corner brackets */}
          <div className="absolute top-5 left-5 w-7 h-7 pointer-events-none" style={{ zIndex: 4, borderTop: `0.5px solid ${CYAN}80`, borderLeft: `0.5px solid ${CYAN}80` }} />
          <div className="absolute top-5 right-5 w-7 h-7 pointer-events-none" style={{ zIndex: 4, borderTop: `0.5px solid ${VIOLET}65`, borderRight: `0.5px solid ${VIOLET}65` }} />
          <div className="absolute bottom-5 left-5 w-7 h-7 pointer-events-none" style={{ zIndex: 4, borderBottom: `0.5px solid ${VIOLET}55`, borderLeft: `0.5px solid ${VIOLET}55` }} />
          <div className="absolute bottom-5 right-5 w-7 h-7 pointer-events-none" style={{ zIndex: 4, borderBottom: `0.5px solid ${CYAN}45`, borderRight: `0.5px solid ${CYAN}45` }} />

          {/* Content */}
          <div className="relative px-8 sm:px-14 lg:px-20 py-14 sm:py-20" style={{ zIndex: 5 }}>

            {/* System status top bar */}
            <div className="flex items-center justify-between mb-16 sm:mb-20">
              <div className="flex items-center gap-2.5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }}
                  animate={{ opacity: [1, 0.08, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity }}
                />
                <span className="text-[9px] tracking-[0.22em] uppercase" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.25)' }}>
                  SISTEMA ATIVO
                </span>
              </div>
              <span className="text-[9px] tabular-nums" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.15)' }}>
                v3.1.0 · PROD
              </span>
            </div>

            {/* ── Function rows ── */}
            <div className="flex flex-col">
              {FUNCS.map((fn, i) => (
                <motion.div
                  key={fn.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.5 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {i > 0 && (
                    <div className="h-px my-10 sm:my-14" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  )}
                  <div className="flex items-center justify-between gap-4">
                    {/* Dot + function name */}
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="relative shrink-0 flex items-center justify-center w-3 h-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: fn.dot, boxShadow: `0 0 10px ${fn.dot}, 0 0 20px ${fn.dot}50` }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ background: fn.dot, opacity: 0.3 }}
                          animate={{ scale: [1, 2.8, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.8 }}
                        />
                      </div>
                      <span
                        className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight"
                        style={{ color: 'rgba(255,255,255,0.90)' }}
                      >
                        {fn.name}
                      </span>
                    </div>

                    {/* Live metric */}
                    <div className="shrink-0">
                      <LiveMetric label={fn.label} value={fn.val} color={fn.color} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom strip */}
            <div
              className="mt-14 sm:mt-20 pt-6 flex items-center justify-between"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
            >
              <span
                className="text-[9px] tracking-[0.2em] uppercase"
                style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.18)' }}
              >
                Ebbinghaus Engine · TRI-Calibrated
              </span>
              <div className="flex items-center gap-2.5">
                {[NEON, CYAN, VIOLET].map((c, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: c, boxShadow: `0 0 4px ${c}` }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.45 }}
                  />
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
