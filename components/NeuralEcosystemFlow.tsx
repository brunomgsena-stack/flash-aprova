'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
} from 'framer-motion';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const VIOLET  = '#7C3AED';
const NEON    = '#00FF73';
const V_LIGHT = '#a78bfa';
const ORANGE  = '#FF8A00';

// ─── Ring config ──────────────────────────────────────────────────────────────
interface Ring {
  id:       string;
  number:   string;
  label:    string;
  sublabel: string;
  color:    string;
  size:     number;
  tiltX:    number;
  tiltZ:    number;
  duration: number;
}

const RINGS: Ring[] = [
  {
    id:       'radar',
    number:   '01',
    label:    'RADAR DE LACUNAS',
    sublabel: 'Mapeamento de falhas invisíveis',
    color:    ORANGE,
    size:     200,
    tiltX:    78,
    tiltZ:    0,
    duration: 8,
  },
  {
    id:       'blindagem',
    number:   '02',
    label:    'ALGORITMO DE BLINDAGEM',
    sublabel: 'Fixação matemática de dados',
    color:    NEON,
    size:     295,
    tiltX:    72,
    tiltZ:    58,
    duration: 13,
  },
  {
    id:       'resposta',
    number:   '03',
    label:    'RESPOSTA INSTANTÂNEA',
    sublabel: "O fim do 'branco' no ENEM",
    color:    V_LIGHT,
    size:     380,
    tiltX:    72,
    tiltZ:    -58,
    duration: 6.5,
  },
];

// viewBox dimensions for the connector SVG overlay
const VW = 680;
const VH = 500;
const CX = VW / 2; // 340
const CY = VH / 2; // 250

// Chip connector anchor points (in SVG viewBox units)
// These are the inner edges of each chip where lines terminate
const ANCHORS = [
  { x: 486, y: 112 },  // RADAR — top-right chip, left inner edge
  { x: 194, y: 268 },  // BLINDAGEM — left chip, right inner edge
  { x: 486, y: 368 },  // RESPOSTA — bottom-right chip, left inner edge
];

