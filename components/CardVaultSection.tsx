'use client';

import { useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  animate,
  useInView,
} from 'framer-motion';
import { useRef } from 'react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

// ─── Subject data ───────────────────────────────────────────────────────────────
interface Subject {
  icon:   string;
  name:   string;
  area:   string;
  count:  number;
  color:  string;
  topics: readonly [string, string, string];
  sysTag: string;
}

const SUBJECTS: Subject[] = [
  {
    icon: '🧬', name: 'Biologia',          area: 'Ciências da Natureza',
    count: 1354, color: '#22c55e',
    topics:   ['Citologia', 'Genética & Evolução', 'Ecologia'],
    sysTag:   'BIONEXUS ATIVO',
  },
  {
    icon: '⚛️', name: 'Física',             area: 'Ciências da Natureza',
    count: 1128, color: '#f97316',
    topics:   ['Mecânica Clássica', 'Eletromagnetismo', 'Termodinâmica'],
    sysTag:   'CINEMÁTICA SINCRONIZADA',
  },
  {
    icon: '⚗️', name: 'Química',            area: 'Ciências da Natureza',
    count:  892, color: '#06b6d4',
    topics:   ['Estequiometria', 'Termoquímica', 'Química Orgânica'],
    sysTag:   'REAÇÃO ESTÁVEL',
  },
  {
    icon: '📐', name: 'Matemática',         area: 'Matemática',
    count: 1043, color: VIOLET,
    topics:   ['Funções & Gráficos', 'Probabilidade', 'Geometria Plana'],
    sysTag:   'LOGIX: 100%',
  },
  {
    icon: '📚', name: 'Língua Portuguesa',  area: 'Linguagens & Códigos',
    count:  743, color: '#a78bfa',
    topics:   ['Morfologia', 'Sintaxe', 'Semântica & Texto'],
    sysTag:   'ANÁLISE MORFOSSINTÁTICA OK',
  },
  {
    icon: '📖', name: 'Literatura',         area: 'Linguagens & Códigos',
    count:  512, color: '#34d399',
    topics:   ['Romantismo', 'Realismo', 'Modernismo Brasileiro'],
    sysTag:   'ESTILO DE ÉPOCA CARREGADO',
  },
  {
    icon: '🎨', name: 'Artes',              area: 'Linguagens & Códigos',
    count:  287, color: '#fb7185',
    topics:   ['Modernismo Brasileiro', 'História da Arte', 'Linguagens Artísticas'],
    sysTag:   'VANGUARDA ESTÁVEL',
  },
  {
    icon: '🌍', name: 'História Geral',     area: 'Ciências Humanas',
    count:  412, color: '#eab308',
    topics:   ['Revolução Francesa', 'Guerra Fria', 'Imperialismo'],
    sysTag:   'LINHA TEMPORAL GLOBAL',
  },
  {
    icon: '🇧🇷', name: 'História do Brasil', area: 'Ciências Humanas',
    count:  344, color: '#f97316',
    topics:   ['Brasil Colonial', 'Era Vargas', 'Ditadura Militar'],
    sysTag:   'CRONOLOGIA NACIONAL OK',
  },
  {
    icon: '🌐', name: 'Geografia',          area: 'Ciências Humanas',
    count:  634, color: '#10b981',
    topics:   ['Geopolítica', 'Climatologia', 'Urbanização'],
    sysTag:   'GEOPROCESSAMENTO OK',
  },
  {
    icon: '🏛️', name: 'Filosofia',          area: 'Ciências Humanas',
    count:  421, color: '#e879f9',
    topics:   ['Platão & Aristóteles', 'Iluminismo', 'Contemporânea'],
    sysTag:   'DIALÉTICA ATIVA',
  },
  {
    icon: '👥', name: 'Sociologia',         area: 'Ciências Humanas',
    count:  298, color: '#f59e0b',
    topics:   ['Marx & Durkheim', 'Estratificação Social', 'Movimentos Sociais'],
    sysTag:   'ESTRUTURA SOCIAL MAPEADA',
  },
  {
    icon: '🇬🇧', name: 'Inglês',             area: 'Linguagens & Códigos',
    count:  376, color: '#38bdf8',
    topics:   ['Interpretação de Texto', 'Vocabulário ENEM', 'Gramática Contextual'],
    sysTag:   'LANGUAGE MODULE ATIVO',
  },
  {
    icon: '🇪🇸', name: 'Espanhol',           area: 'Linguagens & Códigos',
    count:  214, color: '#f87171',
    topics:   ['Falsos Cognatos', 'Compreensão Leitora', 'Variedades Hispânicas'],
    sysTag:   'MÓDULO HISPÂNICO OK',
  },
  {
    icon: '🗞️', name: 'Atualidades',         area: 'Conhecimentos Gerais',
    count:  189, color: '#c084fc',
    topics:   ['Geopolítica Global', 'Meio Ambiente & Clima', 'Ciência & Tecnologia'],
    sysTag:   'FEED ATUALIZADO',
  },
];

