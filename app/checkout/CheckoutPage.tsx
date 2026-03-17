'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { type SubjectId, SUBJECT_META } from '../onboarding/flashcardData';

const GREEN  = '#22c55e';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const RED    = '#ef4444';
const ORANGE = '#f97316';

// ─── Radar Chart ────────────────────────────────────────────────────────────
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

// ─── Narrative Report ────────────────────────────────────────────────────────
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
        {' '}o risco de <em>"branco" no{' '}
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
        <strong className="text-white">"Efeito de Fluência Ilusória"</strong>:{' '}
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

// ─── Knowledge Loss Curve ────────────────────────────────────────────────────
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

          {/* Grid lines */}
          {[25, 50, 75].map(y => (
            <line key={y} x1="20" y1={y} x2="250" y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
          ))}

          {/* Y axis labels */}
          {[{ y: 10, t: '100%' }, { y: 55, t: '50%' }, { y: 100, t: '0%' }].map(({ y, t }) => (
            <text key={t} x="16" y={y + 4} textAnchor="end" fontSize="7"
              fill="rgba(255,255,255,0.25)" fontFamily="monospace">{t}</text>
          ))}

          {/* Red forgetting curve fill */}
          <path d={`M 20,10 C 55,16 90,42 140,72 C 180,92 220,98 250,101 L 250,105 L 20,105 Z`}
            fill="url(#red-fade)" />
          {/* Red forgetting curve line */}
          <path d={`M 20,10 C 55,16 90,42 140,72 C 180,92 220,98 250,101`}
            fill="none" stroke={RED} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${RED}80)` }} />

          {/* Green SRS curve fill */}
          <path d={`M 20,10 C 80,11 140,13 250,18 L 250,105 L 20,105 Z`}
            fill="url(#green-fade)" />
          {/* Green SRS curve line */}
          <path d={`M 20,10 C 80,11 140,13 250,18`}
            fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="6,3"
            style={{ filter: `drop-shadow(0 0 4px ${GREEN}80)` }} />

          {/* X axis labels */}
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
          {/* Sua retenção */}
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

          {/* Meta */}
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

          {/* Gap */}
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

// ─── App Mockup (Tutor IA) ────────────────────────────────────────────────────
function AppMockup({ subjectMeta }: { subjectMeta: typeof SUBJECT_META[SubjectId] }) {
  const [typingDone, setTypingDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTypingDone(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative rounded-2xl p-5 sm:p-6 mb-6 overflow-hidden"
      style={{
        background: 'rgba(10,5,20,0.88)',
        border: `1px solid rgba(6,182,212,0.22)`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 60px rgba(6,182,212,0.08)`,
      }}>
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}60, transparent)` }} />

      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: CYAN }}>
        // TUTOR IA · PRÉVIA DO PLANO PROAI+
      </p>

      {/* Phone frame */}
      <div className="mx-auto max-w-xs">
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(5,3,12,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 6px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.60)',
          }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})` }}>
                🤖
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Tutor IA</p>
                <p className="text-xs leading-none mt-0.5" style={{ color: GREEN }}>● online</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 rounded-full" style={{ height: 6 + i * 3, background: 'rgba(255,255,255,0.30)' }} />
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="px-4 py-4 flex flex-col gap-3" style={{ minHeight: 180 }}>
            {/* Bot message */}
            <div className="flex gap-2 items-end">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs"
                style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})` }}>🤖</div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs leading-relaxed text-white"
                style={{ background: 'rgba(124,58,237,0.28)', border: '1px solid rgba(124,58,237,0.35)' }}>
                Preparei um mnemônico para você nunca mais esquecer{' '}
                <span className="font-bold" style={{ color: subjectMeta.color }}>
                  {subjectMeta.name === 'Biologia' ? 'as fases da Meiose'
                    : subjectMeta.name === 'Química' ? 'Ligação Iônica vs Covalente'
                    : subjectMeta.name === 'História' ? 'as causas da Revolução Francesa'
                    : 'o Cerrado e El Niño'}
                </span>.{' '}
                Quer ver? 🧠
              </div>
            </div>

            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs text-white"
                style={{ background: `linear-gradient(135deg, ${GREEN}90, #16a34a90)` }}>
                Sim! Me mostra 🙏
              </div>
            </div>

            {/* Typing / response */}
            {!typingDone ? (
              <div className="flex gap-2 items-end">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs"
                  style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})` }}>🤖</div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center"
                  style={{ background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(124,58,237,0.30)' }}>
                  {[0, 0.3, 0.6].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#a78bfa', animation: `bounce 1s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-end fade-up">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs"
                  style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})` }}>🤖</div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{ background: 'rgba(124,58,237,0.28)', border: '1px solid rgba(124,58,237,0.35)', color: '#e2e8f0' }}>
                  <span className="font-black" style={{ color: CYAN }}>MACETE: </span>
                  {subjectMeta.name === 'Biologia'
                    ? '"Prof. IL-ME-DIA" → Profase, Intercinese, Leptóteno, Meiose II, Diplóteno, Anafase I'
                    : subjectMeta.name === 'Química'
                    ? '"Metal doa, não-metal recebe" → ligação iônica = transferência de e⁻'
                    : subjectMeta.name === 'História'
                    ? '"LITE" → Liberdade, Igualdade, Tributação excessiva, Estamentos'
                    : '"CEM" → Cerrado=savana, El Niño=Pacífico quente, Mercator=distorção polar'}
                  {' '}💡
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs text-slate-700 flex-1">Pergunte ao Tutor IA...</span>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})` }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-3">
          🔒 Disponível apenas no Plano ProAI+
        </p>
      </div>
    </div>
  );
}

