'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan } from '@/lib/plan';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryShort, ENEM_AREAS } from '@/lib/categories';
import { getSubjectIcon } from '@/lib/iconMap';
import {
  getFlashTutor,
  getSpecialistForArea,
  type TutorConfig,
} from '@/lib/tutor-config';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';

// ─── Colors ───────────────────────────────────────────────────────────────────

const NEON_GREEN  = '#00ff80';
const NEON_PURPLE = '#a855f7';
const NEON_CYAN   = '#22d3ee';
const RED_ALERT   = '#ef4444';

// ─── Heatmap ──────────────────────────────────────────────────────────────────

type HeatDay = { date: string; dayOfWeek: number; weekIndex: number };

function buildHeatmapGrid(): HeatDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 13 * 7);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
  const todayISO = today.toISOString().split('T')[0];
  const days: HeatDay[] = [];
  const cur = new Date(start);
  let week = 0;
  while (cur <= today) {
    const iso = cur.toISOString().split('T')[0];
    if (iso <= todayISO) days.push({ date: iso, dayOfWeek: cur.getDay(), weekIndex: week });
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() === 0) week++;
  }
  return days;
}

function heatColor(count: number): { bg: string; glow: string } {
  if (count === 0)  return { bg: 'rgba(255,255,255,0.05)', glow: 'none' };
  if (count <= 5)   return { bg: 'rgba(0,255,128,0.22)',   glow: 'none' };
  if (count <= 20)  return { bg: 'rgba(0,255,128,0.48)',   glow: 'none' };
  if (count <= 50)  return { bg: 'rgba(0,255,128,0.74)',   glow: '0 0 4px rgba(0,255,128,0.5)' };
  return              { bg: '#00ff80',                     glow: '0 0 8px rgba(0,255,128,0.8)' };
}

