'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserStats } from '@/lib/streak';

export default function StreakBadge() {
  const [streak,  setStreak]  = useState<number | null>(null);
  const [longest, setLongest] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const stats = await fetchUserStats(user.id);
      setStreak(stats.current_streak);
      setLongest(stats.longest_streak);
    }
    load();
  }, []);

  if (streak === null) return null;

  const hot = streak >= 3;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300"
      title={`Maior ofensiva: ${longest} dias`}
      style={{
        background:  hot ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.05)',
        border:      `1px solid ${hot ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow:   hot ? '0 0 16px rgba(251,146,60,0.2)' : 'none',
        animation:   hot ? 'pulse-streak 3s ease-in-out infinite' : 'none',
      }}
    >
      <span className="text-base leading-none" style={{ filter: hot ? 'drop-shadow(0 0 4px #fb923c)' : 'none' }}>
        🔥
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: hot ? '#fb923c' : '#64748b' }}
      >
        {streak}
      </span>
      <span className="text-xs text-slate-500 hidden sm:inline">
        {streak === 1 ? 'dia' : 'dias'}
      </span>
    </div>
  );
}
