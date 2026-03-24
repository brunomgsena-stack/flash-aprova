'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan } from '@/lib/plan';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryShort, ENEM_AREAS } from '@/lib/categories';
import { getSubjectIcon } from '@/lib/iconMap';
import {
  getFlashTutor,
  getSpecialistForArea,
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
                    <div key={dow} title={`${day.date}: ${count} revisão${count !== 1 ? 'ões' : ''}`}
                      style={{ width: CELL, height: CELL, borderRadius: '3px', background: bg,
                        boxShadow: day.date === todayISO ? `0 0 0 1.5px ${NEON_GREEN}` : glow,
                        transition: 'background 0.2s' }} />
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

// ─── Arsenal Status (two horizontal progress bars) ───────────────────────────

function ProgressBar({ label, description, pct, gradFrom, gradTo, glowColor, delay = 0 }: {
  label:       string;
  description: string;
  pct:         number;
  gradFrom:    string;
  gradTo:      string;
  glowColor:   string;
  delay?:      number;
}) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 200 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label + percentage */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold tracking-widest uppercase"
          style={{ color: glowColor, fontFamily: 'ui-monospace, monospace', fontSize: '10px' }}>
          {label}
        </span>
        <span className="font-black tabular-nums"
          style={{ color: glowColor, fontFamily: 'ui-monospace, monospace', fontSize: '13px',
            textShadow: `0 0 10px ${glowColor}88` }}>
          {anim}<span className="text-xs font-semibold opacity-70">%</span>
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        {/* Scanline texture on track */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 7px)' }} />
        {/* Fill */}
        <div className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width:      `${anim}%`,
            background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})`,
            boxShadow:  `0 0 8px ${glowColor}88, 0 0 2px ${glowColor}`,
            transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }} />
        {/* Leading edge pulse */}
        {anim > 1 && (
          <div className="absolute top-0 bottom-0 w-px rounded-full"
            style={{
              left:       `${anim}%`,
              background: gradTo,
              boxShadow:  `0 0 6px 2px ${glowColor}`,
              transition: `left 1.2s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
            }} />
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'ui-monospace, monospace' }}>
        {description}
      </p>
    </div>
  );
}

