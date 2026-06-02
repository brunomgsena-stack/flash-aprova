'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { type SubjectId, SUBJECT_META } from '../onboarding/flashcardData';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { REELS } from '@/lib/reels-data';
import { deterministicEventId } from '@/lib/meta-event-id';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN   = '#22c55e';
const VIOLET  = '#7C3AED';
const CYAN    = '#06b6d4';
const RED     = '#ef4444';
const ORANGE  = '#f97316';
const EMERALD = '#10b981';

// ─── Radar Chart ─────────────────────────────────────────────────────────────
type RadarSubjectId = 'biologia' | 'quimica' | 'historia' | 'geografia';
const RADAR_ORDER: RadarSubjectId[] = ['biologia', 'quimica', 'historia', 'geografia'];
const RADAR_LABELS = ['Bio', 'Quím', 'Hist', 'Geo'];
const RADAR_COLORS = [GREEN, CYAN, '#eab308', '#10b981'];

function RadarChart({ scores }: { scores: number[] }) {
  const cx = 110, cy = 110, R = 82;
  const angles = [-90, 0, 90, 180].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) => `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  // animated scores: fade in from 0 to actual value
  const [animScores, setAnimScores] = useState(scores.map(() => 0));

  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const raf = requestAnimationFrame(function tick(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimScores(scores.map(s => s * ease));
      if (t < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [scores]);

  const polyPoints = animScores.map((s, i) => pt(s * R, i)).join(' ');

  return (
    <svg viewBox="0 0 220 220" className="w-full" style={{ maxHeight: 220, minHeight: 140 }}>
      <defs>
        <filter id="radar-glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="scan-glow">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="40%" stopColor={`${VIOLET}cc`}/>
          <stop offset="60%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
        <clipPath id="radar-clip">
          <rect x="28" y="28" width="164" height="164"/>
        </clipPath>
      </defs>

      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map(p => (
        <polygon key={p} points={angles.map((_, i) => pt(p * R, i)).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {/* grid axes */}
      {angles.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}

      {/* filled area */}
      <polygon points={polyPoints}
        fill={`${VIOLET}28`} stroke={VIOLET} strokeWidth="2" filter="url(#radar-glow)" />

      {/* scan line — pure SMIL, zero JS */}
      <line x1="28" x2="192"
        stroke="url(#scan-grad)" strokeWidth="1.5"
        filter="url(#scan-glow)"
        clipPath="url(#radar-clip)"
        opacity="0.75">
        <animate attributeName="y1" values="28;192;28" dur="3s" repeatCount="indefinite" calcMode="ease-in-out"/>
        <animate attributeName="y2" values="28;192;28" dur="3s" repeatCount="indefinite" calcMode="ease-in-out"/>
      </line>
      {/* scan line bright core */}
      <line x1="60" x2="160"
        stroke="#c4b5fd" strokeWidth="0.5"
        clipPath="url(#radar-clip)"
        opacity="0.4">
        <animate attributeName="y1" values="28;192;28" dur="3s" repeatCount="indefinite" calcMode="ease-in-out"/>
        <animate attributeName="y2" values="28;192;28" dur="3s" repeatCount="indefinite" calcMode="ease-in-out"/>
      </line>

      {/* dots — pulse staggered via SMIL begin offset */}
      {animScores.map((s, i) => {
        const dotX = cx + s * R * Math.cos(angles[i]);
        const dotY = cy + s * R * Math.sin(angles[i]);
        return (
          <g key={i}>
            <circle cx={dotX} cy={dotY} r="6" fill={RADAR_COLORS[i]} opacity="0">
              <animate attributeName="r"       values="6;14;6"        dur="3.6s" begin={`${i * 0.9}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.25;0;0.25"   dur="3.6s" begin={`${i * 0.9}s`} repeatCount="indefinite"/>
            </circle>
            <circle cx={dotX} cy={dotY} r="5" fill={RADAR_COLORS[i]} filter="url(#radar-glow)"/>
            <circle cx={dotX} cy={dotY} r="2.5" fill="white" opacity="0.7"/>
          </g>
        );
      })}

      {/* labels */}
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
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}>
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}60, transparent)` }} />

      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
        // ANÁLISE DO TUTOR IA
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
        IA detectou:{' '}
        <strong className="text-red-400">Falha na Recuperação de Memória</strong> —{' '}
        você reconhece o conceito superficialmente, mas não consegue recuperá-lo sob pressão de tempo.
        Exatamente o cenário de uma prova do{' '}
        <span style={{ color: GREEN, fontWeight: 700, textShadow: `0 0 10px ${GREEN}60` }}>ENEM</span>.{' '}
        Diagnóstico:{' '}
        <strong className="text-white">&quot;Efeito de Fluência Ilusória&quot;</strong> —
        memória aparente sem recuperação sob stress.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          { label: `${hardCount} Lacuna${hardCount !== 1 ? 's' : ''} Crítica${hardCount !== 1 ? 's' : ''}`, color: RED },
          { label: `${subjectMeta.name} — Risco ${risk}`, color: subjectMeta.color },
          { label: 'Recall sob estresse', color: VIOLET },
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
  const deficitPts = health < 55 ? 500 : health < 65 ? 400 : health < 72 ? 300 : 200;
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
        <p className="text-slate-600 text-xs mb-4">Curva original Ebbinghaus (1885), replicada em Murre &amp; Dros, PLOS ONE, 2015</p>

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
              <span className="text-sm font-black glitch-num" style={{ color: health < 55 ? RED : ORANGE }}>
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
              <span className="text-sm font-black" style={{ color: GREEN }}>87%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full"
                style={{
                  width: '87%',
                  background: `linear-gradient(90deg, #16a34a, ${GREEN})`,
                  boxShadow: `0 0 8px ${GREEN}60`,
                }} />
            </div>
          </div>
          <div className="mt-1 px-4 py-4 rounded-xl text-center"
            style={{ background: 'rgba(6,95,70,0.18)', border: `1px solid ${GREEN}40` }}>
            <p className="text-xs font-black tracking-widest uppercase mb-0.5" style={{ color: GREEN }}>
              [ POTENCIAL DE GANHO ]
            </p>
            <p className="text-xl font-black mt-1" style={{ color: '#6ee7b7' }}>
              GANHO POTENCIAL: +{deficitPts} PONTOS NA MÉDIA TRI
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Este é o volume de nota que você pode recuperar usando Engenharia de Retenção.
            </p>
            <p className="text-[10px] text-slate-600 mt-2 leading-relaxed" style={{ fontFamily: 'ui-monospace, monospace' }}>
              * Estimativa baseada em curva de Ebbinghaus + revisão espaçada (Cepeda et al. 2008).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Carousel ────────────────────────────────────────────────────────
