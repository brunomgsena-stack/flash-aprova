'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Design tokens ──────────────────────────────────────────────────────────
const NEON    = '#00FF73';
const EMERALD = '#10b981';
const VIOLET  = '#7C3AED';

// ─── Deterministic graph — computed once at module load ─────────────────────
// XorShift32 PRNG (fast, deterministic, no Math.random())
function xsr(seed: number) {
  let s = (seed || 1) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s <<  5)) >>> 0;
    return s / 0x1_0000_0000;
  };
}

const LW = 440, LH = 310;         // logical canvas dimensions
const GCX = LW / 2, GCY = LH / 2;

const nodeRng = xsr(7331);
const RAW_NODES = Array.from({ length: 64 }, (_, id) => {
  const angle = nodeRng() * Math.PI * 2;
  const t     = nodeRng();
  const r     = 16 + Math.pow(t, 0.55) * 140;  // denser toward edge
  return {
    id,
    bx:   GCX + r * Math.cos(angle) * 1.28,
    by:   GCY + r * Math.sin(angle) * 0.70,
    gFreq: 0.5 + nodeRng() * 2.5,
    gPh:   nodeRng() * Math.PI * 2,
    br:    1.6 + nodeRng() * 1.9,
  };
});

const gMaxD = Math.max(...RAW_NODES.map(n => Math.hypot(n.bx - GCX, n.by - GCY)));
const NODES = RAW_NODES.map(n => ({
  ...n,
  dn: Math.hypot(n.bx - GCX, n.by - GCY) / gMaxD, // normalised dist from center
}));

// Edges: connect nearby nodes, cap 5 per node
const edgeCt = new Uint8Array(64);
const edgeRng = xsr(1337);
const EDGES: [number, number, number][] = []; // [i, j, phaseOffset]
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    if (edgeCt[i] >= 5 || edgeCt[j] >= 5) continue;
    if (Math.hypot(NODES[i].bx - NODES[j].bx, NODES[i].by - NODES[j].by) < 70) {
      EDGES.push([i, j, edgeRng()]);
      edgeCt[i]++;
      edgeCt[j]++;
    }
  }
}

