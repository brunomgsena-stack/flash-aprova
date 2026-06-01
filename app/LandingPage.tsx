'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// ─── Above-the-fold: static import (needed for LCP / SSR) ─────────────────────
import HeroSection from '@/components/HeroSection';

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

const AnkiComparison     = dynamic(() => import('@/components/AnkiComparison'),     { ssr: false, loading: () => <SkeletonBlock h={900} /> });
const EbbinghausSection  = dynamic(() => import('@/components/EbbinghausSection'), { ssr: false, loading: () => <SkeletonBlock h={700} /> });
const CardVaultSection   = dynamic(() => import('@/components/CardVaultSection'),   { ssr: false, loading: () => <SkeletonBlock h={900} /> });
const NormaRedacaoSection= dynamic(() => import('@/components/NormaRedacaoSection'),{ ssr: false, loading: () => <SkeletonBlock h={1500} /> });
const AiTutorsSection    = dynamic(() => import('@/components/AiTutorsSection'),    { ssr: false, loading: () => <SkeletonBlock h={1100} /> });
const FocusSection       = dynamic(() => import('@/components/FocusSection'),       { ssr: false, loading: () => <SkeletonBlock h={900} /> });
const ReelsTestimonials  = dynamic(() => import('@/components/ReelsTestimonials'),  { ssr: false, loading: () => <SkeletonBlock h={600} /> });
const ComoFuncionaSteps  = dynamic(() => import('@/components/ComoFuncionaSteps'),  { ssr: false, loading: () => <SkeletonBlock h={2400} /> });
const PrecoEPlanos       = dynamic(() => import('@/components/PrecoEPlanos'),       { ssr: false, loading: () => <SkeletonBlock h={1400} /> });
const StickyMobileCTA    = dynamic(() => import('@/components/StickyMobileCTA'),    { ssr: false });
const AppDemo            = dynamic(() => import('@/components/AppDemo'),            { ssr: false, loading: () => <SkeletonBlock h={900} /> });

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
    sysTag: 'Trilha de Biologia Liberada',
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
        background:             'rgba(9,9,11,0.92)',
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
      href="/quizz"
      className={`cta-pulse relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-2xl font-black text-black overflow-hidden whitespace-nowrap transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] ${big ? 'px-8 py-5 text-lg' : 'px-6 py-4 text-sm'}`}
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
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
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
const UNIVERSITIES = [
  'USP','UFRJ','UFMG','UFRGS','UFPE','UnB','UFSC','UFPR',
  'UFF','UFBA','UFPA','UFC','UTFPR','UNIFESP','UFG','UFRN',
  'UFPB','UFU','UFSCar','UFSM',
];

