'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryShort } from '@/lib/categories';
import { getSubjectIcon } from '@/lib/iconMap';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─── Paleta Foco Zen ──────────────────────────────────────────────────────────
const MINT  = '#34D399';
const OCEAN = '#0EA5E9';
const AMBER = '#F59E0B';
const DIM   = 'rgba(255,255,255,0.38)';
const CARD  = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

// ─── Mapeamento de pesos SISU por curso ───────────────────────────────────────
const COURSE_WEIGHTS: Record<string, Record<string, number>> = {
  medicina:      { Natureza: 0.35, Humanas: 0.15, Matemática: 0.25, Linguagens: 0.25 },
  odontologia:   { Natureza: 0.35, Humanas: 0.15, Matemática: 0.25, Linguagens: 0.25 },
  enfermagem:    { Natureza: 0.30, Humanas: 0.20, Matemática: 0.25, Linguagens: 0.25 },
  direito:       { Natureza: 0.10, Humanas: 0.45, Matemática: 0.15, Linguagens: 0.30 },
  engenharia:    { Natureza: 0.25, Humanas: 0.10, Matemática: 0.45, Linguagens: 0.20 },
  computacao:    { Natureza: 0.20, Humanas: 0.10, Matemática: 0.50, Linguagens: 0.20 },
  psicologia:    { Natureza: 0.25, Humanas: 0.35, Matemática: 0.15, Linguagens: 0.25 },
  pedagogia:     { Natureza: 0.10, Humanas: 0.40, Matemática: 0.15, Linguagens: 0.35 },
  administracao: { Natureza: 0.15, Humanas: 0.25, Matemática: 0.35, Linguagens: 0.25 },
  economia:      { Natureza: 0.15, Humanas: 0.25, Matemática: 0.40, Linguagens: 0.20 },
};
const DEFAULT_WEIGHTS = { Natureza: 0.25, Humanas: 0.25, Matemática: 0.25, Linguagens: 0.25 };

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function getCourseWeights(course: string | null): Record<string, number> {
  if (!course) return DEFAULT_WEIGHTS;
  const key = Object.keys(COURSE_WEIGHTS).find(k => norm(course).includes(k));
  return key ? COURSE_WEIGHTS[key] : DEFAULT_WEIGHTS;
}
function computeAffinity(course: string | null, areaScores: Map<string, number>): number {
  const w = getCourseWeights(course);
  return Math.round(Object.entries(w).reduce((acc, [area, weight]) => acc + (areaScores.get(area) ?? 0) * weight, 0));
}
function memoryPct(avgInterval: number): number {
  return Math.min(100, Math.round((avgInterval / 60) * 100));
}
function periodOf(h: number): string {
  if (h < 6)  return 'Madrugada';
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}
function memoryLabel(pct: number): string {
  if (pct >= 80) return 'Muito forte';
  if (pct >= 55) return 'Consolidando';
  if (pct >= 30) return 'Aprendendo';
  if (pct > 0)   return 'Iniciando';
  return 'Não estudado';
}
function memoryColor(pct: number): string {
  if (pct >= 80) return MINT;
  if (pct >= 55) return OCEAN;
  if (pct >= 30) return AMBER;
  return 'rgba(255,255,255,0.25)';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DeckRow = { id: string; title: string; memory: number; cards: number; lapses: number };

type SubjectRow = {
  id:      string;
  title:   string;
  icon:    string;
  area:    string;
  mastery: number;
  decks:   DeckRow[];
};

type HourStat = { label: string; accuracy: number; total: number };

type ReportData = {
  firstName:        string;
  targetCourse:     string | null;
  targetUniversity: string | null;
  difficultyAreas:  string[];
  affinityScore:    number;
  courseWeights:    Record<string, number>;
  areaScores:       Map<string, number>;
  // Retention
  totalCards:    number;
  matureCount:   number;
  buildingCount: number;
  riskCount:     number;
  unstudied:     number;
  // Deep dive
  subjects: SubjectRow[];
  // Performance
  hourStats:    HourStat[];
  bestPeriod:   string;
  bestArea:     string | null;
  bestAreaPct:  number;
  totalReviews: number;
  // Today
  todayCount:     number;
  yesterdayCount: number;
  dailyGoal:      number;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ ...CARD, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      {children}
    </div>
  );
}

