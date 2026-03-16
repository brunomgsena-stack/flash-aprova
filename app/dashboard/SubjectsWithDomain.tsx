'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap, type DomainLevel } from '@/lib/domain';
import { getCategoryInfo, ENEM_AREAS } from '@/lib/categories';
import SubjectCard from './SubjectCard';

type Subject = {
  id:       string;
  title:    string;
  icon:     string;
  color:    string;
  category: string | null;
};

type Props = { subjects: Subject[] };

export default function SubjectsWithDomain({ subjects }: Props) {
  const [domainMap, setDomainMap] = useState<Map<string, DomainLevel>>(new Map());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || subjects.length === 0) return;

      const [{ data: allCards }, { data: progress }] = await Promise.all([
        supabase.from('cards').select('id, decks(subject_id)'),
        supabase.from('user_progress').select('card_id, interval_days').eq('user_id', user.id),
      ]);

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

  // ── Normalize: group by canonical short name so any DB variation maps correctly ──
  // e.g. 'MATEMÁTICA E SUAS TECNOLOGIAS', 'Matemática', 'MATEMÁTICA' → all → 'Matemática'
  const groupedByShort = new Map<string, { subjects: Subject[]; info: ReturnType<typeof getCategoryInfo> }>();

  for (const s of subjects) {
    const info  = getCategoryInfo(s.category);
    const short = info.short; // canonical key
    if (!groupedByShort.has(short)) groupedByShort.set(short, { subjects: [], info });
    groupedByShort.get(short)!.subjects.push(s);
  }

  // ── Order: ENEM canonical order first, then any extras ──
  const ordered: { short: string; subjects: Subject[]; info: ReturnType<typeof getCategoryInfo> }[] = [];
  const placed  = new Set<string>();

  for (const area of ENEM_AREAS) {
    if (groupedByShort.has(area.short)) {
      ordered.push({ short: area.short, ...groupedByShort.get(area.short)! });
      placed.add(area.short);
    }
  }
  for (const [short, group] of groupedByShort) {
    if (!placed.has(short)) ordered.push({ short, ...group });
  }

  return (
    <div className="flex flex-col gap-12">
      {ordered.map(({ short, subjects: items, info }) => (
        <section key={short}>

          {/* ── Section header ─────────────────────────────────────────── */}
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

          {/* ── Cards grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(s => (
              <SubjectCard
                key={s.id}
                id={s.id}
                title={s.title}
                icon={s.icon}
                color={s.color}
                domain={domainMap.get(s.id)}
              />
            ))}
          </div>

        </section>
      ))}
    </div>
  );
}
