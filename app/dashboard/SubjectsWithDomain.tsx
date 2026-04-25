'use client';

import { useMemo, useState } from 'react';
import { type DomainLevel } from '@/lib/domain';
import { getCategoryInfo, getCategoryShort, ENEM_AREAS } from '@/lib/categories';
import { useDashboardData } from '@/lib/DashboardContext';
import SubjectCard from './SubjectCard';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';
import WritingAuditModule from './WritingAuditModule';
import MathPrecisionModule from './MathPrecisionModule';

const EMERALD = '#10B981';

type Subject = {
  id:       string;
  title:    string;
  icon:     string;
  color:    string;
  category: string | null;
};

type SectionData = {
  short:    string;
  subjects: Subject[];
  info:     ReturnType<typeof getCategoryInfo>;
};

type Props = { subjects: Subject[] };

// ─── Reusable section block ────────────────────────────────────────────────────

function SectionBlock({
  subjects: items,
  info,
  domainMap,
  onLockedClickFor,
  isPriority,
}: SectionData & { domainMap: Map<string, DomainLevel>; onLockedClickFor?: (id: string) => (() => void) | undefined; isPriority?: boolean }) {
  return (
    <section id={`area-${info.short.toLowerCase()}`}>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: `${info.color}18`, border: `1px solid ${info.color}44` }}
        >
          {info.icon}
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--fa-text)' }}>{info.displayName}</h2>
        {isPriority && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${EMERALD}18`, color: EMERALD, border: `1px solid ${EMERALD}35` }}>
            💡 Sugerido
          </span>
        )}
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${info.color}33, transparent)` }} />
        <span className="text-xs" style={{ color: 'var(--fa-text-2)' }}>
          {items.length} matéria{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(s => (
          <SubjectCard
            key={s.id}
            id={s.id}
            title={s.title}
            icon={s.icon}
            color={s.color}
            domain={domainMap.get(s.id)}
            onLockedClick={onLockedClickFor?.(s.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SubjectsWithDomain({ subjects }: Props) {
  const dashState = useDashboardData();
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const domainMap = dashState.status === 'ready' ? dashState.data.domainMap : new Map<string, DomainLevel>();
  const isFlash   = dashState.status === 'ready' ? dashState.data.plan === 'aceleracao' : false;

  // ── Determine priority area (weakest with progress) ────────────────────────
  const priorityArea = useMemo(() => {
    if (dashState.status !== 'ready') return null;
    const { normCards, domainMap: dm } = dashState.data;
    const subjAreaMap = new Map(normCards.map(c => [c.subjectId, getCategoryShort(c.subjectCategory)]));
    const shortScore = new Map<string, { sum: number; count: number }>();
    for (const [sid, domain] of dm.entries()) {
      const area = subjAreaMap.get(sid);
      if (!area) continue;
      const s = shortScore.get(area) ?? { sum: 0, count: 0 };
      s.sum += domain.coverage; s.count++;
      shortScore.set(area, s);
    }
    let weakest: string | null = null, weakestScore = 101;
    for (const area of ENEM_AREAS) {
      const s = shortScore.get(area.short);
      const score = s && s.count > 0 ? (s.sum / s.count) * 100 : 0;
      if (score > 0 && score < weakestScore) { weakestScore = score; weakest = area.short; }
    }
    return weakest;
  }, [dashState]);

  if (subjects.length === 0) {
    return <p className="text-slate-500 text-center py-20">Nenhuma matéria encontrada.</p>;
  }

  // ── Group by canonical short name ──────────────────────────────────────────
  const groupedByShort = new Map<string, SectionData>();

  for (const s of subjects) {
    const info  = getCategoryInfo(s.category);
    const short = info.short;
    if (!groupedByShort.has(short)) groupedByShort.set(short, { short, subjects: [], info });
    groupedByShort.get(short)!.subjects.push(s);
  }

  // ── Order: priority area first, then ENEM canonical order, then extras ──────
  const ordered: SectionData[] = [];
  const placed  = new Set<string>();

  // Priority area goes first
  if (priorityArea && groupedByShort.has(priorityArea)) {
    ordered.push(groupedByShort.get(priorityArea)!);
    placed.add(priorityArea);
  }

  for (const area of ENEM_AREAS) {
    if (groupedByShort.has(area.short) && !placed.has(area.short)) {
      ordered.push(groupedByShort.get(area.short)!);
      placed.add(area.short);
    }
  }
  for (const [short, group] of groupedByShort) {
    if (!placed.has(short)) ordered.push(group);
  }

  // ── Render groups: each section is standalone ──────────────────────────────
  type RenderGroup = { type: 'solo'; section: SectionData };
  const renderGroups: RenderGroup[] = ordered.map(section => ({ type: 'solo', section }));

  // ── Helper: returns locked click handler for Flash + Redação ───────────────
  function lockedClickFor(id: string): (() => void) | undefined {
    return isFlash && id === 'redacao-flash' ? () => setUpgradeVisible(true) : undefined;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    {upgradeVisible && <AiProUpgradeModal onClose={() => setUpgradeVisible(false)} />}
    <div className="flex flex-col gap-12">
      {renderGroups.map(({ section }) => {
        if (section.short === 'Redação') {
          return (
            <WritingAuditModule
              key="writing-audit"
              subjects={section.subjects}
              domainMap={domainMap}
              onLockedClickFor={lockedClickFor}
            />
          );
        }

        if (section.short === 'Matemática') {
          return (
            <MathPrecisionModule
              key="math-precision"
              subjects={section.subjects}
              domainMap={domainMap}
            />
          );
        }

        return (
          <SectionBlock
            key={section.short}
            {...section}
            domainMap={domainMap}
            onLockedClickFor={lockedClickFor}
            isPriority={section.short === priorityArea}
          />
        );
      })}
    </div>
    </>
  );
}

