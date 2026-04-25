'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Tokens ────────────────────────────────────────────────────────────────────
const NEON      = '#00FF73';
const EMERALD   = '#10b981';
const CYAN      = '#06b6d4';
const VIOLET    = '#7C3AED';
const ORANGE    = '#f97316';
const JETBRAINS = "'JetBrains Mono', ui-monospace, monospace";

// ── Stagger variants ──────────────────────────────────────────────────────────
const gridVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ children, color, className = '' }: {
  children: React.ReactNode; color: string; className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      variants={cardVariants}
      className={`relative rounded-2xl p-5 sm:p-6 overflow-hidden ${className}`}
      style={{
        background:           'rgba(18,18,18,0.92)',
        border: `1px solid ${hovered ? color + '50' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? `0 0 36px ${color}28, 0 0 0 1px ${color}35` : '0 0 0 0 transparent',
        transition: 'border-color 0.28s ease, box-shadow 0.28s ease',
      }}
      whileHover={{ scale: 1.012 }}
      transition={{ duration: 0.22 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${hovered ? '80' : '35'}, transparent)`,
          transition: 'opacity 0.28s',
        }} />
      {children}
    </motion.div>
  );
}

// ── Autopilot Interceptor canvas ──────────────────────────────────────────────
function AutopilotCanvas() {
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

    const BASE_COLORS = [NEON, CYAN, VIOLET, '#a855f7', EMERALD, '#818cf8'];

    type SynapseNode = {
      x: number; y: number;
      vx: number; vy: number;
      color: string; r: number; ph: number;
      strength: number;     // 0–1: quanto a memória está preservada
      weakenRate: number;   // velocidade de esquecimento
      flashTimer: number;   // frames de flash pós-interceptação
    };

    type Interceptor = {
      x: number; y: number;
      angle: number;
      targetIdx: number;
      mode: 'hunting' | 'restoring';
      restoreTimer: number;
      pulseR: number;
    };

    let nodes: SynapseNode[] = [];
    let inter: Interceptor;

    const findWeakest = (): number => {
      let idx = 0, minS = 2;
      nodes.forEach((n, i) => { if (n.strength < minS) { minS = n.strength; idx = i; } });
      return idx;
    };

    const init = () => {
      const W = canvas.width, H = canvas.height;
      nodes = Array.from({ length: 36 }, () => ({
        x: Math.random() * (W - 20) + 10,
        y: Math.random() * (H - 20) + 10,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        color: BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)],
        r: Math.random() * 0.9 + 1.0,
        ph: Math.random() * Math.PI * 2,
        strength: 0.65 + Math.random() * 0.35,
        weakenRate: 0.00035 + Math.random() * 0.00055,
        flashTimer: 0,
      }));
      inter = {
        x: W / 2, y: H / 2,
        angle: 0,
        targetIdx: findWeakest(),
        mode: 'hunting',
        restoreTimer: 0,
        pulseR: 0,
      };
    };

    // ── Draw segmented rotating ring (interceptor) ──
    const drawInterceptor = (
      x: number, y: number,
      angle: number,
      color: string,
      restoring: boolean,
    ) => {
      const R   = 13 + (restoring ? 1 : 0);
      const SEG = 8;
      const arc = (Math.PI * 2) / SEG;
      for (let s = 0; s < SEG; s++) {
        const a0 = angle + s * arc;
        const a1 = a0 + arc * 0.62;
        ctx.beginPath();
        ctx.arc(x, y, R, a0, a1);
        ctx.strokeStyle = color + (restoring ? 'cc' : '88');
        ctx.lineWidth   = restoring ? 1.8 : 1.3;
        ctx.stroke();
      }
      // Inner ring
      ctx.beginPath();
      ctx.arc(x, y, R * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = color + (restoring ? '70' : '40');
      ctx.lineWidth   = 0.8;
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle  = color + (restoring ? 'ff' : 'bb');
      ctx.shadowColor = color;
      ctx.shadowBlur  = restoring ? 16 : 8;
      ctx.fill();
      ctx.shadowBlur  = 0;
      // Corner brackets
      const br   = R * 1.5, bL = 5;
      const quads = [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][];
      ctx.strokeStyle = color + '55';
      ctx.lineWidth   = 0.8;
      quads.forEach(([sx, sy]) => {
        const cx = x + sx * br, cy = y + sy * br;
        ctx.beginPath();
        ctx.moveTo(cx + sx * bL, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * bL);
        ctx.stroke();
      });
    };

    const LINK_DIST = 145;

    const tick = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { raf.current = requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, W, H);

      // ── Move & weaken nodes ──
      nodes.forEach(n => {
        n.ph += 0.015;
        n.vx *= 0.972; n.vy *= 0.972;
        n.x  += n.vx; n.y += n.vy;
        if (n.x < 5)     { n.x = 5;     n.vx *= -1; }
        if (n.x > W - 5) { n.x = W - 5; n.vx *= -1; }
        if (n.y < 5)     { n.y = 5;     n.vy *= -1; }
        if (n.y > H - 5) { n.y = H - 5; n.vy *= -1; }
        // Weaken (simula esquecimento)
        n.strength   = Math.max(0.10, n.strength - n.weakenRate);
        if (n.flashTimer > 0) n.flashTimer--;
      });

      // ── Move interceptor ──
      inter.angle += inter.mode === 'restoring' ? 0.10 : 0.038;
      const tgt = nodes[inter.targetIdx];

      if (inter.mode === 'hunting') {
        inter.x += (tgt.x - inter.x) * 0.033;
        inter.y += (tgt.y - inter.y) * 0.033;
        if (Math.hypot(inter.x - tgt.x, inter.y - tgt.y) < 11) {
          // INTERCEPTOU
          inter.mode        = 'restoring';
          inter.restoreTimer = 50;
          inter.pulseR       = 0;
          tgt.strength       = Math.min(1.0, tgt.strength + 0.80);
          tgt.flashTimer     = 45;
        }
      } else {
        inter.x += (tgt.x - inter.x) * 0.18;
        inter.y += (tgt.y - inter.y) * 0.18;
        inter.restoreTimer--;
        inter.pulseR += 1.1;
        if (inter.restoreTimer <= 0) {
          inter.mode    = 'hunting';
          inter.pulseR  = 0;
          inter.targetIdx = findWeakest();
        }
      }

      // ── Draw connections (cor + alpha pela força) ──
      const hx = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d >= LINK_DIST) continue;
          const avgStr = (nodes[i].strength + nodes[j].strength) / 2;
          const a      = (1 - d / LINK_DIST) * 0.52 * avgStr;
          const g      = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          g.addColorStop(0, nodes[i].color + hx(a));
          g.addColorStop(1, nodes[j].color + hx(a));
          ctx.strokeStyle = g;
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // ── Dashed pursuit line ──
      if (inter.mode === 'hunting') {
        ctx.beginPath();
        ctx.moveTo(inter.x, inter.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = `${CYAN}25`;
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([4, 9]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Restore pulse ring ──
      if (inter.mode === 'restoring' && inter.pulseR < 55) {
        const pa  = Math.max(0, 1 - inter.pulseR / 55);
        const paH = Math.round(pa * 190).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(inter.x, inter.y, inter.pulseR * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = `${NEON}${paH}`;
        ctx.lineWidth   = 1.8;
        ctx.stroke();
      }

      // ── Draw nodes ──
      nodes.forEach((n, i) => {
        const isTarget = i === inter.targetIdx;
        const r = (n.r + Math.sin(n.ph) * 0.28) * (isTarget ? 1.7 : 1);

        // Flash de restauração
        if (n.flashTimer > 0) {
          const fp = n.flashTimer / 45;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + fp * 9, 0, Math.PI * 2);
          ctx.fillStyle = `${NEON}${Math.round(fp * 100).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }

        // Cor do nó: laranja se crítico (força < 0.3)
        const nodeColor  = n.strength < 0.32 ? ORANGE : n.color;
        const alphaVal   = Math.max(0.18, n.strength);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle  = nodeColor + hx(alphaVal);
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur  = isTarget ? 20 : (6 * n.strength + 2);
        ctx.fill();
        ctx.shadowBlur  = 0;
      });

      // ── Draw interceptor ──
      drawInterceptor(inter.x, inter.y, inter.angle,
        inter.mode === 'restoring' ? NEON : CYAN,
        inter.mode === 'restoring',
      );

      // ── HUD overlay ──
      ctx.font          = "9.5px 'JetBrains Mono', monospace";
      ctx.textBaseline  = 'top';
      ctx.fillStyle     = `${NEON}50`;
      ctx.fillText('◉ AUTOPILOT: ATIVO', 9, 8);

      const statusLabel = inter.mode === 'restoring'
        ? '⚡ REFORÇO SINÁPTICO'
        : '⟳ VARREDURA NEURAL';
      ctx.font         = "9px 'JetBrains Mono', monospace";
      ctx.textBaseline = 'bottom';
      ctx.fillStyle    = (inter.mode === 'restoring' ? NEON : CYAN) + '80';
      ctx.fillText(statusLabel, 9, H - 8);

      raf.current = requestAnimationFrame(tick);
    };

    let started = false;
    const ro = new ResizeObserver(() => {
      setup();
      if (!started) { started = true; init(); tick(); }
    });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}

// ── Live metric ───────────────────────────────────────────────────────────────
function LiveMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.span key={value} className="text-[10px] tabular-nums"
      style={{ fontFamily: JETBRAINS, color: 'rgba(255,255,255,0.30)' }}
      initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {label}: <span style={{ color, fontWeight: 600 }}>{value}</span>
    </motion.span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BlindagemEngine() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px' });

  const [m, setM] = useState({ r: '98.4%', l: '0.019ms', c: '94.7%' });
  useEffect(() => {
    const iv = setInterval(() => setM({
      r: `${(98 + Math.random() * 0.9).toFixed(1)}%`,
      l: `${(0.016 + Math.random() * 0.009).toFixed(3)}ms`,
      c: `${(94 + Math.random() * 1.4).toFixed(1)}%`,
    }), 2400);
    return () => clearInterval(iv);
  }, []);

  const FUNCS = [
    { name: 'Interceptação Neural', metricKey: 'Retention_Stability', metricVal: m.r, color: NEON   },
    { name: 'Filtro TRI 80/20',     metricKey: 'Process_Latency',     metricVal: m.l, color: CYAN   },
    { name: 'Oráculo da Vaga',      metricKey: 'Convergence_Score',   metricVal: m.c, color: VIOLET },
  ];

  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ── */}
      <div className="text-center mb-6">
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: CYAN, fontFamily: JETBRAINS }}>
          &gt; Algoritmo de Blindagem
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Sua memória no{' '}
          <span style={{
            background: `linear-gradient(90deg, ${NEON}, ${CYAN})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            piloto automático.
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Pare de gerenciar revisões. <strong>Enquanto você descansa</strong>, o Algoritmo de Blindagem calcula
          o timing exato para <strong>interceptar o esquecimento</strong>.
        </p>
      </div>

      {/* ── Grid ── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch"
        variants={gridVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >

        {/* ── Card 1 — Processador de Memória (piloto automático) ── */}
        <Card color={VIOLET} className="md:col-span-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            {/* Autopilot icon: animated rotating ring */}
            <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `1.5px solid ${VIOLET}80` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-1 rounded-full"
                style={{ border: `1px dashed ${CYAN}60` }}
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }} />
            </div>
            <div>
              <p className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: VIOLET, fontFamily: JETBRAINS }}>
                Processador de Memória
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: JETBRAINS }}>
                Piloto automático · interceptação sináptica
              </p>
            </div>
            {/* Autopilot badge */}
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0"
              style={{ background: `${NEON}12`, border: `1px solid ${NEON}30` }}>
              <motion.span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: NEON }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[9px] font-black tracking-widest"
                style={{ color: NEON, fontFamily: JETBRAINS }}>
                AUTOPILOT
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden" style={{ height: 260 }}>
            <div className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }} />
            <AutopilotCanvas />
            {/* Bottom vignette */}
            <div className="absolute bottom-0 inset-x-0 h-14 pointer-events-none rounded-b-xl"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
          </div>

          {/* Status bar */}
          <div className="mt-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: `${VIOLET}0a`, border: `1px solid ${VIOLET}20` }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{ color: NEON, fontSize: 10, fontFamily: JETBRAINS }}>●</motion.span>
            <p className="text-[11px] font-semibold" style={{ color: VIOLET }}>
              Algoritmo operando — <span className="font-black" style={{ color: NEON }}>sinapses protegidas em tempo real</span>
            </p>
          </div>
        </Card>



      </motion.div>
    </section>
  );
}