// ─── Border-beam (conic-gradient orbiting the card edge) ───────────────────────
function BorderBeam({ color, active }: { color: string; active: boolean }) {
  const angle   = useMotionValue(0);
  const beamEnd = color + 'BB';   // static; computed once per card instance
  const bg      = useMotionTemplate`conic-gradient(from ${angle}deg, transparent 77%, ${beamEnd} 87%, transparent 96%)`;

  useEffect(() => {
    if (!active) return;
    const controls = animate(angle, [0, 360], {
      duration: 2.5,
      repeat:   Infinity,
      ease:     'linear',
    });
    return () => controls.stop();
  }, [active]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        inset:        '-1px',
        borderRadius: 'inherit',
        background:   bg,
        /* punch a border-width hole so only the edge shows */
        WebkitMask:         'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite:      'exclude',
        padding:            '1px',
      }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.22 }}
    />
  );
}

// ─── Count-up ──────────────────────────────────────────────────────────────────
function CountUp({ target, color }: { target: number; color: string }) {
  const spanRef  = useRef<HTMLSpanElement>(null);
  const inView   = useInView(spanRef, { once: true, margin: '-60px' });
  const motionN  = useMotionValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionN, target, {
      duration: 1.4,
      ease: [0.22, 0.61, 0.36, 1],   // easeOutQuart
      onUpdate: (v) => setShown(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, target]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span
      ref={spanRef}
      className="text-2xl font-black tabular-nums leading-none"
      style={{ color, fontFamily: 'ui-monospace, monospace' }}
    >
      {shown.toLocaleString('pt-BR')}
    </span>
  );
}

