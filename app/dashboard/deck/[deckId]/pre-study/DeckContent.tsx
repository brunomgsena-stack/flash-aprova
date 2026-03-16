'use client';

import { useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

type TableRow = Record<string, string>;
type ComparativeTable = { headers: string[]; rows: TableRow[] };

type AccordionItem = {
  id:         string;
  icon:       string;
  title:      string;
  hasContent: boolean;
  content:    React.ReactNode;
};

type Props = {
  color:                  string;
  plan:                   'flash' | 'proai_plus';
  summary_markdown:       string | null;
  comparative_table_json: unknown;
  mnemonics:              string | null;
};

// ─── Markdown renderers ───────────────────────────────────────────────────────

const md: Components = {
  h1: ({ children }) => <h1 className="text-white text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-white text-base font-bold mt-4 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-white text-sm font-semibold mt-3 mb-1 first:mt-0">{children}</h3>,
  p:  ({ children }) => <p  className="text-slate-300 text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="text-slate-400 italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300 text-sm">{children}</ol>,
  li: ({ children }) => <li className="text-slate-300 text-sm leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500 pl-4 my-3 text-slate-400 text-sm italic">{children}</blockquote>
  ),
  code: ({ children, className }) =>
    className?.includes('language-')
      ? <pre className="bg-black/30 border border-white/10 rounded-lg p-3 overflow-x-auto my-3 text-xs text-slate-300"><code>{children}</code></pre>
      : <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded text-xs">{children}</code>,
  hr: () => <hr className="border-white/10 my-4" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTable(raw: unknown): ComparativeTable | null {
  if (!raw) return null;
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (p && Array.isArray(p.headers) && Array.isArray(p.rows)) return p as ComparativeTable;
  } catch { /* malformed */ }
  return null;
}