function ArsenalStatus({ maturePct, reviewedPct }: { maturePct: number; reviewedPct: number }) {
  return (
    <div className="flex flex-col gap-4 pt-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <ProgressBar
        label="DOMÍNIO DO EDITAL"
        description="% de cards maduros · Memória de longo prazo"
        pct={maturePct}
        gradFrom={NEON_GREEN}
        gradTo={NEON_CYAN}
        glowColor={NEON_GREEN}
        delay={0}
      />
      <ProgressBar
        label="ALCANCE DA REVISÃO"
        description="% do banco de dados total já processado"
        pct={reviewedPct}
        gradFrom={NEON_PURPLE}
        gradTo={NEON_CYAN}
        glowColor={NEON_PURPLE}
        delay={180}
      />
    </div>
  );
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function calcStreak(dailyCounts: Map<string, number>): number {
  let s = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
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

// ─── Intelligence Report types + generator ───────────────────────────────────

type ReportItem = { emoji: string; text: string; badge: string };
type IntelReport = { strengths: ReportItem[]; weaknesses: ReportItem[]; attackPlan: ReportItem[] };

function generateReport(p: {
  areaScores:   Map<string, number>;
  streak:       number;
  maturePct:    number;
  totalDue:     number;
  totalReviews: number;
  topDecks:     { deckId: string; deckTitle: string; dueCount: number }[];
  topLapseDeck: { deckId: string; deckTitle: string; lapses: number } | null;
}): IntelReport {
  const { areaScores, streak, maturePct, totalDue, totalReviews, topDecks, topLapseDeck } = p;
  const strengths: ReportItem[] = [], weaknesses: ReportItem[] = [], attackPlan: ReportItem[] = [];

  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score >= 60) strengths.push({ emoji: area.icon, text: `${area.short} com ${score}% de domínio. Continue revisando para blindar essa frente.`, badge: `${score}%` });
  }
  if (streak >= 5) strengths.push({ emoji: '🔥', text: `${streak} dias consecutivos. Você está entre os 10% mais disciplinados.`, badge: `${streak} dias` });
  if (maturePct >= 30) strengths.push({ emoji: '🧠', text: `${maturePct}% dos cards com intervalo maduro. Memória de longo prazo ativa.`, badge: `${maturePct}%` });
  if (totalDue === 0 && totalReviews > 0) strengths.push({ emoji: '🛡️', text: 'Fila limpa: todos os cards estão revisados.', badge: '100%' });
  if (strengths.length === 0) strengths.push({ emoji: '🔍', text: 'Nenhuma fortaleza consolidada ainda. Você está na fase de construção de base.', badge: 'Em progresso' });

  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < 25) {
      const spec = getSpecialistForArea(area.short);
      weaknesses.push({ emoji: '⚠️', text: `${area.short}: apenas ${score}% de domínio.${spec ? ` Especialista indicado: ${spec.name}.` : ''}`, badge: `${score}%` });
    }
  }
  if (streak === 0 && totalReviews > 0) weaknesses.push({ emoji: '💤', text: 'Sequência quebrada. Cada dia sem revisão acelera o esquecimento.', badge: 'Crítico' });
  if (topLapseDeck && topLapseDeck.lapses >= 3) weaknesses.push({ emoji: '🔁', text: `"${topLapseDeck.deckTitle}" acumulou ${topLapseDeck.lapses} lapsos — alta resistência ao SRS.`, badge: `${topLapseDeck.lapses} lapsos` });
  if (totalDue > 50) weaknesses.push({ emoji: '🚨', text: `${totalDue} cards acumulados. Cada dia sem revisar aumenta o débito.`, badge: `${totalDue} cards` });
  if (maturePct === 0 && totalReviews > 0) weaknesses.push({ emoji: '🔴', text: 'Nenhum card com intervalo maduro ainda. Consistência é necessária.', badge: '0%' });
  if (weaknesses.length === 0 && totalReviews === 0) weaknesses.push({ emoji: '🔍', text: 'Sem dados suficientes. Comece a revisar para gerar análise.', badge: 'Sem dados' });
  else if (weaknesses.length === 0) weaknesses.push({ emoji: '✅', text: 'Nenhuma fraqueza crítica detectada. Mantenha o ritmo.', badge: 'Saudável' });

  if (topDecks.length > 0) attackPlan.push({ emoji: '⚔️', text: `Ataque imediato: "${topDecks[0].deckTitle}" — ${topDecks[0].dueCount} cards esperando.`, badge: 'Prioridade 1' });
  let weakestArea: string | null = null, weakestScore = 101;
  for (const area of ENEM_AREAS) {
    const score = areaScores.get(area.short) ?? 0;
    if (score > 0 && score < weakestScore) { weakestArea = area.short; weakestScore = score; }
  }
  if (weakestArea) {
    const spec = getSpecialistForArea(weakestArea);
    attackPlan.push({ emoji: '🎯', text: spec ? `Consulte ${spec.name} para atacar ${weakestArea} antes do próximo simulado.` : `Foque em ${weakestArea} nas próximas sessões.`, badge: weakestArea });
  }
  if (topLapseDeck && topLapseDeck.lapses >= 3) attackPlan.push({ emoji: '🔁', text: `Revise "${topLapseDeck.deckTitle}" no pré-estudo para atacar ${topLapseDeck.lapses} lapsos.`, badge: 'Reforço' });
  if (streak < 3) attackPlan.push({ emoji: '📅', text: 'Meta imediata: 7 dias consecutivos. Isso ativa o SRS no modo ótimo.', badge: 'Meta 7 dias' });
  if (attackPlan.length === 0) attackPlan.push({ emoji: '🚀', text: 'Continue revisando diariamente. O SRS está trabalhando — confie no processo.', badge: 'Em dia' });

  return { strengths, weaknesses, attackPlan };
}

