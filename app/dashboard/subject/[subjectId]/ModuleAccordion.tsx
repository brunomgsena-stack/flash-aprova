'use client';

import { useState } from 'react';
import DeckCard from './DeckCard';

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
  modules: Module[];
  color:   string;
};

const MODULE_ICONS: Record<number, string> = {
  1: '🌿', 2: '🫀', 3: '🔬', 4: '🧬',
  5: '🦕', 6: '🌱', 7: '🦎', 8: '🦠',
};

export default function ModuleAccordion({ modules, color }: Props) {
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
        const isOpen    = open === mod.id;
        const modIcon   = MODULE_ICONS[mod.order_index] ?? '📂';
        const deckCount = mod.decks.length;

        return (
          <div
            key={mod.id}
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: isOpen ? `${color}08` : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${isOpen ? `${color}44` : 'rgba(255,255,255,0.08)'}`,
              boxShadow:  isOpen ? `0 0 24px ${color}14` : 'none',
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
                  background: isOpen ? `${color}22` : 'rgba(255,255,255,0.06)',
                  border:     `1px solid ${isOpen ? `${color}55` : 'rgba(255,255,255,0.12)'}`,
                  color:      isOpen ? color : 'rgba(255,255,255,0.4)',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{modIcon}</span>
                <span
                  className="font-bold tracking-wide truncate transition-colors duration-200"
                  style={{
                    color:    isOpen ? color : 'rgba(255,255,255,0.85)',
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
                  color:     isOpen ? color : 'rgba(255,255,255,0.25)',
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
                      background: 'rgba(255,255,255,0.02)',
                      border:     '1px dashed rgba(255,255,255,0.10)',
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