// ─── Lock icon ────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="rgba(212,175,55,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Upgrade modal ────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(45deg, #B8B8B8 0%, #D4AF37 30%, #F9D423 55%, #E8E8E8 80%, #C8C8C8 100%)',
          border:     '1px solid rgba(255,255,255,0.35)',
          boxShadow:  '0 8px 48px rgba(212,175,55,0.35), 0 1px 0 rgba(255,255,255,0.5) inset',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sheen */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.07) 100%)' }} />

        <div className="relative p-7 flex flex-col items-center text-center gap-4">

          {/* Robot icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.14)', border: '1px solid rgba(255,255,255,0.28)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.72)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <rect x="9" y="7" width="6" height="4" rx="1" />
              <line x1="12" y1="7" x2="12" y2="4" />
              <circle cx="12" cy="3" r="1" />
              <line x1="8"  y1="16" x2="8"  y2="16" strokeWidth="2.4" />
              <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.4" />
              <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.4" />
              <line x1="3"  y1="15" x2="1"  y2="15" />
              <line x1="21" y1="15" x2="23" y2="15" />
            </svg>
          </div>

          <div>
            <p className="font-black text-lg leading-tight mb-1" style={{ color: '#0f172a' }}>
              Conteúdo exclusivo ProAI+ 🤖
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,23,42,0.65)' }}>
              Resumos, Tabelas e Áudio-Resumos são exclusivos do ProAI+. Desbloqueie acesso completo à Base de Conhecimento e acelere sua aprovação.
            </p>
          </div>

          {/* CTA */}
          <a
            href="/subscription"
            className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background:    '#0f0a1e',
              color:         '#e8e8e8',
              border:        '1px solid rgba(255,255,255,0.15)',
              boxShadow:     '0 2px 14px rgba(0,0,0,0.45)',
              letterSpacing: '0.01em',
            }}
          >
            Fazer Upgrade para ProAI+ →
          </a>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="text-xs font-medium transition-opacity hover:opacity-100"
            style={{ color: 'rgba(15,23,42,0.45)', opacity: 0.7 }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionRow({
  item, color, defaultOpen, locked, onLockedClick,
}: {
  item:          AccordionItem;
  color:         string;
  defaultOpen:   boolean;
  locked:        boolean;
  onLockedClick: () => void;
}) {
  const [open, setOpen]   = useState(defaultOpen && !locked);
  const bodyRef           = useRef<HTMLDivElement>(null);

  function handleToggle() {
    if (locked) { onLockedClick(); return; }
    setOpen(o => !o);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: open ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border:     `1px solid ${open && !locked ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
        boxShadow:  open && !locked ? `0 0 20px ${color}10` : 'none',
      }}
    >
      {/* ── Header button ── */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all duration-200"
          style={{
            background: open && !locked ? `${color}20` : 'rgba(255,255,255,0.06)',
            border:     `1px solid ${open && !locked ? `${color}44` : 'rgba(255,255,255,0.10)'}`,
            opacity:    locked ? 0.5 : 1,
          }}
        >
          {item.icon}
        </div>

        {/* Title + lock badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="font-semibold text-sm transition-colors duration-200"
            style={{ color: open && !locked ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.55)' }}
          >
            {item.title}
          </span>

          {locked && (
            <span className="flex items-center gap-1 shrink-0">
              <LockIcon />
              <span
                className="text-xs font-semibold"
                style={{ color: 'rgba(212,175,55,0.85)' }}
              >
                ProAI+
              </span>
            </span>
          )}

          {!locked && !item.hasContent && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{
                color:      'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.06)',
                border:     '1px solid rgba(255,255,255,0.10)',
              }}
            >
              Em breve
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className="shrink-0 transition-transform duration-300"
          style={{
            transform: open && !locked ? 'rotate(180deg)' : 'rotate(0deg)',
            color:     open && !locked ? color : 'rgba(255,255,255,0.20)',
          }}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Collapsible body ── */}
      {!locked && (
        <div
          ref={bodyRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: open ? (bodyRef.current?.scrollHeight ?? 2000) + 'px' : '0px',
            opacity:   open ? 1 : 0,
          }}
        >
          <div className="mx-5 h-px" style={{ background: `${color}20` }} />
          <div className="px-5 py-5">
            {item.hasContent ? item.content : (
              <p className="text-slate-500 text-sm">Conteúdo em preparação. Em breve por aqui!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeckContent({ color, plan, summary_markdown, comparative_table_json, mnemonics }: Props) {
  const [showModal, setShowModal] = useState(false);
  const table   = parseTable(comparative_table_json);
  const isFlash = plan === 'flash';

  const items: AccordionItem[] = [
    {
      id:         'summary',
      icon:       '📖',
      title:      'Resumo Teórico',
      hasContent: !!summary_markdown,
      content: summary_markdown ? (
        <ReactMarkdown components={md}>{summary_markdown}</ReactMarkdown>
      ) : null,
    },
    {
      id:         'table',
      icon:       '📊',
      title:      'Tabelas Comparativas',
      hasContent: !!table,
      content: table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}22` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  {table.headers.map((h, ci) => (
                    <td
                      key={ci}
                      className="py-2.5 px-3 text-slate-300 text-sm align-top"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      {row[h] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null,
    },
    {
      id:         'audio',
      icon:       '🎧',
      title:      'Áudio-Resumo',
      hasContent: false,
      content:    null,
    },
    ...(mnemonics ? [{
      id:         'mnemonics',
      icon:       '🧠',
      title:      'Macetes & Mnemonics',
      hasContent: true,
      content:    <ReactMarkdown components={md}>{mnemonics}</ReactMarkdown>,
    }] : []),
  ];

  return (
    <>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <AccordionRow
            key={item.id}
            item={item}
            color={color}
            defaultOpen={idx === 0 && item.hasContent && !isFlash}
            locked={isFlash}
            onLockedClick={() => setShowModal(true)}
          />
        ))}
      </div>
    </>
  );
}
