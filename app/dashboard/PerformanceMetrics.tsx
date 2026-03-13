'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAILY_GOAL = 20;
const EF_MIN     = 1.3;
const EF_MAX     = 3.5;
const CYAN       = '#00e5ff';
const GREEN      = '#00ff80';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function efToPercent(ef: number) {
  return Math.min(100, Math.max(0, Math.round(((ef - EF_MIN) / (EF_MAX - EF_MIN)) * 100)));
}

function efLabel(pct: number): { text: string; color: string } {
  if (pct >= 85) return { text: 'Excelente!',         color: GREEN };
  if (pct >= 65) return { text: 'Bom desempenho',     color: '#3b82f6' };
  if (pct >= 40) return { text: 'Em progresso',       color: '#f97316' };
  return               { text: 'Precisa de atenção',  color: '#ef4444' };
}

// ─── Donut chart ─────────────────────────────────────────────────────────────

function DonutChart({ pct, color }: { pct: number; color: string }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const offset = circ - (anim / 100) * circ;

  return (
    <svg width="112" height="112" viewBox="0 0 100 100" className="shrink-0">
      {/* Track */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="9"
      />
      {/* Arc */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 10px ${color}88)`,
        }}
      />
      <text x="50" y="47" textAnchor="middle" fill="white" fontSize="17" fontWeight="700" fontFamily="Inter,system-ui">
        {anim}%
      </text>
      <text x="50" y="63" textAnchor="middle" fill="#475569" fontSize="7.5" letterSpacing="1" fontFamily="Inter,system-ui">
        APROVAÇÃO
      </text>
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl animate-pulse"
          style={{
            height: '172px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Metrics = {
  avgEF:         number;
  reviewedToday: number;
  pendingToday:  number;
  totalStudied:  number;
};

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];

      const { data: rows } = await supabase
        .from('user_progress')
        .select('ease_factor, next_review, history')
        .eq('user_id', user.id);

      if (!rows || rows.length === 0) {
        setMetrics({ avgEF: 2.5, reviewedToday: 0, pendingToday: 0, totalStudied: 0 });
        setLoading(false);
        return;
      }


      const avgEF = rows.reduce((s, p) => s + (p.ease_factor ?? 2.5), 0) / rows.length;

      const reviewedToday = rows.filter((p) =>
        Array.isArray(p.history) &&
        p.history.some((h: { reviewed_at: string }) => h.reviewed_at?.startsWith(today))
      ).length;

      // Cards still due: next_review <= today and not reviewed today
      // (after reviewing, next_review moves to tomorrow or later, so this is naturally accurate)
      const pendingToday = rows.filter((p) => p.next_review <= today).length;

      setMetrics({ avgEF, reviewedToday, pendingToday, totalStudied: rows.length });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (!metrics) return null;

  const pct     = efToPercent(metrics.avgEF);
  const label   = efLabel(pct);
  const goalPct = Math.min(100, (metrics.reviewedToday / DAILY_GOAL) * 100);
  const goalOk  = metrics.reviewedToday >= DAILY_GOAL;

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* ── Card 1: Poder de Aprovação ─────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden pulse-glow-cyan"
        style={{
          background:          'rgba(255,255,255,0.04)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:              '1px solid rgba(0,229,255,0.28)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,255,0.07) 0%, transparent 65%)' }}
        />
        {/* Inset top line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)' }}
        />

        <p className="text-xs font-semibold tracking-widest uppercase mb-4 relative z-10" style={{ color: CYAN }}>
          Poder de Aprovação
        </p>

        <div className="flex items-center gap-6 relative z-10">
          <DonutChart pct={pct} color={label.color} />

          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xl font-bold text-white leading-tight">{label.text}</span>
            <span className="text-slate-400 text-sm">
              Facilidade média:{' '}
              <span className="text-white font-semibold">{metrics.avgEF.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 text-xs">
              {metrics.totalStudied} card{metrics.totalStudied !== 1 ? 's' : ''} estudados
            </span>

            {/* Mini gradient bar */}
            <div
              className="h-1.5 rounded-full mt-2"
              style={{ background: 'rgba(255,255,255,0.07)', width: '100%' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${label.color}77, ${label.color})`,
                  boxShadow: `0 0 6px ${label.color}88`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Status da Mente ────────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden pulse-glow-green"
        style={{
          background:          'rgba(255,255,255,0.04)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:              '1px solid rgba(0,255,128,0.28)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(0,255,128,0.07) 0%, transparent 65%)' }}
        />
        {/* Inset top line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.25), transparent)' }}
        />

        <div className="flex items-start justify-between mb-5 relative z-10">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: GREEN }}>
            Status da Mente
          </p>
          <span className="text-xs text-slate-500">{todayLabel}</span>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 mb-5 relative z-10">
          <div>
            <p className="text-3xl font-bold text-white leading-none">{metrics.reviewedToday}</p>
            <p className="text-xs text-slate-400 mt-1">revisados hoje</p>
          </div>

          <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <div>
            <p
              className="text-3xl font-bold leading-none"
              style={{ color: metrics.pendingToday > 0 ? '#f97316' : GREEN }}
            >
              {metrics.pendingToday}
            </p>
            <p className="text-xs text-slate-400 mt-1">pendentes</p>
          </div>
        </div>

        {/* Daily goal bar */}
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500">Meta diária</span>
            <span
              className="text-xs font-semibold"
              style={{ color: goalOk ? GREEN : '#475569' }}
            >
              {metrics.reviewedToday} / {DAILY_GOAL}{goalOk ? ' ✓' : ''}
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${goalPct}%`,
                background: goalOk
                  ? `linear-gradient(90deg, ${GREEN}, ${CYAN})`
                  : `linear-gradient(90deg, ${GREEN}88, ${GREEN})`,
                boxShadow: goalOk
                  ? `0 0 10px rgba(0,255,128,0.55)`
                  : `0 0 6px rgba(0,255,128,0.28)`,
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