function SectionLabel({ color = MINT, children }: { color?: string; children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color }}>
      {children}
    </p>
  );
}

// ── 1. Career Match ────────────────────────────────────────────────────────────

function CareerMatchCard({ data }: { data: ReportData }) {
  const { firstName, targetCourse, targetUniversity, affinityScore, courseWeights, areaScores } = data;
  const course = targetCourse ?? 'Seu Curso Alvo';
  const uni    = targetUniversity ?? 'Sua Universidade';

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionLabel color={MINT}>Match de Carreira · SISU</SectionLabel>
          <h2 className="text-xl font-black text-white mb-0.5">
            {firstName}, você está <span style={{ color: MINT }}>{affinityScore}%</span> alinhado
          </h2>
          <p className="text-sm" style={{ color: DIM }}>
            com o perfil de aprovação em <strong className="text-white">{course}</strong>
            {targetUniversity ? <> na <strong className="text-white">{uni}</strong></> : ''}
          </p>
        </div>

        {/* Big score ring */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={affinityScore >= 70 ? MINT : affinityScore >= 40 ? OCEAN : AMBER}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - affinityScore / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
              {affinityScore}%
            </span>
          </div>
          <p className="text-xs font-semibold" style={{ color: DIM }}>Afinidade</p>
        </div>
      </div>

      {/* Area weight bars */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(courseWeights).map(([area, weight]) => {
          const score    = areaScores.get(area) ?? 0;
          const contrib  = Math.round(score * weight);
          const maxPts   = Math.round(weight * 100);
          const fillPct  = maxPts > 0 ? (contrib / maxPts) * 100 : 0;
          const color    = score >= 60 ? MINT : score >= 30 ? OCEAN : AMBER;
          return (
            <div key={area} className="rounded-xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white">{area}</span>
                <span className="text-xs font-bold" style={{ color }}>{score}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fillPct}%`, background: color }} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Peso SISU: {Math.round(weight * 100)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Opportunity hint */}
      {data.difficultyAreas.length > 0 && (
        <div className="mt-3 rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ background: `${AMBER}0C`, border: `1px solid ${AMBER}25` }}>
          <span>💡</span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
            <span className="font-semibold" style={{ color: AMBER }}>Oportunidade de Ganho de Pontos: </span>
            Você marcou {data.difficultyAreas.join(', ')} como área(s) de desafio.
            Cada revisão nessa(s) área(s) tem impacto direto na sua nota final.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

// ── 2. Retention Pyramid ───────────────────────────────────────────────────────

function RetentionPyramid({ data }: { data: ReportData }) {
  const { totalCards, matureCount, buildingCount, riskCount, unstudied } = data;
  if (totalCards === 0) return null;

  const tiers = [
    {
      label: 'Domínio de Longo Prazo',
      desc:  'Memória consolidada · intervalo > 21 dias',
      count: matureCount,
      color: MINT,
      icon:  '🏆',
    },
    {
      label: 'Conhecimento em Construção',
      desc:  'Revisões frequentes · intervalo 1–21 dias',
      count: buildingCount,
      color: OCEAN,
      icon:  '📈',
    },
    {
      label: 'Zonas de Oportunidade',
      desc:  'Alta taxa de lapso · ganho imediato disponível',
      count: riskCount,
      color: AMBER,
      icon:  '💡',
    },
    {
      label: 'Ainda Não Estudado',
      desc:  'Território inexplorado — puro potencial',
      count: unstudied,
      color: 'rgba(255,255,255,0.18)',
      icon:  '🌱',
    },
  ];

  return (
    <SectionCard>
      <SectionLabel color={MINT}>Pirâmide de Retenção</SectionLabel>
      <p className="text-xs mb-4" style={{ color: DIM }}>
        Como seu conhecimento está distribuído entre os {totalCards.toLocaleString('pt-BR')} cards do ENEM
      </p>

      <div className="flex flex-col gap-3">
        {tiers.map((tier, i) => {
          const pct = totalCards > 0 ? Math.round((tier.count / totalCards) * 100) : 0;
          // Pyramid effect: each tier slightly narrower than the one above
          const maxW = 100 - i * 8;
          return (
            <div key={tier.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '14px' }}>{tier.icon}</span>
                  <span className="text-xs font-semibold text-white">{tier.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold" style={{ color: tier.color }}>{pct}%</span>
                  <span className="text-xs" style={{ color: DIM }}>({tier.count.toLocaleString('pt-BR')})</span>
                </div>
              </div>
              <div className="h-6 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)', maxWidth: `${maxW}%` }}>
                <div
                  className="h-full rounded-lg transition-all duration-700 flex items-center pl-2"
                  style={{
                    width:      `${pct}%`,
                    background: tier.color === 'rgba(255,255,255,0.18)' ? 'rgba(255,255,255,0.08)' : `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
                    minWidth:   pct > 0 ? '8px' : '0',
                  }}
                />
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{tier.desc}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── 3. Today Goal Widget ───────────────────────────────────────────────────────

function TodayGoalWidget({ data }: { data: ReportData }) {
  const { todayCount, yesterdayCount, dailyGoal, totalReviews } = data;
  const pct     = Math.min(100, Math.round((todayCount / dailyGoal) * 100));
  const delta   = todayCount - yesterdayCount;
  const color   = pct >= 100 ? MINT : pct >= 50 ? OCEAN : AMBER;

  return (
    <SectionCard className="flex flex-col gap-3">
      <SectionLabel color={OCEAN}>Meta de Hoje</SectionLabel>

      {/* Progress ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
            {pct}%
          </span>
        </div>

        <div className="flex-1">
          <p className="text-lg font-black text-white leading-tight">
            {todayCount}<span className="text-sm font-semibold text-slate-400"> / {dailyGoal}</span>
          </p>
          <p className="text-xs" style={{ color: DIM }}>cards revisados hoje</p>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ color: delta >= 0 ? MINT : AMBER, fontSize: '11px', fontWeight: 700 }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
            </span>
            <span className="text-xs" style={{ color: DIM }}>vs ontem</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs" style={{ color: DIM }}>Total histórico</span>
        <span className="text-sm font-black" style={{ color: MINT }}>
          {totalReviews.toLocaleString('pt-BR')} revisões
        </span>
      </div>

      {pct >= 100 && (
        <div className="rounded-xl px-3 py-2 text-center"
          style={{ background: `${MINT}0C`, border: `1px solid ${MINT}30` }}>
          <p className="text-xs font-bold" style={{ color: MINT }}>🎉 Meta do dia concluída!</p>
        </div>
      )}
    </SectionCard>
  );
}

// ── 4. Deep Dive Pedagógico ────────────────────────────────────────────────────

function DeepDiveRow({ subject }: { subject: SubjectRow }) {
  const [open, setOpen] = useState(false);
  const color = memoryColor(subject.mastery);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <span className="text-base shrink-0">{subject.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{subject.title}</p>
          <p className="text-xs" style={{ color: DIM }}>{subject.area}</p>
        </div>
        {/* Memory bar */}
        <div className="shrink-0 flex items-center gap-2" style={{ minWidth: '100px' }}>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${subject.mastery}%`, background: color }} />
          </div>
          <span className="text-xs font-bold w-8 text-right" style={{ color }}>{subject.mastery}%</span>
        </div>
        <span className="text-xs shrink-0" style={{ color: DIM }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 flex flex-col gap-1.5"
          style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
            TÓPICOS & FORÇA DA MEMÓRIA
          </p>
          {subject.decks.length === 0 ? (
            <p className="text-xs" style={{ color: DIM }}>Nenhum deck encontrado nesta matéria.</p>
          ) : subject.decks.map(deck => {
            const dc = memoryColor(deck.memory);
            const dl = memoryLabel(deck.memory);
            return (
              <div key={deck.id} className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{deck.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {deck.cards} cards · {deck.lapses > 0 ? `${deck.lapses} revisões extras` : 'sem revisões extras'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${deck.memory}%`, background: dc }} />
                  </div>
                  <div className="text-right" style={{ minWidth: '80px' }}>
                    <p className="text-xs font-bold leading-tight" style={{ color: dc }}>{deck.memory}%</p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)' }}>{dl}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeepDiveCard({ subjects }: { subjects: SubjectRow[] }) {
  return (
    <SectionCard>
      <SectionLabel color={OCEAN}>Deep Dive Pedagógico · por Matéria</SectionLabel>
      <p className="text-xs mb-4" style={{ color: DIM }}>
        Clique em qualquer matéria para ver os tópicos e a força da memória de cada deck
      </p>
      {subjects.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: DIM }}>
          Estude alguns cards para ver seu Deep Dive aparecer aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {subjects.map(s => <DeepDiveRow key={s.id} subject={s} />)}
        </div>
      )}
    </SectionCard>
  );
}

