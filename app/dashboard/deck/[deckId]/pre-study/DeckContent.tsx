'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { getTutor, getOpeningMessage, type Tutor } from '@/lib/tutor-engine';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type TableRow = Record<string, string>;
type ComparativeTable = { headers: string[]; rows: TableRow[] };

type Props = {
  color:                  string;
  plan:                   'aceleracao' | 'panteao_elite';
  subjectTitle:           string | null;
  deckTitle:              string;
  summary_markdown:       string | null;
  comparative_table_json: unknown;
  mnemonics:              string | null;
};

type ChatMessage = {
  id:     string;
  role:   'tutor' | 'user';
  text:   string;
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

// ─── Tutor card ───────────────────────────────────────────────────────────────

function TutorCard({ tutor, plan, subjectTitle, onStartChat, onUpgradeClick }: { tutor: Tutor; plan: 'aceleracao' | 'panteao_elite'; subjectTitle: string | null; onStartChat: () => void; onUpgradeClick: () => void }) {
  const isPro   = plan === 'panteao_elite';
  const VIOLET  = '#a855f7';

  return (
    <div
      className="relative rounded-2xl p-5 mb-4 overflow-hidden flex items-center gap-5"
      style={{
        background:           'rgba(10,5,20,0.88)',
        border:               `1px solid rgba(168,85,247,0.35)`,
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow:            `0 0 48px rgba(168,85,247,0.14)`,
      }}
    >
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}70, transparent)` }} />

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            border:    `1px solid ${VIOLET}50`,
            boxShadow: `0 0 24px ${VIOLET}35`,
          }}
        >
          <Image
            src={tutor.avatar_url}
            alt={tutor.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        {isPro && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#050b14]"
            style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e80' }} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-white font-black text-base leading-tight">
            {tutor.name}: Sua Dúvida Resolvida AGORA.
          </p>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          {isPro
            ? `Trava em ${subjectTitle ?? tutor.specialty}? Pergunte agora e desbloqueie o caminho mais rápido.`
            : `Desbloqueie o ${tutor.name} com o AiPro+ e tenha um especialista 24h ao seu lado.`}
        </p>
      </div>

      {/* CTA */}
      <div className="shrink-0">
        {isPro ? (
          <button
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, #7c3aed, ${VIOLET})`,
              boxShadow:  `0 0 22px ${VIOLET}55`,
            }}
            onClick={onStartChat}
          >
            Falar com {tutor.name}
          </button>
        ) : (
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            style={{
              background: `rgba(168,85,247,0.15)`,
              border:     `1px solid ${VIOLET}40`,
            }}
          >
            Desbloquear →
          </button>
        )}
      </div>
    </div>
  );
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
              Conteúdo exclusivo AiPro+ 🤖
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,23,42,0.65)' }}>
              Resumos, Tabelas e Áudio-Resumos são exclusivos do AiPro+. Desbloqueie acesso completo à Base de Conhecimento e acelere sua aprovação.
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
            Fazer Upgrade para AiPro+ →
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

// ─── Arsenal Card ─────────────────────────────────────────────────────────────

