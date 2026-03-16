'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { buildDomainMap } from '@/lib/domain';
import { getCategoryInfo, ENEM_AREAS } from '@/lib/categories';
import MasteryRadarChart, { type RadarPoint }      from './charts/MasteryRadarChart';
import RetentionAreaChart, { type RetentionPoint } from './charts/RetentionAreaChart';

// ── Day label helper ───────────────────────────────────────────────────────────

const PT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  const d = new Date(iso + 'T12:00:00'); // avoid TZ shift
  return `${PT_DAYS[d.getDay()]} ${d.getDate()}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1].map(i => (
        <div
          key={i}
          className="rounded-2xl animate-pulse"
          style={{ height: '240px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type SubjectRow = { id: string; category: string | null };

export default function ChartsRow({ subjects }: { subjects: SubjectRow[] }) {
  const [radarData,    setRadarData]    = useState<RadarPoint[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionPoint[]>([]);
  const [ready,        setReady]        = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setReady(true); return; }

      // ── 1. Cards + subject mapping ──────────────────────────────────────────
      const { data: allCards } = await supabase
        .from('cards')
        .select('id, decks(subject_id)');

      // ── 2. User progress ────────────────────────────────────────────────────
      const today   = new Date().toISOString().split('T')[0];
      const day7    = new Date(Date.now() + 6 * 864e5).toISOString().split('T')[0];

      const { data: progress } = await supabase
        .from('user_progress')
        .select('card_id, interval_days, next_review')
        .eq('user_id', user.id);

      if (!allCards || !progress) { setReady(true); return; }

      // ── 3. Domain map ───────────────────────────────────────────────────────
      const normalised = (allCards as { id: string; decks: unknown }[]).map(c => ({
        id:    c.id,
        decks: Array.isArray(c.decks)
          ? (c.decks[0] as { subject_id: string } ?? null)
          : (c.decks as { subject_id: string } | null),
      }));
      const domainMap = buildDomainMap(normalised, progress);

      // ── 4. Mastery per ENEM area ────────────────────────────────────────────
      // Map: canonical short name → { sum, count }
      const shortScore = new Map<string, { sum: number; count: number }>();

      for (const subj of subjects) {
        const cat = subj.category;
        if (!cat) continue;
        const short = getCategoryInfo(cat).short;
        if (!shortScore.has(short)) shortScore.set(short, { sum: 0, count: 0 });
        const dom = domainMap.get(subj.id);
        if (dom) {
          const s = shortScore.get(short)!;
          s.sum   += dom.level;
          s.count += 1;
        }
      }

      const radar: RadarPoint[] = ENEM_AREAS.map(info => {
        const s = shortScore.get(info.short);
        const mastery = s && s.count > 0 ? Math.round((s.sum / s.count / 5) * 100) : 0;
        return { area: info.short, mastery, fullMark: 100 };
      });

      // ── 5. Retention curve (next 7 days) ────────────────────────────────────
      const dueCounts = new Map<string, number>();
      for (const p of progress) {
        if (p.next_review >= today && p.next_review <= day7) {
          dueCounts.set(p.next_review, (dueCounts.get(p.next_review) ?? 0) + 1);
        }
      }

      const retention: RetentionPoint[] = Array.from({ length: 7 }, (_, i) => {
        const iso = new Date(Date.now() + i * 864e5).toISOString().split('T')[0];
        return {
          label:   dayLabel(iso, i),
          due:     dueCounts.get(iso) ?? 0,
          isToday: i === 0,
        };
      });

      setRadarData(radar);
      setRetentionData(retention);
      setReady(true);
    }
    load();
  }, [subjects]);

  if (!ready) return <Skeleton />;

  const cardStyle = {
    background:           'rgba(255,255,255,0.04)',
    backdropFilter:       'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:               '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="max-w-5xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Radar */}
      <div className="relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,255,0.05) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)' }} />
        <div className="relative z-10" style={{ height: '200px' }}>
          <MasteryRadarChart data={radarData} />
        </div>
      </div>

      {/* Retention */}
      <div className="relative rounded-2xl p-6 overflow-hidden" style={cardStyle}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(0,255,128,0.05) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.25), transparent)' }} />
        <div className="relative z-10" style={{ height: '200px' }}>
          <RetentionAreaChart data={retentionData} />
        </div>
      </div>

    </div>
  );
}
