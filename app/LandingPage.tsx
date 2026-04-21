'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// ─── Above-the-fold: static import (needed for LCP / SSR) ─────────────────────
import HeroSection    from '@/components/HeroSection';
import AnkiComparison from '@/components/AnkiComparison';

// ─── Below-the-fold: dynamic imports → separate JS chunks ─────────────────────
// Each chunk is only downloaded when the section scrolls into view (see LazySection).
const SkeletonBlock = ({ h = 400 }: { h?: number }) => (
  <div
    aria-hidden="true"
    style={{
      minHeight: h,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 16,
      margin: '0 auto',
      maxWidth: 1152,
    }}
  />
);

const EbbinghausSection  = dynamic(() => import('@/components/EbbinghausSection'), { ssr: false, loading: () => <SkeletonBlock h={340} /> });
const NeuralBrainMap     = dynamic(() => import('@/components/NeuralBrainMap'),     { ssr: false, loading: () => <SkeletonBlock h={380} /> });
const CardVaultSection   = dynamic(() => import('@/components/CardVaultSection'),   { ssr: false, loading: () => <SkeletonBlock h={480} /> });
const NormaRedacaoSection= dynamic(() => import('@/components/NormaRedacaoSection'),{ ssr: false, loading: () => <SkeletonBlock h={520} /> });
const AiTutorsSection    = dynamic(() => import('@/components/AiTutorsSection'),    { ssr: false, loading: () => <SkeletonBlock h={480} /> });
const FocusSection          = dynamic(() => import('@/components/FocusSection'),          { ssr: false, loading: () => <SkeletonBlock h={480} /> });
const NeuralEcosystemFlow= dynamic(() => import('@/components/NeuralEcosystemFlow'),{ ssr: false, loading: () => <SkeletonBlock h={360} /> });
const BlindagemEngine    = dynamic(() => import('@/components/BlindagemEngine'),    { ssr: false, loading: () => <SkeletonBlock h={400} /> });
const TacticalRecovery   = dynamic(() => import('@/components/TacticalRecovery'),   { ssr: false, loading: () => <SkeletonBlock h={400} /> });
const ArsenalElite       = dynamic(() => import('@/components/ArsenalElite'),       { ssr: false, loading: () => <SkeletonBlock h={420} /> });
const ReelsTestimonials  = dynamic(() => import('@/components/ReelsTestimonials'),  { ssr: false, loading: () => <SkeletonBlock h={340} /> });

