import { supabase } from './supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserStats = {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
};

// ── Fetch current stats ───────────────────────────────────────────────────────

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const { data } = await supabase
    .from('user_stats')
    .select('current_streak, longest_streak, last_study_date')
    .eq('user_id', userId)
    .maybeSingle();

  return data ?? { current_streak: 0, longest_streak: 0, last_study_date: null };
}

// ── Update streak (safe to call multiple times — idempotent per day) ──────────

export async function updateStreak(userId: string): Promise<UserStats> {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('user_stats')
    .select('current_streak, longest_streak, last_study_date')
    .eq('user_id', userId)
    .maybeSingle();

  // Already updated today — no-op
  if (existing?.last_study_date === today) {
    return {
      current_streak: existing.current_streak,
      longest_streak: existing.longest_streak,
      last_study_date: existing.last_study_date,
    };
  }

  const prevStreak  = existing?.current_streak  ?? 0;
  const prevLongest = existing?.longest_streak  ?? 0;
  const lastDate    = existing?.last_study_date ?? null;

  // Consecutive day → increment; gap → reset to 1
  const newStreak  = lastDate === yesterday ? prevStreak + 1 : 1;
  const newLongest = Math.max(newStreak, prevLongest);

  const payload = {
    user_id:         userId,
    current_streak:  newStreak,
    longest_streak:  newLongest,
    last_study_date: today,
  };

  await supabase
    .from('user_stats')
    .upsert(payload, { onConflict: 'user_id' });

  return { current_streak: newStreak, longest_streak: newLongest, last_study_date: today };
}
