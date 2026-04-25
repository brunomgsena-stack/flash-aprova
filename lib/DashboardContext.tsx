'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan } from '@/lib/plan';
import { buildDomainMap, type DomainLevel } from '@/lib/domain';

// ─── Raw row types (superset of all component needs) ─────────────────────────

export type RawCard = {
  id: string;
  decks: {
    id: string;
    title: string;
    subject_id: string;
    subjects: {
      id: string;
      title: string;
      icon_url: string | null;
      category: string | null;
    } | null;
  } | null;
};

export type ProgressRow = {
  card_id: string;
  interval_days: number | null;
  next_review: string | null;
  lapses: number | null;
  history: Array<{ reviewed_at: string }> | null;
};

export type ProfileData = {
  target_course?: string | null;
  target_university?: string | null;
  difficulty_subjects?: string[] | null;
  daily_card_goal?: number | null;
  full_name?: string | null;
};

// ─── Normalized card (computed once, used by all components) ──────────────────

export type NormCard = {
  id: string;
  deckId: string;
  deckTitle: string;
  subjectId: string;
  subjectTitle: string;
  subjectIconUrl: string | null;
  subjectCategory: string | null;
};

// ─── Context shape ───────────────────────────────────────────────────────────

export type DashboardData = {
  userId: string;
  plan: Plan;
  profile: ProfileData;
  normCards: NormCard[];
  progress: ProgressRow[];
  totalCardCount: number;
  domainMap: Map<string, DomainLevel>;
  dailyCounts: Map<string, number>;
  totalReviews: number;
};

type DashboardState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; data: DashboardData };

const DashboardContext = createContext<DashboardState>({ status: 'loading' });

// ─── Normalize raw Supabase cards ────────────────────────────────────────────

function normalizeCards(rawCards: RawCard[]): NormCard[] {
  const result: NormCard[] = [];
  for (const raw of rawCards) {
    const deck = Array.isArray(raw.decks) ? raw.decks[0] : raw.decks;
    if (!deck) continue;
    const subj = Array.isArray(deck.subjects) ? deck.subjects[0] : deck.subjects;
    if (!subj) continue;
    result.push({
      id: raw.id,
      deckId: deck.id,
      deckTitle: deck.title,
      subjectId: subj.id,
      subjectTitle: subj.title,
      subjectIconUrl: subj.icon_url,
      subjectCategory: subj.category,
    });
  }
  return result;
}

// ─── Compute daily review counts from history ────────────────────────────────

function computeDailyCounts(progress: ProgressRow[]): { dailyCounts: Map<string, number>; totalReviews: number } {
  const dailyCounts = new Map<string, number>();
  let totalReviews = 0;
  for (const row of progress) {
    for (const entry of row.history ?? []) {
      const day = entry.reviewed_at?.slice(0, 10);
      if (day) {
        dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
        totalReviews++;
      }
    }
  }
  return { dailyCounts, totalReviews };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setState({ status: 'empty' }); return; }

      const [planInfo, cardsRes, progressRes, countRes, profileRes] = await Promise.all([
        fetchUserPlan(user.id),
        supabase.from('cards').select('id, decks(id, title, subject_id, subjects(id, title, icon_url, category))'),
        supabase.from('user_progress').select('card_id, interval_days, next_review, lapses, history').eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('target_course, target_university, difficulty_subjects, daily_card_goal, full_name')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const normCards = normalizeCards((cardsRes.data ?? []) as unknown as RawCard[]);
      const progress = (progressRes.data ?? []) as ProgressRow[];
      const totalCardCount = countRes.count ?? 0;

      // Domain map (used by ChartsRow, SubjectsWithDomain, PerformanceMetrics, StudentDashboard)
      const domainMap = buildDomainMap(
        normCards.map(c => ({ id: c.id, decks: { subject_id: c.subjectId } })),
        progress.map(r => ({ card_id: r.card_id, interval_days: r.interval_days ?? 0 })),
      );

      // Daily counts (used by StudentDashboard, PerformanceMetrics)
      const { dailyCounts, totalReviews } = computeDailyCounts(progress);

      setState({
        status: 'ready',
        data: {
          userId: user.id,
          plan: planInfo.plan,
          profile: (profileRes.data as ProfileData) ?? {},
          normCards,
          progress,
          totalCardCount,
          domainMap,
          dailyCounts,
          totalReviews,
        },
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardContext.Provider value={state}>
      {children}
    </DashboardContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDashboardData(): DashboardState {
  return useContext(DashboardContext);
}