// ─── Expiry Timer ────────────────────────────────────────────────────────────
function ExpiryTimer() {
  const [secs, setSecs] = useState(600);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  const urgent = secs < 120;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-4 rounded-xl mb-4 text-sm font-semibold"
      style={{
        background: urgent ? 'rgba(239,68,68,0.10)' : 'rgba(249,115,22,0.08)',
        border: `1px solid ${urgent ? RED : ORANGE}30`,
      }}>
      <div className="flex items-center gap-2" style={{ color: urgent ? RED : ORANGE }}>
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: urgent ? RED : ORANGE }} />
        Seu diagnóstico expira em:
      </div>
      <span className="font-black text-white text-lg tabular-nums font-mono tracking-widest"
        style={{
          textShadow: `0 0 16px ${urgent ? RED : ORANGE}80`,
          color: urgent ? RED : 'white',
        }}>
        {m}:{s}
      </span>
    </div>
  );
}

// ─── Urgency Strip (vagas) ───────────────────────────────────────────────────
function UrgencyStrip() {
  const [count, setCount] = useState(7);
  useEffect(() => {
    const t = setInterval(() => setCount(c => (c > 3 ? c - 1 : 3)), 45000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold mb-6"
      style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${RED}25`, color: RED }}>
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: RED }} />
      Apenas <strong className="mx-1">{count} vagas</strong> restantes para acesso ao Tutor IA nesta sessão
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  subject: SubjectId;
  results: { rating: string; seconds: number }[];
  memoryHealth: number;
  radar?: Record<string, number>;
}

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
      if (raw) setData(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const health      = data?.memoryHealth ?? 62;
  const subjectId   = data?.subject ?? 'biologia';
  const subjectMeta = SUBJECT_META[subjectId];
  const hardCount   = data?.results.filter(r => r.rating === 'dificil').length ?? 3;

  const status      = health < 55 ? 'CRÍTICO' : health < 72 ? 'EM RISCO' : 'ATENÇÃO';
  const statusColor = health < 55 ? RED : health < 72 ? ORANGE : '#eab308';
  const statusBorder= health < 55 ? 'rgba(239,68,68,0.28)' : health < 72 ? 'rgba(249,115,22,0.28)' : 'rgba(234,179,8,0.28)';

  // Radar scores
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

        {/* ── App Mockup ── */}
        <AppMockup subjectMeta={subjectMeta} />

        {/* ── Urgency ── */}
        <ExpiryTimer />
        <UrgencyStrip />

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          {/* Flash — desemphasized */}
          <div className="relative rounded-2xl p-6 overflow-hidden opacity-70 hover:opacity-90 transition-opacity"
            style={{ ...cardStyle, border:'1px solid rgba(124,58,237,0.15)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:`linear-gradient(90deg,transparent,rgba(124,58,237,0.40),transparent)` }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
              style={{ background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.25)' }}>⚡</div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color:'#6d519e' }}>Plano Flash</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-slate-600 text-xs">12x de</span>
              <span className="text-4xl font-black text-slate-300 ml-1">R$&nbsp;21</span>
              <span className="text-2xl font-black text-slate-300">,90</span>
            </div>
            <p className="text-slate-700 text-xs mb-5">R$ 262,80/ano · sem juros</p>
            <div className="h-px mb-5" style={{ background:'rgba(255,255,255,0.05)' }} />
            <div className="flex flex-col gap-2 mb-6 text-sm text-slate-500">
              {['Flashcards ilimitados', 'Algoritmo SRS avançado', 'Dashboard & heatmap'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span style={{ color:'#6d519e' }}>✓</span> {f}
                </div>
              ))}
              {['Resumos & Tabelas', 'Áudio-Resumos', 'Tutor IA Especialista'].map(f => (
                <div key={f} className="flex items-center gap-2 opacity-30">
                  <span>🔒</span> <span className="line-through">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login"
              className="block w-full py-3 rounded-xl text-center text-sm font-bold transition-all hover:opacity-70"
              style={{ background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.25)',color:'#6d519e' }}>
              Começar com Flash
            </Link>
          </div>

          {/* ProAI+ — the obvious choice */}
          <div className="shimmer-card relative rounded-2xl p-6 overflow-hidden"
            style={{
              background:'rgba(8,4,18,0.95)',
              boxShadow:`0 0 0 1px rgba(124,58,237,0.55), 0 0 70px rgba(124,58,237,0.22), 0 0 140px rgba(6,182,212,0.10)`,
            }}>
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ padding:'1px', background:'linear-gradient(135deg,#7C3AED,#06b6d4,#ec4899)',
                WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',
                WebkitMaskComposite:'xor', maskComposite:'exclude' }} />
            {/* Ambient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:'radial-gradient(ellipse at top right,rgba(6,182,212,0.12) 0%,transparent 60%)' }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:'linear-gradient(90deg,#7C3AED,#06b6d4,#ec4899)' }} />

            {/* Badge */}
            <div className="absolute top-4 right-4 text-xs font-black px-2.5 py-1.5 rounded-full text-white"
              style={{ background:'linear-gradient(135deg,#7C3AED,#06b6d4)', boxShadow:'0 0 16px rgba(124,58,237,0.55)' }}>
              💎 Recomendado para {subjectMeta.area.split(' ').pop()}
            </div>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 relative"
              style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.30),rgba(6,182,212,0.22))',
                border:'1px solid rgba(6,182,212,0.40)', boxShadow:'0 0 20px rgba(6,182,212,0.25)' }}>
              🤖
            </div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1 relative"
              style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Plano ProAI+
            </p>
            <div className="flex items-baseline gap-1 mb-1 relative">
              <span className="text-slate-400 text-xs">12x de</span>
              <span className="text-4xl font-black text-white ml-1">R$&nbsp;29</span>
              <span className="text-2xl font-black text-white">,90</span>
            </div>
            <p className="text-slate-600 text-xs mb-5 relative">R$ 358,80/ano · sem juros</p>
            <div className="h-px mb-5 relative"
              style={{ background:'linear-gradient(90deg,rgba(124,58,237,0.45),rgba(6,182,212,0.45))' }} />

            <div className="flex flex-col gap-2 mb-6 text-sm relative">
              {[
                { t:'Tudo do Plano Flash',              c:'#67e8f9' },
                { t:'Resumos Storytelling por deck',     c:'#67e8f9' },
                { t:'Tabelas + Macetes & Mnemonics',     c:'#67e8f9' },
                { t:'Áudio-Resumos narrados por IA',     c:'#67e8f9' },
                { t:'Tutor IA Especialista 24h',         c:'#f472b6' },
                { t:'Flashcards via Foto/PDF',           c:'#f472b6' },
              ].map(({ t, c }) => (
                <div key={t} className="flex items-center gap-2">
                  <span style={{ color:c }}>✓</span>
                  <span className="text-slate-300">{t}</span>
                </div>
              ))}
            </div>

            <Link href="/login"
              className="relative block w-full py-4 rounded-xl text-center font-black text-white text-base transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background:'linear-gradient(135deg,#7C3AED 0%,#06b6d4 60%,#ec4899 100%)',
                boxShadow:'0 0 36px rgba(124,58,237,0.60),0 4px 20px rgba(0,0,0,0.50)',
              }}>
              Garantir minha Aprovação (12x sem juros)
            </Link>
          </div>
        </div>

        {/* ── Guarantee ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)',border:'1px solid rgba(34,197,94,0.18)' }}>
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <p className="text-white font-bold text-sm">Garantia de 7 dias</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Se não sentir melhora na sua retenção em 7 dias, devolvemos 100% do valor. Sem perguntas.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)',border:'1px solid rgba(124,58,237,0.18)' }}>
            <div className="text-3xl shrink-0">⚡</div>
            <div>
              <p className="text-white font-bold text-sm">Acesso em menos de 2 minutos</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Após a confirmação, seus flashcards e o Tutor IA já estarão disponíveis. Sem espera.
              </p>
            </div>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border:'1px solid rgba(255,255,255,0.06)',background:'rgba(10,5,20,0.60)' }}>
          <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurso</span>
            <span className="text-xs font-semibold text-center uppercase tracking-wider" style={{ color:'#6d519e' }}>Flash</span>
            <span className="text-xs font-semibold text-center uppercase tracking-widest"
              style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
              ProAI+
            </span>
          </div>
          {[
            ['Flashcards SRS ilimitados', true,  true ],
            ['Dashboard & heatmap',       true,  true ],
            ['Resumos Storytelling',       false, true ],
            ['Tabelas Comparativas',       false, true ],
            ['Áudio-Resumos IA',           false, true ],
            ['Tutor IA Especialista',      false, true ],
            ['Flashcards por Foto/PDF',    false, true ],
          ].map(([feat, flash, pro], i) => (
            <div key={feat as string} className="grid grid-cols-3 px-5 py-3 text-sm"
              style={{ borderTop:'1px solid rgba(255,255,255,0.04)',background:i%2===0?'rgba(255,255,255,0.012)':'transparent' }}>
              <span className="text-slate-400">{feat as string}</span>
              <span className="text-center font-semibold" style={{ color:flash?'#6d519e':'#1e1b4b' }}>{flash?'✓':'—'}</span>
              <span className="text-center font-semibold" style={{ color:pro?'#67e8f9':'#334155' }}>{pro?'✓':'—'}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-700 text-xs pb-8">
          🔒 Pagamento 100% seguro · 📅 Cancele quando quiser · ⚡ Acesso imediato
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