// ─── Lazy section wrapper ──────────────────────────────────────────────────────
// Defers rendering (and therefore chunk download) until the section is ~300px
// from entering the viewport. Prevents heavy JS from blocking the initial paint.
function LazySection({
  children,
  minHeight = 400,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '300px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? children : <SkeletonBlock h={minHeight} />}
    </div>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN  = '#22c55e';          // Biologia / 24h stat
const VIOLET = '#7C3AED';          // Roxo Elétrico
const NEON   = '#00FF73';          // Verde Neon — cor primária da plataforma
const ORANGE = '#FF8A00';          // Laranja Vibrante — "esquecer" / dor

// Card backgrounds sobre Grafite Escuro (#121212)
const CARD_BG   = 'rgba(255,255,255,0.04)';
const CARD_BG2  = 'rgba(255,255,255,0.05)';

// ─── Subjects data ────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    icon: '⚛️', name: 'Física',    area: 'Ciências da Natureza', count: '1.128',
    color: ORANGE,
    topics: ['Mecânica Clássica', 'Eletromagnetismo', 'Termodinâmica', 'Óptica Geométrica', 'Ondulatória'],
    sysTag: 'CINEMÁTICA SINCRONIZADA',
  },
  {
    icon: '⚗️', name: 'Química',   area: 'Ciências da Natureza', count: '892',
    color: NEON,
    topics: ['Estequiometria', 'Termoquímica', 'Ácidos e Bases', 'Eletroquímica', 'Orgânica e Funções'],
    sysTag: 'REAÇÃO ESTÁVEL',
  },
  {
    icon: '🧬', name: 'Biologia',  area: 'Ciências da Natureza', count: '1.354',
    color: GREEN,
    topics: ['Ecologia', 'Genética e Evolução', 'Citologia', 'Embriologia', 'Fisiologia Humana'],
    sysTag: 'BIONEXUS ATIVO',
  },
  {
    icon: '⏳', name: 'História',  area: 'Ciências Humanas',     count: '756',
    color: '#eab308',
    topics: ['Revolução Francesa', 'Brasil Colonial', 'Guerra Fria', 'Era Vargas', 'Ditadura Militar'],
    sysTag: 'LINHA TEMPORAL INTEGRADA',
  },
  {
    icon: '🌐', name: 'Geografia', area: 'Ciências Humanas',     count: '634',
    color: '#10b981',
    topics: ['Geopolítica', 'Climatologia', 'Urbanização', 'Geopolítica Brasileira', 'Globalização'],
    sysTag: 'GEOPROCESSAMENTO OK',
  },
  {
    icon: '📐', name: 'Matemática',area: 'Matemática',           count: '1.043',
    color: VIOLET,
    topics: ['Funções e Gráficos', 'Estatística e Probabilidade', 'Geometria Plana', 'Trigonometria', 'Análise Combinatória'],
    sysTag: 'LOGIX: 100%',
  },
] as const;

// ─── Subject card (Neural Hardware Module) ────────────────────────────────────
function SubjectCard({ s }: { s: typeof SUBJECTS[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{
        background:             'rgba(9,9,11,0.50)',
        backdropFilter:         'blur(16px)',
        WebkitBackdropFilter:   'blur(16px)',
        border:                 `1px solid ${hovered ? s.color + '45' : 'rgba(255,255,255,0.07)'}`,
        boxShadow:              hovered
          ? `0 0 32px ${s.color}18, 0 0 60px ${s.color}08`
          : 'none',
        transform:              hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition:             'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top shimmer */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${s.color}${hovered ? '70' : '30'}, transparent)`,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Pulsing border overlay */}
      {hovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: `1px solid ${s.color}` }}
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Count — top, most prominent ── */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: s.color, fontFamily: 'ui-monospace, monospace' }}
          >
            {s.count}
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.2em]"
            style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.22)' }}
          >
            CARDS
          </span>
        </div>
      </div>

      {/* ── Identity row ── */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}
        >
          {s.icon}
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{s.name}</p>
          <p className="text-slate-600 text-xs mt-0.5">{s.area}</p>
        </div>
      </div>

      {/* ── Topics with neon bullet + stagger ── */}
      <div className="flex flex-col gap-1.5 pb-8">
        {s.topics.map((t, i) => (
          <motion.div
            key={t}
            className="flex items-center gap-2"
            animate={hovered
              ? { opacity: 1, x: 0 }
              : { opacity: 0.5, x: 0 }
            }
            transition={{ duration: 0.18, delay: hovered ? i * 0.05 : 0, ease: 'easeOut' }}
          >
            <span
              className="text-[11px] shrink-0 leading-none"
              style={{ color: s.color }}
            >
              •
            </span>
            <span className="text-xs text-slate-500 leading-snug">{t}</span>
          </motion.div>
        ))}
      </div>

      {/* ── System tag — bottom right ── */}
      <div className="absolute bottom-4 right-4">
        <span
          className="text-[9px] tracking-widest uppercase"
          style={{
            fontFamily: 'ui-monospace, monospace',
            color: s.color,
            opacity: hovered ? 0.75 : 0.35,
            transition: 'opacity 0.3s',
          }}
        >
          [ {s.sysTag} ]
        </span>
      </div>
    </div>
  );
}

