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
};

type Props = {
  subjects: Subject[];
};

export default function SubjectsWithDomain({ subjects }: Props) {
  const [domainMap, setDomainMap] = useState<Map<string, DomainLevel>>(new Map());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || subjects.length === 0) return;

      // All cards with their subject (via deck FK)
      const { data: allCards } = await supabase
        .from('cards')
        .select('id, decks(subject_id)');

      // All user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('card_id, interval_days')
        .eq('user_id', user.id);

      if (!allCards || !progress) return;

      // Supabase returns decks as array for to-one joins; normalise to object | null
      const normalised = (allCards as { id: string; decks: unknown }[]).map((c) => ({
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
    return (
      <p className="text-slate-500 col-span-3 text-center py-20">
        Nenhuma matéria encontrada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((s) => (
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
  );
}
