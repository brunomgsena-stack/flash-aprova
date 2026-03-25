'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap, type DomainLevel } from '@/lib/domain';
import { getCategoryInfo, ENEM_AREAS } from '@/lib/categories';
import { fetchUserPlan } from '@/lib/plan';
import SubjectCard from './SubjectCard';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';

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
}: SectionData & { domainMap: Map<string, DomainLevel>; onLockedClickFor?: (id: string) => (() => void) | undefined }) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: `${info.color}18`, border: `1px solid ${info.color}44` }}
        >
          {info.icon}
        </div>
        <h2 className="text-lg font-bold text-white">{info.displayName}</h2>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${info.color}33, transparent)` }} />
        <span className="text-xs text-slate-600">
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
  const [domainMap,      setDomainMap]      = useState<Map<string, DomainLevel>>(new Map());
  const [isFlash,        setIsFlash]        = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || subjects.length === 0) return;

      const [{ data: allCards }, { data: progress }, planInfo] = await Promise.all([
        supabase.from('cards').select('id, decks(subject_id)'),
        supabase.from('user_progress').select('card_id, interval_days').eq('user_id', user.id),
        fetchUserPlan(user.id),
      ]);

      setIsFlash(planInfo.plan === 'flash');

      if (!allCards || !progress) return;

      const normalised = (allCards as { id: string; decks: unknown }[]).map(c => ({
        id:    c.id,
        decks: Array.isArray(c.decks)
          ? (c.decks[0] as { subject_id: string } ?? null)
          : (c.decks as { subject_id: string } | null),
      }));

      setDomainMap(buildDomainMap(normalised, progress));
    }
    load();
  }, [subjects]);

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

  // ── Order: ENEM canonical order first, then extras ─────────────────────────
  const ordered: SectionData[] = [];
  const placed  = new Set<string>();

  for (const area of ENEM_AREAS) {
    if (groupedByShort.has(area.short)) {
      ordered.push(groupedByShort.get(area.short)!);
      placed.add(area.short);
    }
  }
  for (const [short, group] of groupedByShort) {
    if (!placed.has(short)) ordered.push(group);
  }

  // ── Build render groups: Matemática + Redação are paired side-by-side ──────
  const PAIRED = new Set(['Matemática', 'Redação']);

  type RenderGroup =
    | { type: 'solo';   section: SectionData }
    | { type: 'paired'; sections: [SectionData, SectionData] };

  const renderGroups: RenderGroup[] = [];
  const pairBuffer: SectionData[]   = [];

  for (const section of ordered) {
    if (PAIRED.has(section.short)) {
      pairBuffer.push(section);
      if (pairBuffer.length === 2) {
        renderGroups.push({ type: 'paired', sections: [pairBuffer[0], pairBuffer[1]] });
        pairBuffer.length = 0;
      }
    } else {
      // flush any lone paired item as solo before continuing
      if (pairBuffer.length > 0) {
        renderGroups.push({ type: 'solo', section: pairBuffer[0] });
        pairBuffer.length = 0;
      }
      renderGroups.push({ type: 'solo', section });
    }
  }
  for (const s of pairBuffer) renderGroups.push({ type: 'solo', section: s });

  // ── Helper: returns locked click handler for Flash + Redação ───────────────
  function lockedClickFor(id: string): (() => void) | undefined {
    return isFlash && id === 'redacao-flash' ? () => setUpgradeVisible(true) : undefined;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    {upgradeVisible && <AiProUpgradeModal onClose={() => setUpgradeVisible(false)} />}
    <div className="flex flex-col gap-12">
      {renderGroups.map((group) => {
        if (group.type === 'solo') {
          return (
            <SectionBlock
              key={group.section.short}
              {...group.section}
              domainMap={domainMap}
              onLockedClickFor={lockedClickFor}
            />
          );
        }

        // Paired: single full-width header + 2-column card grid
        const pairedColor = '#7C3AED';
        const allPairedSubjects = group.sections.flatMap(s => s.subjects);
        return (
          <section key="paired-mat-red">
            {/* Full-width section header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: `${pairedColor}18`, border: `1px solid ${pairedColor}44` }}
              >
                📐✒️
              </div>
              <h2 className="text-lg font-bold text-white">Matemática e Redação</h2>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pairedColor}33, transparent)` }} />
              <span className="text-xs text-slate-600">
                {allPairedSubjects.length} matéria{allPairedSubjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards: 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {allPairedSubjects.map(s => (
                <SubjectCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  icon={s.icon}
                  color={s.color}
                  domain={domainMap.get(s.id)}
                  onLockedClick={lockedClickFor(s.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
    </>
  );
}
