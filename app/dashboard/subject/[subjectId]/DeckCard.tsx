'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/components/ThemeProvider';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const VIOLET = '#7C3AED';
const NEON   = '#00FF73';

// ─── Progress level config ─────────────────────────────────────────────────────
type LevelId = 'iniciante' | 'progresso' | 'avancado' | 'mestre';

interface Level {
  id:    LevelId;
  label: string;
  color: string;
  glow:  boolean;
}

function getLevel(pct: number): Level {
  if (pct >= 100) return { id: 'mestre',    label: 'Mestre',       color: NEON,      glow: true  };
  if (pct >= 71)  return { id: 'avancado',  label: 'Avançado',     color: NEON,      glow: false };
  if (pct >= 31)  return { id: 'progresso', label: 'Em Progresso', color: VIOLET,    glow: false };
  return               { id: 'iniciante', label: 'Iniciante',    color: '#64748b', glow: false };
}

// ─── Component ─────────────────────────────────────────────────────────────────

type Props = {
  id:    string;
  title: string;
  color: string;
};

export default function DeckCard({ id, title, color }: Props) {
  const { theme }  = useTheme();
  const isLight    = theme === 'light';

  const [hovered,     setHovered]     = useState(false);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [totalCards,  setTotalCards]  = useState<number | null>(null);

  // Fetch de progresso — auto-contido, 2 queries leves por card
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProgressPct(0); return; }

      // 1. Todos os cards deste deck
      const { data: cards } = await supabase
        .from('cards')
        .select('id')
        .eq('deck_id', id);

      if (!cards || cards.length === 0) {
        setTotalCards(0);
        setProgressPct(0);
        return;
      }
      setTotalCards(cards.length);

      // 2. Quantos o usuário já revisou (tem entrada em user_progress)
      const { count: reviewed } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('card_id', cards.map(c => c.id));

      setProgressPct(Math.round(((reviewed ?? 0) / cards.length) * 100));
    }
    load();
  }, [id]);

  const level = progressPct !== null ? getLevel(progressPct) : null;

  return (
    <Link
      href={`/dashboard/deck/${id}/pre-study`}
      className="group relative block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
      style={{
        background:           isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
        backdropFilter:       isLight ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: isLight ? 'none' : 'blur(16px)',
        border:     `1px solid ${hovered ? `${VIOLET}cc` : isLight ? `${VIOLET}30` : `${VIOLET}40`}`,
        boxShadow:  hovered
          ? isLight
            ? `0 4px 24px ${VIOLET}28, 0 1px 4px rgba(0,0,0,0.08)`
            : `0 0 28px ${VIOLET}40, 0 0 56px ${VIOLET}18`
          : isLight
            ? '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)'
            : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Radial glow bg */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top left, ${VIOLET}14 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}80, transparent)` }}
      />

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        {/* Deck icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}40` }}
        >
          🃏
        </div>

        {/* Card count badge */}
        {totalCards !== null && totalCards > 0 && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: `${VIOLET}18`,
              color:       VIOLET,
              border:      `1px solid ${VIOLET}30`,
            }}
          >
            {totalCards} cards
          </span>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h2 className="text-base font-bold mb-4 relative z-10 leading-snug" style={{ color: isLight ? '#0A0A0A' : '#ffffff' }}>
        {title}
      </h2>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div className="relative z-10 mb-4">
        {progressPct !== null && level ? (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: level.color }}>
                {level.label}
              </span>
              <span className="text-xs text-slate-600">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.max(progressPct, progressPct > 0 ? 4 : 0)}%`,
                  background:  level.color,
                  boxShadow:   level.glow ? `0 0 8px ${level.color}90, 0 0 16px ${level.color}40` : 'none',
                }}
              />
            </div>
          </>
        ) : (
          /* Skeleton enquanto carrega */
          <div
            className="w-full h-1.5 rounded-full animate-pulse"
            style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}
          />
        )}
      </div>

      {/* ── CTA row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between relative z-10">
        <span
          className="text-sm font-semibold"
          style={{ color: NEON }}
        >
          Estudar agora →
        </span>
        <div
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: hovered ? NEON : VIOLET,
            boxShadow:  hovered ? `0 0 8px ${NEON}` : 'none',
          }}
        />
      </div>
    </Link>
  );
}