const WEEK_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Heatmap({ dailyCounts }: { dailyCounts: Map<string, number> }) {
  const grid     = useMemo(buildHeatmapGrid, []);
  const todayISO = new Date().toISOString().split('T')[0];
  const numWeeks = (grid[grid.length - 1]?.weekIndex ?? 0) + 1;
  const CELL = 12, GAP = 3;

  return (
    <div className="overflow-x-auto pb-1 -mx-1">
      <div style={{ minWidth: numWeeks * (CELL + GAP) + 36, paddingLeft: '4px' }}>
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, marginRight: '4px' }}>
            {WEEK_LABELS.map((l, i) => (
              <div key={i} style={{ width: '14px', height: `${CELL}px`, display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', fontSize: '7px', color: 'rgba(255,255,255,0.22)' }}>
                {i % 2 === 0 ? l : ''}
              </div>
            ))}
          </div>
          {Array.from({ length: numWeeks }, (_, wi) => {
            const weekDays = grid.filter(d => d.weekIndex === wi);
            return (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {Array.from({ length: 7 }, (_, dow) => {
                  const day = weekDays.find(d => d.dayOfWeek === dow);
                  if (!day) return <div key={dow} style={{ width: CELL, height: CELL }} />;
                  const count = dailyCounts.get(day.date) ?? 0;
                  const { bg, glow } = heatColor(count);
                  return (
                    <div key={dow}
                      title={`${day.date}: ${count} revisão${count !== 1 ? 'ões' : ''}`}
                      style={{ width: CELL, height: CELL, borderRadius: '3px', background: bg,
                        boxShadow: day.date === todayISO ? `0 0 0 1.5px ${NEON_GREEN}` : glow,
                        transition: 'background 0.2s' }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2.5" style={{ paddingLeft: '18px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)' }}>Menos</span>
          {[0, 5, 20, 50, 100].map((n, i) => (
            <div key={i} style={{ width: CELL, height: CELL, borderRadius: '3px', background: heatColor(n).bg }} />
          ))}
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)' }}>Mais</span>
        </div>
      </div>
    </div>
  );
}

// ─── Donut progress ring ──────────────────────────────────────────────────────

function DonutDomain({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 150); return () => clearTimeout(t); }, [pct]);
  const offset = circ - (anim / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <defs>
        <linearGradient id="dm-grad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={NEON_GREEN} />
          <stop offset="100%" stopColor={NEON_CYAN}  />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#dm-grad2)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 5px ${NEON_GREEN}66)` }}
      />
      <text x="50" y="45" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Inter,system-ui">{anim}%</text>
      <text x="50" y="57" textAnchor="middle" fill="#475569" fontSize="5.8" letterSpacing="0.8" fontFamily="Inter,system-ui">DO EDITAL</text>
      <text x="50" y="65" textAnchor="middle" fill="#475569" fontSize="5.8" letterSpacing="0.8" fontFamily="Inter,system-ui">DOMINADO</text>
    </svg>
  );
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function calcStreak(dailyCounts: Map<string, number>): number {
  let s = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    if ((dailyCounts.get(iso) ?? 0) > 0) s++;
    else break;
  }
  return s;
}

function calcMaxStreak(dailyCounts: Map<string, number>): number {
  const dates = [...dailyCounts.entries()].filter(([, c]) => c > 0).map(([d]) => d).sort();
  if (!dates.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i] + 'T12:00:00').getTime() - new Date(dates[i - 1] + 'T12:00:00').getTime()) / 86400000
    );
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return Math.max(max, cur);
}

// ─── Snippet types + generator ────────────────────────────────────────────────

type SnippetType = 'good' | 'bad' | 'neutral';

type Snippet = {
  emoji: string;
  label: string;
  type:  SnippetType;
};

function generateSnippets(p: {
  areaScores:   Map<string, number>;
  streak:       number;
  maturePct:    number;
  totalDue:     number;
  totalReviews: number;
  topLapseDeck: { lapses: number } | null;
}): Snippet[] {
  const { areaScores, streak, maturePct, totalDue, totalReviews, topLapseDeck } = p;
  const all: Snippet[] = [];

  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < 25) {
      all.push({ emoji: '⚠️', label: `Crise em ${area.short}`, type: 'bad' });
    } else if (score >= 65) {
      all.push({ emoji: '✅', label: `Domínio em ${area.short}`, type: 'good' });
    }
  }

  if (streak >= 7)       all.push({ emoji: '🔥', label: `${streak} dias consecutivos`, type: 'good' });
  else if (streak >= 2)  all.push({ emoji: '⚡', label: `Sequência de ${streak} dias`,  type: 'neutral' });
  else if (streak === 0 && totalReviews > 0)
                         all.push({ emoji: '💤', label: 'Sequência quebrada',           type: 'bad' });

  if (totalDue > 100)                          all.push({ emoji: '🚨', label: `${totalDue} cards acumulados`, type: 'bad' });
  else if (totalDue === 0 && totalReviews > 0) all.push({ emoji: '🛡️', label: 'Fila limpa hoje',             type: 'good' });

  if      (maturePct >= 40)                        all.push({ emoji: '🧠', label: `${maturePct}% do edital sólido`,    type: 'good' });
  else if (maturePct === 0 && totalReviews > 0)    all.push({ emoji: '🟡', label: 'Memória ainda fragmentada',         type: 'bad' });

  if (topLapseDeck && topLapseDeck.lapses >= 5)    all.push({ emoji: '⚡', label: 'Lapsos críticos detectados',        type: 'bad' });

  if (all.length === 0) return [{ emoji: '🚀', label: 'Comece a revisar para ver dados', type: 'neutral' }];

  const bad     = all.filter(s => s.type === 'bad');
  const neutral = all.filter(s => s.type === 'neutral');
  const good    = all.filter(s => s.type === 'good');
  return [...bad, ...neutral, ...good].slice(0, 3);
}

// ─── Intelligence Report types + generator ───────────────────────────────────

type ReportItem = {
  emoji:  string;
  text:   string;
  badge:  string;
};

type IntelReport = {
  strengths:  ReportItem[];
  weaknesses: ReportItem[];
  attackPlan: ReportItem[];
};

function generateReport(p: {
  areaScores:   Map<string, number>;
  streak:       number;
  maxStreak:    number;
  maturePct:    number;
  totalDue:     number;
  totalReviews: number;
  topDecks:     { deckId: string; deckTitle: string; dueCount: number }[];
  topLapseDeck: { deckId: string; deckTitle: string; lapses: number } | null;
}): IntelReport {
  const { areaScores, streak, maturePct, totalDue, totalReviews, topDecks, topLapseDeck } = p;

  const strengths:  ReportItem[] = [];
  const weaknesses: ReportItem[] = [];
  const attackPlan: ReportItem[] = [];

  // ── Fortalezas ────────────────────────────────────────────────────────────
  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score >= 60) {
      strengths.push({
        emoji: area.icon,
        text:  `${area.short} com ${score}% de domínio. Acima da média — continue revisando para blindar essa frente.`,
        badge: `${score}%`,
      });
    }
  }
  if (streak >= 5) {
    strengths.push({
      emoji: '🔥',
      text:  `${streak} dias consecutivos de estudo. Você está entre os 10% mais disciplinados.`,
      badge: `${streak} dias`,
    });
  }
  if (maturePct >= 30) {
    strengths.push({
      emoji: '🧠',
      text:  `${maturePct}% dos cards com intervalo maduro (>21 dias). Memória de longo prazo ativa.`,
      badge: `${maturePct}%`,
    });
  }
  if (totalDue === 0 && totalReviews > 0) {
    strengths.push({ emoji: '🛡️', text: 'Fila limpa: todos os cards estão revisados e em dia.', badge: '100%' });
  }
  if (strengths.length === 0) {
    strengths.push({ emoji: '🔍', text: 'Nenhuma fortaleza consolidada ainda. Você está na fase de construção de base.', badge: 'Em progresso' });
  }

  // ── Fraquezas ─────────────────────────────────────────────────────────────
  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < 25) {
      const spec = getSpecialistForArea(area.short);
      weaknesses.push({
        emoji: '⚠️',
        text:  `${area.short}: apenas ${score}% de domínio.${spec ? ` Especialista indicado: ${spec.name}.` : ' Prioridade imediata.'}`,
        badge: `${score}%`,
      });
    }
  }
  if (streak === 0 && totalReviews > 0) {
    weaknesses.push({
      emoji: '💤',
      text:  'Sequência quebrada. Cada dia sem revisão acelera o esquecimento e reduz a eficiência do algoritmo.',
      badge: 'Crítico',
    });
  }
  if (topLapseDeck && topLapseDeck.lapses >= 3) {
    weaknesses.push({
      emoji: '🔁',
      text:  `"${topLapseDeck.deckTitle}" acumulou ${topLapseDeck.lapses} lapsos — conteúdo com alta resistência ao SRS.`,
      badge: `${topLapseDeck.lapses} lapsos`,
    });
  }
  if (totalDue > 50) {
    weaknesses.push({
      emoji: '🚨',
      text:  `${totalDue} cards acumulados. O atraso cria efeito bola de neve: cada dia sem revisar aumenta o débito.`,
      badge: `${totalDue} cards`,
    });
  }
  if (maturePct === 0 && totalReviews > 0) {
    weaknesses.push({
      emoji: '🔴',
      text:  'Nenhum card com intervalo maduro ainda. Mais consistência é necessária para ativar a memória de longo prazo.',
      badge: '0%',
    });
  }
  if (weaknesses.length === 0 && totalReviews === 0) {
    weaknesses.push({ emoji: '🔍', text: 'Sem dados suficientes. Comece a revisar para gerar sua análise completa.', badge: 'Sem dados' });
  } else if (weaknesses.length === 0) {
    weaknesses.push({ emoji: '✅', text: 'Nenhuma fraqueza crítica detectada. Mantenha o ritmo atual.', badge: 'Saudável' });
  }

  // ── Plano de Ataque ───────────────────────────────────────────────────────
  if (topDecks.length > 0) {
    attackPlan.push({
      emoji: '⚔️',
      text:  `Ataque imediato: estude "${topDecks[0].deckTitle}" hoje — ${topDecks[0].dueCount} cards esperando.`,
      badge: 'Prioridade 1',
    });
  }
  let weakestArea: string | null = null, weakestScore = 101;
  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < weakestScore) { weakestArea = area.short; weakestScore = score; }
  }
  if (weakestArea) {
    const spec = getSpecialistForArea(weakestArea);
    attackPlan.push({
      emoji: '🎯',
      text:  spec
        ? `Consulte ${spec.name} para atacar ${weakestArea} antes do próximo simulado.`
        : `Concentre sessões em ${weakestArea} — é onde você perde mais pontos agora.`,
      badge: weakestArea,
    });
  }
  if (topLapseDeck && topLapseDeck.lapses >= 3) {
    attackPlan.push({
      emoji: '🔁',
      text:  `Revise "${topLapseDeck.deckTitle}" no pré-estudo para atacar os ${topLapseDeck.lapses} lapsos acumulados.`,
      badge: 'Reforço',
    });
  }
  if (streak < 3) {
    attackPlan.push({
      emoji: '📅',
      text:  'Meta imediata: 7 dias consecutivos de revisão. Isso coloca o algoritmo SRS no modo ótimo.',
      badge: 'Meta 7 dias',
    });
  }
  if (attackPlan.length === 0) {
    attackPlan.push({ emoji: '🚀', text: 'Continue revisando diariamente. O algoritmo SRS está trabalhando — confie no processo.', badge: 'Em dia' });
  }

  return { strengths, weaknesses, attackPlan };
}