// ─── Live Briefing ────────────────────────────────────────────────────────────

type BriefingTone = 'alert' | 'victory' | 'calm';
type Briefing = { lines: string[]; tone: BriefingTone };

function getLiveBriefing(p: {
  totalDue:     number;
  streak:       number;
  areaScores:   Map<string, number>;
  totalReviews: number;
}): Briefing {
  const { totalDue, streak, areaScores, totalReviews } = p;
  const hour         = new Date().getHours();
  const isMorning    = hour >= 5  && hour < 12;
  const isAfternoon  = hour >= 12 && hour < 18;

  const scores      = [...areaScores.values()].filter(s => s > 0);
  const avgScore    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  let weakestArea: string | null = null, weakestScore = 101;
  let strongestArea: string | null = null, strongestScore = -1;
  for (const [area, score] of areaScores.entries()) {
    if (score > 0 && score < weakestScore) { weakestArea = area; weakestScore = score; }
    if (score > strongestScore)             { strongestArea = area; strongestScore = score; }
  }

  if (totalDue > 100) return {
    tone: 'alert',
    lines: [
      `${totalDue} cards acumulados — situação de crise detectada.`,
      'Ative o FlashTurbo para gestão de danos em múltiplas frentes.',
      weakestArea ? `${weakestArea} é a brecha mais vulnerável agora.` : 'Priorize as áreas com menor domínio primeiro.',
    ],
  };

  if (totalDue > 20) return {
    tone: 'alert',
    lines: [
      `${totalDue} cards aguardando revisão — não deixe acumular.`,
      isMorning ? 'Ataque o mais difícil enquanto a mente está fresca.' : 'Use o FlashTurbo para liquidar a fila de uma vez.',
      weakestArea ? `Foco em ${weakestArea} — é onde você mais perde pontos.` : 'Distribua a sessão pelas áreas mais urgentes.',
    ],
  };

  if (avgScore >= 60 && scores.length >= 2) return {
    tone: 'victory',
    lines: [
      `Domínio médio de ${avgScore}% — operação em zona de excelência.`,
      strongestArea ? `${strongestArea} está blindada. Hora de avançar para novas fronteiras.` : 'Suas fortalezas estão consolidadas.',
      'Expanda o banco de cards para converter domínio em pontuação real.',
    ],
  };

  if (streak >= 7) return {
    tone: 'victory',
    lines: [
      `${streak} dias consecutivos — ritmo de aprovação confirmado.`,
      'Consistência é o que separa os aprovados dos eliminados.',
      totalDue > 0 ? `Mantenha o ritmo: ${totalDue} cards aguardam hoje.` : 'Fila limpa. Você está no controle.',
    ],
  };

  if (isMorning && totalReviews > 0) return {
    tone: 'calm',
    lines: [
      'Janela cognitiva de pico ativa. Bom momento para atacar.',
      weakestArea ? `Priorize ${weakestArea} agora — dificuldade alta, recompensa máxima.` : 'Comece pelos cards mais difíceis.',
      'A manhã é sua vantagem tática. Use-a antes da fadiga chegar.',
    ],
  };

  if (totalReviews === 0) return {
    tone: 'calm',
    lines: [
      'Operação iniciada. Aguardando primeiros dados de batalha.',
      'Complete sua primeira sessão de revisão para ativar o diagnóstico.',
      'O SRS começa a trabalhar a partir do primeiro card revisado.',
    ],
  };

  return {
    tone: 'calm',
    lines: [
      isAfternoon ? 'Período de consolidação. Revise o que foi aprendido.' : 'Missão noturna: grave o que mais pesou hoje.',
      totalDue > 0 ? `${totalDue} cards na fila — liquide antes de encerrar o dia.` : 'Fila limpa. Bom trabalho hoje.',
      streak > 1 ? `Sequência de ${streak} dias ativa. Não quebre agora.` : 'Uma nova sequência começa com a próxima sessão.',
    ],
  };
}

