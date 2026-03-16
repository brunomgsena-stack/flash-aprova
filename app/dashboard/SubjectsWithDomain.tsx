'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap, type DomainLevel } from '@/lib/domain';
import SubjectCard from './SubjectCard';

type Subject = {
  id:       string;
  title:    string;
  icon:     string;
  color:    string;
  category: string | null;
};

type Props = { subjects: Subject[] };

const ENEM_ORDER = [
  'Ciências da Natureza',
  'Ciências Humanas',
  'Linguagens e Códigos',
  'Matemática',
];

const CATEGORY_ACCENT: Record<string, string> = {
  'Ciências da Natureza': '#00e5ff',
  'Ciências Humanas':     '#a855f7',
  'Linguagens e Códigos': '#f97316',
  'Matemática':           '#00ff80',
};

const CATEGORY_ICON: Record<string, string> = {
  'Ciências da Natureza': '🔬',
  'Ciências Humanas':     '🌍',
  'Linguagens e Códigos': '✍️',
  'Matemática':           '📐',
};

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

  // Group subjects by category
  const grouped = new Map<string, Subject[]>();
  const noCategory: Subject[] = [];

  for (const s of subjects) {
    const cat = s.category ?? '';
    if (!cat) { noCategory.push(s); continue; }
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(s);
  }

  const orderedGroups: { cat: string; items: Subject[] }[] = [];
  for (const cat of ENEM_ORDER) {
    if (grouped.has(cat)) orderedGroups.push({ cat, items: grouped.get(cat)! });
  }
  // Any remaining categories not in ENEM_ORDER
  for (const [cat, items] of grouped) {
    if (!ENEM_ORDER.includes(cat)) orderedGroups.push({ cat, items });
  }
  if (noCategory.length > 0) orderedGroups.push({ cat: 'Outras', items: noCategory });

  return (
    <div className="flex flex-col gap-12">
      {orderedGroups.map(({ cat, items }) => {
        const accent = CATEGORY_ACCENT[cat] ?? '#7C3AED';
        const catIcon = CATEGORY_ICON[cat] ?? '📚';

        return (
          <section key={cat}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: `${accent}18`, border: `1px solid ${accent}44` }}
              >
                {catIcon}
              </div>
              <h2 className="text-lg font-bold text-white">{cat}</h2>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}33, transparent)` }} />
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
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