// ─── System logs ─────────────────────────────────────────────────────────────
const LOGS = [
  {
    icon: '🧠', tag: 'SINAPSE ATIVA', color: NEON,
    text: 'Identificamos conexões fracas e o que você vai esquecer.',
    delay: 0.00,
  },
  {
    icon: '🏗️', tag: 'ARQUITETURA DA MENTE', color: EMERALD,
    text: 'Deixe de ver matérias isoladas. Veja seu conhecimento amadurecer.',
    delay: 0.15,
  },
  {
    icon: '🛡️', tag: 'BLINDAGEM COGNITIVA', color: VIOLET,
    text: 'Transformamos o ruído mental em aprovação focada na TRI.',
    delay: 0.30,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
interface Shockwave { x: number; y: number; t: number; color: string; }

export default function NeuralBrainMap() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const sectionRef    = useRef<HTMLDivElement>(null);
  const healRef       = useRef<number | null>(null);
  const scaleRef      = useRef(1);
  const rafRef        = useRef(0);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const isMobileRef   = useRef(false);

  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  // Arm the heal timer when section enters view
  useEffect(() => {
    if (inView && healRef.current === null) {
      healRef.current = performance.now() + 700; // 700ms lead-in before heal starts
    }
  }, [inView]);

  // Canvas sizing + animation loop
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Responsive sizing ─────────────────────────────────────────────────
    const resize = () => {
      const dpr  = window.devicePixelRatio || 1;
      const cssW = container.clientWidth;
      const cssH = Math.round(cssW * (LH / LW));
      canvas.width        = cssW * dpr;
      canvas.height       = cssH * dpr;
      canvas.style.width  = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      scaleRef.current    = (cssW / LW) * dpr;
      isMobileRef.current = cssW < 640;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Draw loop ─────────────────────────────────────────────────────────
    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scaleRef.current, scaleRef.current);

      const hs = healRef.current;
      const hf = hs !== null ? Math.min(Math.max((now - hs) / 2600, 0), 1) : 0;

      // Mobile density reduction
      const mobileCutoff = isMobileRef.current ? Math.floor(NODES.length * 0.4) : NODES.length;
      const VISIBLE_NODES = isMobileRef.current ? NODES.filter(n => n.id < mobileCutoff) : NODES;
      const visibleSet = new Set(VISIBLE_NODES.map(n => n.id));
      const VISIBLE_EDGES = EDGES.filter(([i, j]) => visibleSet.has(i) && visibleSet.has(j));

      // 1. Radial background glow — shifts red → emerald as healing progresses
      const bg = ctx.createRadialGradient(GCX, GCY, 0, GCX, GCY, 175);
      bg.addColorStop(0,   `rgba(16,185,129,${0.03 + hf * 0.12})`);
      bg.addColorStop(0.4, `rgba(${Math.round(80*(1-hf))},${Math.round(10*(1-hf)+40*hf)},${Math.round(5*(1-hf)+20*hf)},0.06)`);
      bg.addColorStop(1,   'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, LW, LH);

      // 2. Edges
      ctx.lineWidth = 0.75;
      for (const [i, j] of VISIBLE_EDGES) {
        const ni = NODES[i], nj = NODES[j];
        const ih = hf > ni.dn, jh = hf > nj.dn;
        ctx.beginPath();
        ctx.moveTo(ni.bx, ni.by);
        ctx.lineTo(nj.bx, nj.by);
        ctx.strokeStyle = (ih && jh)
          ? 'rgba(16,185,129,0.22)'
          : (ih || jh)
            ? 'rgba(0,255,115,0.13)'
            : 'rgba(239,68,68,0.09)';
        ctx.stroke();
      }

      // 3. Healing pulses — emerald dots traveling along edges
      for (const [i, j, ph] of VISIBLE_EDGES) {
        const ni = NODES[i], nj = NODES[j];
        const ih = hf > ni.dn, jh = hf > nj.dn;
        if (!ih && !jh) continue;  // nothing healed yet on this edge

        const t   = ((now / 1050 + ph) % 1);  // 0→1 looping, phase-shifted per edge
        const src = ih ? ni : nj;
        const dst = ih ? nj : ni;
        const px  = src.bx + (dst.bx - src.bx) * t;
        const py  = src.by + (dst.by - src.by) * t;

        ctx.beginPath();
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(0,255,115,${Math.sin(t * Math.PI) * 0.85})`;
        ctx.shadowBlur  = 7;
        ctx.shadowColor = NEON;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }

      // 4. Nodes
      for (const n of VISIBLE_NODES) {
        const healed = hf > n.dn;
        // healT: 0→1 transition once node's threshold is crossed (over ~14% of total range)
        const healT  = healed ? Math.min((hf - n.dn) / 0.14, 1) : 0;

        // Glitch jitter — dampens as healT rises
        const jx = Math.sin(now * 0.001  * n.gFreq + n.gPh) * 2.8 * (1 - healT);
        const jy = Math.cos(now * 0.0014 * n.gFreq + n.gPh) * 2.0 * (1 - healT);

        const x  = n.bx + jx;
        const y  = n.by + jy;
        const r  = n.br + (healed ? Math.sin(now * 0.0008 + n.gPh) * 0.55 : 0);

        // Color lerp: glitch (red/orange oscillation) → emerald
        const gt = Math.sin(now * 0.0009 * n.gFreq + n.gPh) * 0.5 + 0.5; // 0→1
        const fR = 239 + gt * 10;
        const fG = 68  + gt * 47;
        const fB = Math.max(68 - gt * 46, 22);
        const cr = Math.round(fR + (16  - fR) * healT);
        const cg = Math.round(fG + (185 - fG) * healT);
        const cb = Math.round(fB + (129 - fB) * healT);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
        ctx.shadowBlur  = healed ? 10 + Math.sin(now * 0.001) * 3 : 5;
        ctx.shadowColor = healed ? EMERALD : '#ef4444';
        ctx.fill();
        ctx.shadowBlur  = 0;
      }

      // 5. Shockwaves
      const alive: Shockwave[] = [];
      for (const sw of shockwavesRef.current) {
        const age = (now - sw.t) / 850; // 0→1 over 850 ms
        if (age >= 1) continue;
        alive.push(sw);
        const r     = age * 40;
        const alpha = (1 - age) * 0.75;
        // outer ring
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,115,${alpha * 0.9})`;
        ctx.lineWidth   = 1.5 * (1 - age);
        ctx.shadowBlur  = 12 * (1 - age);
        ctx.shadowColor = NEON;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        // mid ring
        if (age < 0.65) {
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, r * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55 * (1 - age / 0.65)})`;
          ctx.lineWidth   = 0.75;
          ctx.stroke();
        }
        // center flash
        if (age < 0.2) {
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(1 - age / 0.2) * 0.9})`;
          ctx.fill();
        }
      }
      shockwavesRef.current = alive;

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    // ── Node hit-detection helpers ─────────────────────────────────────────
    const getLogicalPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx   = LW / rect.width;
      const sy   = LH / rect.height;
      return { lx: (clientX - rect.left) * sx, ly: (clientY - rect.top) * sy };
    };

    const trySpawnShockwave = (lx: number, ly: number) => {
      // Find nearest node within 14 logical-px
      let closest: (typeof NODES)[0] | null = null;
      let minDist = 14;
      for (const n of NODES) {
        const d = Math.hypot(lx - n.bx, ly - n.by);
        if (d < minDist) { minDist = d; closest = n; }
      }
      if (!closest) return;
      const now2 = performance.now();
      // Debounce: don't re-spawn within 350 ms on same node
      const recent = shockwavesRef.current.find(
        sw => Math.hypot(sw.x - closest!.bx, sw.y - closest!.by) < 6 && (now2 - sw.t) < 350
      );
      if (!recent) {
        shockwavesRef.current.push({ x: closest.bx, y: closest.by, t: now2, color: NEON });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const { lx, ly } = getLogicalPos(e.clientX, e.clientY);
      trySpawnShockwave(lx, ly);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const { lx, ly } = getLogicalPos(t.clientX, t.clientY);
      trySpawnShockwave(lx, ly);
    };

    if (!isMobileRef.current) {
      canvas.addEventListener('mousemove', onMouseMove);
    }
    canvas.addEventListener('touchstart', onTouch, { passive: true });

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouch);
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}>
          A Solução
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          A IA mapeia seu cérebro{' '}
          <span style={{
            background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            em tempo real
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Visualize exatamente o que você domina, o que está esquecendo e quando
          revisar cada tópico — sem esforço manual.
        </p>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center">

        {/* ── Brain canvas ────────────────────────────────────────────────── */}
        <motion.div
          ref={containerRef}
          className="lg:col-span-3 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.88)',
            border:     '1px solid rgba(255,255,255,0.07)',
            boxShadow:  '0 0 60px rgba(0,255,115,0.04)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${NEON}40, transparent)` }} />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: NEON, opacity: 0.35 }} />
            <div className="absolute top-0 left-0 w-px h-full" style={{ background: NEON, opacity: 0.35 }} />
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-px" style={{ background: EMERALD, opacity: 0.35 }} />
            <div className="absolute bottom-0 right-0 w-px h-full" style={{ background: EMERALD, opacity: 0.35 }} />
          </div>

          {/* The brain */}
          <canvas ref={canvasRef} style={{ display: 'block' }} />

          {/* Status label */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 pointer-events-none">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: inView ? EMERALD : '#ef4444' }}
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: inView ? 1.2 : 0.5, repeat: Infinity }}
            />
            <span className="text-[9px] tracking-widest uppercase"
              style={{
                fontFamily: 'ui-monospace, monospace',
                color:      inView ? EMERALD : '#ef4444',
                opacity:    0.70,
              }}>
              {inView ? 'MAPEAMENTO ATIVO' : 'AGUARDANDO SCAN'}
            </span>
          </div>

          {/* Node count badge */}
          <div className="absolute top-3 right-4 pointer-events-none">
            <span className="text-[9px] tabular-nums tracking-widest"
              style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.18)' }}>
              {NODES.length} NODES · {EDGES.length} SYNAPSES
            </span>
          </div>
        </motion.div>

        {/* ── System logs ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          {LOGS.map((log, i) => (
            <motion.div
              key={i}
              className="rounded-xl p-4"
              style={{
                background:           `${log.color}07`,
                backdropFilter:       'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderStyle:          'solid',
                borderTopWidth:       '2px',
                borderTopColor:       `${log.color}50`,
                borderLeftWidth:      '1px',
                borderRightWidth:     '1px',
                borderBottomWidth:    '1px',
                borderLeftColor:      `${log.color}20`,
                borderRightColor:     `${log.color}20`,
                borderBottomColor:    `${log.color}20`,
              }}
              initial={{ opacity: 0, x: 22 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.45 + log.delay, ease: 'easeOut' }}
            >
              {/* Terminal tag */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm leading-none">{log.icon}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: log.color, fontFamily: 'ui-monospace, monospace' }}>
                  [ {log.tag} ]
                </span>
                <motion.span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: log.color }}
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1.3 + i * 0.35, repeat: Infinity, delay: i * 0.45 }}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{log.text}</p>
              <div className="mt-3 h-px"
                style={{ background: `linear-gradient(90deg, ${log.color}35, transparent)` }} />
            </motion.div>
          ))}

          {/* Live metrics strip */}
          <motion.div
            className="rounded-xl px-4 py-3 grid grid-cols-2 gap-4"
            style={{
              background:  'rgba(0,0,0,0.50)',
              border:      '1px solid rgba(0,255,115,0.12)',
              backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0, x: 22 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.75, ease: 'easeOut' }}
          >
            <div>
              <p className="text-xl font-black tabular-nums leading-none"
                style={{ color: NEON, fontFamily: 'ui-monospace, monospace', filter: `drop-shadow(0 0 8px ${NEON}50)` }}>
                {NODES.length}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: 'ui-monospace, monospace' }}>
                sinapses mapeadas
              </p>
            </div>
            <div>
              <p className="text-xl font-black tabular-nums leading-none"
                style={{ color: EMERALD, fontFamily: 'ui-monospace, monospace', filter: `drop-shadow(0 0 8px ${EMERALD}50)` }}>
                {EDGES.length}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: 'ui-monospace, monospace' }}>
                conexões ativas
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