// ── 5. Performance Analysis ────────────────────────────────────────────────────

function PerfTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: HourStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(5,11,20,0.95)', border: `1px solid ${OCEAN}30` }}>
      <p className="font-bold text-white">{d.label}</p>
      <p style={{ color: OCEAN }}>{d.accuracy}% de acerto · {d.total} revisões</p>
    </div>
  );
}

function PerformanceAnalysisCard({ data }: { data: ReportData }) {
  const { hourStats, bestPeriod, bestArea, bestAreaPct } = data;

  return (
    <SectionCard>
      <SectionLabel color={AMBER}>Análise de Performance · por Horário</SectionLabel>
      <p className="text-xs mb-4" style={{ color: DIM }}>
        Taxa de acerto ao longo do dia — baseada em todas as suas revisões históricas
      </p>

      {hourStats.length < 2 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: DIM }}>
            Faça mais revisões em horários diferentes para ver seu mapa de performance aparecer aqui.
          </p>
        </div>
      ) : (
        <>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourStats} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTip content={<PerfTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {hourStats.map((entry, i) => (
                    <Cell key={i} fill={entry.accuracy >= 70 ? MINT : entry.accuracy >= 50 ? OCEAN : AMBER} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight */}
          <div className="mt-3 rounded-xl px-4 py-3 flex items-start gap-2"
            style={{ background: `${OCEAN}0C`, border: `1px solid ${OCEAN}25` }}>
            <span>💡</span>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Insight do Mentor</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Você rende mais no período da{' '}
                <strong style={{ color: OCEAN }}>{bestPeriod}</strong>.
                {bestArea && (
                  <> Sua área mais forte é{' '}
                    <strong style={{ color: MINT }}>{bestArea}</strong>
                    {' '}({bestAreaPct}% de domínio){' '}—{' '}
                    use isso como alavanca para os tópicos que ainda estão crescendo.
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {[300, 220, 180, 260].map((h, i) => (
        <div key={i} className="rounded-2xl" style={{ height: h, ...CARD }} />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressReport() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today     = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

      const [
        { data: profileData },
        { data: allCards },
        { data: progressRows },
        { count: totalCount },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('full_name, target_course, target_university, daily_card_goal, difficulty_subjects')
          .eq('id', user.id).maybeSingle(),
        supabase.from('cards')
          .select('id, decks(id, title, subjects(id, title, icon_url, category))'),
        supabase.from('user_progress')
          .select('card_id, lapses, interval_days, next_review, history')
          .eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
      ]);

      const rows  = progressRows ?? [];
      const total = totalCount ?? 0;

      // Normalize cards (same pattern as PerformanceMetrics)
      type NormCard = {
        id: string; deckId: string; deckTitle: string;
        subjectId: string; subjectTitle: string;
        subjectIconUrl: string | null; subjectCategory: string | null;
      };
      const normCards: NormCard[] = [];
      for (const raw of (allCards ?? []) as Array<{ id: string; decks: unknown }>) {
        const rd = Array.isArray(raw.decks) ? (raw.decks[0] ?? null) : raw.decks as { id: string; title: string; subjects: unknown } | null;
        if (!rd) continue;
        const d  = rd as { id: string; title: string; subjects: unknown };
        const rs = Array.isArray(d.subjects) ? (d.subjects[0] ?? null) : d.subjects as { id: string; title: string; icon_url: string | null; category: string | null } | null;
        if (!rs) continue;
        const s  = rs as { id: string; title: string; icon_url: string | null; category: string | null };
        normCards.push({ id: raw.id, deckId: d.id, deckTitle: d.title, subjectId: s.id, subjectTitle: s.title, subjectIconUrl: s.icon_url, subjectCategory: s.category });
      }

      const progMap = new Map(rows.map(r => [r.card_id, r]));

      // Retention tiers
      const matureCount   = rows.filter(r => (r.interval_days ?? 0) > 21).length;
      const buildingCount = rows.filter(r => { const d = r.interval_days ?? 0; return d >= 1 && d <= 21; }).length;
      const riskCount     = rows.filter(r => (r.lapses ?? 0) >= 2 && (r.interval_days ?? 0) <= 7).length;
      const unstudied     = Math.max(0, total - rows.length);

      // Area scores
      const domainMap = buildDomainMap(
        normCards.map(c => ({ id: c.id, decks: { subject_id: c.subjectId } })),
        rows.map(r => ({ card_id: r.card_id, interval_days: r.interval_days ?? 0 })),
      );
      const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.subjectCategory)]));
      const shortScore  = new Map<string, { sum: number; count: number }>();
      for (const [sid, domain] of domainMap.entries()) {
        const area = subjAreaMap.get(sid); if (!area) continue;
        const s = shortScore.get(area) ?? { sum: 0, count: 0 };
        s.sum += domain.level; s.count++;
        shortScore.set(area, s);
      }
      const areaScores = new Map<string, number>(
        Array.from(shortScore.entries()).map(([a, s]) => [a, s.count > 0 ? Math.round((s.sum / s.count / 5) * 100) : 0]),
      );

      // Subject details for deep dive
      type SubjMeta = {
        title: string; iconUrl: string | null; category: string | null;
        decks: Map<string, { title: string; intervals: number[]; lapses: number; cards: number }>;
      };
      const subjMap = new Map<string, SubjMeta>();
      for (const c of normCards) {
        if (!subjMap.has(c.subjectId))
          subjMap.set(c.subjectId, { title: c.subjectTitle, iconUrl: c.subjectIconUrl, category: c.subjectCategory, decks: new Map() });
        const sm = subjMap.get(c.subjectId)!;
        if (!sm.decks.has(c.deckId))
          sm.decks.set(c.deckId, { title: c.deckTitle, intervals: [], lapses: 0, cards: 0 });
        const dk = sm.decks.get(c.deckId)!;
        dk.cards++;
        const prog = progMap.get(c.id);
        if (prog) {
          dk.intervals.push(prog.interval_days ?? 0);
          dk.lapses += (prog.lapses as number) ?? 0;
        }
      }
      const subjects: SubjectRow[] = Array.from(subjMap.entries()).map(([sid, sm]) => {
        const domain  = domainMap.get(sid);
        const mastery = domain ? Math.round((domain.level / 5) * 100) : 0;
        const decks: DeckRow[] = Array.from(sm.decks.entries()).map(([did, dk]) => ({
          id:     did,
          title:  dk.title,
          memory: dk.intervals.length > 0 ? memoryPct(dk.intervals.reduce((a, v) => a + v, 0) / dk.intervals.length) : 0,
          cards:  dk.cards,
          lapses: dk.lapses,
        })).sort((a, b) => b.memory - a.memory);
        return {
          id:      sid,
          title:   sm.title,
          icon:    getSubjectIcon(sm.title, sm.iconUrl, sm.category),
          area:    getCategoryShort(sm.category),
          mastery,
          decks,
        };
      }).sort((a, b) => b.mastery - a.mastery);

      // Hourly accuracy
      const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, correct: 0, total: 0 }));
      let todayCount = 0, yesterdayCount = 0, totalReviews = 0;
      for (const row of rows) {
        for (const entry of (row.history as Array<{ reviewed_at: string; rating: number }> | null) ?? []) {
          const d = entry.reviewed_at?.slice(0, 10);
          const h = new Date(entry.reviewed_at).getHours();
          if (!isNaN(h)) {
            buckets[h].total++;
            if ((entry.rating ?? 0) >= 3) buckets[h].correct++;
            totalReviews++;
          }
          if (d === today)     todayCount++;
          if (d === yesterday) yesterdayCount++;
        }
      }
      const hourStats: HourStat[] = buckets
        .filter(b => b.total >= 5)
        .map(b => ({
          label:    `${String(b.hour).padStart(2, '0')}h`,
          accuracy: Math.round((b.correct / b.total) * 100),
          total:    b.total,
        }));

      // Best period
      const pAcc: Record<string, { c: number; t: number }> = {
        Madrugada: { c: 0, t: 0 }, Manhã: { c: 0, t: 0 }, Tarde: { c: 0, t: 0 }, Noite: { c: 0, t: 0 },
      };
      for (const b of buckets) {
        const p = periodOf(b.hour);
        pAcc[p].c += b.correct;
        pAcc[p].t += b.total;
      }
      let bestPeriod = 'Tarde', bestPeriodAcc = 0;
      for (const [p, v] of Object.entries(pAcc)) {
        if (v.t >= 5 && v.c / v.t > bestPeriodAcc) { bestPeriodAcc = v.c / v.t; bestPeriod = p; }
      }

      // Best area
      let bestArea: string | null = null, bestAreaPct = 0;
      for (const [area, score] of areaScores.entries()) {
        if (score > bestAreaPct) { bestAreaPct = score; bestArea = area; }
      }

      const firstName = (profileData?.full_name ?? '').trim().split(/\s+/)[0] || 'Estudante';

      setData({
        firstName,
        targetCourse:     profileData?.target_course ?? null,
        targetUniversity: profileData?.target_university ?? null,
        difficultyAreas:  (profileData?.difficulty_subjects as string[]) ?? [],
        affinityScore:    computeAffinity(profileData?.target_course ?? null, areaScores),
        courseWeights:    getCourseWeights(profileData?.target_course ?? null),
        areaScores,
        totalCards: total,
        matureCount, buildingCount, riskCount, unstudied,
        subjects,
        hourStats, bestPeriod, bestArea, bestAreaPct,
        todayCount, yesterdayCount,
        dailyGoal:    profileData?.daily_card_goal ?? 50,
        totalReviews,
      });
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: #fff !important; color: #111 !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; }
        }
      `}</style>

      <main className="min-h-screen px-4 py-10 sm:px-8 flex flex-col items-center print-page">
        <div className="w-full max-w-4xl">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between gap-4 mb-8 no-print">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: MINT }}>
                Acompanhamento Pedagógico
              </p>
              <h1 className="text-2xl font-black text-white">Auditoria de Aprovação</h1>
              <p className="text-sm mt-0.5" style={{ color: DIM }}>
                Seu retrato completo de conhecimento — baseado em ciência da memória
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:brightness-125"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)' }}
              >
                🖨️ Imprimir
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:brightness-125"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)' }}
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {loading ? <Skeleton /> : !data ? (
            <p className="text-center text-slate-500 py-20">Não foi possível carregar seus dados.</p>
          ) : (
            <div className="flex flex-col gap-5">

              {/* 1. Career Match */}
              <CareerMatchCard data={data} />

              {/* 2+3. Pyramid + Today — side by side on ≥ md */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <RetentionPyramid data={data} />
                </div>
                <TodayGoalWidget data={data} />
              </div>

              {/* 4. Deep Dive */}
              <DeepDiveCard subjects={data.subjects} />

              {/* 5. Performance Analysis */}
              <PerformanceAnalysisCard data={data} />

              {/* Print footer */}
              <div className="mt-6 text-center hidden print:block">
                <p style={{ fontSize: '11px', color: '#666' }}>
                  Relatório gerado pelo FlashAprova · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Link to settings */}
              <p className="text-xs text-center no-print" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Atualize seu curso-alvo ou meta diária em{' '}
                <Link href="/dashboard/settings" className="underline hover:text-white transition-colors">
                  Perfil de Estudos
                </Link>
              </p>

            </div>
          )}
        </div>
      </main>
    </>
  );
}