// ─── Radar chart mockup ───────────────────────────────────────────────────────
function RadarMockup() {
  const cx = 100, cy = 100, R = 78;
  const angles = [-90, -30, 30, 90, 150, 210].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) =>
    `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  const dataR = [0.75, 0.45, 0.62, 0.82, 0.38, 0.70].map(p => p * R);
  const labels = ['Bio', 'Quím', 'Fís', 'Hist', 'Geo', 'Mat'];
  const labelColors = [GREEN, NEON, ORANGE, '#eab308', '#10b981', VIOLET];

  return (
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
        <circle key={i}
          cx={cx + r * Math.cos(angles[i])} cy={cy + r * Math.sin(angles[i])}
          r="3" fill={NEON} />
      ))}
      {angles.map((_, i) => {
        const lx = cx + (R + 14) * Math.cos(angles[i]);
        const ly = cy + (R + 14) * Math.sin(angles[i]);
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor="middle"
            fill={labelColors[i]} fontSize="8" fontWeight="700" fontFamily="Inter,system-ui">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Heatmap mockup ───────────────────────────────────────────────────────────
const HEAT_MOCK = [
  [0,0,2,3,5,0,1],[0,4,5,2,0,3,1],[2,0,3,5,4,1,0],[0,1,5,3,2,0,4],
  [3,2,0,4,5,1,0],[0,5,3,1,0,4,2],[1,0,4,5,3,0,2],[0,3,1,5,4,0,3],
  [2,1,0,3,5,2,0],[0,4,5,2,1,0,3],[1,0,2,5,4,3,0],[0,2,4,1,5,0,2],[0,1,5,3,0,4,2],
];
const HEAT_ALPHA = [0.05, 0.20, 0.40, 0.65, 0.85, 1.0];

function HeatmapMockup() {
  return (
    <div style={{ display:'flex', gap:'3px' }}>
      {HEAT_MOCK.map((week, wi) => (
        <div key={wi} style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
          {week.map((v, di) => (
            <div key={di} style={{
              width: 10, height: 10, borderRadius: 2,
              background: v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(0,255,115,${HEAT_ALPHA[v]})`,
              boxShadow: v >= 4 ? `0 0 4px rgba(0,255,115,0.5)` : 'none',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Line chart mockup ────────────────────────────────────────────────────────
function LineMockup() {
  const path = 'M10,70 C30,68 40,60 60,50 C75,42 80,55 100,40 C120,28 130,35 150,22 C165,12 175,18 190,8';
  const area = `${path} L190,80 L10,80 Z`;
  return (
    <svg viewBox="0 0 200 90" className="w-full" style={{ maxHeight: 90 }}>
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity="0.25" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0" />
        </linearGradient>
        <filter id="line-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[20,40,60,80].map(y => (
        <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      <path d={area} fill="url(#line-fill)" />
      <path d={path} fill="none" stroke={NEON} strokeWidth="2" strokeLinecap="round"
        filter="url(#line-glow)" />
      <circle cx="190" cy="8" r="4" fill={NEON} />
      <circle cx="190" cy="8" r="7" fill={`${NEON}33`} />
    </svg>
  );
}


// ─── CTA button (verde neon, shimmer) ─────────────────────────────────────────
function CTAButton({ size = 'lg', label }: { size?: 'sm' | 'lg'; label?: string }) {
  const big = size === 'lg';
  const text = label ?? 'Gerar meu Diagnóstico IA';
  return (
    <Link
      href="/onboarding"
      className={`cta-pulse relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-2xl font-black text-black overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] ${big ? 'px-8 py-5 text-lg' : 'px-6 py-4 text-base'}`}
      style={{
        background:    `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
        letterSpacing: '-0.01em',
        boxShadow:     `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
      }}
    >
      {/* shimmer sweep */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
          animation: 'shimmer 2.4s infinite',
        }}
      />
      <svg width={big ? 22 : 18} height={big ? 22 : 18} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="relative">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
      <span className="relative">{text}</span>
    </Link>
  );
}

