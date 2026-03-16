'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────

const MATURE_THRESHOLD = 21; // days
const NEON_GREEN       = '#00ff80';
const NEON_ORANGE      = '#f97316';

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

type HeatDay = { date: string; dayOfWeek: number; weekIndex: number };

/** Build 13 full weeks ending today, aligned to Sunday. */
function buildHeatmapGrid(): HeatDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday 13 weeks ago
  const start = new Date(today);
  start.setDate(today.getDate() - 13 * 7);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  const todayISO = today.toISOString().split('T')[0];
  const days: HeatDay[] = [];
  const cur = new Date(start);
  let week  = 0;

  while (cur <= today) {
    const iso = cur.toISOString().split('T')[0];
    if (iso <= todayISO) {
      days.push({ date: iso, dayOfWeek: cur.getDay(), weekIndex: week });
    }
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() === 0) week++;
  }
  return days;
}

function heatColor(count: number): { bg: string; glow: string } {
  if (count === 0)   return { bg: 'rgba(255,255,255,0.05)', glow: 'none' };
  if (count <= 5)    return { bg: 'rgba(0,255,128,0.20)',   glow: 'none' };
  if (count <= 20)   return { bg: 'rgba(0,255,128,0.45)',   glow: 'none' };
  if (count <= 50)   return { bg: 'rgba(0,255,128,0.72)',   glow: '0 0 4px rgba(0,255,128,0.5)' };
  return               { bg: '#00ff80',                     glow: '0 0 8px rgba(0,255,128,0.8)' };
}

// ─── Radial Donut (gradient arc) ──────────────────────────────────────────────