// ─── Orbital ring (3D-tilted SVG) ─────────────────────────────────────────────
function OrbitalRing({ ring, isActive }: { ring: Ring; isActive: boolean }) {
  const r    = ring.size / 2 - 2;
  const c    = ring.size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.07;
  const gap  = circ - dash;

  return (
    <div
      aria-hidden
      style={{
        position:       'absolute',
        width:          ring.size,
        height:         ring.size,
        left:           '50%',
        top:            '50%',
        marginLeft:     -ring.size / 2,
        marginTop:      -ring.size / 2,
        transform:      `rotateX(${ring.tiltX}deg) rotateZ(${ring.tiltZ}deg)`,
        transformStyle: 'preserve-3d',
        pointerEvents:  'none',
      }}
    >
      <svg
        width={ring.size}
        height={ring.size}
        viewBox={`0 0 ${ring.size} ${ring.size}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={`glow-${ring.id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static orbital path */}
        <circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={ring.color}
          strokeWidth={isActive ? 1.2 : 0.5}
          strokeOpacity={isActive ? 0.55 : 0.15}
          style={{ transition: 'stroke-width 0.5s, stroke-opacity 0.5s' }}
        />

        {/* Traveling pulse */}
        <motion.circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={ring.color}
          strokeWidth={isActive ? 4.5 : 2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          animate={{ strokeDashoffset: [0, -circ] }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
          filter={`url(#glow-${ring.id})`}
          strokeOpacity={isActive ? 1 : 0.3}
          style={{ transition: 'stroke-width 0.5s, stroke-opacity 0.5s' }}
        />
      </svg>
    </div>
  );
}

// ─── Pulsing nucleus ──────────────────────────────────────────────────────────
function Nucleus() {
  return (
    <div
      style={{
        position:     'absolute',
        left:         '50%',
        top:          '50%',
        transform:    'translate(-50%, -50%)',
        width:        88,
        height:       88,
        borderRadius: '50%',
      }}
    >
      {[1.9, 1.45, 1.0].map((scale, i) => (
        <motion.div
          key={i}
          style={{
            position:     'absolute',
            inset:        0,
            borderRadius: '50%',
            border:       `1px solid ${i === 0 ? V_LIGHT : VIOLET}`,
            transform:    `scale(${scale})`,
          }}
          animate={{
            opacity: [0.08, 0.28, 0.08],
            scale:   [scale, scale * 1.06, scale],
          }}
          transition={{
            duration: 3 + i * 0.8,
            repeat:   Infinity,
            ease:     'easeInOut',
            delay:    i * 0.65,
          }}
        />
      ))}

      <div
        style={{
          position:     'absolute',
          inset:        9,
          borderRadius: '50%',
          background:   `radial-gradient(circle at 35% 30%, ${V_LIGHT}70 0%, ${VIOLET}95 55%, #130820 100%)`,
          boxShadow:    `0 0 32px ${VIOLET}90, 0 0 70px ${VIOLET}45, inset 0 0 18px ${V_LIGHT}25`,
        }}
      />

      <motion.div
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${V_LIGHT}35 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.88, 1.12, 0.88] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Connector lines SVG overlay ─────────────────────────────────────────────
function ConnectorLines({ active }: { active: number }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width="100%" height="100%"
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {RINGS.map((ring) => (
          <filter key={ring.id} id={`ln-glow-${ring.id}`}
            x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {RINGS.map((ring, i) => {
        const { x: ex, y: ey } = ANCHORS[i];
        const isActive = active === i;

        return (
          <g key={ring.id}>
            {/* Dashed static line */}
            <line
              x1={CX} y1={CY}
              x2={ex}  y2={ey}
              stroke={ring.color}
              strokeWidth={isActive ? 0.8 : 0.35}
              strokeOpacity={isActive ? 0.45 : 0.12}
              strokeDasharray="4 5"
              style={{ transition: 'stroke-width 0.5s, stroke-opacity 0.5s' }}
            />

            {/* Traveling particle — only when active */}
            {isActive && (
              <motion.circle
                r="3.5"
                fill={ring.color}
                filter={`url(#ln-glow-${ring.id})`}
                animate={{
                  cx: [CX, ex],
                  cy: [CY, ey],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration:    1.4,
                  repeat:      Infinity,
                  ease:        'easeOut',
                  repeatDelay: 0.6,
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Orbital chip (the prominent element) ─────────────────────────────────────
function OrbitalChip({
  ring,
  isActive,
  pos,
}: {
  ring:     Ring;
  isActive: boolean;
  pos:      { top: string; left?: string; right?: string };
}) {
  const alignRight = pos.right !== undefined;

  return (
    <motion.div
      className="hidden sm:block"
      style={{
        position: 'absolute',
        top:      pos.top,
        ...(pos.left  !== undefined ? { left:  pos.left  } : {}),
        ...(pos.right !== undefined ? { right: pos.right } : {}),
        width:    190,
      }}
      animate={{ opacity: isActive ? 1 : 0.32 }}
      transition={{ duration: 0.5 }}
    >
      <div
        style={{
          position:             'relative',
          background:           isActive
            ? `linear-gradient(135deg, rgba(8,4,20,0.92) 0%, ${ring.color}12 100%)`
            : 'rgba(8,4,20,0.78)',
          border:               `1px solid ${ring.color}${isActive ? '55' : '22'}`,
          borderRadius:         12,
          padding:              '11px 14px 10px',
          boxShadow:            isActive
            ? `0 0 28px ${ring.color}22, 0 0 70px ${ring.color}0e, inset 0 1px 0 ${ring.color}35`
            : 'none',
          transition:           'all 0.5s ease',
        }}
      >
        {/* Top shimmer */}
        <div
          style={{
            position:   'absolute',
            insetInline: 0,
            top:        0,
            height:     1,
            borderRadius:'12px 12px 0 0',
            background: `linear-gradient(90deg, transparent, ${ring.color}${isActive ? '88' : '28'}, transparent)`,
            transition: 'background 0.5s',
          }}
        />

        {/* Number + label */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
          <span
            style={{
              fontFamily:    'ui-monospace, monospace',
              fontSize:      8,
              color:         ring.color,
              opacity:       0.65,
              letterSpacing: '0.08em',
              paddingTop:    2,
              minWidth:      16,
              lineHeight:    1,
            }}
          >
            {ring.number}
          </span>

          <p
            style={{
              fontFamily:    'ui-monospace, monospace',
              fontSize:      11,
              letterSpacing: '0.10em',
              color:         ring.color,
              fontWeight:    800,
              lineHeight:    1.25,
              textShadow:    isActive ? `0 0 12px ${ring.color}70` : 'none',
              transition:    'text-shadow 0.5s',
            }}
          >
            {ring.label}
          </p>
        </div>

        {/* Sublabel */}
        <p
          style={{
            fontFamily:    'ui-monospace, monospace',
            fontSize:      9,
            letterSpacing: '0.04em',
            color:         isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)',
            lineHeight:    1.45,
            paddingLeft:   24,
            transition:    'color 0.5s',
          }}
        >
          {ring.sublabel}
        </p>

        {/* Connector anchor dot (inner edge of chip) */}
        <motion.div
          style={{
            position:     'absolute',
            top:          '50%',
            transform:    'translateY(-50%)',
            [alignRight ? 'left' : 'right']: -5,
            width:        10,
            height:       10,
            borderRadius: '50%',
            background:   ring.color,
            boxShadow:    `0 0 ${isActive ? 14 : 4}px ${ring.color}`,
            transition:   'box-shadow 0.5s',
          }}
          animate={isActive
            ? { opacity: [0.6, 1, 0.6] }
            : { opacity: 0.35 }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Breathing border overlay */}
        {isActive && (
          <motion.div
            style={{
              position:     'absolute',
              inset:        0,
              borderRadius: 12,
              border:       `1px solid ${ring.color}`,
              pointerEvents:'none',
            }}
            animate={{ opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Chip layout positions in the visual container
const CHIP_POSITIONS = [
  { top: '14%', right: '0%' },   // RADAR
  { top: '44%', left:  '0%' },   // BLINDAGEM
  { top: '65%', right: '0%' },   // RESPOSTA
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NeuralEcosystemFlow() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, amount: 0.25 });

  // Mouse parallax
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 38, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 38, damping: 22 });
  const rotY    = useTransform(springX, [-1, 1], [-16, 16]);
  const rotX    = useTransform(springY, [-1, 1], [9, -9]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2));
    mouseY.set((e.clientY - rect.top   - rect.height / 2) / (rect.height / 2));
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Active ring cycling
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => setActive(a => (a + 1) % RINGS.length), 2800);
    return () => clearInterval(iv);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="max-w-6xl mx-auto px-5 sm:px-10 pb-10 sm:pb-28 pt-8"
    >

      {/* ── Headline ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-1 sm:mb-6"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <p
          style={{
            fontFamily:    'ui-monospace, monospace',
            fontSize:      10,
            letterSpacing: '0.20em',
            color:         VIOLET,
            fontWeight:    700,
            textTransform: 'uppercase',
            marginBottom:  14,
          }}
        >
          &gt;_ NEURAL CORE
        </p>

        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5"
          style={{ letterSpacing: '-0.025em', lineHeight: 1.05 }}
        >
          A Engenharia da{' '}
          <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>Memória.</span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Conheça o{' '}
          <span className="text-white font-semibold">Neural Core</span>
          : a tecnologia do FlashAprova que garante que você{' '}
          <span style={{ color: V_LIGHT }}>nunca mais perca</span>{' '}
          o que estudou.
        </p>
      </motion.div>

      {/* ── Visual arena ─────────────────────────────────────────────────────── */}
      <div
        className="relative mx-auto h-[280px] sm:h-[460px]"
        style={{ maxWidth: 680 }}
      >

        {/* Connector lines */}
        <ConnectorLines active={active} />

        {/* 3D core */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '900px' }}
        >
          <motion.div
            style={{
              position:       'relative',
              width:          420,
              height:         420,
              transformStyle: 'preserve-3d',
              rotateY:        rotY,
              rotateX:        rotX,
            }}
            initial={{ opacity: 0, scale: 0.75 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Ambient glow */}
            <div
              aria-hidden
              style={{
                position:     'absolute',
                left:         '50%',
                top:          '50%',
                transform:    'translate(-50%, -50%)',
                width:        220,
                height:       220,
                borderRadius: '50%',
                background:   `radial-gradient(circle, ${VIOLET}28 0%, transparent 68%)`,
                pointerEvents:'none',
              }}
            />

            {RINGS.map((ring, i) => (
              <OrbitalRing key={ring.id} ring={ring} isActive={active === i} />
            ))}

            <Nucleus />
          </motion.div>
        </div>

        {/* Orbital chips */}
        {RINGS.map((ring, i) => (
          <OrbitalChip
            key={ring.id}
            ring={ring}
            isActive={active === i}
            pos={CHIP_POSITIONS[i]}
          />
        ))}
      </div>

      {/* ── Ring selector dots ────────────────────────────────────────────────── */}
      <div className="flex justify-center gap-3 mt-6">
        {RINGS.map((ring, i) => (
          <button
            key={ring.id}
            onClick={() => setActive(i)}
            aria-label={ring.label}
            style={{
              height:     3,
              width:      active === i ? 28 : 8,
              borderRadius:2,
              background: active === i ? ring.color : 'rgba(255,255,255,0.12)',
              border:     'none',
              cursor:     'pointer',
              transition: 'width 0.4s ease, background 0.4s ease',
              boxShadow:  active === i ? `0 0 8px ${ring.color}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Mobile list ──────────────────────────────────────────────────────── */}
      <div className="sm:hidden mt-10 flex flex-col gap-3">
        {RINGS.map((ring, i) => {
          const isActive = active === i;
          return (
            <motion.div
              key={ring.id}
              style={{
                position:     'relative',
                borderRadius: 10,
                padding:      '11px 14px',
                background:   isActive ? `${ring.color}10` : 'rgba(255,255,255,0.02)',
                border:       `${isActive ? 1.5 : 1}px solid ${ring.color}${isActive ? '60' : '22'}`,
                boxShadow:    isActive
                  ? `0 0 0 0px ${ring.color}00`
                  : 'none',
              }}
              animate={isActive ? {
                boxShadow: [
                  `0 0 0 0px ${ring.color}00, inset 0 0 0px ${ring.color}00`,
                  `0 0 14px 3px ${ring.color}40, inset 0 0 10px ${ring.color}18`,
                  `0 0 0 0px ${ring.color}00, inset 0 0 0px ${ring.color}00`,
                ],
              } : { boxShadow: 'none' }}
              transition={isActive ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
            >
              {/* Pulsing border overlay */}
              {isActive && (
                <motion.div
                  style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: 10,
                    border:       `1.5px solid ${ring.color}`,
                    pointerEvents:'none',
                  }}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 8,
                    color: ring.color,
                    opacity: 0.65,
                    letterSpacing: '0.08em',
                  }}
                >
                  {ring.number}
                </span>
                <p
                  style={{
                    fontFamily:    'ui-monospace, monospace',
                    fontSize:      11,
                    letterSpacing: '0.10em',
                    color:         ring.color,
                    fontWeight:    800,
                    textShadow:    isActive ? `0 0 10px ${ring.color}70` : 'none',
                    transition:    'text-shadow 0.4s',
                  }}
                >
                  {ring.label}
                </p>
              </div>
              <p
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize:   9,
                  color:      isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)',
                  paddingLeft: 24,
                  transition: 'color 0.4s',
                }}
              >
                {ring.sublabel}
              </p>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
}
