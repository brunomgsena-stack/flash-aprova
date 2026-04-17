'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { type SubjectId, SUBJECT_META } from '../onboarding/flashcardData';
import WhatsAppFloat from '@/components/WhatsAppFloat';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN   = '#22c55e';
const VIOLET  = '#7C3AED';
const CYAN    = '#06b6d4';
const RED     = '#ef4444';
const ORANGE  = '#f97316';
const EMERALD = '#10b981';

// ─── Radar Chart ─────────────────────────────────────────────────────────────
const RADAR_ORDER: SubjectId[] = ['biologia', 'quimica', 'historia', 'geografia'];
const RADAR_LABELS = ['Bio', 'Quím', 'Hist', 'Geo'];
const RADAR_COLORS = [GREEN, CYAN, '#eab308', '#10b981'];

function RadarChart({ scores }: { scores: number[] }) {
  const cx = 110, cy = 110, R = 82;
  const angles = [-90, 0, 90, 180].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) => `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  return (
    <svg viewBox="0 0 220 220" className="w-full" style={{ maxHeight: 220 }}>
      <defs>
        <filter id="radar-glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <polygon key={p} points={angles.map((_, i) => pt(p * R, i)).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {angles.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      <polygon points={scores.map((s, i) => pt(s * R, i)).join(' ')}
        fill={`${VIOLET}25`} stroke={VIOLET} strokeWidth="2" filter="url(#radar-glow)" />
      {scores.map((s, i) => (
        <circle key={i} cx={cx + s * R * Math.cos(angles[i])} cy={cy + s * R * Math.sin(angles[i])}
          r="5" fill={RADAR_COLORS[i]} />
      ))}
      {angles.map((_, i) => {
        const lx = cx + (R + 16) * Math.cos(angles[i]);
        const ly = cy + (R + 16) * Math.sin(angles[i]);
        return (
          <text key={i} x={lx} y={ly + 4} textAnchor="middle"
            fill={RADAR_COLORS[i]} fontSize="10" fontWeight="700" fontFamily="Inter,system-ui">
            {RADAR_LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Narrative Report ─────────────────────────────────────────────────────────
function NarrativeReport({
  subjectMeta, hardCount, health,
}: {
  subjectMeta: typeof SUBJECT_META[SubjectId]; hardCount: number; health: number;
}) {
  const risk  = health < 55 ? 'elevado' : health < 72 ? 'moderado' : 'controlável';
  const verbs = hardCount >= 4
    ? 'múltiplas lacunas críticas de retenção'
    : hardCount >= 2
    ? 'lacunas de retenção em conceitos-chave'
    : 'lacunas pontuais de consolidação';

  return (
    <div className="relative rounded-2xl p-5 sm:p-6 mb-6 overflow-hidden"
      style={{
        background: 'rgba(10,5,20,0.85)',
        border: '1px solid rgba(124,58,237,0.22)',
        backdropFilter: 'blur(20px)',
      }}>
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}60, transparent)` }} />

      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
        // ANÁLISE · TUTOR IA ESPECIALISTA
      </p>

      <p className="text-slate-300 leading-relaxed text-sm mb-4">
        O Stress Test identificou{' '}
        <span className="text-white font-bold">{hardCount} {verbs}</span>{' '}
        em{' '}
        <span className="font-bold" style={{ color: subjectMeta.color,
          textShadow: `0 0 10px ${subjectMeta.color}60` }}>
          {subjectMeta.name}
        </span>.
        {' '}Com saúde de memória em{' '}
        <span className="font-bold" style={{ color: health < 55 ? RED : ORANGE }}>{health}%</span>,
        {' '}o risco de <em>&quot;branco&quot; no{' '}
        <span style={{ color: GREEN, textShadow: `0 0 14px ${GREEN}80`, fontStyle: 'normal', fontWeight: 700 }}>
          ENEM
        </span>
        </em>{' '}é{' '}
        <span className="font-bold" style={{ color: health < 55 ? RED : ORANGE }}>{risk}</span>.
      </p>

      <p className="text-slate-500 text-sm leading-relaxed mb-4">
        A IA detectou um padrão de <strong className="text-slate-400">retenção fragmentada</strong>:{' '}
        você reconhece o conceito superficialmente, mas não consegue recuperá-lo sob pressão de tempo —
        exatamente o cenário de uma prova do{' '}
        <span style={{ color: GREEN, fontWeight: 700, textShadow: `0 0 10px ${GREEN}60` }}>ENEM</span>.
        Este é o{' '}
        <strong className="text-white">&quot;Efeito de Fluência Ilusória&quot;</strong>:{' '}
        você acha que sabe, mas a memória falha na hora H.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          { label: `${hardCount} Lacuna${hardCount !== 1 ? 's' : ''} Crítica${hardCount !== 1 ? 's' : ''}`, color: RED },
          { label: `${subjectMeta.name} — Risco ${risk}`, color: subjectMeta.color },
          { label: 'Intervenção recomendada', color: VIOLET },
        ].map(({ label, color }) => (
          <span key={label} className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Knowledge Loss Curve ─────────────────────────────────────────────────────
function InsightsPanel({ health }: { health: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

      {/* Forgetting curve */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: 'rgba(10,5,20,0.85)', border: '1px solid rgba(239,68,68,0.20)', backdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${RED}50, transparent)` }} />

        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: RED }}>
          Curva de Perda de Conhecimento
        </p>
        <p className="text-slate-600 text-xs mb-4">Sem revisão espaçada — Ebbinghaus (1885)</p>

        <svg viewBox="0 0 260 110" className="w-full" style={{ maxHeight: 110 }}>
          <defs>
            <linearGradient id="red-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity="0.30" />
              <stop offset="100%" stopColor={RED} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="green-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity="0.25" />
              <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map(y => (
            <line key={y} x1="20" y1={y} x2="250" y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
          ))}
          {[{ y: 10, t: '100%' }, { y: 55, t: '50%' }, { y: 100, t: '0%' }].map(({ y, t }) => (
            <text key={t} x="16" y={y + 4} textAnchor="end" fontSize="7"
              fill="rgba(255,255,255,0.25)" fontFamily="monospace">{t}</text>
          ))}
          <path d={`M 20,10 C 55,16 90,42 140,72 C 180,92 220,98 250,101 L 250,105 L 20,105 Z`}
            fill="url(#red-fade)" />
          <path d={`M 20,10 C 55,16 90,42 140,72 C 180,92 220,98 250,101`}
            fill="none" stroke={RED} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${RED}80)` }} />
          <path d={`M 20,10 C 80,11 140,13 250,18 L 250,105 L 20,105 Z`}
            fill="url(#green-fade)" />
          <path d={`M 20,10 C 80,11 140,13 250,18`}
            fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="6,3"
            style={{ filter: `drop-shadow(0 0 4px ${GREEN}80)` }} />
          {[{ x: 20, t: 'Hoje' }, { x: 135, t: '15 dias' }, { x: 250, t: '30 dias' }].map(({ x, t }) => (
            <text key={t} x={x} y="110" textAnchor="middle" fontSize="7"
              fill="rgba(255,255,255,0.25)" fontFamily="monospace">{t}</text>
          ))}
        </svg>

        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: RED }}>
            <div className="w-6 h-0.5 rounded" style={{ background: RED }} />
            Sem revisão
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: GREEN }}>
            <div className="w-6 rounded" style={{ height: 2, background: `repeating-linear-gradient(90deg, ${GREEN} 0, ${GREEN} 4px, transparent 4px, transparent 8px)` }} />
            Com FlashAprova
          </div>
        </div>
      </div>

      {/* Retention comparison */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: 'rgba(10,5,20,0.85)', border: '1px solid rgba(124,58,237,0.20)', backdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}50, transparent)` }} />

        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: VIOLET }}>
          Comparativo de Retenção
        </p>
        <p className="text-slate-600 text-xs mb-6">Sua situação atual vs meta para aprovação</p>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Sua Retenção Atual</span>
              <span className="text-sm font-black" style={{ color: health < 55 ? RED : ORANGE }}>
                {health}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${health}%`,
                  background: health < 55
                    ? `linear-gradient(90deg, #991b1b, ${RED})`
                    : `linear-gradient(90deg, #c2410c, ${ORANGE})`,
                  boxShadow: `0 0 8px ${health < 55 ? RED : ORANGE}60`,
                }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Meta para Aprovação</span>
              <span className="text-sm font-black" style={{ color: GREEN }}>85%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full"
                style={{
                  width: '85%',
                  background: `linear-gradient(90deg, #16a34a, ${GREEN})`,
                  boxShadow: `0 0 8px ${GREEN}60`,
                }} />
            </div>
          </div>
          <div className="mt-1 px-4 py-3 rounded-xl text-center"
            style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.22)' }}>
            <p className="text-xs text-slate-500">Gap a preencher</p>
            <p className="text-2xl font-black mt-0.5" style={{
              background: `linear-gradient(90deg, ${RED}, ${GREEN})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              +{Math.max(0, 85 - health)} pts
            </p>
            <p className="text-xs text-slate-600 mt-0.5">com método FlashAprova</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Carousel ────────────────────────────────────────────────────────
const EVIDENCE_VIDEOS = [
  { id: 1, name: 'Ana Clara M.',    city: 'SP', score: '960 pts', quote: 'Medicina USP na 1ª chamada!',              accent: EMERALD },
  { id: 2, name: 'Pedro Alves',     city: 'MG', score: '940 pts', quote: 'Aprovado em Medicina UFMG!',               accent: CYAN    },
  { id: 3, name: 'Beatriz S.',      city: 'RJ', score: '952 pts', quote: 'Sem cursinho — só FlashAprova.',           accent: VIOLET  },
  { id: 4, name: 'Lucas T.',        city: 'BA', score: '930 pts', quote: 'Do 680 para 930 em 4 meses.',             accent: ORANGE  },
  { id: 5, name: 'Mariana F.',      city: 'PR', score: '944 pts', quote: 'Prof. Norma salvou minha redação!',       accent: '#ec4899' },
  { id: 6, name: 'Rafael O.',       city: 'CE', score: '920 pts', quote: 'Os tutores IA são incríveis.',            accent: GREEN   },
  { id: 7, name: 'Juliana C.',      city: 'RS', score: '936 pts', quote: 'Passei em Odonto UFRGS!',                 accent: CYAN    },
  { id: 8, name: 'Gabriel N.',      city: 'GO', score: '948 pts', quote: 'Panteão Elite mudou tudo pra mim.',      accent: EMERALD },
] as const;

function EvidenceCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mb-8">
      <div className="text-center mb-5">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: EMERALD }}>
          📹 Prova Social — Depoimentos Reais
        </p>
        <h3 className="text-white font-black text-lg">
          Quem já está no Panteão conta a história
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {EVIDENCE_VIDEOS.map(v => (
          <div
            key={v.id}
            className="shrink-0 rounded-2xl overflow-hidden relative cursor-pointer group"
            style={{
              width: 200,
              height: 280,
              background: `radial-gradient(ellipse at top, ${v.accent}22 0%, rgba(8,4,18,0.95) 65%)`,
              border: `1px solid ${v.accent}30`,
            }}
          >
            {/* Thumbnail gradient */}
            <div className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${v.accent}18 0%, rgba(4,2,10,0.90) 55%, rgba(4,2,10,0.98) 100%)`,
              }} />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `${v.accent}30`,
                  border: `2px solid ${v.accent}60`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 4L16 10L6 16V4Z" fill={v.accent} />
                </svg>
              </div>
            </div>

            {/* Score badge */}
            <div className="absolute top-3 left-3">
              <span className="text-xs font-black px-2 py-1 rounded-full"
                style={{ background: `${v.accent}25`, border: `1px solid ${v.accent}50`, color: v.accent }}>
                {v.score}
              </span>
            </div>

            {/* Info bottom */}
            <div className="absolute bottom-0 inset-x-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(4,2,10,0.98) 0%, transparent 100%)' }}>
              <p className="text-white font-bold text-sm leading-tight mb-1">{v.name}</p>
              <p className="text-xs mb-2" style={{ color: v.accent }}>{v.city}</p>
              <p className="text-slate-400 text-xs leading-snug">&ldquo;{v.quote}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <p className="text-center text-slate-700 text-xs mt-2">← deslize para ver mais →</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  subject: SubjectId;
  results: { rating: string; seconds: number }[];
  memoryHealth: number;
  radar?: Record<string, number>;
  email?: string;
  name?:  string;
}