function computeMicroKPIs(p: {
  totalDue:     number;
  maturePct:    number;
  areaScores:   Map<string, number>;
}): { label: string; value: string; color: string }[] {
  const scores   = [...p.areaScores.values()].filter(s => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const carga = p.totalDue > 100 ? { v: 'Crítica', c: RED_ALERT }
              : p.totalDue > 30  ? { v: 'Alta',    c: '#f97316' }
              : p.totalDue > 10  ? { v: 'Média',   c: '#facc15' }
              :                    { v: 'Baixa',   c: NEON_GREEN };

  const domColor = avgScore === null ? 'rgba(255,255,255,0.30)'
                 : avgScore >= 50    ? NEON_GREEN
                 : avgScore < 30     ? RED_ALERT
                 : NEON_CYAN;

  const memColor = p.maturePct >= 30 ? NEON_GREEN
                 : p.maturePct === 0 ? 'rgba(255,255,255,0.30)'
                 : NEON_CYAN;

  return [
    { label: 'Domínio Médio',    value: avgScore !== null ? `${avgScore}%` : '—', color: domColor },
    { label: 'Carga Cognitiva',  value: carga.v,                                   color: carga.c  },
    { label: 'Memória Sólida',   value: `${p.maturePct}%`,                         color: memColor },
  ];
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
      <p className="flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{item.text}</p>
      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: badgeColor + '22', color: badgeColor, border: `1px solid ${badgeColor}44` }}>
        {item.badge}
      </span>
    </div>
  );
}