// ─── Intelligence Report Modal ────────────────────────────────────────────────

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 rounded-full" style={{ background: color }} />
      <span className="text-xs font-bold tracking-wider uppercase" style={{ color }}>{children}</span>
    </div>
  );
}

function ReportCard({ item, badgeColor }: { item: ReportItem; badgeColor: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="shrink-0 text-base mt-0.5">{item.emoji}</span>
      <p className="flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
        {item.text}
      </p>
      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: badgeColor + '22', color: badgeColor, border: `1px solid ${badgeColor}44` }}>
        {item.badge}
      </span>
    </div>
  );
}

function IntelReportModal({
  report,
  isPro,
  flashTutorAvatar,
  onClose,
  onUpgrade,
}: {
  report:            IntelReport;
  isPro:             boolean;
  flashTutorAvatar:  string;
  onClose:           () => void;
  onUpgrade:         () => void;
}) {
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: '90vh',
          background: 'linear-gradient(160deg, #0d0a1e 0%, #0f0c22 60%, #090614 100%)',
          border:     '1px solid rgba(168,85,247,0.30)',
          boxShadow:  '0 0 0 1px rgba(168,85,247,0.15), 0 0 80px rgba(168,85,247,0.18), 0 0 160px rgba(34,211,238,0.08)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #a855f7, #22d3ee, transparent)' }} />

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.10) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom left, rgba(34,211,238,0.06) 0%, transparent 55%)' }} />

        {/* ── Modal Header ── */}
        <div className="relative flex items-center gap-4 px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="rounded-full overflow-hidden shrink-0"
            style={{ width: 44, height: 44, border: `2px solid ${NEON_PURPLE}88`,
              boxShadow: `0 0 16px ${NEON_PURPLE}44` }}>
            <Image src={flashTutorAvatar} alt="FlashTutor" width={44} height={44} unoptimized />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">FlashTutor</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${NEON_PURPLE}22`, color: NEON_PURPLE, border: `1px solid ${NEON_PURPLE}44` }}>
                ⚡ Estrategista
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Relatório de Inteligência · {dateStr}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-white text-slate-500"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        {isPro ? (
          <div className="relative overflow-y-auto flex flex-col gap-5 p-6">
            {/* Fortalezas */}
            <section>
              <SectionLabel color={NEON_GREEN}>Fortalezas</SectionLabel>
              <div className="flex flex-col gap-2">
                {report.strengths.map((item, i) => (
                  <ReportCard key={i} item={item} badgeColor={NEON_GREEN} />
                ))}
              </div>
            </section>

            {/* Fraquezas */}
            <section>
              <SectionLabel color={RED_ALERT}>Fraquezas</SectionLabel>
              <div className="flex flex-col gap-2">
                {report.weaknesses.map((item, i) => (
                  <ReportCard key={i} item={item} badgeColor={RED_ALERT} />
                ))}
              </div>
            </section>

            {/* Plano de Ataque */}
            <section>
              <SectionLabel color={NEON_CYAN}>Plano de Ataque Imediato</SectionLabel>
              <div className="flex flex-col gap-2">
                {report.attackPlan.map((item, i) => (
                  <ReportCard key={i} item={item} badgeColor={NEON_CYAN} />
                ))}
              </div>
            </section>

            <p className="text-center text-xs pb-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Análise gerada pelo FlashTutor com base nos seus dados de revisão SRS.
            </p>
          </div>
        ) : (
          /* ── Flash lock screen ── */
          <div className="relative p-6 flex flex-col items-center gap-5">
            {/* Blurred preview of sections */}
            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
              className="w-full flex flex-col gap-4">
              <div>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: NEON_GREEN }}>Fortalezas</div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl mb-2"
                    style={{ background: 'rgba(0,255,128,0.08)', border: '1px solid rgba(0,255,128,0.15)' }} />
                ))}
              </div>
              <div>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: RED_ALERT }}>Fraquezas</div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl mb-2"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }} />
                ))}
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-x-6 top-1/4 flex flex-col items-center gap-4 text-center p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(160deg, rgba(13,10,30,0.96) 0%, rgba(15,12,34,0.98) 100%)',
                border:     `1px solid ${NEON_PURPLE}44`,
                boxShadow:  `0 0 40px rgba(0,0,0,0.80), 0 0 24px ${NEON_PURPLE}22`,
              }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${NEON_PURPLE}20`, border: `1px solid ${NEON_PURPLE}40` }}>
                🔒
              </div>
              <div>
                <p className="text-base font-black text-white leading-snug mb-2">
                  Relatório de Inteligência Detalhado
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Este recurso é exclusivo para assinantes{' '}
                  <span className="font-bold" style={{ color: NEON_PURPLE }}>AiPro+</span>.
                  Quer saber exatamente onde você está perdendo pontos?
                </p>
              </div>
              <button onClick={onUpgrade}
                className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${NEON_PURPLE} 0%, ${NEON_CYAN}99 100%)`,
                  boxShadow:  `0 0 28px ${NEON_PURPLE}55`,
                }}>
                🚀 Assinar AiPro+ e Ver Relatório
              </button>
              <button onClick={onClose}
                className="text-xs transition-colors hover:text-slate-400"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1].map(i => (
        <div key={i} className="rounded-2xl animate-pulse"
          style={{ height: '340px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
      ))}
    </div>
  );
}