// Content comes from lib/reels-data.ts — shared with ReelsTestimonials on the
// landing page. Edit that file to update both carousels simultaneously.

const EDGE_MASK = {
  maskImage:       'linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)',
} as const;

function EvidenceCarousel() {
  const x        = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const SPEED = 0.045; // px/ms

  useAnimationFrame((_, delta) => {
    const px      = paused ? SPEED * 0.4 : SPEED;
    const current = x.get();
    const half    = (trackRef.current?.scrollWidth ?? 0) / 2;
    let   next    = current - px * delta;
    if (half > 0 && Math.abs(next) >= half) next += half;
    x.set(next);
  });

  const doubled = [...REELS, ...REELS];

  return (
    <div id="mural-aprovados" className="mb-8">
      <div className="text-center mb-5">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: EMERALD }}>
          🏅 MURAL DOS APROVADOS
        </p>
        <h3 className="text-white font-black text-lg">
          Quem já passou conta a história
        </h3>
      </div>

      <div
        className="overflow-hidden"
        style={EDGE_MASK}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          ref={trackRef}
          className="flex gap-4 py-4 px-2"
          style={{ x, willChange: 'transform' }}
        >
          {doubled.map((reel, i) => (
            <div
              key={`${reel.handle}-${i}`}
              className="shrink-0 rounded-2xl overflow-hidden relative cursor-pointer group"
              style={{
                width: 180,
                height: 252,
                background: `linear-gradient(160deg, ${reel.gradA} 0%, ${reel.gradB} 100%)`,
                border: `1px solid ${reel.tagColor}30`,
              }}
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reel.img}
                alt={reel.handle}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
                decoding="async"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />

              {/* Vignette */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.10) 70%, transparent 100%)' }} />

              {/* Stories bar */}
              <div className="absolute top-0 inset-x-0 flex gap-0.5 px-2.5 pt-2 z-20">
                {reel.stories.map((filled, j) => (
                  <div key={j} className="h-0.5 flex-1 rounded-full"
                    style={{ background: filled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)' }} />
                ))}
              </div>

              {/* Tag + handle */}
              <div className="absolute top-5 left-2.5 z-20 flex flex-col gap-0.5">
                <span className="text-[7px] font-bold tracking-widest uppercase"
                  style={{ color: reel.tagColor, fontFamily: 'ui-monospace, monospace' }}>
                  [ {reel.tag} ]
                </span>
                <span className="text-[7px] text-white/45" style={{ fontFamily: 'ui-monospace, monospace' }}>
                  {reel.handle}
                </span>
              </div>

              {/* Score badge */}
              <div className="absolute top-3 right-2 z-20">
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: `${reel.tagColor}25`, border: `1px solid ${reel.tagColor}55`, color: reel.tagColor }}>
                  {reel.score}
                </span>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 inset-x-0 px-3 pb-3 z-20">
                <p className="font-black text-[9px] leading-none mb-0.5"
                  style={{ color: reel.tagColor, fontFamily: 'ui-monospace, monospace' }}>
                  {reel.course}
                </p>
                <ul className="flex flex-col gap-0.5 mt-1.5">
                  {reel.bullets.map((b, j) => (
                    <li key={j} className="text-[8px] text-white/75 leading-snug">{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
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

type PlanId = 'aceleracao' | 'panteao_elite' | 'black';

const ASAAS_LINKS: Record<PlanId, string> = {
  aceleracao:    'https://www.asaas.com/c/5eavmb23sffhvvni',
  panteao_elite: 'https://www.asaas.com/c/cahneqkzx0cn05yh',
  black:         'https://www.asaas.com/c/cahneqkzx0cn05yh', // TEMPORÁRIO: aponta pro Neural enquanto link Black do Asaas não está pronto. Risco: usuário paga R$ 327 ao invés de R$ 997.
};

const PLAN_META: Record<PlanId, { value: number; name: string }> = {
  aceleracao:    { value: 257, name: 'Protocolo Aceleração' },
  panteao_elite: { value: 327, name: 'Protocolo Pantéon Elite' },
  black:         { value: 997, name: 'Protocolo Black' },
};

const cardStyle = {
  background: 'rgba(10,5,20,0.88)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
} as React.CSSProperties;

export default function CheckoutPage() {
  const [data, setData] = useState<OnboardingData | null>(null);

  // ENEM 2026: first weekend of November (8/Nov/2026)
  const enemDate = new Date('2026-11-08T00:00:00');
  const daysLeft = Math.max(0, Math.ceil((enemDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  const [buying, setBuying] = useState<PlanId | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  // planId pré-selecionado via URL (?plan=aceleracao ou ?plan=panteao_elite)
  const [urlPlan, setUrlPlan] = useState<PlanId | null>(null);
  const addToCartFiredRef = useRef(false);

  useEffect(() => {
    let parsed: OnboardingData | null = null;
    try {
      const raw = localStorage.getItem('flashAprovaOnboarding');
      if (raw) {
        parsed = JSON.parse(raw) as OnboardingData;
        setData(parsed);
      }
    } catch { /* ignore */ }

    // Lê o plano da URL: /checkout?plan=aceleracao
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') as PlanId | null;
    if (plan === 'aceleracao' || plan === 'panteao_elite' || plan === 'black') setUrlPlan(plan);

    // Tracking AddToCart — best-effort, nunca bloqueia.
    if (addToCartFiredRef.current) return;
    addToCartFiredRef.current = true;

    const email = parsed?.email?.trim().toLowerCase();
    const eventId = deterministicEventId('AddToCart', email || `anon-${Date.now()}`);

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        currency: 'BRL',
        content_ids: ['aceleracao', 'panteao_elite', 'black'],
        content_type: 'product',
      }, { eventID: eventId });
    }

    fetch('/api/meta/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, email: email || undefined }),
    }).catch(() => {});
  }, []);

  const handleBuy = useCallback((planId: PlanId) => {
    if (buying) return;

    setBuying(planId);

    const email = (data?.email || emailInput.trim().toLowerCase()).trim();
    const hasEmail = !!email && email.includes('@');
    const url = hasEmail
      ? `${ASAAS_LINKS[planId]}?email=${encodeURIComponent(email)}`
      : ASAAS_LINKS[planId];

    // Tracking InitiateCheckout — best-effort, antes do redirect.
    try {
      const meta = PLAN_META[planId];
      const eventId = deterministicEventId(
        'InitiateCheckout',
        `${planId}.${hasEmail ? email : 'anon'}`,
      );

      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', {
          currency: 'BRL',
          value: meta.value,
          content_name: meta.name,
          content_ids: [planId],
          content_type: 'product',
          num_items: 1,
        }, { eventID: eventId });
      }

      const payload = JSON.stringify({
        eventId,
        email: hasEmail ? email : undefined,
        planId,
      });
      const blob = new Blob([payload], { type: 'application/json' });
      const beaconOk =
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/api/meta/initiate-checkout', blob);

      if (!beaconOk) {
        fetch('/api/meta/initiate-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch { /* tracking nunca bloqueia */ }

    window.location.href = url;
  }, [buying, data, emailInput]);

  const health      = data?.memoryHealth ?? 62;
  const subjectId   = data?.subject ?? 'biologia';
  const subjectMeta = SUBJECT_META[subjectId] ?? SUBJECT_META['biologia'];
  const hardCount   = data?.results.filter(r => r.rating === 'dificil').length ?? 3;

  const status      = health < 55 ? 'CRÍTICO' : health < 72 ? 'EM RISCO' : 'ATENÇÃO';
  const statusColor = health < 55 ? RED : health < 72 ? ORANGE : '#eab308';
  const statusBorder= health < 55 ? 'rgba(239,68,68,0.28)' : health < 72 ? 'rgba(249,115,22,0.28)' : 'rgba(234,179,8,0.28)';
  const deficitPts  = health < 55 ? 500 : health < 65 ? 400 : health < 72 ? 300 : 200;

  const subjectScore = health > 80 ? 0.76 : health > 60 ? 0.52 : health > 40 ? 0.32 : 0.18;
  const defaultScores: Record<RadarSubjectId, number> = { biologia: 0.60, quimica: 0.42, historia: 0.55, geografia: 0.68 };
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
        0%, 100% { box-shadow: 0 0 0 1px ${GREEN}88, 0 0 28px ${GREEN}30, 0 0 60px ${GREEN}14; }
        50%       { box-shadow: 0 0 0 1px ${GREEN}, 0 0 48px ${GREEN}55, 0 0 100px ${GREEN}22; }
      }
      .elite-card { animation: emerald-pulse 2.8s ease-in-out infinite; }

      @keyframes glitch {
        0%, 90%, 100% { opacity: 1; transform: translate(0); clip-path: none; }
        91%  { opacity: 0.8; transform: translate(-2px, 1px); clip-path: inset(15% 0 40% 0); color: #fca5a5; }
        92%  { opacity: 1;   transform: translate(2px, -1px); clip-path: inset(55% 0 15% 0); color: #f87171; }
        93%  { opacity: 0.7; transform: translate(-1px, 0);  clip-path: inset(30% 0 55% 0); }
        94%  { opacity: 1;   transform: translate(0); clip-path: none; }
      }
      .glitch-num { animation: glitch 3.5s ease-in-out infinite; display: inline-block; }
      @media (prefers-reduced-motion: reduce) {
        .elite-card, .glitch-num { animation: none !important; }
      }
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

        {/* Countdown ENEM 2026 */}
        <div
          className="max-w-md mx-auto mb-6 px-5 py-3 rounded-xl flex items-center justify-center gap-3 text-center"
          style={{
            background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.25)',
          }}
        >
          <span className="text-xl leading-none" aria-hidden>⏳</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#fbbf24' }}>
              Faltam
            </span>
            <span className="text-2xl font-black leading-tight" style={{ color: '#fef3c7' }}>
              {daysLeft} dias
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              para o ENEM 2026
            </span>
          </div>
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
              {/* Diagnosis-complete banner */}
              <div className="rounded-lg px-3 py-2 mb-4 text-center text-xs font-black tracking-widest uppercase"
                style={{ color: '#6ee7b7', border: '1px solid #065f46', background: 'rgba(6,95,70,0.18)' }}>
                [ DIAGNÓSTICO CONCLUÍDO · IA ]
              </div>
              <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">
                Relatório de Diagnóstico · IA
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">
                {data?.name && <span>{data.name.split(' ')[0]}, </span>}
                <span style={{ color: EMERALD, textShadow: `0 0 24px ${EMERALD}90` }}>
                  seu diagnóstico
                </span>{' '}está pronto.
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                Identificamos exatamente onde sua memória está vazando em{' '}
                <span style={{ color: subjectMeta.color, textShadow: `0 0 10px ${subjectMeta.color}60` }}
                  className="font-bold">
                  {subjectMeta.name}
                </span>{' '}
                — e montamos o plano que fecha essas lacunas antes do ENEM. Sem reforço espaçado, boa parte do que você estudou hoje se perde em poucos dias;{' '}
                <span className="text-white font-bold">
                  com o protocolo certo, vira retenção.
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

        {/* ── E-mail (quando não vem do quiz) ── */}
        {!data?.email && (
          <div className="mb-6 rounded-2xl p-5"
            style={{ ...cardStyle, border: '1px solid rgba(124,58,237,0.22)' }}>
            <label className="block text-slate-400 text-xs mb-1.5">E-mail (opcional) — agiliza seu acesso após o pagamento</label>
            <input
              type="email"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
              placeholder="seu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-1"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: emailError ? '1px solid #ef4444' : '1px solid rgba(124,58,237,0.30)',
                transition: 'border-color 150ms',
              }}
            />
            {emailError && (
              <p className="text-xs mt-1.5" style={{ color: RED }}>{emailError}</p>
            )}
          </div>
        )}

        {/* ── Intro copy ── */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Escolha seu protocolo de aprovação
          </h2>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 items-start lg:w-[min(64rem,92vw)] lg:relative lg:left-1/2 lg:-translate-x-1/2">

          {/* ── ESSENCIAL ── */}
          <div className="relative rounded-2xl p-7 overflow-hidden order-2 lg:order-1"
            style={{ ...cardStyle, border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, rgba(124,58,237,0.30), transparent)` }} />

            {/* Badge */}
            <div className="mb-4">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#8b5cf6' }}>
                BÁSICO
              </span>
            </div>

            {/* Plan name */}
            <p className="text-base font-black text-white mb-4 leading-tight">
              FlashAprova <span style={{ color: '#8b5cf6' }}>Essencial</span>
            </p>

            {/* Price */}
            <div className="mb-1">
              <span className="text-xs text-slate-500 font-semibold">12x de </span><span className="text-3xl font-black text-white">R$&nbsp;21,41</span>
            </div>
            <p className="text-slate-500 text-xs mb-1">ou R$ 257 à vista</p>
            <p className="text-slate-500 text-xs italic mb-6">Para quem quer apenas revisar com flashcards.</p>

            <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

            <div className="flex flex-col gap-2.5 mb-4 text-sm">
              {[
                'Flashcards SRS ilimitados',
                'Revisão por matéria',
                'Dashboard básico',
                'Acesso ENEM 2026',
                'Progresso salvo automaticamente',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: '#8b5cf6' }}>✓</span>
                  <span className="text-slate-300">{f}</span>
                </div>
              ))}

              {[
                'Tutor IA 24/7',
                'Radar de Lacunas avançado',
                'Correção de Redação IA',
                'Simulados TRI',
                'Especialistas IA',
              ].map(f => (
                <div key={f} className="flex items-start gap-2 opacity-35">
                  <span className="shrink-0 mt-0.5 text-xs">🔒</span>
                  <span className="line-through text-slate-500 leading-snug">
                    {f}
                    <span className="no-underline not-italic text-[9px] font-black tracking-wider ml-1.5 align-middle"
                      style={{ color: 'rgba(239,68,68,0.6)' }}>[ BLOQUEADO ]</span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
              style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
              Ideal para quem já tem estratégia própria.
            </p>

            <button
              onClick={() => handleBuy('aceleracao')}
              aria-label="Assinar FlashAprova Essencial"
              disabled={!!buying}
              className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}>
              {buying === 'aceleracao' ? '[ AGUARDE... ]' : '[ QUERO SÓ OS FLASHCARDS ]'}
            </button>
          </div>

          {/* ── PROTOCOLO NEURAL (principal) ── */}
          <div className="elite-card relative rounded-2xl p-8 overflow-hidden order-1 lg:order-2"
            style={{ background: 'rgba(4,10,8,0.97)' }}>
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding: '1.5px',
                background: `linear-gradient(135deg, ${GREEN}, ${CYAN}, #a78bfa, ${GREEN})`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
              }} />
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${GREEN}18 0%, transparent 55%)` }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN}, #a78bfa)` }} />

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white inline-flex items-center gap-1"
                style={{ background: `linear-gradient(135deg, ${GREEN}, ${CYAN})`, boxShadow: `0 0 20px ${GREEN}55` }}>
                🏅 MAIS ESCOLHIDO
              </span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40`, color: GREEN }}>
                MELHOR CUSTO-BENEFÍCIO
              </span>
            </div>

            {/* Plan name */}
            <p className="text-xs font-black mb-2 leading-tight tracking-tight"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              [ PROTOCOLO NEURAL ]
            </p>

            {/* Headline */}
            <p className="text-white text-sm font-semibold leading-snug mb-4">
              O sistema completo para não esquecer o que estudou até o ENEM.
            </p>

            {/* Price */}
            <div className="mb-1 relative">
              <span className="text-xs text-slate-400 font-semibold">12x de </span><span className="text-4xl font-black text-white">R$&nbsp;27,25</span>
            </div>
            <p className="text-slate-500 text-xs mb-1">ou R$ 327 à vista</p>
            <p className="text-sm font-semibold italic mb-2" style={{ color: GREEN }}>menos de R$ 0,90 por dia</p>

            <div className="h-px mb-4 relative"
              style={{ background: `linear-gradient(90deg, ${GREEN}55, ${CYAN}55)` }} />

            <div className="flex flex-col gap-2.5 mb-6 text-sm relative">
              {([
                { t: 'Tudo do Essencial incluído',               c: GREEN },
                { t: 'Dashboard + heatmap',                      c: GREEN },
                { t: 'Radar de Lacunas',                         c: GREEN },
                { t: 'Algoritmo SRS de retenção espaçada',       c: GREEN },
                { t: 'Resumos Storytelling',                     c: CYAN  },
                { t: 'Tabelas comparativas',                     c: CYAN  },
                { t: '15 Especialistas IA',                      c: GREEN },
                { t: 'Tutor IA 24/7',                            c: GREEN },
                { t: 'Correção de Redação com IA',               c: GREEN },
                { t: 'Treinos e simulados direcionados',         c: GREEN },
                { t: 'Acesso até jul/2027 · ENEM 2026 + FUVEST, UNICAMP e USP', c: GREEN },
              ] as { t: string; c: string }[]).map(({ t, c }) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: c }}>✓</span>
                  <span className="text-slate-200 leading-snug">{t}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy('panteao_elite')}
              aria-label="Assinar Protocolo Neural"
              disabled={!!buying}
              className="relative block w-full py-4 rounded-xl text-center font-black text-white text-sm tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
              style={{
                background: `linear-gradient(135deg, ${GREEN} 0%, ${CYAN} 60%, #a78bfa 100%)`,
                boxShadow: `0 0 40px ${GREEN}55, 0 4px 20px rgba(0,0,0,0.50)`,
              }}>
              <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <span className="absolute inset-0"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }} />
              </span>
              {buying === 'panteao_elite' ? '[ AGUARDE... ]' : '[ COMEÇAR 7 DIAS GRÁTIS ]'}
            </button>

            <p className="text-center text-sm font-black mt-4 relative" style={{ color: GREEN, textShadow: `0 0 12px ${GREEN}60` }}>
              🛡️ Garantia incondicional de 7 dias. Risco zero.
            </p>
          </div>

          {/* ── PROTOCOLO BLACK (âncora premium) ── */}
          <div className="relative rounded-2xl p-7 overflow-hidden order-3 lg:order-3"
            style={{ background: 'rgba(18,14,6,0.96)', border: '1px solid rgba(217,119,6,0.22)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.50), transparent)' }} />

            {/* Badge */}
            <div className="mb-4">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
                style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.30)', color: '#d97706' }}>
                PREMIUM
              </span>
            </div>

            {/* Plan name */}
            <p className="text-base font-black mb-4 leading-tight" style={{ color: '#fbbf24' }}>
              Protocolo <span style={{ color: '#d97706' }}>Black</span>
            </p>

            {/* Price */}
            <div className="mb-1">
              <span className="text-xs font-semibold" style={{ color: '#78716c' }}>12x de </span><span className="text-3xl font-black" style={{ color: '#fef3c7' }}>R$&nbsp;99,70</span>
            </div>
            <p className="text-slate-500 text-xs mb-1">ou R$ 997 à vista</p>
            <p className="text-slate-500 text-xs italic mb-6">Para quem quer acompanhamento estratégico máximo.</p>

            <div className="h-px mb-4" style={{ background: 'rgba(217,119,6,0.15)' }} />

            <div className="flex flex-col gap-2.5 mb-6 text-sm">
              {[
                'Tudo do Protocolo Neural',
                'Mentoria mensal 1x1 com especialista pedagógico',
                'Plano intensivo reta final',
                'Suporte prioritário',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" style={{ color: '#d97706' }}>✓</span>
                  <span className="text-slate-300 leading-snug">{f}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
              style={{ borderColor: 'rgba(217,119,6,0.25)' }}>
              Indicado para quem quer máxima personalização.
            </p>

            <button
              onClick={() => handleBuy('black')}
              aria-label="Aplicar para o Protocolo Black"
              disabled={!!buying}
              className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:bg-amber-900/10 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: 'transparent', border: '1px solid rgba(217,119,6,0.40)', color: '#d97706' }}>
              {buying === 'black' ? '[ AGUARDE... ]' : '[ APLICAR PARA O BLACK ]'}
            </button>
          </div>
        </div>

        {/* ── A MURALHA — Prova Social ── */}
        <EvidenceCarousel />

        {/* ── Guarantee ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(10,5,20,0.70)', border: `1px solid ${GREEN}20` }}>
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <p className="text-white font-bold text-sm">Garantia incondicional de 7 dias</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Entre, teste o FlashAprova e veja se o sistema faz sentido para sua rotina. Se não sentir clareza no plano de estudo, devolvemos 100% do valor. Sem pergunta, sem burocracia.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(10,5,20,0.70)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="text-3xl shrink-0">⚡</div>
            <div>
              <p className="text-white font-bold text-sm">Acesso liberado em menos de 2 minutos</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Após a confirmação, seus flashcards, diagnóstico, radar de lacunas e tutores IA ficam disponíveis imediatamente.
              </p>
            </div>
          </div>
        </div>

        {/* ── Feature comparison ── */}
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,5,20,0.60)' }}>
          <div className="text-center py-4 border-b border-white/5">
            <h3 className="text-white font-black text-base">Compare os protocolos</h3>
          </div>
          <div className="grid grid-cols-4 px-3 sm:px-5 py-3 border-b border-white/5">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurso</span>
            <span className="text-[10px] sm:text-xs font-semibold text-center uppercase tracking-wider" style={{ color: '#8b5cf6' }}>
              Essencial
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-center uppercase tracking-widest"
              style={{ background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🏆 P. Neural
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-center uppercase tracking-wider" style={{ color: '#d97706' }}>
              Black
            </span>
          </div>
          {([
            ['Flashcards SRS ilimitados',       true,  true,  true ],
            ['Dashboard básico',                true,  true,  true ],
            ['Dashboard + heatmap',             false, true,  true ],
            ['Radar de Lacunas',                false, true,  true ],
            ['Resumos Storytelling',            false, true,  true ],
            ['Tabelas comparativas',            false, true,  true ],
            ['15 Especialistas IA',             false, true,  true ],
            ['Tutor IA 24/7',                   false, true,  true ],
            ['Correção de Redação IA',          false, true,  true ],
            ['Simulados/Treinos direcionados',  false, true,  true ],
            ['Plano estratégico semanal',       false, false, true ],
            ['Prioridade na IA',                false, false, true ],
            ['Suporte prioritário',             false, false, true ],
          ] as [string, boolean, boolean, boolean][]).map(([feat, ess, pro, blk], i) => (
            <div key={feat} className="grid grid-cols-4 px-3 sm:px-5 py-3 text-xs sm:text-sm"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <span className="text-slate-400 leading-snug text-[10px] sm:text-xs">{feat}</span>
              <span className="text-center font-semibold" style={{ color: ess ? '#8b5cf6' : '#1e1b4b' }}>{ess ? '✓' : '—'}</span>
              <span className="text-center font-bold" style={{ color: pro ? GREEN : '#334155', textShadow: pro ? `0 0 8px ${GREEN}60` : 'none' }}>{pro ? '✓' : '—'}</span>
              <span className="text-center font-semibold" style={{ color: blk ? '#d97706' : '#292524' }}>{blk ? '✓' : '—'}</span>
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