function IntelReportModal({ report, isPro, flashTutorAvatar, onClose, onUpgrade }: {
  report: IntelReport; isPro: boolean; flashTutorAvatar: string;
  onClose: () => void; onUpgrade: () => void;
}) {
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', background: 'linear-gradient(160deg, #0d0a1e 0%, #0f0c22 60%, #090614 100%)',
          border: '1px solid rgba(168,85,247,0.30)', boxShadow: '0 0 0 1px rgba(168,85,247,0.15), 0 0 80px rgba(168,85,247,0.18)' }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #a855f7, #22d3ee, transparent)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.10) 0%, transparent 55%)' }} />

        {/* Header */}
        <div className="relative flex items-center gap-4 px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="rounded-full overflow-hidden shrink-0"
            style={{ width: 44, height: 44, border: `2px solid ${NEON_PURPLE}88`, boxShadow: `0 0 16px ${NEON_PURPLE}44` }}>
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
            style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
        </div>

        {/* Body */}
        {isPro ? (
          <div className="relative overflow-y-auto flex flex-col gap-5 p-6">
            <section>
              <SectionLabel color={NEON_GREEN}>Fortalezas</SectionLabel>
              <div className="flex flex-col gap-2">{report.strengths.map((item, i) => <ReportCard key={i} item={item} badgeColor={NEON_GREEN} />)}</div>
            </section>
            <section>
              <SectionLabel color={RED_ALERT}>Fraquezas</SectionLabel>
              <div className="flex flex-col gap-2">{report.weaknesses.map((item, i) => <ReportCard key={i} item={item} badgeColor={RED_ALERT} />)}</div>
            </section>
            <section>
              <SectionLabel color={NEON_CYAN}>Plano de Ataque Imediato</SectionLabel>
              <div className="flex flex-col gap-2">{report.attackPlan.map((item, i) => <ReportCard key={i} item={item} badgeColor={NEON_CYAN} />)}</div>
            </section>
            <p className="text-center text-xs pb-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Análise gerada com base nos dados de revisão SRS.
            </p>
          </div>
        ) : (
          <div className="relative p-6 flex flex-col items-center gap-5">
            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
              className="w-full flex flex-col gap-4">
              <div>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: NEON_GREEN }}>Fortalezas</div>
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 rounded-xl mb-2" style={{ background: 'rgba(0,255,128,0.08)', border: '1px solid rgba(0,255,128,0.15)' }} />)}
              </div>
              <div>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: RED_ALERT }}>Fraquezas</div>
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 rounded-xl mb-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }} />)}
              </div>
            </div>
            <div className="absolute inset-x-6 top-1/4 flex flex-col items-center gap-4 text-center p-6 rounded-2xl"
              style={{ background: 'linear-gradient(160deg, rgba(13,10,30,0.96) 0%, rgba(15,12,34,0.98) 100%)',
                border: `1px solid ${NEON_PURPLE}44`, boxShadow: `0 0 40px rgba(0,0,0,0.80), 0 0 24px ${NEON_PURPLE}22` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${NEON_PURPLE}20`, border: `1px solid ${NEON_PURPLE}40` }}>🔒</div>
              <div>
                <p className="text-base font-black text-white leading-snug mb-2">Relatório de Inteligência Detalhado</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Este recurso é exclusivo para assinantes{' '}
                  <span className="font-bold" style={{ color: NEON_PURPLE }}>AiPro+</span>.
                  Quer saber exatamente onde você está perdendo pontos?
                </p>
              </div>
              <button onClick={onUpgrade}
                className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]"
                style={{ background: `linear-gradient(135deg, ${NEON_PURPLE} 0%, ${NEON_CYAN}99 100%)`, boxShadow: `0 0 28px ${NEON_PURPLE}55` }}>
                🚀 Assinar AiPro+ e Ver Relatório
              </button>
              <button onClick={onClose} className="text-xs transition-colors hover:text-slate-400"
                style={{ color: 'rgba(255,255,255,0.25)' }}>Agora não</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FlashTurbo Modal ─────────────────────────────────────────────────────────

type TurboSuggestion = {
  deckId:       string;
  deckTitle:    string;
  subjectTitle: string;
  icon:         string;
  dueCount:     number;
  priority:     'urgent' | 'weak';
  area:         string;
};

function FlashTurboModal({ suggestions, onClose }: {
  suggestions: TurboSuggestion[];
  onClose:     () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(suggestions.map(s => s.deckId))
  );

  const totalCards = suggestions
    .filter(s => selected.has(s.deckId))
    .reduce((sum, s) => sum + s.dueCount, 0);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStart() {
    const ids = [...selected].join(',');
    if (!ids) return;
    router.push(`/study/turbo?decks=${ids}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0c091e 0%, #0e0b20 100%)',
          border: `1px solid ${NEON_PURPLE}40`,
          boxShadow: `0 0 0 1px ${NEON_PURPLE}18, 0 0 60px ${NEON_PURPLE}18` }}
        onClick={e => e.stopPropagation()}>

        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON_PURPLE}, ${NEON_CYAN}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${NEON_PURPLE}0D 0%, transparent 60%)` }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg font-black text-white">⚡ FlashTurbo</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${NEON_PURPLE}22`, color: NEON_PURPLE, border: `1px solid ${NEON_PURPLE}44` }}>
                AiPro+
              </span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Mix de Combate Sugerido pela IA
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
        </div>

        {/* Suggestions list */}
        <div className="relative flex flex-col gap-2 p-6 overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {suggestions.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Nenhum card pendente no momento. Volte quando tiver revisões acumuladas.
            </p>
          ) : suggestions.map((s) => {
            const isChecked  = selected.has(s.deckId);
            const isWeak     = s.priority === 'weak';
            const badgeColor = isWeak ? RED_ALERT : '#f97316';
            const badgeLabel = isWeak ? '⚠️ Área fraca' : '🚨 Urgente';

            return (
              <button key={s.deckId} onClick={() => toggle(s.deckId)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
                style={{
                  background: isChecked ? `${NEON_PURPLE}12` : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${isChecked ? NEON_PURPLE + '44' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {/* Custom checkbox */}
                <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: isChecked ? NEON_PURPLE : 'rgba(255,255,255,0.08)',
                    border:     `1.5px solid ${isChecked ? NEON_PURPLE : 'rgba(255,255,255,0.20)'}`,
                  }}>
                  {isChecked && <span style={{ fontSize: '11px', color: 'white', fontWeight: 800 }}>✓</span>}
                </div>

                {/* Deck icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  {s.icon}
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">{s.subjectTitle}</p>
                  <p className="text-xs truncate leading-tight" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.deckTitle}</p>
                </div>

                {/* Priority + count */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: badgeColor + '18', color: badgeColor, border: `1px solid ${badgeColor}35`, fontSize: '9px' }}>
                    {badgeLabel}
                  </span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {s.dueCount} cards
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="relative px-6 pb-6 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={handleStart} disabled={selected.size === 0}
            className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${NEON_PURPLE} 0%, ${NEON_CYAN}CC 100%)`,
              boxShadow:  `0 0 28px ${NEON_PURPLE}44`,
            }}>
            ⚡ Iniciar Sequência Turbo
            {totalCards > 0 && (
              <span className="ml-2 text-xs font-semibold opacity-80">· {totalCards} cards</span>
            )}
          </button>
        </div>
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
  totalDue:         number;
  topDecks:         DeckPriority[];
  maturePct:        number;
  reviewedPct:      number;
  dailyCounts:      Map<string, number>;
  streak:           number;
  maxStreak:        number;
  plan:             Plan;
  areaScores:       Map<string, number>;
  topLapseDeck:     TopLapseDeck | null;
  totalReviews:     number;
  turboSuggestions: TurboSuggestion[];
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerformanceMetrics() {
  const [metrics,     setMetrics]     = useState<Metrics | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [showTurbo,   setShowTurbo]   = useState(false);

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
        id: string; deckId: string; deckTitle: string;
        subjectId: string; subjectTitle: string; subjectIconUrl: string | null; subjectCategory: string | null;
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
        else deckDueMap.set(c.deckId, { dueCount: 1, deckTitle: c.deckTitle, subjectTitle: c.subjectTitle, icon: getSubjectIcon(c.subjectTitle, c.subjectIconUrl, c.subjectCategory) });
      }

      const topDecks: DeckPriority[] = Array.from(deckDueMap.entries())
        .map(([deckId, v]) => ({ deckId, ...v }))
        .sort((a, b) => b.dueCount - a.dueCount).slice(0, 3);
      const totalDue   = Array.from(deckDueMap.values()).reduce((s, v) => s + v.dueCount, 0);
      const maturePct  = total > 0 ? Math.round((rows.filter(r => (r.interval_days ?? 0) > 21).length / total) * 100) : 0;
      const reviewedPct = total > 0 ? Math.round((rows.length / total) * 100) : 0;

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

      // ── FlashTurbo suggestions ────────────────────────────────────────────
      const deckAreaMap = new Map<string, string>();
      for (const c of normCards) {
        if (!deckAreaMap.has(c.deckId)) deckAreaMap.set(c.deckId, getCategoryShort(c.subjectCategory));
      }
      const turboSuggestions: TurboSuggestion[] = Array.from(deckDueMap.entries())
        .map(([deckId, v]) => {
          const area     = deckAreaMap.get(deckId) ?? 'Outras';
          const score    = areaScores.get(area) ?? 100;
          const isWeak   = score > 0 && score < 40;
          return { deckId, ...v, area, priority: (isWeak ? 'weak' : 'urgent') as 'urgent' | 'weak' };
        })
        .sort((a, b) => {
          if (a.priority === 'weak' && b.priority !== 'weak') return -1;
          if (a.priority !== 'weak' && b.priority === 'weak') return 1;
          return b.dueCount - a.dueCount;
        })
        .slice(0, 6);

      setMetrics({ totalDue, topDecks, maturePct, reviewedPct, dailyCounts, streak, maxStreak, plan: planInfo.plan, areaScores, topLapseDeck, totalReviews, turboSuggestions });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (!metrics) return null;

  const flashTutor = getFlashTutor();
  const isPro      = metrics.plan === 'proai_plus';

  const report = generateReport({
    areaScores: metrics.areaScores, streak: metrics.streak, maturePct: metrics.maturePct,
    totalDue: metrics.totalDue, totalReviews: metrics.totalReviews,
    topDecks: metrics.topDecks, topLapseDeck: metrics.topLapseDeck,
  });

  const briefing  = getLiveBriefing({
    totalDue: metrics.totalDue, streak: metrics.streak,
    areaScores: metrics.areaScores, totalReviews: metrics.totalReviews,
  });

  const microKPIs = computeMicroKPIs({
    totalDue: metrics.totalDue, maturePct: metrics.maturePct, areaScores: metrics.areaScores,
  });

  const toneColor: Record<BriefingTone, string> = {
    alert:   RED_ALERT,
    victory: NEON_GREEN,
    calm:    NEON_CYAN,
  };

  return (
    <>
      {showUpgrade && <AiProUpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showReport  && (
        <IntelReportModal report={report} isPro={isPro} flashTutorAvatar={flashTutor.avatar_url}
          onClose={() => setShowReport(false)}
          onUpgrade={() => { setShowReport(false); setShowUpgrade(true); }} />
      )}
      {showTurbo && (
        <FlashTurboModal suggestions={metrics.turboSuggestions} onClose={() => setShowTurbo(false)} />
      )}

      <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ╔══════════════════════════════════════════════╗ */}
        {/* ║  CARD 3 — CENTRAL DE COMBATE ⚡             ║ */}
        {/* ╚══════════════════════════════════════════════╝ */}
        <div className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${NEON_PURPLE}28`, boxShadow: `0 0 50px ${NEON_PURPLE}0A` }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, ${NEON_PURPLE}0D 0%, transparent 65%)` }} />
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${NEON_PURPLE}55, ${NEON_CYAN}22, transparent)` }} />

          {/* Header */}
          <p className="text-xs font-semibold tracking-widest uppercase relative z-10" style={{ color: NEON_GREEN }}>
            Central de Combate ⚡
          </p>

          {/* ── Top row: FlashTurbo (left) + Heatmap (right) ── */}
          <div className="relative z-10 flex gap-3 items-stretch">
            {/* FlashTurbo CTA — left col */}
            <div className="shrink-0 w-[42%] flex flex-col justify-center">
              {metrics.totalDue > 0 ? (
                <button
                  onClick={() => isPro ? setShowTurbo(true) : setShowUpgrade(true)}
                  className="relative flex flex-col justify-between rounded-xl px-3 py-3 w-full h-full text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_PURPLE}28 0%, ${NEON_CYAN}18 100%)`,
                    border:     `1px solid ${NEON_PURPLE}50`,
                    boxShadow:  `0 0 24px ${NEON_PURPLE}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                  <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: NEON_PURPLE }}>
                    ⚡ FlashTurbo{!isPro && ' 🔒'}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black tabular-nums leading-none text-white"
                        style={{ textShadow: `0 0 20px ${NEON_PURPLE}66` }}>
                        {metrics.totalDue}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>cards</p>
                    </div>
                    <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${NEON_PURPLE}88)` }}>⚠️</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {metrics.turboSuggestions.length} decks na fila
                  </p>
                </button>
              ) : (
                <div className="relative flex flex-col justify-center gap-1 rounded-xl px-3 py-3 h-full"
                  style={{ background: 'rgba(0,255,128,0.06)', border: '1px solid rgba(0,255,128,0.18)' }}>
                  <span className="text-xl">🛡️</span>
                  <p className="text-xs font-bold text-white">Fila limpa!</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>0 cards pendentes</p>
                </div>
              )}
            </div>

            {/* Heatmap — right col */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Streak inline */}
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '13px' }}>{metrics.streak >= 7 ? '🔥' : '⚡'}</span>
                <span className="text-xs font-bold text-white">{metrics.streak}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>dias</span>
                <div className="w-px h-3 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '12px' }}>🏆</span>
                <span className="text-xs font-bold text-white">{metrics.maxStreak}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>recorde</span>
              </div>
              <Heatmap dailyCounts={metrics.dailyCounts} />
            </div>
          </div>

          {/* ── Arsenal Status ── */}
          <div className="relative z-10 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <ArsenalStatus maturePct={metrics.maturePct} reviewedPct={metrics.reviewedPct} />
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════╗ */}
        {/* ║  CARD 4 — O PANTEÃO 🏛️                     ║ */}
        {/* ╚══════════════════════════════════════════════╝ */}
        <div className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(168,85,247,0.22)', boxShadow: '0 0 50px rgba(168,85,247,0.07)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.10) 0%, transparent 65%)' }} />
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.50), rgba(34,211,238,0.20), transparent)' }} />

          <p className="text-xs font-semibold tracking-widest uppercase relative z-10" style={{ color: NEON_PURPLE }}>
            O Panteão 🏛️
          </p>

          {/* FlashTutor identity — compact row */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="rounded-full overflow-hidden shrink-0"
              style={{ width: 32, height: 32, border: `2px solid ${isPro ? NEON_PURPLE + 'AA' : NEON_PURPLE + '44'}`,
                boxShadow: isPro ? `0 0 12px ${NEON_PURPLE}44` : 'none' }}>
              <Image src={flashTutor.avatar_url} alt="FlashTutor" width={32} height={32} unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight">FlashTutor</p>
              <p className="leading-tight truncate" style={{ color: isPro ? NEON_PURPLE : 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', fontSize: '10px' }}>
                {isPro ? '⚡ ESTRATEGISTA GERAL' : '🔒 AIPRO+ EXCLUSIVO'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: isPro ? NEON_GREEN : 'rgba(255,255,255,0.15)', boxShadow: isPro ? `0 0 5px ${NEON_GREEN}` : 'none' }} />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{isPro ? 'online' : 'bloqueado'}</span>
            </div>
          </div>

          {/* ── Live Briefing + Micro-KPIs ── */}
          <div className="relative z-10 flex gap-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Briefing text — left */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p style={{ fontSize: '9px', letterSpacing: '0.10em', fontFamily: 'ui-monospace,monospace',
                color: toneColor[briefing.tone], textTransform: 'uppercase', fontWeight: 700 }}>
                ▶ BRIEFING ATIVO
              </p>
              {briefing.lines.map((line, i) => (
                <p key={i} style={{
                  fontSize: '11px', lineHeight: '1.55',
                  color: i === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.48)',
                  fontWeight: i === 0 ? 600 : 400,
                  fontStyle: i > 0 ? 'italic' : 'normal',
                }}>
                  {i === 0 && <span style={{ color: toneColor[briefing.tone], marginRight: '4px' }}>›</span>}
                  {line}
                </p>
              ))}
            </div>

            {/* Micro-KPIs — right */}
            <div className="shrink-0 flex flex-col gap-2" style={{ minWidth: '90px' }}>
              {microKPIs.map((kpi, i) => (
                <div key={i} className="rounded-lg px-2 py-1.5 flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', fontFamily: 'ui-monospace,monospace' }}>
                    {kpi.label}
                  </span>
                  <span className="font-black tabular-nums leading-tight"
                    style={{ fontSize: '13px', color: kpi.color, fontFamily: 'ui-monospace,monospace',
                      textShadow: `0 0 8px ${kpi.color}66` }}>
                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Deep Dive footer ── */}
          <div className="relative z-10 flex items-center justify-end pt-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 transition-all duration-150 hover:brightness-125 active:scale-95"
              style={{ fontSize: '10px', color: isPro ? NEON_PURPLE : 'rgba(255,255,255,0.30)',
                fontFamily: 'ui-monospace,monospace', fontWeight: 700, letterSpacing: '0.04em' }}>
              {isPro ? '📊' : '🔒'} Relatório Profundo (Deep Dive)
              <span style={{ fontSize: '9px', opacity: 0.6 }}>→</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