// ─── Vault card ─────────────────────────────────────────────────────────────────
function VaultCard({ s, index }: { s: Subject; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden cursor-default"
      style={{
        background:           'rgba(9,9,11,0.92)',
        border:               '1px solid rgba(255,255,255,0.08)',
      }}
      initial={{ opacity: 0, y: 32, scale: 0.94, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.48, delay: index * 0.065, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -4,
        borderColor: s.color + '42',
        boxShadow:   `0 0 28px ${s.color}1a, 0 0 56px ${s.color}0a`,
        transition:  { duration: 0.22, ease: 'easeOut' },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <BorderBeam color={s.color} active={hovered} />

      {/* Top shimmer line — brightens on hover */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        animate={{
          background: hovered
            ? `linear-gradient(90deg, transparent, ${s.color}70, transparent)`
            : `linear-gradient(90deg, transparent, ${s.color}28, transparent)`,
        }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-4 flex flex-col gap-3">

        {/* ── Module header ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}2a` }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{s.name}</p>
              <p className="text-slate-600 text-[10px] mt-0.5 leading-none">{s.area}</p>
            </div>
          </div>

          {/* Live indicator */}
          <motion.div
            className="flex items-center gap-1 shrink-0 mt-0.5"
            animate={{ opacity: hovered ? 0.85 : 0.28 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span
              className="text-[8px] font-bold tracking-wider"
              style={{ fontFamily: 'ui-monospace, monospace', color: s.color }}
            >
              LIVE
            </span>
          </motion.div>
        </div>

        {/* ── Count-up ── */}
        <div className="flex items-baseline gap-1.5">
          <CountUp target={s.count} color={s.color} />
          <span
            className="text-[8px] font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.2)' }}
          >
            CARDS
          </span>
        </div>

        {/* ── Thin rule ── */}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* ── Topic list — cycling upward ── */}
        <div className="overflow-hidden" style={{ height: '66px' }}>
          <motion.div
            className="flex flex-col"
            animate={{ y: [0, -66] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          >
            {[...s.topics, ...s.topics].map((topic, i) => (
              <div key={i} className="flex items-center gap-1.5" style={{ height: '22px' }}>
                <span
                  className="text-[10px] font-bold shrink-0 leading-none"
                  style={{ color: s.color }}
                >
                  ›
                </span>
                <span className="text-[11px] text-slate-500 leading-snug">{topic}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── System tag footer ── */}
        <div className="pt-1">
          <motion.span
            className="text-[8px] tracking-[0.17em] uppercase block"
            style={{ fontFamily: 'ui-monospace, monospace', color: s.color }}
            animate={{ opacity: hovered ? 0.75 : 0.28 }}
            transition={{ duration: 0.25 }}
          >
            [ {s.sysTag} ]
          </motion.span>
        </div>

      </div>
    </motion.div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────
export default function CardVaultSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Section header ── */}
      <div className="text-center mb-10">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            fontFamily: 'ui-monospace, monospace',
            color:      NEON,
            background: `${NEON}0d`,
            border:     `1px solid ${NEON}28`,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: NEON }}
          />
          PROTOCOLO APROVAÇÃO ENEM
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          +
          <span
            style={{
              background:             `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip:   'text',
              WebkitTextFillColor:    'transparent',
            }}
          >
            5.700
          </span>
          {' '}Flashcards Táticos
        </h2>

        <p className="text-slate-500 text-base max-w-xl mx-auto mb-5">
          O arsenal definitivo para dominar o 80/20 do ENEM.{' '}
          <span className="text-slate-300 font-medium">
            Zero tempo criando material, 100% do tempo evoluindo sua nota.
          </span>
        </p>

        {/* Module count rule */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 sm:w-20" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span
            className="text-[9px] tracking-[0.22em] uppercase whitespace-nowrap"
            style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.28)' }}
          >
            15 MÓDULOS CARREGADOS
          </span>
          <div className="h-px w-12 sm:w-20" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
      </div>

      {/* Mobile: 2-row auto-scrolling marquee */}
      <div className="sm:hidden flex flex-col gap-3 overflow-hidden">
        <style>{`
          @keyframes marquee-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        `}</style>
        {([SUBJECTS.slice(0, 8), SUBJECTS.slice(8)] as Subject[][]).map((row, rowIdx) => {
          const doubled = [...row, ...row];
          const duration = rowIdx === 0 ? 26 : 22;
          const animName = rowIdx === 0 ? 'marquee-left' : 'marquee-right';
          return (
            <div key={rowIdx} className="overflow-hidden pb-2">
              <div
                className="flex gap-3"
                style={{
                  width: 'max-content',
                  animation: `${animName} ${duration}s linear infinite`,
                }}
              >
                {doubled.map((s, i) => (
                  <div key={`${s.name}-${i}`} className="shrink-0" style={{ width: '65vw', maxWidth: 260 }}>
                    <VaultCard s={s} index={i} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* Desktop: grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SUBJECTS.map((s, i) => (
          <VaultCard key={s.name} s={s} index={i} />
        ))}
      </div>

    </section>
  );
}