function ArsenalCard({
  icon, title, description, color, locked, hasContent, content, onLockedClick, defaultOpen,
}: {
  icon:          React.ReactNode;
  title:         string;
  description:   string;
  color:         string;
  locked:        boolean;
  hasContent:    boolean;
  content:       React.ReactNode;
  onLockedClick: () => void;
  defaultOpen?:  boolean;
}) {
  const [open, setOpen] = useState(!!(defaultOpen && !locked && hasContent));
  const bodyRef         = useRef<HTMLDivElement>(null);

  function handleToggle() {
    if (locked) { onLockedClick(); return; }
    if (!hasContent) return;
    setOpen(o => !o);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background:           open ? 'rgba(10,5,25,0.92)' : 'rgba(10,5,20,0.80)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               `1px solid ${open && !locked ? `${color}50` : 'rgba(255,255,255,0.08)'}`,
        boxShadow:            open && !locked ? `0 0 32px ${color}20, 0 4px 24px rgba(0,0,0,0.40)` : '0 2px 12px rgba(0,0,0,0.20)',
      }}
    >
      {/* Top shimmer */}
      <div className="h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${open && !locked ? '80' : '30'}, transparent)`,
        }} />

      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Icon bubble */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: open && !locked ? `${color}22` : 'rgba(255,255,255,0.06)',
            border:     `1px solid ${open && !locked ? `${color}55` : 'rgba(255,255,255,0.10)'}`,
            boxShadow:  open && !locked ? `0 0 20px ${color}45` : 'none',
            color:      open && !locked ? color : 'rgba(255,255,255,0.40)',
            opacity:    locked ? 0.5 : 1,
          }}
        >
          {icon}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="font-bold text-sm transition-colors duration-200"
              style={{ color: open && !locked ? '#fff' : 'rgba(255,255,255,0.65)' }}
            >
              {title}
            </span>

            {locked && (
              <span className="flex items-center gap-1 shrink-0">
                <LockIcon />
                <span className="text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.85)' }}>AiPro+</span>
              </span>
            )}

            {!locked && !hasContent && (
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
          <p className="text-xs text-slate-600">{description}</p>
        </div>

        {/* Chevron */}
        {!locked && hasContent && (
          <svg
            className="shrink-0 transition-transform duration-300"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              color:     open ? color : 'rgba(255,255,255,0.20)',
            }}
            width="16" height="16" viewBox="0 0 16 16" fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Body */}
      {!locked && (
        <div
          ref={bodyRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: open ? (bodyRef.current?.scrollHeight ?? 2000) + 'px' : '0px',
            opacity:   open ? 1 : 0,
          }}
        >
          <div className="mx-5 h-px" style={{ background: `${color}25` }} />
          <div className="px-5 py-5">
            {hasContent ? content : (
              <p className="text-slate-500 text-sm">Conteúdo em preparação. Em breve por aqui!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat view ────────────────────────────────────────────────────────────────

function ChatView({
  tutor, deckTitle, subjectTitle, color, onBack,
}: {
  tutor:         Tutor;
  deckTitle:     string;
  subjectTitle:  string | null;
  color:         string;
  onBack:        () => void;
}) {
  const VIOLET = '#7C3AED';
  const CYAN   = '#06b6d4';

  const opening = getOpeningMessage(tutor, deckTitle);
  const [messages, setMessages]           = useState<ChatMessage[]>([
    { id: 'open', role: 'tutor', text: opening },
  ]);
  const [input, setInput]                 = useState('');
  const [typing, setTyping]               = useState(false);
  const [apiError, setApiError]           = useState('');
  // Stores the last OpenAI response ID for conversation continuity
  const previousResponseIdRef             = useRef<string | undefined>(undefined);
  const bottomRef                         = useRef<HTMLDivElement>(null);
  const inputRef                          = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function sendMessage(text: string) {
    if (!text || typing) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setApiError('');

    try {
      const res = await fetch('/api/chat/tutor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:              text,
          deck_title:           deckTitle,
          subject_title:        subjectTitle ?? tutor.specialty,
          previous_response_id: previousResponseIdRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      // Persist response ID so next turn continues the same conversation
      if (data.previous_response_id) previousResponseIdRef.current = data.previous_response_id;
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: data.text ?? '' }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApiError(msg);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setTyping(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  }

  function handleSendText(text: string) {
    sendMessage(text);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const SUGGESTIONS = [
    { label: 'Como isso cai no ENEM? 🎯', text: 'Como esse tema cai no ENEM? Quais são os tipos de questão mais comuns?' },
    { label: 'Qual a pegadinha? ⚠️',      text: 'Qual é a principal pegadinha desse tema que derruba os alunos na prova?' },
    { label: 'Resumo em 3 engrenagens. ⚙️', text: 'Me dê um resumo desse tema em exatamente 3 engrenagens (pontos-chave).' },
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden -mx-4 sm:-mx-8 -my-12">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center gap-4 px-4 sm:px-8 py-4"
        style={{
          background:   'rgba(5,3,15,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Base de Conhecimento
        </button>

        <div className="w-px h-6 bg-white/10 shrink-0" />

        {/* Tutor info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden"
              style={{
                border:    `1px solid ${CYAN}40`,
                boxShadow: `0 0 16px ${CYAN}30`,
              }}
            >
              <Image
                src={tutor.avatar_url}
                alt={tutor.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            {/* Online dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#05030f]"
              style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e80' }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm">{tutor.name}</p>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  color: '#fff',
                  boxShadow: `0 0 8px ${VIOLET}50`,
                }}
              >
                Consultoria AiPro+
              </span>
            </div>
            <p className="text-xs" style={{ color: CYAN }}>
              <span className="mr-1.5 text-green-400">●</span>
              Online agora · {tutor.tagline.split('·')[0].trim()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Deck context pill ── */}
      <div
        className="shrink-0 flex items-center gap-2 px-4 sm:px-8 py-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="2" stroke={color} strokeWidth="1.5"/>
          <path d="M5 7h6M5 10h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Consultoria sobre: <span className="font-semibold" style={{ color: `${color}cc` }}>{deckTitle}</span>
        </p>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {/* Tutor avatar */}
            {msg.role === 'tutor' && (
              <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden mt-0.5"
                style={{ border: `1px solid ${CYAN}30` }}>
                <Image src={tutor.avatar_url} alt={tutor.name} width={32} height={32}
                  className="w-full h-full object-cover" unoptimized />
              </div>
            )}

            {/* Bubble */}
            <div
              className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'tutor'
                  ? {
                      background:   'rgba(255,255,255,0.05)',
                      border:       '1px solid rgba(255,255,255,0.09)',
                      color:        'rgba(255,255,255,0.90)',
                      borderRadius: '4px 18px 18px 18px',
                    }
                  : {
                      background:   `linear-gradient(135deg, ${VIOLET}cc, ${CYAN}99)`,
                      color:        '#fff',
                      borderRadius: '18px 4px 18px 18px',
                      boxShadow:    `0 4px 16px ${VIOLET}40`,
                    }
              }
            >
              {msg.role === 'tutor' ? (
                <ReactMarkdown
                  components={{
                    // Block-level — must stay as block so \n\n creates visible gaps
                    p:  ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                    h3: ({ children }) => <h3 className="font-black text-white text-sm mb-3 mt-1 first:mt-0">{children}</h3>,
                    h2: ({ children }) => <h2 className="font-black text-white text-sm mb-3 mt-1 first:mt-0">{children}</h2>,
                    ul: ({ children }) => <ul className="list-none space-y-2 mb-3">{children}</ul>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    // Inline
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    em:     ({ children }) => <em className="italic text-slate-300">{children}</em>,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden mt-0.5"
              style={{ border: `1px solid ${CYAN}30` }}>
              <Image src={tutor.avatar_url} alt={tutor.name} width={32} height={32}
                className="w-full h-full object-cover" unoptimized />
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
              style={{
                background:   'rgba(255,255,255,0.05)',
                border:       '1px solid rgba(255,255,255,0.09)',
                borderRadius: '4px 18px 18px 18px',
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: CYAN,
                    animation:  `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    opacity:    0.5,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="shrink-0 px-4 sm:px-8 py-4"
        style={{
          background:   'rgba(5,3,15,0.95)',
          borderTop:    '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Suggestion chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => handleSendText(s.text)}
              disabled={typing}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:-translate-y-px disabled:opacity-30 whitespace-nowrap"
              style={{
                background:           'rgba(255,255,255,0.06)',
                border:               '1px solid rgba(255,255,255,0.12)',
                backdropFilter:       'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color:                'rgba(255,255,255,0.70)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.45)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.70)';
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border:     '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Pergunte ao ${tutor.name}...`}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder:text-slate-600 leading-relaxed"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
            disabled={typing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || typing}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-30"
            style={{
              background: input.trim() && !typing
                ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                : 'rgba(255,255,255,0.08)',
              boxShadow: input.trim() && !typing ? `0 0 16px ${VIOLET}60` : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L7 9M14 2L10 14l-3-5-5-3 12-4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {apiError && (
          <p className="text-center text-xs text-red-400 mt-1">{apiError}</p>
        )}
        <p className="text-center text-xs text-slate-700 mt-2">
          {tutor.name} pode cometer erros. Verifique informações importantes.
        </p>
      </div>

      {/* Typing dot keyframe injection */}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconFileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);
const IconHeadphones = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);
const IconLayoutDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9"/>
    <rect x="14" y="3" width="7" height="5"/>
    <rect x="14" y="12" width="7" height="9"/>
    <rect x="3" y="16" width="7" height="5"/>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeckContent({ color, plan, subjectTitle, deckTitle, summary_markdown, comparative_table_json, mnemonics }: Props) {
  const [showModal,        setShowModal]        = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [view, setView]                         = useState<'knowledge' | 'chat'>('knowledge');
  const table   = parseTable(comparative_table_json);
  const isFlash = plan === 'aceleracao';
  const tutor   = getTutor(subjectTitle);

  if (view === 'chat' && tutor) {
    return (
      <ChatView
        tutor={tutor}
        deckTitle={deckTitle}
        subjectTitle={subjectTitle}
        color={color}
        onBack={() => setView('knowledge')}
      />
    );
  }

  // ── Fixed colors per arsenal card ──
  const ORANGE = '#f97316';
  const PINK   = '#ec4899';
  const BLUE   = '#3b82f6';
  const YELLOW = '#eab308';

  return (
    <>
      {showModal        && <UpgradeModal        onClose={() => setShowModal(false)} />}
      {showUpgradeModal && <AiProUpgradeModal   onClose={() => setShowUpgradeModal(false)} />}

      {/* ── Pilar 1: Mentoria com Especialista ── */}
      {tutor && (
        <TutorCard
          tutor={tutor}
          plan={plan}
          subjectTitle={subjectTitle}
          onStartChat={() => setView('chat')}
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}

      {/* ── Pilares 2-5: Grid 2x2 Ataque Tático ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Raio-X de Vulnerabilidades */}
        <ArsenalCard
          icon={<IconZap />}
          title="Raio-X de Vulnerabilidades"
          description="Onde seu cérebro está falhando?"
          color={ORANGE}
          locked={isFlash}
          hasContent={!!table}
          defaultOpen={false}
          onLockedClick={() => setShowModal(true)}
          content={
            table ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {table.headers.map((h, i) => (
                        <th key={i}
                          className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider"
                          style={{ background: `${ORANGE}18`, color: ORANGE, border: `1px solid ${ORANGE}22` }}
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
                          <td key={ci}
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
            ) : null
          }
        />

        {/* Guia Tático de Elite */}
        <ArsenalCard
          icon={<IconFileText />}
          title="Guia Tático de Elite"
          description="Estude o que realmente cai."
          color={PINK}
          locked={isFlash}
          hasContent={!!summary_markdown}
          defaultOpen={!!summary_markdown && !isFlash}
          onLockedClick={() => setShowModal(true)}
          content={
            summary_markdown ? (
              <ReactMarkdown components={md}>{summary_markdown}</ReactMarkdown>
            ) : null
          }
        />

        {/* Imersão Auditiva */}
        <ArsenalCard
          icon={<IconHeadphones />}
          title="Imersão Auditiva (Podcast)"
          description="Estude enquanto faz outra coisa."
          color={BLUE}
          locked={isFlash}
          hasContent={!!mnemonics}
          defaultOpen={false}
          onLockedClick={() => setShowModal(true)}
          content={
            mnemonics ? (
              <ReactMarkdown components={md}>{mnemonics}</ReactMarkdown>
            ) : null
          }
        />

        {/* Radar Visual */}
        <ArsenalCard
          icon={<IconLayoutDashboard />}
          title="Radar Visual de Conceitos"
          description="Visualize e Memorize em segundos."
          color={YELLOW}
          locked={isFlash}
          hasContent={false}
          onLockedClick={() => setShowModal(true)}
          content={null}
        />

      </div>
    </>
  );
}