function DonutDomain({ pct }: { pct: number }) {
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  const id = 'domain-grad';

  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  const offset = circ - (anim / 100) * circ;

  return (
    <svg width="130" height="130" viewBox="0 0 100 100" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={NEON_ORANGE} />
          <stop offset="100%" stopColor={NEON_GREEN}  />
        </linearGradient>
      </defs>

      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />

      {/* Progress arc */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{
          transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 4px ${NEON_ORANGE}88) drop-shadow(0 0 10px ${NEON_GREEN}44)`,
        }}
      />

      {/* Center text */}
      <text x="50" y="45" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Inter,system-ui">
        {anim}%
      </text>
      <text x="50" y="57" textAnchor="middle" fill="#475569" fontSize="5.8" letterSpacing="0.8" fontFamily="Inter,system-ui">
        DO EDITAL
      </text>
      <text x="50" y="65" textAnchor="middle" fill="#475569" fontSize="5.8" letterSpacing="0.8" fontFamily="Inter,system-ui">
        DOMINADO
      </text>
    </svg>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const WEEK_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Heatmap({ dailyCounts }: { dailyCounts: Map<string, number> }) {
  const grid    = useMemo(buildHeatmapGrid, []);
  const todayISO = new Date().toISOString().split('T')[0];
  const numWeeks = (grid[grid.length - 1]?.weekIndex ?? 0) + 1;

  const CELL = 11; // px
  const GAP  = 3;  // px
  const totalW = numWeeks * (CELL + GAP);

  return (
    <div className="overflow-x-auto pb-1 -mx-1">
      <div style={{ minWidth: totalW + 36, paddingLeft: '4px' }}>

        {/* Day-of-week labels */}
        <div style={{ display: 'flex', gap: `${GAP}px`, marginBottom: `${GAP}px`, paddingLeft: '28px' }}>
          {/* empty week columns — just spacer */}
        </div>

        <div style={{ display: 'flex', gap: `${GAP}px` }}>

          {/* Day labels (Mon-Sun) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, marginRight: '4px' }}>
            {WEEK_LABELS.map((l, i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: `${CELL}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.20)',
                  lineHeight: 1,
                }}
              >
                {i % 2 === 0 ? l : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {Array.from({ length: numWeeks }, (_, wi) => {
            const weekDays = grid.filter(d => d.weekIndex === wi);
            return (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {Array.from({ length: 7 }, (_, dow) => {
                  const day    = weekDays.find(d => d.dayOfWeek === dow);
                  if (!day)    return <div key={dow} style={{ width: CELL, height: CELL }} />;
                  const count  = dailyCounts.get(day.date) ?? 0;
                  const { bg, glow } = heatColor(count);
                  const isToday = day.date === todayISO;
                  return (
                    <div
                      key={dow}
                      title={`${day.date}: ${count} revisão${count !== 1 ? 'ões' : ''}`}
                      style={{
                        width:        CELL,
                        height:       CELL,
                        borderRadius: '2px',
                        background:   bg,
                        boxShadow:    isToday ? `0 0 0 1px ${NEON_GREEN}` : glow,
                        transition:   'background 0.2s',
                        cursor:       'default',
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3" style={{ paddingLeft: '18px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>Menos</span>
          {[0, 5, 20, 50, 100].map((n, i) => {
            const { bg } = heatColor(n);
            return (
              <div
                key={i}
                style={{ width: CELL, height: CELL, borderRadius: '2px', background: bg }}
              />
            );
          })}
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>Mais</span>
        </div>

      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1].map(i => (
        <div
          key={i}
          className="rounded-2xl animate-pulse"
          style={{ height: '200px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      ))}
    </div>
  );
}

// ─── Data types ───────────────────────────────────────────────────────────────

type ProgressRow = {
  interval_days: number;
  history:       Array<{ reviewed_at: string }> | null;
};

type Metrics = {
  maturePct:  number;
  matureCount: number;
  totalCards: number;
  dailyCounts: Map<string, number>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Parallel fetch: user progress + total card count
      const [{ data: progressRows }, { count: totalCards }] = await Promise.all([
        supabase
          .from('user_progress')
          .select('interval_days, history')
          .eq('user_id', user.id),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
      ]);

      const rows = (progressRows as ProgressRow[]) ?? [];
      const total = totalCards ?? 0;

      // Mature cards (interval > MATURE_THRESHOLD)
      const matureCount = rows.filter(r => (r.interval_days ?? 0) > MATURE_THRESHOLD).length;
      const maturePct   = total > 0 ? Math.round((matureCount / total) * 100) : 0;

      // Build heatmap: aggregate reviewed_at dates from history arrays
      const dailyCounts = new Map<string, number>();
      for (const row of rows) {
        for (const entry of row.history ?? []) {
          const day = entry.reviewed_at?.slice(0, 10);
          if (day) dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
        }
      }

      setMetrics({ maturePct, matureCount, totalCards: total, dailyCounts });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (!metrics) return null;

  const matureLabel = metrics.maturePct >= 70
    ? 'Memorização sólida 🧠'
    : metrics.maturePct >= 40
    ? 'Construindo base'
    : metrics.maturePct > 0
    ? 'Iniciando consolidação'
    : 'Comece a revisar!';

  return (
    <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* ── Card 1: Domínio do Edital ──────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:          'rgba(255,255,255,0.04)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:              '1px solid rgba(249,115,22,0.22)',
          boxShadow:           '0 0 40px rgba(249,115,22,0.06)',
        }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(249,115,22,0.08) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.40), rgba(0,255,128,0.20), transparent)' }} />

        <p className="text-xs font-semibold tracking-widest uppercase mb-4 relative z-10"
          style={{ color: NEON_ORANGE }}>
          Domínio do Edital
        </p>

        <div className="flex items-center gap-5 relative z-10">
          <DonutDomain pct={metrics.maturePct} />

          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-base font-bold text-white leading-tight">{matureLabel}</span>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: NEON_GREEN }} />
                <span className="text-xs text-slate-400">
                  <span className="text-white font-semibold">{metrics.matureCount}</span> maduros (&gt;21 dias)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <span className="text-xs text-slate-400">
                  <span className="text-white font-semibold">{metrics.totalCards}</span> cards no sistema
                </span>
              </div>
            </div>

            {/* Gradient bar */}
            <div className="h-1.5 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width:      `${metrics.maturePct}%`,
                  background: `linear-gradient(90deg, ${NEON_ORANGE}, ${NEON_GREEN})`,
                  boxShadow:  `0 0 8px ${NEON_GREEN}66`,
                  transition:  'width 1.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Consistência — Heatmap ─────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:          'rgba(255,255,255,0.04)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:              '1px solid rgba(0,255,128,0.20)',
          boxShadow:           '0 0 40px rgba(0,255,128,0.04)',
        }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(0,255,128,0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.35), transparent)' }} />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NEON_GREEN }}>
            Consistência
          </p>
          <span className="text-xs text-slate-500">últimos 3 meses</span>
        </div>

        <div className="relative z-10">
          <Heatmap dailyCounts={metrics.dailyCounts} />
        </div>
      </div>

    </div>
  );
}
