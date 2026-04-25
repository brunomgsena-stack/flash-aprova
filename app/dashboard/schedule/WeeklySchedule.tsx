'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryShort, ENEM_AREAS } from '@/lib/categories';
import { getSubjectIcon } from '@/lib/iconMap';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const EMERALD = '#10B981';
const OCEAN   = '#0EA5E9';
const AMBER   = '#F59E0B';
const VIOLET  = '#8B5CF6';
const DIM     = 'rgba(255,255,255,0.35)';

const AREA_COLORS: Record<string, string> = {
  Natureza:   EMERALD,
  Humanas:    OCEAN,
  Matemática: AMBER,
  Linguagens: VIOLET,
  Redação:    '#06b6d4',
};
const AREA_ICONS: Record<string, string> = {
  Natureza: '🔬', Humanas: '🌍', Matemática: '📐', Linguagens: '✍️', Redação: '✒️',
};

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MINS_PER_BLOCK = 15;   // 75 cards × 12s = 15 min por bloco
const SECS_PER_CARD  = 12;

// ─── AI Plan types ────────────────────────────────────────────────────────────

type AiModule = {
  area:             string;
  topicos:          string[];
  cards_sugeridos:  number;
  prioridade:       'alta' | 'media' | 'baixa';
};

type AiWeek = {
  numero:  number;
  tema:    string;
  modulos: AiModule[];
};

type AiPriority = {
  area:   string;
  peso:   number;
  motivo: string;
};

function getLastMondayMidnight(): Date {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const d = new Date(now);
  d.setDate(now.getDate() - daysFromMonday);
  d.setHours(0, 1, 0, 0);
  return d;
}