function AuthorityBanner() {
  // duplicate for seamless loop
  const items = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-10 pt-6 sm:pt-0 pb-8 sm:pb-16">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(18,18,18,0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7">
          <div className="text-center sm:text-left flex-shrink-0">
            <p className="text-white font-black text-xl sm:text-2xl leading-snug">
              Plataforma desenhada para <span style={{ color: NEON }}>milhares</span> de estudantes<br className="hidden sm:block" /> do ENEM
            </p>
            <p className="text-slate-600 text-xs mt-1 tracking-widest uppercase">
              Padrão alinhado às exigências das top universidades do país
            </p>
          </div>

          <div className="hidden sm:block w-px h-12 bg-white/10 flex-shrink-0" />

          {/* Carousel */}
          <div className="relative w-full overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
            <style>{`
              @keyframes uni-scroll {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .uni-track { animation: uni-scroll 28s linear infinite; }
            `}</style>
            <div className="uni-track flex items-center gap-8 w-max">
              {items.map((abbr, i) => (
                <span
                  key={i}
                  className="text-white font-black text-base tracking-tight flex-shrink-0"
                  style={{ opacity: 0.35 }}
                >
                  {abbr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Quanto custa o FlashAprova? Tem parcelamento?',
    a: 'A partir de R$ 21,41/mês (Plano Essencial) ou R$ 27,25/mês no Protocolo Neural (completo, com 15 Tutores IA e Norma IA de redação) — pagamento em 12x sem juros, ou à vista a partir de R$ 257. O plano mais escolhido sai por menos de R$ 0,90 por dia.',
  },
  {
    q: 'Tem garantia? Como pedir reembolso?',
    a: 'Sim. 7 dias de garantia incondicional. Testou e não se encaixou na sua rotina? Mande um email para contato@flashaprova.com.br e devolvemos 100% do valor. Sem perguntas, sem burocracia, sem letra miúda.',
  },
  {
    q: 'O que é o Protocolo Neural?',
    a: 'É o método em 4 fases que combina a Curva de Ebbinghaus com IA. Você responde um diagnóstico, a IA monta seu Radar de Lacunas, te entrega o card certo no dia certo (15 min/dia) e fixa o conteúdo na memória de longo prazo. Detalhes em /metodo.',
  },
  {
    q: 'Funciona para Medicina, Engenharia ou concursos?',
    a: 'O método de SRS + IA funciona para qualquer conteúdo que exija memorização precisa. Hoje o foco é ENEM com cards desenhados para Medicina e Engenharia, mas o algoritmo é matéria-agnóstico.',
  },
  {
    q: 'Quanto tempo por dia preciso estudar?',
    a: '15 a 30 minutos por dia. O Radar de Lacunas elimina o estudo às cegas: você foca apenas no que o seu cérebro está prestes a esquecer. Menos que rolar o feed do Instagram.',
  },
  {
    q: 'Por que pagar se o Anki é grátis?',
    a: 'Anki te obriga a montar deck do zero (2-3 meses antes de estudar 1 card). Aqui você abre o app e em 3 minutos já tem revisão personalizada, com biblioteca pronta de milhares de cards alinhados ao ENEM.',
  },
  {
    q: 'Posso confiar na correção de redação por IA?',
    a: (
      <>
        A Norma IA segue o padrão oficial do INEP. Em segundos você recebe um parecer detalhado das cinco
        competências, identifica falhas estruturais que custariam pontos e melhora a próxima redação
        imediatamente.{' '}
        <Link href="/metodo" className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: NEON }}>
          Veja a fundamentação científica completa em /metodo.
        </Link>
      </>
    ),
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. Plataforma 100% responsiva, abre direto no navegador do celular. Sem download obrigatório.',
  },
  {
    q: 'Quem é a empresa? Como entro em contato?',
    a: 'FlashAprova é um produto brasileiro com CNPJ, política de privacidade e termos de uso publicados. Suporte por email respondido em até 24h úteis: contato@flashaprova.com.br.',
  },
];

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
    <div className="flex items-center gap-1.5"
      style={{ fontFamily: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" }}
    >
      <span className="text-[9px] font-bold tracking-[0.18em] uppercase mr-1"
        style={{ color: '#ef4444' }}>
        ENEM
      </span>
      {units.map(({ v, label }, i) => (
        <span key={label} className="flex items-baseline gap-0.5">
          <span
            className="tabular-nums text-sm font-black"
            style={{
              color: '#ef4444',
              background: '#0a0a0a',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 5,
              padding: '1px 5px',
              letterSpacing: '-0.02em',
            }}
          >{v}</span>
          <span className="text-[9px]" style={{ color: 'rgba(239,68,68,0.55)' }}>{label}</span>
          {i < units.length - 1 && (
            <span className="text-xs mx-0.5" style={{ color: 'rgba(239,68,68,0.25)' }}>·</span>
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
        <CTAButton size="sm" label="GERAR MEU DIAGNÓSTICO GRÁTIS" />
        <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Diagnóstico grátis · 3 min</p>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main
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

        {/* ════════════════ MOBILE COUNTDOWN BAR ══ */}
        <div className="flex sm:hidden items-center justify-center py-2.5 w-full"
          style={{ background: '#000000', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <ENEMCountdown />
        </div>

        {/* ════════════════════════════════════ NAVBAR ══ */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-2 sm:py-5 max-w-6xl mx-auto">
          <span className="hidden sm:inline font-black text-white text-xl tracking-tight">
            Flash<span style={{
              background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </span>
          <div className="hidden sm:block">
            <ENEMCountdown />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden sm:block">
              Entrar
            </Link>
          </div>
        </nav>

        {/* ════════════════════════════════════ HERO ══ */}
        <HeroSection />

        <AuthorityBanner />

        {/* ════════════════════════════ APP DEMO · vídeo real ══ */}
        <LazySection minHeight={900}>
          <AppDemo />
        </LazySection>

        {/* ════════════════════════════ COMO FUNCIONA · 4 PASSOS ══ */}
        <LazySection minHeight={2400}>
          <ComoFuncionaSteps />
        </LazySection>

        {/* ════════════════════════════ METHODS COMPARISON ══ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">

          <LazySection minHeight={700}>
            <EbbinghausSection />
          </LazySection>

          <LazySection minHeight={900}>
            <AnkiComparison />
          </LazySection>

        </section>



        {/* ════════════════════ FOCO — Mapeamento de Fragilidades ══ */}
        <LazySection minHeight={900}>
          <FocusSection />
        </LazySection>

        <div className="flex justify-center pb-16 px-4 -mt-8">
          <div className="flex flex-col items-center">
            <CTAButton size="sm" label="GERAR MEU DIAGNÓSTICO GRÁTIS" />
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Diagnóstico grátis · 3 min</p>
          </div>
        </div>

        {/* ═══════════════════════════ BIBLIOTECA ══ */}
        <LazySection minHeight={900}>
          <CardVaultSection />
        </LazySection>

        {/* ════════════════════════════ TUTOR IA ══ */}
        <LazySection minHeight={1100}>
          <AiTutorsSection />
        </LazySection>

        {/* ═══════════════════════ NORMA · REDAÇÃO ══ */}
        <LazySection minHeight={1500}>
          <NormaRedacaoSection />
        </LazySection>

        {/* ═══════════════════ CTA mid-page ══ */}
        <div className="flex justify-center pb-16 -mt-10 px-5 sm:px-0">
          <div className="flex flex-col items-center">
            <CTAButton size="sm" label="GERAR MEU DIAGNÓSTICO GRÁTIS" />
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Diagnóstico grátis · 3 min</p>
          </div>
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
            <div className="relative mb-8 flex flex-col items-center text-center">
              <p className="text-base font-bold tracking-widest uppercase mb-6" style={{ color: '#f87171' }}>
                O VERDADEIRO CUSTO DA APROVAÇÃO
              </p>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                Você não precisa pagar R$ 30 mil por ano de cursinho — nem aceitar videoaula passiva de R$ 100/mês. Veja o que o mercado oferece hoje:
              </p>
            </div>

            {/* receipt items — âncora visual do cursinho */}
            <div
              className="relative rounded-sm mb-8 overflow-hidden"
              style={{ border: '1px solid #222', background: '#0A0A0A' }}
            >
              {/* receipt header */}
              <div
                className="hidden sm:block px-6 py-3 text-xs tracking-widest text-center"
                style={{ color: '#f87171', borderBottom: '1px dashed #222' }}
              >
                ┌─ CUSTO MENSAL ESTIMADO ─────────────────────────────────────┐
              </div>
              <div
                className="sm:hidden px-4 py-2 text-[10px] tracking-widest text-center"
                style={{ color: '#f87171', borderBottom: '1px dashed #222' }}
              >
                CUSTO MENSAL ESTIMADO
              </div>

              {[
                { label: 'Mentorias Individuais', value: 'R$ 1.200,00 /mês' },
                { label: 'Corretor de Redação Privado', value: 'R$ 450,00 /mês' },
                { label: 'Materiais de Revisão', value: 'R$ 200,00 /mês' },
                { label: 'Cursinho Famoso', value: 'R$ 2.500,00 /mês' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3 text-xs sm:text-sm"
                  style={{ borderBottom: '1px dashed #1a1a1a', color: '#94a3b8' }}
                >
                  <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                  <span style={{ color: '#f87171', fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}

              {/* total */}
              <div
                className="flex items-center justify-between px-6 py-4 text-sm sm:text-base font-bold"
                style={{ background: 'rgba(248,113,113,0.06)', borderTop: '1px solid rgba(248,113,113,0.2)' }}
              >
                <span style={{ color: '#f1f5f9' }}>Total Projetado</span>
                <span style={{ color: '#f87171', fontSize: '1.1em' }}>R$ 4.350,00 /mês</span>
              </div>

              <div
                className="hidden sm:block px-6 py-3 text-xs tracking-widest text-center"
                style={{ color: '#333' }}
              >
                └─────────────────────────────────────────────────────────────┘
              </div>
            </div>

            {/* frase de transição */}
            <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
              A pergunta não é quanto custa o FlashAprova. É quanto você está pagando hoje pra{' '}
              <span style={{ color: ORANGE, fontWeight: 700 }}>esquecer 70% do conteúdo em 24h.</span>
            </p>

            {/* tabela comparativa Stoodi / Descomplica / FlashAprova */}
            <div className="overflow-x-auto mb-8">
              <div
                className="relative rounded-sm overflow-hidden"
                style={{ border: '1px solid #222', minWidth: 480 }}
              >
                {/* cabeçalho */}
                <div
                  className="grid text-xs font-bold tracking-widest uppercase py-3"
                  style={{
                    gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
                    background: '#111',
                    borderBottom: '1px solid #222',
                    color: '#475569',
                  }}
                >
                  <div className="px-2 sm:px-5">Atributo</div>
                  <div className="px-1 sm:px-3" style={{ color: ORANGE }}>Stoodi</div>
                  <div className="px-1 sm:px-3" style={{ color: ORANGE }}>Descomplica</div>
                  <div className="px-1 sm:px-3" style={{ color: NEON }}>FlashAprova</div>
                </div>

                {[
                  {
                    attr: 'Investimento anual',
                    stoodi: 'R$ 708',
                    descomplica: 'R$ 1.188',
                    flash: 'R$ 327',
                  },
                  {
                    attr: 'Modelo de aprendizado',
                    stoodi: 'Videoaula passiva',
                    descomplica: 'Videoaula + simulado',
                    flash: 'SRS adaptativo + IA',
                  },
                  {
                    attr: 'Correção de redação',
                    stoodi: 'Limitada',
                    descomplica: 'Limitada',
                    flash: 'Norma IA ilimitada',
                  },
                  {
                    attr: 'Tempo diário',
                    stoodi: '1-2h passivo',
                    descomplica: '1-2h passivo',
                    flash: '15min ativo',
                  },
                  {
                    attr: 'Garantia',
                    stoodi: '7 dias',
                    descomplica: '7 dias',
                    flash: '7 dias',
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid text-xs sm:text-sm py-3 items-center"
                    style={{
                      gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
                      borderBottom: i < 4 ? '1px dashed #1a1a1a' : undefined,
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    }}
                  >
                    <div className="px-2 sm:px-5" style={{ color: '#94a3b8', overflowWrap: 'break-word' }}>{row.attr}</div>
                    <div className="px-1 sm:px-3" style={{ color: ORANGE, opacity: 0.85, overflowWrap: 'break-word' }}>{row.stoodi}</div>
                    <div className="px-1 sm:px-3" style={{ color: ORANGE, opacity: 0.85, overflowWrap: 'break-word' }}>{row.descomplica}</div>
                    <div className="px-1 sm:px-3 font-bold" style={{ color: NEON, overflowWrap: 'break-word' }}>{row.flash}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* frase de fechamento */}
            <p
              className="text-center text-sm sm:text-base font-bold mb-2 leading-snug"
              style={{ color: '#f1f5f9' }}
            >
              Pagar mais por menos retenção é o erro mais caro do seu ano de cursinho.{' '}
              <span style={{ color: NEON }}>R$ 327/ano</span>{' '}
              te dá tudo isso — com garantia.
            </p>
            <p className="text-center text-xs mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Link href="/metodo" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Por que o método funciona? Veja a fundamentação científica.
              </Link>
            </p>

            {/* CTA */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <CTAButton size="sm" label="GERAR MEU DIAGNÓSTICO GRÁTIS" />
                <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Diagnóstico grátis · 3 min</p>
              </div>
            </div>
          </div>
        </section>

        <LazySection minHeight={1400}>
          <PrecoEPlanos />
        </LazySection>

        <LazySection minHeight={600}>
          <ReelsTestimonials />
        </LazySection>

        <FAQAccordion />

        {/* ════════════════════════════════ FOOTER ══ */}
        <footer className="border-t border-white/5 py-10 px-6 sm:px-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-white font-black mb-2">
                Flash<span style={{
                  background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Aprova</span>
              </p>
              <p className="text-slate-700 text-xs flex items-center gap-2 flex-wrap">
                © 2026 · Tecnologia de aprovação com IA
                <span className="inline-flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span className="text-[10px]">SSL</span>
                </span>
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <Link href="/privacidade" className="hover:text-slate-300 transition-colors">Política de Privacidade</Link>
              <Link href="/termos" className="hover:text-slate-300 transition-colors">Termos de Uso</Link>
              <Link href="/login" className="hover:text-slate-300 transition-colors">Entrar</Link>
              <a href="mailto:contato@flashaprova.com.br" className="hover:text-slate-300 transition-colors">Suporte</a>
            </nav>
          </div>
        </footer>

      </div>

      {/* Sticky CTA mobile — aparece após scroll > 400px */}
      <StickyMobileCTA />

    </main>

  );
}
