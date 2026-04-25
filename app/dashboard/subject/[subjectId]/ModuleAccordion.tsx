'use client';

import { useState } from 'react';
import DeckCard from './DeckCard';
import { useTheme } from '@/components/ThemeProvider';
import { getSubjectIcon } from '@/lib/iconMap';

type Deck = {
  id:    string;
  title: string;
};

type Module = {
  id:          string;
  title:       string;
  order_index: number;
  decks:       Deck[];
};

type Props = {
  modules:      Module[];
  color:        string;
  subjectTitle: string;
  subjectIcon:  string | null;
  subjectCat:   string | null;
};

export default function ModuleAccordion({ modules, color, subjectTitle, subjectIcon, subjectCat }: Props) {
  const moduleIcon = getSubjectIcon(subjectTitle, subjectIcon, subjectCat);
  const { theme } = useTheme();
  const isLight   = theme === 'light';
  const [open, setOpen] = useState<string | null>(modules[0]?.id ?? null);

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="text-5xl">📦</span>
        <p className="text-slate-500 text-lg">Nenhum módulo disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {modules.map((mod, idx) => {
        const isOpen = open === mod.id;
        const deckCount = mod.decks.length;

        return (
          <div
            key={mod.id}
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: isOpen
                ? `${color}08`
                : isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isOpen
                ? `${color}44`
                : isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isOpen
                ? isLight ? `0 2px 12px ${color}18` : `0 0 24px ${color}14`
                : isLight ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
            }}
          >
            {/* ── Module header ──────────────────────────────────────── */}
            <button
              onClick={() => setOpen(isOpen ? null : mod.id)}
              className="w-full flex items-center gap-4 px-6 py-4 text-left group"
            >
              {/* Order badge */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                style={{
                  background: isOpen
                    ? `${color}22`
                    : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isOpen
                    ? `${color}55`
                    : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)'}`,
                  color: isOpen ? color : isLight ? '#64748B' : 'rgba(255,255,255,0.4)',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{moduleIcon}</span>
                <span
                  className="font-bold tracking-wide truncate transition-colors duration-200"
                  style={{
                    color:    isOpen ? color : isLight ? '#1E293B' : 'rgba(255,255,255,0.85)',
                    fontSize: '0.95rem',
                  }}
                >
                  {mod.title}
                </span>
              </div>

              {/* Deck count */}
              <span className="text-xs text-slate-500 shrink-0 mr-2">
                {deckCount} deck{deckCount !== 1 ? 's' : ''}
              </span>

              {/* Chevron */}
              <svg
                className="shrink-0 transition-transform duration-300"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color:     isOpen ? color : isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)',
                }}
                width="16" height="16" viewBox="0 0 16 16" fill="none"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* ── Deck grid (expandable) ─────────────────────────────── */}
            {isOpen && (
              <div className="px-6 pb-6">
                {/* Divider */}
                <div
                  className="h-px mb-5"
                  style={{ background: `linear-gradient(90deg, ${color}33, transparent)` }}
                />

                {deckCount === 0 ? (
                  /* ── Empty state ────────────────────────────────────── */
                  <div
                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                    style={{
                      background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                      border:     isLight ? '1px dashed rgba(0,0,0,0.10)' : '1px dashed rgba(255,255,255,0.10)',
                    }}
                  >
                    <span className="text-2xl">🤖</span>
                    <p className="text-slate-500 text-sm leading-snug">
                      Gere um deck com IA para este módulo 🤖
                    </p>
                  </div>
                ) : (
                  /* ── DeckCards grid ──────────────────────────────────── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mod.decks.map(deck => (
                      <DeckCard
                        key={deck.id}
                        id={deck.id}
                        title={deck.title}
                        color={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