type AiStudyPlan = {
  prioridades:        AiPriority[];
  semanas:            AiWeek[];
  pontos_criticos:    string[];
  meta_diaria_cards:  number;
  meta_semanal_cards: number;
  horas_por_dia:      number;
  generated_at?:      string;   // ISO — quando foi gerado
  generated_from?:    string;   // 'onboarding' | 'performance_data'
  dica_tutor:         string;
  feedback_tutor?:    string;   // frase personalizada com nome + matéria real (máx 150 chars)
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DeckInfo = {
  id:          string;
  title:       string;
  subject:     string;
  subjectIcon: string;
  area:        string;
  dueCount:    number;   // cards agendados para revisão hoje
  newCount:    number;   // cards nunca estudados
  mastery:     number;
};

type WeekBlock = {
  area:        string;
  subject:     string;
  subjectIcon: string;
  deckTitle:   string;
  deckId:      string;
  cards:       number;
  mins:        number;
  isNew:       boolean;  // true = conteúdo inédito; false = revisão
};

type ScheduleData = {
  decksWithDue:      DeckInfo[];
  areaScores:        Map<string, number>;
  difficultyAreas:   string[];
  targetCourse:      string | null;
  firstName:         string;
  totalDue:          number;
  aiPlan:            AiStudyPlan | null;
  studiedTodayDecks: Set<string>;   // deckIds reviewed at least once today
  todayReviewCount:  number;        // total card reviews done today
};

// ─── Schedule generation ──────────────────────────────────────────────────────

function generateSchedule(
  hoursPerDay:     number,
  decks:           DeckInfo[],
  areaScores:      Map<string, number>,
  difficultyAreas: string[],
  aiPlan:          AiStudyPlan | null,
): WeekBlock[][] {
  const blocksPerDay = Math.max(1, Math.floor((hoursPerDay * 60) / MINS_PER_BLOCK));
  const MAX_CARDS    = Math.floor((MINS_PER_BLOCK * 60) / SECS_PER_CARD); // 75

  // Sort areas: AI peso → dificuldade → menor mastery
  const sortedAreas = [...ENEM_AREAS]
    .map(a => a.short)
    .filter(a => decks.some(d => d.area === a))
    .sort((a, b) => {
      if (aiPlan) {
        const aPeso = aiPlan.prioridades.find(p => p.area === a)?.peso ?? 0;
        const bPeso = aiPlan.prioridades.find(p => p.area === b)?.peso ?? 0;
        if (aPeso !== bPeso) return bPeso - aPeso;
      }
      const aDiff = difficultyAreas.includes(a) ? 1 : 0;
      const bDiff = difficultyAreas.includes(b) ? 1 : 0;
      if (aDiff !== bDiff) return bDiff - aDiff;
      return (areaScores.get(a) ?? 100) - (areaScores.get(b) ?? 100);
    });

  if (sortedAreas.length === 0) return Array.from({ length: 7 }, () => []);

  const schedule: WeekBlock[][] = [];
  let globalAreaIdx = 0;

  for (let day = 0; day < 7; day++) {
    const dayBlocks: WeekBlock[] = [];
    const usedDeckIds  = new Set<string>();
    const usedAreas    = new Set<string>();

    // Blocos pares → revisão preferencial; blocos ímpares → conteúdo novo preferencial
    for (let b = 0; b < blocksPerDay; b++) {
      const preferReview = b % 2 === 0;

      // Tenta encontrar área com deck disponível, sem repetir área no mesmo dia
      let chosenArea: string | null = null;
      for (let pass = 0; pass < 2 && !chosenArea; pass++) {
        const allowUsedArea = pass === 1; // 2ª passagem: aceita área já usada hoje
        for (let attempt = 0; attempt < sortedAreas.length; attempt++) {
          const candidate = sortedAreas[(globalAreaIdx + attempt) % sortedAreas.length];
          if (!allowUsedArea && usedAreas.has(candidate)) continue;
          const hasReview = decks.some(d => d.area === candidate && !usedDeckIds.has(d.id) && d.dueCount > 0);
          const hasNew    = decks.some(d => d.area === candidate && !usedDeckIds.has(d.id) && d.newCount > 0);
          const hasAny    = decks.some(d => d.area === candidate && !usedDeckIds.has(d.id));
          if ((preferReview && hasReview) || (!preferReview && hasNew) || hasAny) {
            chosenArea = candidate;
            break;
          }
        }
      }
      if (!chosenArea) chosenArea = sortedAreas[globalAreaIdx % sortedAreas.length];
      globalAreaIdx = (globalAreaIdx + 1) % sortedAreas.length;
      usedAreas.add(chosenArea);

      // Dentro da área, prefere deck de revisão ou novo conforme o bloco
      const deck = decks
        .filter(d => d.area === chosenArea)
        .sort((a, b) => {
          const aUsed = usedDeckIds.has(a.id) ? 1 : 0;
          const bUsed = usedDeckIds.has(b.id) ? 1 : 0;
          if (aUsed !== bUsed) return aUsed - bUsed;
          if (preferReview) return b.dueCount - a.dueCount;
          return b.newCount - a.newCount;
        })[0];

      if (!deck) continue;
      usedDeckIds.add(deck.id);

      const isNew        = deck.dueCount === 0 && deck.newCount > 0;
      const baseCards    = deck.dueCount > 0 ? deck.dueCount : (deck.newCount > 0 ? deck.newCount : MAX_CARDS);
      const cardsInBlock = Math.min(baseCards, MAX_CARDS);

      dayBlocks.push({
        area:        chosenArea,
        subject:     deck.subject,
        subjectIcon: deck.subjectIcon,
        deckTitle:   deck.title,
        deckId:      deck.id,
        cards:       cardsInBlock,
        mins:        Math.ceil((cardsInBlock * SECS_PER_CARD) / 60),
        isNew,
      });
    }
    schedule.push(dayBlocks);
  }
  return schedule;
}


// ─── AI Plan banner ───────────────────────────────────────────────────────────

function AiPlanBanner({
  plan,
  selectedWeek,
  onSelectWeek,
  firstName,
}: {
  plan:           AiStudyPlan;
  selectedWeek:   number;
  onSelectWeek:   (w: number) => void;
  firstName:      string;
}) {
  const week = plan.semanas[selectedWeek];
  if (!week) return null;

  const PRIORIDADE_COLOR: Record<string, string> = {
    alta:  EMERALD,
    media: AMBER,
    baixa: OCEAN,
  };

  return (
    <div
      className="rounded-2xl p-5 mb-5 overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${VIOLET}10 0%, rgba(14,165,233,0.06) 100%)`,
        border:     `1px solid ${VIOLET}30`,
      }}
    >
      {/* Top shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}70, ${EMERALD}50, transparent)` }}
      />

      {/* Week tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-bold tracking-widest uppercase mr-1" style={{ color: VIOLET }}>
          🤖 Plano IA
        </span>
        {plan.semanas.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelectWeek(i)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150"
            style={
              selectedWeek === i
                ? { background: `${VIOLET}30`, border: `1px solid ${VIOLET}70`, color: '#fff' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: DIM }
            }
          >
            Semana {s.numero}
          </button>
        ))}
      </div>

      {/* Week title */}
      <p className="font-black text-white text-base mb-3 leading-tight">{week.tema}</p>

      {/* Modules for this week */}
      <div className="flex flex-wrap gap-2 mb-4">
        {week.modulos.map((mod, i) => {
          const color = AREA_COLORS[mod.area] ?? OCEAN;
          const prColor = PRIORIDADE_COLOR[mod.prioridade] ?? OCEAN;
          return (
            <div
              key={i}
              className="rounded-xl px-3 py-2"
              style={{ background: `${color}0C`, border: `1px solid ${color}30` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ fontSize: '11px' }}>{AREA_ICONS[mod.area] ?? '📚'}</span>
                <span className="text-xs font-bold" style={{ color }}>
                  {mod.area}
                </span>
                <span
                  className="text-xs font-semibold px-1.5 rounded"
                  style={{ background: `${prColor}20`, color: prColor, fontSize: '9px' }}
                >
                  {mod.prioridade}
                </span>
              </div>
              {mod.topicos.slice(0, 2).map((t, j) => (
                <p key={j} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.50)', lineHeight: 1.4 }}>
                  · {t}
                </p>
              ))}
              {mod.topicos.length > 2 && (
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                  +{mod.topicos.length - 2} tópicos
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Tutor message — feedback personalizado tem prioridade sobre dica_tutor genérica */}
      <div
        className="rounded-xl px-4 py-2.5 flex items-start gap-2"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span>💬</span>
        <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="font-semibold" style={{ color: EMERALD }}>FlashTutor: </span>
          {plan.feedback_tutor || plan.dica_tutor || `Bora moer esses cards hoje, ${firstName}?`}
        </p>
      </div>
    </div>
  );
}

// ─── Pontos Críticos ──────────────────────────────────────────────────────────

function PontosCriticos({ pontos, curso }: { pontos: string[]; curso: string | null }) {
  if (pontos.length === 0) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-3"
      style={{ background: `${AMBER}0A`, border: `1px solid ${AMBER}25` }}
    >
      <span>🎯</span>
      <div>
        <p className="text-xs font-bold mb-1" style={{ color: AMBER }}>
          Pontos Críticos {curso ? `para ${curso}` : 'no ENEM'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {pontos.map((p, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${AMBER}15`, color: 'rgba(255,255,255,0.70)', border: `1px solid ${AMBER}30` }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

function BlockCard({ block, onStart, doneToday }: { block: WeekBlock; onStart: () => void; doneToday: boolean }) {
  const color    = doneToday ? EMERALD : (AREA_COLORS[block.area] ?? OCEAN);
  const icon     = AREA_ICONS[block.area] ?? '📚';
  const tagColor = block.isNew ? VIOLET : OCEAN;
  const tagLabel = block.isNew ? 'novo' : 'revisão';

  return (
    <button
      onClick={onStart}
      className="w-full text-left rounded-xl p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] relative overflow-hidden"
      style={{
        background: doneToday ? `${EMERALD}14` : `${color}10`,
        border:     `1px solid ${doneToday ? `${EMERALD}50` : `${color}35`}`,
        boxShadow:  doneToday ? `0 0 14px ${EMERALD}20` : `0 0 12px ${color}08`,
        opacity:    doneToday ? 0.85 : 1,
      }}
    >
      {/* Done checkmark badge */}
      {doneToday && (
        <div
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: EMERALD, fontSize: '8px' }}
        >
          ✓
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ fontSize: '11px' }}>{icon}</span>
        <span className="text-xs font-bold truncate" style={{ color, fontSize: '10px', letterSpacing: '0.04em' }}>
          {block.area}
        </span>
        {!doneToday && (
          <span
            className="ml-auto rounded px-1 font-bold shrink-0"
            style={{ fontSize: '8px', color: tagColor, background: `${tagColor}18`, border: `1px solid ${tagColor}30` }}
          >
            {tagLabel}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-white leading-tight truncate mb-0.5">
        {block.subject}
      </p>
      <p className="leading-tight text-white/50 truncate" style={{ fontSize: '10px' }}>
        {block.deckTitle}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {doneToday
          ? <span style={{ fontSize: '9px', color: EMERALD, fontWeight: 700 }}>✓ feito hoje</span>
          : <>
              <span className="text-xs font-black" style={{ color, fontSize: '10px' }}>{block.cards}</span>
              <span style={{ fontSize: '9px', color: DIM }}>cards · {block.mins}min</span>
            </>
        }
      </div>
    </button>
  );
}

// ─── Empty Day ────────────────────────────────────────────────────────────────

function EmptyDay() {
  return (
    <div className="rounded-xl p-2.5 text-center"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>Dia livre</p>
      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '2px' }}>descanso é parte do método</p>
    </div>
  );
}

// ─── Day Selector ─────────────────────────────────────────────────────────────

function DaySelector({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold" style={{ color: DIM }}>Dias de estudo:</span>
      <div className="flex gap-1.5 flex-wrap">
        {DAYS_SHORT.map((day, i) => {
          const active = value.includes(i);
          return (
            <button
              key={day}
              onClick={() => {
                const next = active ? value.filter(d => d !== i) : [...value, i].sort((a, b) => a - b);
                if (next.length > 0) onChange(next);
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150"
              style={
                active
                  ? { background: `${EMERALD}22`, border: `1px solid ${EMERALD}55`, color: 'white' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: DIM }
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Attack Time Selector ─────────────────────────────────────────────────────

const ATTACK_OPTIONS: { label: string; value: number }[] = [
  { label: '15min', value: 0.25 },
  { label: '30min', value: 0.5  },
  { label: '45min', value: 0.75 },
  { label: '1h',    value: 1    },
];

function AttackTimeSelector({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold" style={{ color: DIM }}>Tempo de ataque:</span>
      <div className="flex gap-1.5 flex-wrap">
        {ATTACK_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150"
            style={
              value === opt.value
                ? { background: `${OCEAN}22`, border: `1px solid ${OCEAN}55`, color: 'white' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: DIM }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 rounded mb-6" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklySchedule() {
  const router = useRouter();
  const [schedData,     setSchedData]     = useState<ScheduleData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [hours,         setHours]         = useState(0.5);
  const [selectedWeek,  setSelectedWeek]  = useState(0);
  const [generating,    setGenerating]    = useState(false);
  const [studyDays,     setStudyDays]     = useState<number[]>(() => {
    if (typeof window === 'undefined') return [0, 1, 2, 3, 4];
    try {
      const saved = localStorage.getItem('flashaprova_study_days');
      if (saved) return JSON.parse(saved) as number[];
    } catch { /* ignore */ }
    return [0, 1, 2, 3, 4];
  });

  function handleStudyDaysChange(days: number[]) {
    setStudyDays(days);
    localStorage.setItem('flashaprova_study_days', JSON.stringify(days));
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];

      const [
        { data: profileData },
        { data: allCards },
        { data: progressRows },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('full_name, target_course, difficulty_subjects, ai_study_plan')
          .eq('id', user.id).maybeSingle(),
        supabase.from('cards')
          .select('id, decks(id, title, subjects(id, title, icon_url, category))'),
        supabase.from('user_progress')
          .select('card_id, interval_days, next_review, history')
          .eq('user_id', user.id),
      ]);

      const rows    = progressRows ?? [];
      const aiPlan  = (profileData?.ai_study_plan as AiStudyPlan | null) ?? null;

      // Pre-fill hours from plan if available
      if (aiPlan?.horas_por_dia) {
        const clamped = Math.min(aiPlan.horas_por_dia, 1);
        const nearest = ATTACK_OPTIONS.reduce((prev, cur) =>
          Math.abs(cur.value - clamped) < Math.abs(prev.value - clamped) ? cur : prev
        );
        setHours(nearest.value);
      }

      // Normalize cards
      type NormCard = { id: string; deckId: string; deckTitle: string; subjectId: string; subjectTitle: string; subjectIconUrl: string | null; subjectCategory: string | null };
      const normCards: NormCard[] = [];
      for (const raw of (allCards ?? []) as Array<{ id: string; decks: unknown }>) {
        const rd = Array.isArray(raw.decks) ? (raw.decks[0] ?? null) : raw.decks as { id: string; title: string; subjects: unknown } | null;
        if (!rd) continue;
        const d  = rd as { id: string; title: string; subjects: unknown };
        const rs = Array.isArray(d.subjects) ? (d.subjects[0] ?? null) : d.subjects as { id: string; title: string; icon_url: string | null; category: string | null } | null;
        if (!rs) continue;
        const s = rs as { id: string; title: string; icon_url: string | null; category: string | null };
        normCards.push({ id: raw.id, deckId: d.id, deckTitle: d.title, subjectId: s.id, subjectTitle: s.title, subjectIconUrl: s.icon_url, subjectCategory: s.category });
      }

      const progMap = new Map(rows.map(r => [r.card_id, r]));
      const nrMap   = new Map(rows.map(r => [r.card_id, r.next_review as string | null]));

      // Due count + new count per deck
      const deckDueMap = new Map<string, { title: string; subject: string; subjectIcon: string; area: string; dueCount: number; newCount: number; subjectId: string }>();
      let totalDue = 0;
      for (const c of normCards) {
        const nr      = nrMap.get(c.id);
        const isNew   = nr === undefined;                           // nunca estudado
        const isDue   = isNew || (nr !== null && nr <= today);     // novo ou agendado para hoje
        const area    = getCategoryShort(c.subjectCategory);
        if (!deckDueMap.has(c.deckId)) {
          deckDueMap.set(c.deckId, {
            title:       c.deckTitle,
            subject:     c.subjectTitle,
            subjectIcon: getSubjectIcon(c.subjectTitle, c.subjectIconUrl, c.subjectCategory),
            area,
            dueCount:    0,
            newCount:    0,
            subjectId:   c.subjectId,
          });
        }
        if (isDue) {
          totalDue++;
          deckDueMap.get(c.deckId)!.dueCount++;
        }
        if (isNew) {
          deckDueMap.get(c.deckId)!.newCount++;
        }
      }

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

      const subjectMastery = new Map(
        Array.from(domainMap.entries()).map(([sid, d]) => [sid, Math.round((d.level / 5) * 100)]),
      );

      const decksWithDue: DeckInfo[] = Array.from(deckDueMap.entries()).map(([id, d]) => ({
        id,
        title:       d.title,
        subject:     d.subject,
        subjectIcon: d.subjectIcon,
        area:        d.area,
        dueCount:    d.dueCount,
        newCount:    d.newCount,
        mastery:     subjectMastery.get(d.subjectId) ?? 0,
      })).sort((a, b) => b.dueCount - a.dueCount);

      // Include non-due decks too
      const allDecksMeta: DeckInfo[] = [];
      const seenDecks = new Set(decksWithDue.map(d => d.id));
      for (const c of normCards) {
        if (seenDecks.has(c.deckId)) continue;
        seenDecks.add(c.deckId);
        allDecksMeta.push({
          id:          c.deckId,
          title:       c.deckTitle,
          subject:     c.subjectTitle,
          subjectIcon: getSubjectIcon(c.subjectTitle, c.subjectIconUrl, c.subjectCategory),
          area:        getCategoryShort(c.subjectCategory),
          dueCount:    0,
          newCount:    0,
          mastery:     subjectMastery.get(c.subjectId) ?? 0,
        });
      }

      const firstName = (profileData?.full_name ?? '').trim().split(/\s+/)[0] || 'você';

      // ── Which decks were studied today? ──────────────────────────────────────
      const todayISO         = today;
      const studiedTodayDecks = new Set<string>();
      let todayReviewCount   = 0;

      // Build card → deckId map
      const cardDeckMap = new Map<string, string>();
      for (const c of normCards) cardDeckMap.set(c.id, c.deckId);

      for (const row of (rows as Array<{ card_id: string; history?: Array<{ reviewed_at: string }> | null }>) ) {
        const hist = row.history ?? [];
        const reviewedToday = hist.some(e => e.reviewed_at?.slice(0, 10) === todayISO);
        if (reviewedToday) {
          const deckId = cardDeckMap.get(row.card_id);
          if (deckId) studiedTodayDecks.add(deckId);
          todayReviewCount += hist.filter(e => e.reviewed_at?.slice(0, 10) === todayISO).length;
        }
      }

      setSchedData({
        decksWithDue:      [...decksWithDue, ...allDecksMeta],
        areaScores,
        difficultyAreas:   (profileData?.difficulty_subjects as string[]) ?? [],
        targetCourse:      profileData?.target_course ?? null,
        firstName,
        totalDue,
        aiPlan,
        studiedTodayDecks,
        todayReviewCount,
      });
      setLoading(false);

      // Auto-regenerate every Monday at 00:01 — no manual button needed
      if (rows.length >= 10) {
        const lastMonday = getLastMondayMidnight();
        const needsRegen = !aiPlan || !aiPlan.generated_at || new Date(aiPlan.generated_at) < lastMonday;
        if (needsRegen) {
          setGenerating(true);
          try {
            const res  = await fetch('/api/ai/generate-schedule', { method: 'POST' });
            const body = await res.json() as { ok?: boolean; plan?: Record<string, unknown>; error?: string };
            if (body.ok && body.plan) {
              setSchedData(prev => prev ? { ...prev, aiPlan: body.plan as AiStudyPlan } : prev);
              setSelectedWeek(0);
              if ((body.plan as AiStudyPlan).horas_por_dia) {
                const clamped = Math.min((body.plan as AiStudyPlan).horas_por_dia, 1);
                const nearest = ATTACK_OPTIONS.reduce((prev, cur) =>
                  Math.abs(cur.value - clamped) < Math.abs(prev.value - clamped) ? cur : prev
                );
                setHours(nearest.value);
              }
            }
          } finally {
            setGenerating(false);
          }
        }
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schedule = useMemo(() => {
    if (!schedData) return null;
    return generateSchedule(hours, schedData.decksWithDue, schedData.areaScores, schedData.difficultyAreas, schedData.aiPlan);
  }, [schedData, hours]);

  const todayIdx        = ((new Date().getDay() + 6) % 7);
  const totalWeekCards  = schedule?.reduce((s, day, i) => studyDays.includes(i) ? s + day.reduce((ds, b) => ds + b.cards, 0) : s, 0) ?? 0;
  const totalWeekMins   = schedule?.reduce((s, day, i) => studyDays.includes(i) ? s + day.reduce((ds, b) => ds + b.mins,  0) : s, 0) ?? 0;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: OCEAN }}>
              FlashTutor IA
            </p>
            <h1 className="text-2xl font-black text-white">
              Cronograma da Semana
            </h1>
            <p className="text-sm mt-0.5" style={{ color: DIM }}>
              {schedData?.aiPlan?.generated_from === 'performance_data'
                ? `Baseado no seu desempenho real · ${schedData.targetCourse ?? 'ENEM'}`
                : schedData?.aiPlan
                  ? `Plano FlashTutor · otimizado para ${schedData.targetCourse ?? 'o ENEM'}`
                  : 'Estude cards e o FlashTutor vai montar seu cronograma'}
            </p>
          </div>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:brightness-125 shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: DIM }}>
            ← Dashboard
          </Link>
        </div>

        {loading ? <Skeleton /> : !schedData ? (
          <p className="text-center py-20" style={{ color: DIM }}>Não foi possível carregar seus dados.</p>
        ) : schedData.decksWithDue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${OCEAN}14`, border: `1px solid ${OCEAN}30` }}>📚</div>
            <p className="text-white font-black text-lg">Adicione decks para montar o cronograma</p>
            <Link href="/dashboard" className="text-xs underline hover:text-white transition-colors" style={{ color: DIM }}>← Ir para o Dashboard</Link>
          </div>
        ) : (
          <>
            {/* ── Atualizando cronograma (auto, toda segunda-feira) ── */}
            {generating && (
              <div
                className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                style={{ background: `${VIOLET}08`, border: `1px solid ${VIOLET}20` }}
              >
                <span className="text-lg">⏳</span>
                <p className="text-xs font-semibold" style={{ color: DIM }}>
                  FlashTutor atualizando seu cronograma…
                </p>
              </div>
            )}

            {/* ── AI Plan banner (se tem plano) ── */}
            {schedData.aiPlan && (
            <AiPlanBanner
              plan={schedData.aiPlan}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              firstName={schedData.firstName}
            />

            )}

            {/* ── Pontos Críticos ── */}
            {schedData.aiPlan && <PontosCriticos
              pontos={schedData.aiPlan.pontos_criticos}
              curso={schedData.targetCourse}
            />}

            {/* ── Controls row ── */}
            <div className="flex flex-col gap-3 mb-5 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <DaySelector value={studyDays} onChange={handleStudyDaysChange} />
              <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <AttackTimeSelector value={hours} onChange={setHours} />
              <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: DIM }}>
                <span>
                  <strong className="text-white">{totalWeekCards.toLocaleString('pt-BR')}</strong> cards
                </span>
                <span>
                  <strong className="text-white">{Math.round(totalWeekMins / 60)}h</strong> na semana
                </span>
                {schedData.todayReviewCount > 0 && (
                  <span className="font-semibold" style={{ color: EMERALD }}>
                    ✓ {schedData.todayReviewCount} revisados hoje
                  </span>
                )}
                {schedData.totalDue > 0 && (
                  <span className="font-semibold" style={{ color: AMBER }}>
                    {schedData.totalDue} pendentes hoje
                  </span>
                )}
                {schedData.aiPlan && schedData.aiPlan.meta_diaria_cards > 0 && (
                  <span className="font-semibold" style={{ color: DIM }}>
                    meta: {schedData.aiPlan.meta_diaria_cards}/dia
                  </span>
                )}
              </div>
            </div>

            {/* ── Area legend ── */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              {(schedData.aiPlan?.prioridades ?? Object.entries(AREA_COLORS).map(([area]) => ({ area, peso: 0, motivo: '' }))).map(({ area, peso, motivo }) => {
                const color = AREA_COLORS[area] ?? OCEAN;
                return (
                  <div key={area} className="flex items-center gap-1.5" title={motivo}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span style={{ fontSize: '11px', color: DIM }}>{area}</span>
                    {peso > 0 && (
                      <span
                        className="rounded px-1"
                        style={{ fontSize: '9px', color, background: `${color}18` }}
                      >
                        {peso}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Weekly Grid ── */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${studyDays.length}, minmax(110px, 1fr))`,
                  minWidth: `${studyDays.length * 115}px`,
                }}
              >
                {/* Day headers */}
                {DAYS_SHORT.map((day, i) => !studyDays.includes(i) ? null : (
                  <div key={day} className="rounded-xl px-2 py-1.5 text-center"
                    style={{
                      background: i === todayIdx ? `${OCEAN}18` : 'rgba(255,255,255,0.04)',
                      border:     `1px solid ${i === todayIdx ? OCEAN + '40' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <p className="text-xs font-bold" style={{ color: i === todayIdx ? OCEAN : 'rgba(255,255,255,0.55)' }}>
                      {day}
                    </p>
                    {i === todayIdx && (
                      <p style={{ fontSize: '8px', color: OCEAN, opacity: 0.7 }}>hoje</p>
                    )}
                  </div>
                ))}

                {/* Blocks */}
                {schedule!.map((dayBlocks, dayIdx) => !studyDays.includes(dayIdx) ? null : (
                  <div key={dayIdx} className="flex flex-col gap-1.5">
                    {dayBlocks.length === 0 ? (
                      <EmptyDay />
                    ) : (
                      dayBlocks.map((block, blockIdx) => (
                        <BlockCard
                          key={blockIdx}
                          block={block}
                          doneToday={dayIdx === todayIdx && schedData.studiedTodayDecks.has(block.deckId)}
                          onStart={() => router.push(`/study/turbo?decks=${block.deckId}`)}
                        />
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer ── */}
            <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.22)' }}>
              <Link href="/dashboard/settings" className="underline hover:text-white transition-colors">
                Atualizar Perfil de Estudos
              </Link>
            </p>

          </>
        )}
      </div>
    </main>
  );
}