type PlanId = 'aceleracao' | 'panteao_elite';

const ABACATE_LINKS: Record<PlanId, string> = {
  aceleracao:    'https://www.asaas.com/c/49ydadcmmrrzmigg',
  panteao_elite: 'https://www.asaas.com/c/7tv0nhdilq1frb4s',
};

const cardStyle = {
  background: 'rgba(10,5,20,0.88)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
} as React.CSSProperties;

export default function CheckoutPage() {
  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('flashAprovaOnboarding');
      if (raw) setData(JSON.parse(raw) as OnboardingData);
    } catch { /* ignore */ }
  }, []);

  function handleBuy(planId: PlanId) {
    const params = new URLSearchParams();
    if (data?.email) params.set('email', data.email);
    if (data?.name)  params.set('name',  data.name);
    const query = params.toString();
    window.location.href = query ? `${ABACATE_LINKS[planId]}?${query}` : ABACATE_LINKS[planId];
  }

  const health      = data?.memoryHealth ?? 62;
  const subjectId   = data?.subject ?? 'biologia';
  const subjectMeta = SUBJECT_META[subjectId];
  const hardCount   = data?.results.filter(r => r.rating === 'dificil').length ?? 3;

  const status      = health < 55 ? 'CRÍTICO' : health < 72 ? 'EM RISCO' : 'ATENÇÃO';
  const statusColor = health < 55 ? RED : health < 72 ? ORANGE : '#eab308';
  const statusBorder= health < 55 ? 'rgba(239,68,68,0.28)' : health < 72 ? 'rgba(249,115,22,0.28)' : 'rgba(234,179,8,0.28)';

  const subjectScore = health > 80 ? 0.76 : health > 60 ? 0.52 : health > 40 ? 0.32 : 0.18;
  const defaultScores: Record<SubjectId, number> = { biologia: 0.60, quimica: 0.42, historia: 0.55, geografia: 0.68 };
  const scores = RADAR_ORDER.map(id => {
    if (id === subjectId) return subjectScore;
    if (data?.radar) {
      const area = id === 'biologia' || id === 'quimica' ? 'natureza' : 'humanas';
      const v = data.radar[area];
      if (v !== undefined) return v / 100;
    }
    return defaultScores[id];
  });


  return (
    <>
    <style>{`
      @keyframes emerald-pulse {
        0%, 100% { box-shadow: 0 0 0 1px ${EMERALD}88, 0 0 28px ${EMERALD}30, 0 0 60px ${EMERALD}14; }
        50%       { box-shadow: 0 0 0 1px ${EMERALD}, 0 0 48px ${EMERALD}55, 0 0 100px ${EMERALD}22; }
      }
      .elite-card { animation: emerald-pulse 2.8s ease-in-out infinite; }
    `}</style>
    <div className="min-h-screen px-4 py-10 sm:px-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px', zIndex: 0,
        }} />
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full orb-a"
          style={{ width:600, height:600, top:'-15%', left:'-10%',
            background:`radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)` }} />
        <div className="absolute rounded-full orb-b"
          style={{ width:500, height:500, bottom:'5%', right:'-10%',
            background:`radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)` }} />
      </div>

      <div className="relative max-w-3xl mx-auto" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-black text-white text-xl">
            Flash<span style={{ background:`linear-gradient(90deg,${GREEN},${CYAN})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Aprova</span>
          </Link>
        </div>

        {/* ── Status header ── */}
        <div className="relative rounded-3xl p-6 sm:p-8 mb-6 overflow-hidden"
          style={{ ...cardStyle, border: `1px solid ${statusBorder}`, boxShadow: `0 0 60px ${statusColor}15` }}>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${statusColor}80, transparent)` }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top, ${statusColor}0a 0%, transparent 60%)` }} />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left flex-1">
              <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">
                Relatório de Diagnóstico · IA
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">
                Status:{' '}
                <span style={{ color: statusColor, textShadow: `0 0 20px ${statusColor}80` }}>
                  {status}
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                Saúde da Memória:{' '}
                <span style={{ color: statusColor }} className="font-bold">{health}%</span>
                {' · '}
                <span className="text-white font-bold">{hardCount}</span> lacunas críticas em{' '}
                <span style={{ color: subjectMeta.color, textShadow: `0 0 10px ${subjectMeta.color}60` }}
                  className="font-bold">
                  {subjectMeta.name}
                </span>
              </p>
            </div>
            <div className="shrink-0 w-44">
              <RadarChart scores={scores} />
              <p className="text-xs text-center text-slate-600 mt-1">Radar ENEM · IA</p>
            </div>
          </div>
        </div>

        {/* ── Narrative Report ── */}
        <NarrativeReport subjectMeta={subjectMeta} hardCount={hardCount} health={health} />

        {/* ── Visual Insights ── */}
        <InsightsPanel health={health} />

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 items-start">

          {/* ── PLANO ACELERAÇÃO (Flash) ── */}
          <div className="relative rounded-2xl p-7 overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
            style={{ ...cardStyle, border:'1px solid rgba(124,58,237,0.18)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:`linear-gradient(90deg,transparent,rgba(124,58,237,0.40),transparent)` }} />

            <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color:'#8b5cf6' }}>
              ⚡ PLANO ACELERAÇÃO
            </p>

            {/* Validity — hero element */}
            <div className="px-4 py-2.5 rounded-xl mb-4 text-center"
              style={{ background:'rgba(124,58,237,0.10)', border:'1px solid rgba(124,58,237,0.30)' }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color:'#8b5cf6' }}>
                VÁLIDO ATÉ
              </p>
              <p className="text-lg font-black text-white mt-0.5">ENEM 2026</p>
            </div>

            {/* Price */}
            <div className="mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">12x de R$&nbsp;59,16</span>
              </div>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#8b5cf6' }}>no cartão de crédito</p>
            </div>
            <p className="text-slate-600 text-sm mb-6">ou R$ 710,00 à vista</p>

            <div className="h-px mb-5" style={{ background:'rgba(255,255,255,0.05)' }} />

            <div className="flex flex-col gap-2 mb-6 text-sm text-slate-500">
              {['Flashcards SRS ilimitados', 'Algoritmo SRS avançado', 'Dashboard & heatmap'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span style={{ color:'#8b5cf6' }}>✓</span> {f}
                </div>
              ))}
              {['Resumos & Tabelas', 'Áudio-Resumos', 'Exército de 10 Especialistas IA'].map(f => (
                <div key={f} className="flex items-center gap-2 opacity-30">
                  <span>🔒</span> <span className="line-through">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy('aceleracao')}
              className="block w-full py-3 rounded-xl text-center text-sm font-bold transition-all hover:opacity-80"
              style={{ background:'rgba(124,58,237,0.14)', border:'1px solid rgba(124,58,237,0.30)', color:'#a78bfa' }}>
              Garantir Minha Vaga no ENEM →
            </button>
          </div>

          {/* ── PLANO PANTEÃO ELITE (AiPro+) ── */}
          <div className="elite-card relative rounded-2xl p-8 overflow-hidden"
            style={{ background:'rgba(4,10,8,0.97)' }}>
            {/* Emerald gradient border overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding:'1.5px',
                background:`linear-gradient(135deg,${EMERALD},#06b6d4,#a78bfa,${EMERALD})`,
                WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',
                WebkitMaskComposite:'xor', maskComposite:'exclude',
              }} />
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:`radial-gradient(ellipse at top right,${EMERALD}18 0%,transparent 55%)` }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:`linear-gradient(90deg,${EMERALD},${CYAN},#a78bfa)` }} />

            {/* Top badge — inline, no overlap */}
            <div className="flex justify-center mb-4">
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white text-center"
                style={{ background:`linear-gradient(135deg,${EMERALD},${CYAN})`, boxShadow:`0 0 20px ${EMERALD}55` }}>
                🏅 ESCOLHA DOS TOP 1% MEDICINA
              </span>
            </div>

            <p className="text-xs font-black tracking-widest uppercase mb-3 relative"
              style={{ background:`linear-gradient(90deg,${EMERALD},${CYAN})`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              🏆 PLANO PANTEÃO ELITE
            </p>

            {/* Validity — hero element */}
            <div className="px-4 py-3 rounded-xl mb-4 text-center relative"
              style={{ background:`${EMERALD}15`, border:`1px solid ${EMERALD}45` }}>
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: EMERALD }}>
                SEGURO APROVAÇÃO
              </p>
              <p className="text-lg font-black text-white mt-0.5">ENEM 2026 + 2027</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: EMERALD }}>COMBO 2 ANOS</p>
            </div>

            {/* Price */}
            <div className="mb-3 relative">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  12x de R$&nbsp;66,41
                </span>
              </div>
              <p className="text-xs font-semibold mt-0.5" style={{ color: EMERALD }}>no cartão de crédito</p>
            </div>
            <p className="text-slate-600 text-sm mb-1 relative">ou R$ 797,00 à vista</p>
            <p className="text-sm font-semibold italic mb-6 relative" style={{ color: EMERALD }}>
              Menos de R$ 1,09 por dia
            </p>

            <div className="h-px mb-5 relative"
              style={{ background:`linear-gradient(90deg,${EMERALD}55,${CYAN}55)` }} />

            <div className="flex flex-col gap-2.5 mb-6 text-sm relative">
              {([
                { t:'Tudo do Plano Aceleração incluído',          c: EMERALD },
                { t:'Exército de 10 Especialistas IA 24h',        c: EMERALD },
                { t:'__NORMA__',                                   c: EMERALD },
                { t:'Resumos Storytelling por deck',               c: CYAN    },
                { t:'Tabelas Comparativas + Macetes & Mnemonics', c: CYAN    },
                { t:'Áudio-Resumos narrados por IA',              c: CYAN    },
              ] as { t: string; c: string }[]).map(({ t, c }) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color:c }}>✓</span>
                  <span className="text-slate-200 leading-snug">
                    {t === '__NORMA__'
                      ? <>Redação Master: Mentoria e Correção com Tutor.IA{' '}
                          <strong style={{ color: EMERALD, textShadow: `0 0 8px ${EMERALD}90` }}>Norma</strong>
                        </>
                      : t}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy('panteao_elite')}
              className="relative block w-full py-4 rounded-xl text-center font-black text-white text-base transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background:`linear-gradient(135deg,${EMERALD} 0%,${CYAN} 60%,#a78bfa 100%)`,
                boxShadow:`0 0 40px ${EMERALD}55, 0 4px 20px rgba(0,0,0,0.50)`,
              }}>
              <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <span className="absolute inset-0"
                  style={{ background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)' }} />
              </span>
              Garantir Minha Vaga no ENEM →
            </button>

            {/* Micro trust */}
            <p className="text-center text-sm font-black mt-4 relative" style={{ color: EMERALD, textShadow: `0 0 12px ${EMERALD}60` }}>
              🛡️ Garantia Incondicional de 7 Dias • Risco Zero
            </p>
          </div>
        </div>

        {/* ── A MURALHA — Prova Social ── */}
        <EvidenceCarousel />

        {/* ── Guarantee ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)', border:`1px solid ${EMERALD}20` }}>
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <p className="text-white font-bold text-sm">Garantia Incondicional de 7 Dias. Risco Zero.</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Se não sentir melhora na sua retenção em 7 dias, devolvemos 100% do valor. Sem perguntas, sem burocracia.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)', border:'1px solid rgba(124,58,237,0.18)' }}>
            <div className="text-3xl shrink-0">⚡</div>
            <div>
              <p className="text-white font-bold text-sm">Acesso em menos de 2 minutos</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Após a confirmação, seus flashcards e o Exército de Especialistas IA já estarão disponíveis. Sem espera.
              </p>
            </div>
          </div>
        </div>

        {/* ── Feature comparison ── */}
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,5,20,0.60)' }}>
          <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurso</span>
            <span className="text-xs font-semibold text-center uppercase tracking-wider" style={{ color:'#8b5cf6' }}>
              ⚡ Aceleração
            </span>
            <span className="text-xs font-semibold text-center uppercase tracking-widest"
              style={{ background:`linear-gradient(90deg,${EMERALD},${CYAN})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              🏆 Panteão
            </span>
          </div>
          {[
            ['Flashcards SRS ilimitados',                true,  true ],
            ['Dashboard & heatmap',                      true,  true ],
            ['Resumos Storytelling',                     false, true ],
            ['Tabelas Comparativas',                     false, true ],
            ['Áudio-Resumos IA',                         false, true ],
            ['Exército de 10 Especialistas IA',          false, true ],
            ['Redação Master — Tutor.IA Norma',          false, true ],
            ['Acesso 2 anos (ENEM 2026 + 2027)',         false, true ],
          ].map(([feat, flash, pro], i) => (
            <div key={feat as string} className="grid grid-cols-3 px-5 py-3 text-sm"
              style={{ borderTop:'1px solid rgba(255,255,255,0.04)', background:i%2===0?'rgba(255,255,255,0.012)':'transparent' }}>
              <span className="text-slate-400">{feat as string}</span>
              <span className="text-center font-semibold" style={{ color:flash?'#8b5cf6':'#1e1b4b' }}>{flash?'✓':'—'}</span>
              <span className="text-center font-semibold" style={{ color:pro?EMERALD:'#334155' }}>{pro?'✓':'—'}</span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-slate-700 text-xs pb-8">
          🔒 Pagamento 100% seguro · 🛡️ Garantia Incondicional de 7 Dias. Risco Zero. · ⚡ Acesso imediato
        </p>
      </div>

    </div>

    <WhatsAppFloat />
    </>
  );
}