// ─── Neon green highlight ──────────────────────────────────────────────────────
function Neon({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>
      {children}
    </span>
  );
}

// ─── Authority Banner ─────────────────────────────────────────────────────────
function AuthorityBanner() {
  const universities = [
    { abbr: 'USP',     full: 'Universidade de São Paulo' },
    { abbr: 'UNICAMP', full: 'Univ. Estadual de Campinas' },
    { abbr: 'UFPE',    full: 'Univ. Federal de Pernambuco' },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-10 pb-8 sm:pb-16">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7">
          <div className="text-center sm:text-left">
            <p className="text-white font-black text-xl sm:text-2xl leading-snug">
              +<span style={{ color: NEON }}>8.000</span> estudantes já blindaram<br className="hidden sm:block" /> sua memória com o FlashAprova
            </p>
            <p className="text-slate-600 text-xs mt-1 tracking-widest uppercase">
              Aprovados nas maiores universidades do país
            </p>
          </div>

          <div className="hidden sm:block w-px h-12 bg-white/10" />

          <div className="flex items-center gap-5 sm:gap-10">
            {universities.map(({ abbr, full }) => (
              <div key={abbr} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-70 transition-opacity duration-200">
                <span className="text-white font-black text-xl tracking-tight">{abbr}</span>
                <span className="text-white/50 text-[8px] tracking-[0.12em] uppercase text-center leading-tight" style={{ maxWidth: 80 }}>
                  {full}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'O FlashAprova é gratuito?',
    a: 'Sim. O plano gratuito (Flash) dá acesso a centenas de flashcards e ao Diagnóstico por IA sem cartão de crédito. Para acesso ilimitado a todos os 5.700+ cards, Tutores IA e Redação com IA, existe o plano AiPro+.',
  },
  {
    q: 'Funciona para quem está começando do zero?',
    a: 'Perfeitamente. O Diagnóstico de IA identifica seu nível em cada disciplina e cria um plano personalizado. Você começa exatamente de onde precisa — sem desperdiçar tempo com conteúdo que já domina.',
  },
  {
    q: 'Em quanto tempo vejo resultado?',
    a: 'A maioria dos alunos relata melhora perceptível em retenção após 7 dias de uso consistente. Alunos que usam o FlashAprova por 60+ dias apresentam, em média, 30% mais acertos nas disciplinas treinadas.',
  },
  {
    q: 'Quanto tempo preciso dedicar por dia?',
    a: 'O algoritmo SRS otimiza suas revisões para 15 a 20 minutos diários. Sessões curtas e diárias são cientificamente mais eficazes do que maratonas semanais.',
  },
  {
    q: 'O que diferencia o FlashAprova do Anki e outros apps?',
    a: 'Três diferenciais: (1) conteúdo 100% curado para o ENEM — nenhum card genérico; (2) Tutores IA especialistas por disciplina; (3) Mapa de Domínio em tempo real que mostra onde você está perdendo pontos.',
  },
  {
    q: 'Posso usar no celular?',
    a: 'Sim. O FlashAprova é 100% web responsivo — funciona no navegador do celular, tablet e computador sem precisar instalar nenhum aplicativo.',
  },
] as const;

// ─── ENEM Countdown ────────────────────────────────────────────────────────────
function ENEMCountdown() {
  const ENEM = new Date('2026-11-08T08:00:00-03:00').getTime();
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = ENEM - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const units = [
    { v: String(timeLeft.d), label: 'd' },
    { v: pad(timeLeft.h),    label: 'h' },
    { v: pad(timeLeft.m),    label: 'm' },
    { v: pad(timeLeft.s),    label: 's' },
  ];

  return (
    <div className="hidden sm:flex items-center gap-1.5"
      style={{ fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" }}
    >
      <span className="text-[9px] font-bold tracking-[0.18em] uppercase mr-1"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        ENEM
      </span>
      {units.map(({ v, label }, i) => (
        <span key={label} className="flex items-baseline gap-0.5">
          <span
            className="tabular-nums text-sm font-black"
            style={{
              color: '#e2e8f0',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5,
              padding: '1px 5px',
              letterSpacing: '-0.02em',
            }}
          >{v}</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>{label}</span>
          {i < units.length - 1 && (
            <span className="text-xs mx-0.5" style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── FAQ Accordion ─────────────────────────────────────────────────────────────
function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
          Dúvidas Frequentes
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Ainda tem dúvidas?{' '}
          <span style={{ color: NEON }}>A gente responde.</span>
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: open === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${open === i ? `rgba(124,58,237,0.50)` : 'rgba(255,255,255,0.07)'}`,
              boxShadow: open === i ? `0 0 20px rgba(124,58,237,0.12)` : 'none',
            }}
          >
            {open === i && (
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}70, transparent)` }} />
            )}
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-white font-semibold text-sm sm:text-base pr-4">{item.q}</span>
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{
                  background: open === i ? `${VIOLET}30` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${open === i ? `rgba(124,58,237,0.60)` : 'rgba(255,255,255,0.10)'}`,
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  color: open === i ? NEON : 'rgba(255,255,255,0.5)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
                </svg>
              </span>
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <CTAButton size="sm" />
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      className="relative overflow-x-hidden"
      style={{ background: '#121212' }}
    >

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
      `}</style>

      {/* ── Ambient orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb-a absolute rounded-full"
          style={{ width: 700, height: 700, top: '-20%', left: '-15%',
            background: `radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)` }} />
        <div className="orb-b absolute rounded-full"
          style={{ width: 550, height: 550, top: '30%', right: '-18%',
            background: `radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)` }} />
        <div className="orb-a absolute rounded-full"
          style={{ width: 450, height: 450, bottom: '5%', left: '20%',
            background: `radial-gradient(circle, rgba(0,255,115,0.07) 0%, transparent 70%)`, animationDelay: '-5s' }} />
      </div>

      {/* ── Grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ════════════════════════════════════ NAVBAR ══ */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
          <span className="font-black text-white text-xl tracking-tight">
            Flash<span style={{
              background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </span>
          <ENEMCountdown />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden sm:block">
              Entrar
            </Link>
          </div>
        </nav>

        {/* ════════════════════════════════════ HERO ══ */}
        <HeroSection />

        <AuthorityBanner />

        {/* ════════════════════════════ METHODS COMPARISON ══ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">

          <EbbinghausSection />

          <AnkiComparison />

        </section>



        {/* ════════════════════════ ECOSSISTEMA — Neural Ciclo FlashAprova ══ */}
        <LazySection minHeight={360}>
          <NeuralEcosystemFlow />
        </LazySection>

        {/* ════════════════════ FOCO — Mapeamento de Fragilidades ══ */}
        <LazySection minHeight={480}>
          <FocusSection />
        </LazySection>

        {/* ════════════════════════ CENTRAL DE OPERAÇÕES ══ */}
        <LazySection minHeight={400}>
          <BlindagemEngine />
        </LazySection>

        {/* ════════════════════ RECUPERAÇÃO TÁTICA ══ */}
        <LazySection minHeight={400}>
          <TacticalRecovery />
        </LazySection>

        {/* ══════════════════════════ ARSENAL DE ELITE ══ */}
        <LazySection minHeight={420}>
          <ArsenalElite />
        </LazySection>

        {/* ═══════════════════════════ BIBLIOTECA ══ */}
        <LazySection minHeight={480}>
          <CardVaultSection />
        </LazySection>

        {/* ════════════════════════════ TUTOR IA ══ */}
        <LazySection minHeight={480}>
          <AiTutorsSection />
        </LazySection>

        {/* ═══════════════════════ NORMA · REDAÇÃO ══ */}
        <LazySection minHeight={520}>
          <NormaRedacaoSection />
        </LazySection>

        {/* ═══════════════════ CTA mid-page ══ */}
        <div className="flex justify-center pb-16">
          <CTAButton />
        </div>

        {/* ════════════════════ AUDITORIA DE MERCADO ══ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-10 pb-8 sm:pb-16">
          <div
            className="relative rounded-2xl overflow-hidden p-4 sm:p-8 md:p-12"
            style={{
              background: '#0D0D0D',
              border: '1px solid #1a1a1a',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            }}
          >
            {/* scanline overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #00FF73, #00FF73 1px, transparent 1px, transparent 4px)',
              }}
            />

            {/* header badge */}
            <div className="relative mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'rgba(0,255,115,0.08)', border: '1px solid rgba(0,255,115,0.25)', color: NEON }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON }} />
                [AUDITORIA DE MERCADO] | O CUSTO DA INÉRCIA
              </div>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                Manter uma estrutura de aprovação de elite no modelo tradicional exige um investimento pesado.
                Se você fosse contratar cada módulo da nossa infraestrutura separadamente, este seria o seu custo mensal:
              </p>
            </div>

            {/* receipt items */}
            <div
              className="relative rounded-sm mb-8 overflow-hidden"
              style={{ border: '1px solid #222', background: '#0A0A0A' }}
            >
              {/* receipt header */}
              <div
                className="hidden sm:block px-6 py-3 text-xs tracking-widest text-center"
                style={{ color: NEON, borderBottom: '1px dashed #222' }}
              >
                ┌─ CUSTO MENSAL ESTIMADO ─────────────────────────────────────┐
              </div>
              <div
                className="sm:hidden px-4 py-2 text-[10px] tracking-widest text-center"
                style={{ color: NEON, borderBottom: '1px dashed #222' }}
              >
                CUSTO MENSAL ESTIMADO
              </div>

              {[
                { label: 'Mentorias Individuais', value: 'R$ 1.200,00 /mês' },
                { label: 'Corretor de Redação Privado', value: 'R$ 450,00 /mês' },
                { label: 'Material de Revisão (Papel/PDF)', value: 'R$ 200,00 /mês' },
                { label: 'Mensalidade Cursinho Premium', value: 'R$ 2.500,00 /mês' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3 text-xs sm:text-sm"
                  style={{ borderBottom: '1px dashed #1a1a1a', color: '#94a3b8' }}
                >
                  <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                  <span style={{ color: NEON, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}

              {/* total */}
              <div
                className="flex items-center justify-between px-6 py-4 text-sm sm:text-base font-bold"
                style={{ background: 'rgba(0,255,115,0.06)', borderTop: '1px solid rgba(0,255,115,0.2)' }}
              >
                <span style={{ color: '#f1f5f9' }}>Total Projetado</span>
                <span style={{ color: NEON, fontSize: '1.1em' }}>R$ 4.350,00 /mês</span>
              </div>

              <div
                className="hidden sm:block px-6 py-3 text-xs tracking-widest text-center"
                style={{ color: '#333' }}
              >
                └─────────────────────────────────────────────────────────────┘
              </div>
            </div>

            {/* insight text */}
            <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
              A pergunta não é quanto custa o FlashAprova, mas quanto custa continuar operando em um sistema que{' '}
              <span style={{ color: ORANGE, fontWeight: 700 }}>cobra o preço de um carro popular por ano</span>
              {' '}para te entregar 30% de retenção.
            </p>

            {/* comparison table */}
            <div
              className="relative rounded-sm overflow-hidden mb-8"
              style={{ border: '1px solid #222' }}
            >
              {/* table header */}
              <div
                className="grid text-xs font-bold tracking-widest uppercase py-3"
                style={{
                  gridTemplateColumns: '1.8fr 1fr 1fr',
                  background: '#111',
                  borderBottom: '1px solid #222',
                  color: '#475569',
                }}
              >
                <div className="px-2 sm:px-5">Atributo</div>
                <div className="px-1 sm:px-3" style={{ color: ORANGE }}>Cursinho</div>
                <div className="px-1 sm:px-3" style={{ color: NEON }}>FlashAprova</div>
              </div>

              {[
                {
                  attr: 'Investimento Anual',
                  trad: '~ R$ 25.000,00',
                  flash: '< 4% deste valor',
                  flashColor: NEON,
                },
                {
                  attr: 'Retenção Real',
                  trad: 'Aluguel (Esquece em 24h)',
                  flash: 'Propriedade (97% Blindado)',
                  flashColor: NEON,
                },
                {
                  attr: 'Disponibilidade',
                  trad: 'Horário Comercial',
                  flash: '24/7 (Zero Latência)',
                  flashColor: NEON,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid text-xs sm:text-sm py-3 items-center"
                  style={{
                    gridTemplateColumns: '1.8fr 1fr 1fr',
                    borderBottom: i < 2 ? '1px dashed #1a1a1a' : undefined,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}
                >
                  <div className="px-2 sm:px-5" style={{ color: '#94a3b8', overflowWrap: 'break-word' }}>{row.attr}</div>
                  <div className="px-1 sm:px-3" style={{ color: ORANGE, opacity: 0.85, overflowWrap: 'break-word' }}>{row.trad}</div>
                  <div className="px-1 sm:px-3 font-bold" style={{ color: row.flashColor, overflowWrap: 'break-word' }}>{row.flash}</div>
                </div>
              ))}
            </div>

            {/* yellow alert */}
            <div
              className="flex items-center gap-3 rounded-sm px-5 py-3 mb-8 text-xs sm:text-sm font-bold tracking-wide"
              style={{
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.35)',
                color: '#fbbf24',
              }}
            >
              <span style={{ fontSize: '1.1em' }}>⚠</span>
              <span className="hidden sm:inline">[ CONCLUSÃO: O SISTEMA TRADICIONAL É FINANCEIRAMENTE INEFICIENTE ]</span>
              <span className="sm:hidden">SISTEMA TRADICIONAL: FINANCEIRAMENTE INEFICIENTE</span>
            </div>

            {/* transition line */}
            <p
              className="text-center text-base sm:text-lg font-bold mb-8 leading-snug"
              style={{ color: '#f1f5f9' }}
            >
              Um ano a mais de cursinho custa{' '}
              <span style={{ color: ORANGE }}>R$ 30k</span>.
              {' '}O FlashAprova custa{' '}
              <span style={{ color: NEON }}>menos que um jantar.</span>
            </p>

            {/* CTA */}
            <div className="flex justify-center">
              <a
                href="/onboarding"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-sm text-sm font-black tracking-widest uppercase transition-all duration-200"
                style={{
                  background: NEON,
                  color: '#000',
                  boxShadow: `0 0 24px ${NEON}50, 0 0 48px ${NEON}20`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 40px ${NEON}80, 0 0 80px ${NEON}30`;
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 24px ${NEON}50, 0 0 48px ${NEON}20`;
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
                }}
              >
                <span>▶</span>
                [ DETECTAR VAZAMENTO DE NOTA ]
              </a>
            </div>
          </div>
        </section>

        <LazySection minHeight={340}>
          <ReelsTestimonials />
        </LazySection>

        <FAQAccordion />

        {/* ════════════════════════════════ FOOTER ══ */}
        <footer className="border-t border-white/5 py-8 px-6 sm:px-10 text-center">
          <p className="text-white font-black mb-2">
            Flash<span style={{
              background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </p>
          <p className="text-slate-700 text-xs">
            © 2026 · Tecnologia de aprovação com IA ·{' '}
            <Link href="/login" className="hover:text-slate-400 transition-colors">Entrar</Link>
          </p>
        </footer>

      </div>

    </div>

  );
}