// ─── Data types ───────────────────────────────────────────────────────────────

type DeckPriority = {
  deckId:       string;
  deckTitle:    string;
  subjectTitle: string;
  icon:         string;
  dueCount:     number;
};

type TopLapseDeck = {
  deckId:          string;
  deckTitle:       string;
  subjectCategory: string | null;
  lapses:          number;
};

type Metrics = {
  totalDue:     number;
  topDecks:     DeckPriority[];
  maturePct:    number;
  dailyCounts:  Map<string, number>;
  streak:       number;
  maxStreak:    number;
  plan:         Plan;
  areaScores:   Map<string, number>;
  topLapseDeck: TopLapseDeck | null;
  totalReviews: number;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerformanceMetrics() {
  const [metrics,     setMetrics]     = useState<Metrics | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showReport,  setShowReport]  = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];

      const [planInfo, { data: allCards }, { data: progressRows }, { count: totalCards }] = await Promise.all([
        fetchUserPlan(user.id, user.email ?? undefined),
        supabase.from('cards').select('id, decks(id, title, subjects(id, title, icon_url, category))'),
        supabase.from('user_progress').select('card_id, interval_days, next_review, lapses, history').eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
      ]);

      const rows  = progressRows ?? [];
      const total = totalCards ?? 0;

      // ── Normalize cards ───────────────────────────────────────────────────
      type NormCard = {
        id:              string;
        deckId:          string;
        deckTitle:       string;
        subjectId:       string;
        subjectTitle:    string;
        subjectIconUrl:  string | null;
        subjectCategory: string | null;
      };

      const normCards: NormCard[] = [];
      for (const rawCard of (allCards ?? []) as Array<{ id: string; decks: unknown }>) {
        const rd = Array.isArray(rawCard.decks) ? (rawCard.decks[0] ?? null) : rawCard.decks as { id: string; title: string; subjects: unknown } | null;
        if (!rd) continue;
        const d  = rd as { id: string; title: string; subjects: unknown };
        const rs = Array.isArray(d.subjects) ? (d.subjects[0] ?? null) : d.subjects as { id: string; title: string; icon_url: string | null; category: string | null } | null;
        if (!rs) continue;
        const s  = rs as { id: string; title: string; icon_url: string | null; category: string | null };
        normCards.push({ id: rawCard.id, deckId: d.id, deckTitle: d.title, subjectId: s.id, subjectTitle: s.title, subjectIconUrl: s.icon_url, subjectCategory: s.category });
      }

      const progMap = new Map(rows.map(r => [r.card_id, r]));

      // ── Due cards per deck ────────────────────────────────────────────────
      const deckDueMap = new Map<string, { dueCount: number; deckTitle: string; subjectTitle: string; icon: string }>();
      for (const c of normCards) {
        const prog  = progMap.get(c.id);
        const isDue = !prog || (prog.next_review !== null && prog.next_review <= today);
        if (!isDue) continue;
        const ex = deckDueMap.get(c.deckId);
        if (ex) { ex.dueCount++; }
        else {
          deckDueMap.set(c.deckId, {
            dueCount:     1,
            deckTitle:    c.deckTitle,
            subjectTitle: c.subjectTitle,
            icon:         getSubjectIcon(c.subjectTitle, c.subjectIconUrl, c.subjectCategory),
          });
        }
      }

      const topDecks: DeckPriority[] = Array.from(deckDueMap.entries())
        .map(([deckId, v]) => ({ deckId, ...v }))
        .sort((a, b) => b.dueCount - a.dueCount)
        .slice(0, 3);
      const totalDue  = Array.from(deckDueMap.values()).reduce((s, v) => s + v.dueCount, 0);
      const maturePct = total > 0 ? Math.round((rows.filter(r => (r.interval_days ?? 0) > 21).length / total) * 100) : 0;

      // ── Heatmap + streak ──────────────────────────────────────────────────
      const dailyCounts = new Map<string, number>();
      let totalReviews  = 0;
      for (const row of rows) {
        for (const entry of (row.history as Array<{ reviewed_at: string }> | null) ?? []) {
          const day = entry.reviewed_at?.slice(0, 10);
          if (day) { dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1); totalReviews++; }
        }
      }
      const streak    = calcStreak(dailyCounts);
      const maxStreak = calcMaxStreak(dailyCounts);

      // ── Area scores ───────────────────────────────────────────────────────
      const domainMap = buildDomainMap(
        normCards.map(c => ({ id: c.id, decks: { subject_id: c.subjectId } })),
        rows.map(r => ({ card_id: r.card_id, interval_days: r.interval_days ?? 0 })),
      );
      const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.subjectCategory)]));
      const shortScore  = new Map<string, { sum: number; count: number }>();
      for (const [sid, domain] of domainMap.entries()) {
        const area = subjAreaMap.get(sid); if (!area) continue;
        const s    = shortScore.get(area) ?? { sum: 0, count: 0 };
        s.sum += domain.level; s.count++;
        shortScore.set(area, s);
      }
      const areaScores = new Map<string, number>(
        Array.from(shortScore.entries()).map(([a, s]) => [a, s.count > 0 ? Math.round((s.sum / s.count / 5) * 100) : 0]),
      );

      // ── Top lapse deck ────────────────────────────────────────────────────
      const lapsesMap    = new Map(rows.map(r => [r.card_id, r.lapses as number]));
      const deckLapseMap = new Map<string, { deckTitle: string; subjectCategory: string | null; lapses: number }>();
      for (const c of normCards) {
        const lapses = lapsesMap.get(c.id); if (!lapses) continue;
        const ex = deckLapseMap.get(c.deckId);
        if (ex) { ex.lapses += lapses; }
        else deckLapseMap.set(c.deckId, { deckTitle: c.deckTitle, subjectCategory: c.subjectCategory, lapses });
      }
      let topLapseDeck: TopLapseDeck | null = null;
      for (const [deckId, agg] of deckLapseMap.entries()) {
        if (!topLapseDeck || agg.lapses > topLapseDeck.lapses) topLapseDeck = { deckId, ...agg };
      }

      setMetrics({
        totalDue, topDecks, maturePct, dailyCounts, streak, maxStreak,
        plan: planInfo.plan, areaScores, topLapseDeck, totalReviews,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (!metrics) return null;

  const flashTutor = getFlashTutor();
  const isPro      = metrics.plan === 'proai_plus';
  const topDeckId  = metrics.topDecks[0]?.deckId ?? null;

  const snippets = generateSnippets({
    areaScores:   metrics.areaScores,
    streak:       metrics.streak,
    maturePct:    metrics.maturePct,
    totalDue:     metrics.totalDue,
    totalReviews: metrics.totalReviews,
    topLapseDeck: metrics.topLapseDeck,
  });

  const report = generateReport({
    areaScores:   metrics.areaScores,
    streak:       metrics.streak,
    maxStreak:    metrics.maxStreak,
    maturePct:    metrics.maturePct,
    totalDue:     metrics.totalDue,
    totalReviews: metrics.totalReviews,
    topDecks:     metrics.topDecks,
    topLapseDeck: metrics.topLapseDeck,
  });

  function handleReportClick() {
    setShowReport(true);
  }

  function handleUpgrade() {
    setShowReport(false);
    setShowUpgrade(true);
  }

  const snippetColors: Record<SnippetType, { bg: string; border: string; text: string }> = {
    good:    { bg: 'rgba(0,255,128,0.10)',   border: 'rgba(0,255,128,0.30)',    text: NEON_GREEN  },
    bad:     { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.35)',    text: RED_ALERT   },
    neutral: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.50)' },
  };

  return (
    <>
      {showUpgrade && <AiProUpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showReport  && (
        <IntelReportModal
          report={report}
          isPro={isPro}
          flashTutorAvatar={flashTutor.avatar_url}
          onClose={() => setShowReport(false)}
          onUpgrade={handleUpgrade}
        />
      )}

      <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ╔══════════════════════════════════════════════╗ */}
        {/* ║  CARD 3 — CENTRAL DE COMBATE ⚡             ║ */}
        {/* ╚══════════════════════════════════════════════╝ */}
        <div className="relative rounded-2xl p-6 flex flex-col gap-5 overflow-hidden"
          style={{
            background:       'rgba(255,255,255,0.035)',
            backdropFilter:   'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:           '1px solid rgba(0,255,128,0.18)',
            boxShadow:        '0 0 50px rgba(0,255,128,0.05)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(0,255,128,0.07) 0%, transparent 65%)' }} />
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.45), rgba(34,211,238,0.20), transparent)' }} />

          <p className="text-xs font-semibold tracking-widest uppercase relative z-10" style={{ color: NEON_GREEN }}>
            Central de Combate ⚡
          </p>

          {/* ── Hero CTA Button ── */}
          {topDeckId ? (
            <Link href={`/study/${topDeckId}`}
              className="relative flex items-center justify-between rounded-xl px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] z-10"
              style={{
                background:     'linear-gradient(135deg, rgba(0,255,128,0.20) 0%, rgba(34,211,238,0.14) 100%)',
                border:         '1px solid rgba(0,255,128,0.42)',
                boxShadow:      '0 0 24px rgba(0,255,128,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                textDecoration: 'none',
              }}>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase mb-0.5" style={{ color: NEON_GREEN }}>
                  🗡 Retomar Revisão Prioritária
                </p>
                <p className="text-2xl font-black tabular-nums leading-none text-white"
                  style={{ textShadow: `0 0 20px ${NEON_GREEN}66` }}>
                  {metrics.totalDue}
                  <span className="text-sm font-semibold ml-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>cards</span>
                </p>
              </div>
              <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${NEON_GREEN}88)` }}>⚔️</span>
            </Link>
          ) : (
            <div className="relative flex items-center gap-3 rounded-xl px-5 py-4 z-10"
              style={{ background: 'rgba(0,255,128,0.06)', border: '1px solid rgba(0,255,128,0.15)' }}>
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-sm font-bold text-white">Fila limpa!</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Nenhum card pendente agora.</p>
              </div>
            </div>
          )}

          {/* ── Streak badge + Heatmap ── */}
          <div className="relative z-10 flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '16px' }}>{metrics.streak >= 7 ? '🔥' : '⚡'}</span>
                <span className="text-sm font-bold text-white">{metrics.streak}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  dia{metrics.streak !== 1 ? 's' : ''}
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Sequência Atual</span>
              </div>
              <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '14px' }}>🏆</span>
                <span className="text-sm font-bold text-white">{metrics.maxStreak}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Recorde</span>
              </div>
            </div>
            <Heatmap dailyCounts={metrics.dailyCounts} />
          </div>

          {/* ── Bottom row: top deck icons + donut ring ── */}
          <div className="relative z-10 flex items-center justify-between pt-1 mt-auto"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              {metrics.topDecks.map((deck) => (
                <Link key={deck.deckId} href={`/study/${deck.deckId}`}
                  title={`${deck.subjectTitle} · ${deck.deckTitle} (${deck.dueCount})`}
                  className="flex flex-col items-center gap-1 transition-all duration-150 hover:scale-110 active:scale-95"
                  style={{ textDecoration: 'none' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    {deck.icon}
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: NEON_GREEN }}>{deck.dueCount}</span>
                </Link>
              ))}
              {metrics.topDecks.length === 0 && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Sem decks pendentes</span>
              )}
            </div>
            <DonutDomain pct={metrics.maturePct} size={80} />
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════╗ */}
        {/* ║  CARD 4 — O PANTEÃO 🏛️                     ║ */}
        {/* ╚══════════════════════════════════════════════╝ */}
        <div className="relative rounded-2xl p-6 flex flex-col gap-5 overflow-hidden"
          style={{
            background:       'rgba(255,255,255,0.035)',
            backdropFilter:   'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:           '1px solid rgba(168,85,247,0.22)',
            boxShadow:        '0 0 50px rgba(168,85,247,0.07)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.10) 0%, transparent 65%)' }} />
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.50), rgba(34,211,238,0.20), transparent)' }} />

          <p className="text-xs font-semibold tracking-widest uppercase relative z-10" style={{ color: NEON_PURPLE }}>
            O Panteão 🏛️
          </p>

          {/* ── FlashTutor identity ── */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="rounded-full overflow-hidden shrink-0"
              style={{
                width: 40, height: 40,
                border: `2px solid ${isPro ? NEON_PURPLE + 'AA' : NEON_PURPLE + '44'}`,
                boxShadow: isPro ? `0 0 16px ${NEON_PURPLE}44` : 'none',
              }}>
              <Image src={flashTutor.avatar_url} alt="FlashTutor" width={40} height={40} unoptimized />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white leading-tight">FlashTutor</p>
              <p className="text-xs leading-tight"
                style={{ color: isPro ? NEON_PURPLE : 'rgba(255,255,255,0.28)', letterSpacing: '0.05em' }}>
                {isPro ? '⚡ ESTRATEGISTA GERAL' : '🔒 AIPRO+ EXCLUSIVO'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-2 h-2 rounded-full" style={{
                background: isPro ? NEON_GREEN : 'rgba(255,255,255,0.15)',
                boxShadow:  isPro ? `0 0 6px ${NEON_GREEN}` : 'none',
              }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {isPro ? 'online' : 'bloqueado'}
              </span>
            </div>
          </div>

          {/* ── 3 Snippets ── */}
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Diagnóstico rápido
            </p>
            <div className="flex flex-wrap gap-2">
              {snippets.map((s, i) => {
                const c = snippetColors[s.type];
                return (
                  <div key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Descriptive line ── */}
          <div className="relative z-10 flex-1 rounded-xl p-4"
            style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: NEON_PURPLE }}>
              📊 Relatório de Inteligência
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {isPro
                ? 'Análise completa de fortalezas, fraquezas e plano de ataque gerada com seus dados de revisão SRS.'
                : 'Seu diagnóstico detalhado está pronto. Fortalezas, fraquezas e o plano de ataque exato para sua aprovação.'}
            </p>
          </div>

          {/* ── CTA button ── */}
          <button
            onClick={handleReportClick}
            className="relative w-full py-3.5 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] z-10 overflow-hidden"
            style={{
              background: isPro
                ? `linear-gradient(135deg, ${NEON_PURPLE} 0%, ${NEON_CYAN}CC 100%)`
                : `linear-gradient(135deg, ${NEON_PURPLE}99 0%, ${NEON_CYAN}66 100%)`,
              boxShadow: `0 0 28px ${NEON_PURPLE}${isPro ? '55' : '33'}`,
            }}
          >
            {/* Shimmer */}
            <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              <span className="absolute inset-0"
                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }} />
            </span>
            {isPro ? '📊 Gerar Relatório de Inteligência Completo' : '🔒 Ver Relatório de Inteligência'}
          </button>
        </div>

      </div>
    </>
  );
}
