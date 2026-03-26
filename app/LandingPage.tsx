'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AnkiComparison from '@/components/AnkiComparison';
import NeuralEcosystemFlow from '@/components/NeuralEcosystemFlow';
import TacticalOperations from '@/components/TacticalOperations';
import NeuralBrainMap from '@/components/NeuralBrainMap';
import ReelsTestimonials from '@/components/ReelsTestimonials';

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

// ─── Ebbinghaus curve ─────────────────────────────────────────────────────────
function ForgettingCurve() {
  return (
    <svg viewBox="0 0 440 190" className="w-full" style={{ maxHeight: 200 }}>
      <defs>
        <linearGradient id="grad-forget" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={ORANGE} /><stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="grad-srs2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={VIOLET} /><stop offset="60%" stopColor={NEON} /><stop offset="100%" stopColor={GREEN} />
        </linearGradient>
        <filter id="glow-srs2"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="area-forget2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.15"/><stop offset="100%" stopColor={ORANGE} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="area-srs2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity="0.20"/><stop offset="100%" stopColor={NEON} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[10,50,90,130,170].map(y => (
        <line key={y} x1="40" y1={y} x2="430" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {([[10,'100%'],[50,'75%'],[90,'50%'],[130,'25%'],[170,'0%']] as const).map(([y,l]) => (
        <text key={l} x="34" y={y+4} textAnchor="end" fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
      ))}
      {([[40,'Hoje'],[105,'1d'],[170,'3d'],[260,'1 sem'],[380,'1 mês']] as const).map(([x,l]) => (
        <text key={l} x={x} y="185" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
      ))}
      <path d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163 L380,170 L40,170 Z" fill="url(#area-forget2)"/>
      <path d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163" fill="none" stroke="url(#grad-forget)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18 L380,170 L40,170 Z" fill="url(#area-srs2)"/>
      <path d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18" fill="none" stroke="url(#grad-srs2)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-srs2)"/>
      {([112,194,292] as const).map(cx => (
        <circle key={cx} cx={cx} cy={16} r="4" fill="#121212" stroke={NEON} strokeWidth="1.8"/>
      ))}
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
      className={`cta-pulse relative inline-flex items-center gap-3 rounded-2xl font-black text-black overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] ${big ? 'px-8 py-5 text-lg' : 'px-6 py-4 text-base'}`}
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
    <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-16">
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

          <div className="flex items-center gap-10">
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

// ─── FAQ Accordion ─────────────────────────────────────────────────────────────
function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-10 pb-24">
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
        <nav className="flex items-center justify-between px-5 sm:px-10 py-5 max-w-6xl mx-auto">
          <span className="font-black text-white text-xl tracking-tight">
            Flash<span style={{
              background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden sm:block">
              Entrar
            </Link>
            <Link href="/onboarding"
              className="text-sm px-4 py-2 rounded-xl font-bold text-black transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: NEON, boxShadow: `0 0 16px ${NEON}40` }}>
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* ════════════════════════════════════ HERO ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pt-10 pb-20 text-center">

          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: `${NEON}14`, border: `1px solid ${NEON}35`, color: NEON }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON }} />
            Retenção Cognitiva · IA Especialista · SRS Automático
          </div>

          <h1 className="fade-up-d1 text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-white mb-6">
            Pare de estudar<br/>
            para{' '}
            <span style={{ color: ORANGE, textShadow: `0 0 20px ${ORANGE}80, 0 0 40px ${ORANGE}40` }}>
              esquecer.
            </span>
            <br/>
            Garanta{' '}
            <span style={{ color: NEON, textShadow: `0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>
              97% de retenção
            </span>{' '}
            <span style={{ color: '#5F00F6', textShadow: '0 0 20px rgba(95,0,246,0.50)' }}>
              até o dia do ENEM.
            </span>
          </h1>

          <p className="fade-up-d2 text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            A ciência prova: sem revisão espaçada, você esquece{' '}
            <span className="text-white font-semibold">70% do conteúdo em menos de 24h.</span>{' '}
            O FlashAprova usa IA + SRS para blindar sua memória — e seu nome na lista de aprovados.
          </p>

          <div className="fade-up-d3 flex flex-col items-center gap-3">
            <CTAButton />
            <p className="text-slate-700 text-xs">Sem cartão · Diagnóstico por IA em 3 min · Acesso imediato</p>
          </div>

          {/* Stats */}
          <div className="fade-up-d4 flex flex-wrap justify-center gap-8 mt-14">
            {[
              { n: '97%',    label: 'retenção com SRS + IA',    color: NEON   },
              { n: '5.700+', label: 'flashcards táticos ENEM',  color: VIOLET },
              { n: '24h',    label: 'para sentir a diferença',  color: GREEN  },
            ].map(({ n, label, color }) => (
              <div key={n} className="text-center">
                <p className="text-3xl font-black" style={{
                  color,
                  textShadow: `0 0 18px ${color}70`,
                }}>{n}</p>
                <p className="text-slate-600 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <AuthorityBanner />

        {/* ════════════════════════════════ A DOR — Ebbinghaus ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
            style={{
              background: CARD_BG2,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${ORANGE}25`,
              boxShadow: `0 0 60px ${ORANGE}08, 0 0 0 1px rgba(124,58,237,0.08)`,
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at bottom left, rgba(124,58,237,0.10) 0%, transparent 60%)' }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}50, rgba(124,58,237,0.30), transparent)` }} />

            <div className="max-w-xl mb-6">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: ORANGE }}>
                A Dor Real do Estudante
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                Você estuda horas. Amanhã,{' '}
                <span style={{ color: ORANGE }}>esqueceu quase tudo.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                A Curva de Ebbinghaus é implacável:{' '}
                <span className="text-white font-semibold">sem revisão, você perde 70% do conteúdo em menos de{' '}
                  <Neon>24h</Neon>.</span>{' '}
                Não é falta de inteligência — é falta do método certo.
              </p>
            </div>

            <ForgettingCurve />

            <div className="flex flex-wrap gap-5 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: ORANGE }} />
                <span className="text-slate-500 text-xs">Sem revisão (método tradicional)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${VIOLET}, ${NEON})` }} />
                <span className="text-slate-500 text-xs">Com IA + SRS (FlashAprova)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════ ANKI COMPARISON ══ */}
        <section className="max-w-5xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: ORANGE }}>
              Por que o Anki não é suficiente
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Você já tentou o Anki.{' '}
              <span style={{ color: ORANGE }}>Abandonou em 2 semanas.</span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              O problema não é você. É a ferramenta genérica que não foi feita para o ENEM — e nem para o seu cérebro.
            </p>
          </div>

          <AnkiComparison />
        </section>

        {/* ════════════════════════ A SOLUÇÃO — Neural Brain Map ══ */}
        <NeuralBrainMap />

        {/* ════════════════════════ ECOSSISTEMA — Neural Ciclo FlashAprova ══ */}
        <NeuralEcosystemFlow />

        {/* ════════════════════════ CENTRAL DE OPERAÇÕES ══ */}
        <TacticalOperations />

        {/* ════════════════════════════ TUTOR IA ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
              7 Tutores IA Especialistas
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Travou numa questão?{' '}
              <span style={{
                background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                A IA resolve em segundos.
              </span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Treinado exclusivamente nas provas do ENEM, cada Tutor IA explica conceitos de forma tática — disponível{' '}
              <Neon>24h</Neon> por dia, sem julgamento.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden"
            style={{
              background: CARD_BG,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${NEON}25`,
              boxShadow: `0 0 40px rgba(124,58,237,0.14), 0 0 0 1px rgba(124,58,237,0.08)`,
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }} />

            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: `${NEON}20`, border: `1px solid ${NEON}40` }}>
                🤖
              </div>
              <div>
                <p className="text-white font-bold text-sm">Tutor IA · Química Especialista</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON }} />
                  <span className="text-slate-600 text-xs">Online · Analisando lacunas</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="px-5 py-6 flex flex-col gap-4">

              <div className="flex justify-end">
                <div className="max-w-xs sm:max-w-sm rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Não consigo entender Estequiometria. Como calculo a proporção entre reagentes sem travar na prova?
                  </p>
                  <p className="text-slate-700 text-xs mt-1 text-right">Você · agora</p>
                </div>
              </div>

              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-1"
                  style={{ background: `${NEON}20`, border: `1px solid ${NEON}40` }}>
                  🤖
                </div>
                <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: `${NEON}0e`, border: `1px solid ${NEON}25` }}>
                  <p className="text-white text-sm font-semibold mb-2">
                    Técnica dos 3 passos — memorize isso:
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-slate-300 leading-relaxed">
                    {[
                      ['①', 'Escreva a equação balanceada.', 'Os coeficientes são as proporções. Ex: 2H₂ + O₂ → 2H₂O significa 2 mol de H₂ para 1 mol de O₂.'],
                      ['②', 'Monte a regra de 3', 'usando massas molares (H=1, O=16, C=12...).'],
                      ['③', 'Confira as unidades.', 'Se der mol → converta pra gramas multiplicando pela massa molar. Pronto.'],
                    ].map(([num, bold, rest]) => (
                      <div key={num} className="flex gap-2">
                        <span style={{ color: NEON }} className="font-bold shrink-0">{num}</span>
                        <span><span className="text-white font-semibold">{bold}</span>{' '}{rest}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)' }}>
                    <span style={{ color: NEON }} className="font-bold">💡 Macete ENEM:</span>
                    <span className="text-slate-400 ml-1">Coeficiente = proporção = regra de 3. Nunca mude isso.</span>
                  </div>
                  <p className="text-slate-700 text-xs mt-2">Tutor IA · agora</p>
                </div>
              </div>

              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: `${NEON}20`, border: `1px solid ${NEON}40` }}>
                  🤖
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
                  style={{ background: `${NEON}0a`, border: `1px solid ${NEON}18` }}>
                  {[0,0.2,0.4].map(delay => (
                    <div key={delay} className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: NEON, animationDelay: `${delay}s` }} />
                  ))}
                  <span className="text-slate-600 text-xs ml-2">Preparando seu próximo card...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ CTA mid-page ══ */}
        <div className="flex justify-center pb-16">
          <CTAButton />
        </div>

        {/* ═══════════════════════════ BIBLIOTECA ══ */}
        <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: NEON, fontFamily: 'ui-monospace, monospace' }}
            >
              CONHECIMENTO BRUTO
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              +<Neon>5.700</Neon> Flashcards Táticos
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Cada card foi validado por especialistas para garantir o filtro 80/20.{' '}
              <span className="text-slate-300 font-medium">Zero tempo criando, 100% do tempo evoluindo.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECTS.map(s => (
              <SubjectCard key={s.name} s={s} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════ FINAL CTA ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="relative rounded-3xl p-10 sm:p-16 overflow-hidden text-center"
            style={{
              background: 'rgba(15,15,15,0.98)',
              border: `1px solid ${NEON}30`,
              boxShadow: `0 0 0 1px ${NEON}10, 0 0 80px ${NEON}14, 0 0 160px rgba(124,58,237,0.10)`,
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${NEON}80, ${VIOLET}60, transparent)` }} />
            <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${NEON}10 0%, transparent 70%)`, transform: 'translate(-30%,-30%)' }} />
            <div className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none"
              style={{ background: `radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)`, transform: 'translate(30%,30%)' }} />

            <div className="relative">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
                style={{ background: `${NEON}14`, border: `1px solid ${NEON}35`, color: NEON }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON }} />
                Seu concorrente já está usando
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                Cada dia sem o método certo<br/>
                é memória perdida{' '}
                <span style={{ color: ORANGE }}>que não volta.</span>
              </h2>
              <p className="text-slate-400 text-base mb-10 max-w-lg mx-auto">
                Inicie seu Diagnóstico por IA agora, descubra suas lacunas em 3 minutos e comece a reter{' '}
                <Neon>97%</Neon> do que estuda — a partir de hoje.
              </p>
              <div className="flex flex-col items-center gap-4">
                <CTAButton size="lg" />
                <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600">
                  {['Sem cartão de crédito', 'Acesso imediato', 'Cancele quando quiser'].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span style={{ color: NEON }}>✓</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReelsTestimonials />

        <FAQAccordion />

        {/* ════════════════════════════════ FOOTER ══ */}
        <footer className="border-t border-white/5 py-8 px-5 sm:px-10 text-center">
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
