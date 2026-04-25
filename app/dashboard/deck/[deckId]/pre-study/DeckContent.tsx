'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { getTutor, getOpeningMessage, type Tutor } from '@/lib/tutor-engine';
import AiProUpgradeModal from '@/components/AiProUpgradeModal';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  color:                  string;
  plan:                   'aceleracao' | 'panteao_elite';
  subjectTitle:           string | null;
  deckTitle:              string;
  deckId:                 string;
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

// ─── Tutor card ───────────────────────────────────────────────────────────────

function TutorCard({ tutor, plan, subjectTitle, onStartChat, onUpgradeClick }: { tutor: Tutor; plan: 'aceleracao' | 'panteao_elite'; subjectTitle: string | null; onStartChat: () => void; onUpgradeClick: () => void }) {
  const isPro   = plan === 'panteao_elite';
  const VIOLET  = '#a855f7';

  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 mb-4 overflow-hidden"
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

      {/* Avatar + Text row */}
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex items-center justify-center"
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
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050b14]"
              style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e80' }} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm sm:text-base leading-tight mb-1">
            {tutor.name}: Sua Dúvida Resolvida AGORA.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            {isPro
              ? `Trava em ${subjectTitle ?? tutor.specialty}? Pergunte agora e desbloqueie o caminho mais rápido.`
              : `Desbloqueie o ${tutor.name} com o Protocolo Neural e tenha um especialista 24h ao seu lado.`}
          </p>
        </div>
      </div>

      {/* CTA — full width below on mobile */}
      <div className="mt-3">
        {isPro ? (
          <button
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all duration-200 hover:-translate-y-0.5"
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: `rgba(168,85,247,0.15)`,
              border:     `1px solid ${VIOLET}40`,
            }}
          >
            Desbloquear Protocolo Neural →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Performance Chart ────────────────────────────────────────────────────────

type ProgressStats = {
  total:      number;
  reviewed:   number;
  easy:       number;  // rating 4
  good:       number;  // rating 3
  hard:       number;  // rating 2
  wrong:      number;  // rating 1
  dueToday:   number;
};

function DonutChart({ segments, size = 120 }: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const r   = 42;
  const cx  = 50;
  const cy  = 50;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset  = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
      ) : (
        segments.map((seg, i) => {
          const dash  = (seg.value / total) * circ;
          const gap   = circ - dash;
          const el    = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offset += dash;
          return el;
        })
      )}
    </svg>
  );
}

function PerformanceChart({ deckId, color }: { deckId: string; color: string }) {
  const [stats, setStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch total cards in deck
      const { data: cards } = await supabase
        .from('cards')
        .select('id')
        .eq('deck_id', deckId);

      const total = cards?.length ?? 0;
      const cardIds = cards?.map(c => c.id) ?? [];

      if (!user || cardIds.length === 0) {
        setStats({ total, reviewed: 0, easy: 0, good: 0, hard: 0, wrong: 0, dueToday: 0 });
        return;
      }

      // Fetch user_progress for those cards
      const { data: progress } = await supabase
        .from('user_progress')
        .select('card_id, next_review, history')
        .eq('user_id', user.id)
        .in('card_id', cardIds);

      const today = new Date().toISOString().split('T')[0];
      let easy = 0, good = 0, hard = 0, wrong = 0, dueToday = 0;

      for (const row of progress ?? []) {
        if (row.next_review <= today) dueToday++;
        const history: { rating: number }[] = Array.isArray(row.history) ? row.history : [];
        if (history.length > 0) {
          const last = history[history.length - 1].rating;
          if      (last === 4) easy++;
          else if (last === 3) good++;
          else if (last === 2) hard++;
          else if (last === 1) wrong++;
        }
      }

      const reviewed = (progress?.length ?? 0);
      setStats({ total, reviewed, easy, good, hard, wrong, dueToday });
    }
    load();
  }, [deckId]);

  if (!stats) return null;

  const notReviewed = stats.total - stats.reviewed;
  const accuracy    = stats.reviewed > 0
    ? Math.round(((stats.easy + stats.good) / stats.reviewed) * 100)
    : 0;

  const donutSegments = [
    { value: stats.easy,   color: '#22c55e' },
    { value: stats.good,   color: color },
    { value: stats.hard,   color: '#f59e0b' },
    { value: stats.wrong,  color: '#ef4444' },
    { value: notReviewed,  color: 'rgba(255,255,255,0.08)' },
  ];

  const legend = [
    { label: 'Fácil',        count: stats.easy,    color: '#22c55e' },
    { label: 'Bom',          count: stats.good,    color: color },
    { label: 'Difícil',      count: stats.hard,    color: '#f59e0b' },
    { label: 'Errei',        count: stats.wrong,   color: '#ef4444' },
    { label: 'Não revisado', count: notReviewed,   color: 'rgba(255,255,255,0.18)' },
  ];

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        background:           'rgba(10,5,20,0.80)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               '1px solid rgba(255,255,255,0.09)',
        boxShadow:            '0 2px 12px rgba(0,0,0,0.20)',
      }}
    >
      {/* Top shimmer */}
      <div className="h-px mb-4"
        style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />

      <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
        Seu Aproveitamento
      </p>

      <div className="flex items-center gap-6">
        {/* Donut + center text */}
        <div className="relative shrink-0">
          <DonutChart segments={donutSegments} size={110} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white leading-none">{accuracy}%</span>
            <span className="text-[10px] text-slate-500 mt-0.5">acertos</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Legend */}
          {legend.filter(l => l.count > 0).map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="text-xs text-slate-400 flex-1">{l.label}</span>
              <span className="text-xs font-semibold text-white">{l.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {[
          { label: 'Total',    value: stats.total,    c: 'rgba(255,255,255,0.07)' },
          { label: 'Revisadas', value: stats.reviewed, c: `${color}18` },
          { label: 'Para hoje', value: stats.dueToday, c: stats.dueToday > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)' },
        ].map(pill => (
          <div
            key={pill.label}
            className="flex-1 min-w-[70px] rounded-xl px-3 py-2 text-center"
            style={{ background: pill.c, border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-base font-black text-white leading-none">{pill.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{pill.label}</p>
          </div>
        ))}
      </div>
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
      const chunks: string[] = Array.isArray(data.messages) && data.messages.length > 0
        ? data.messages
        : [data.text ?? ''];
      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) {
          // pausa breve após a bolha anterior aparecer
          await new Promise(r => setTimeout(r, 300));
          // mostra o indicador de digitação por tempo proporcional ao tamanho da mensagem
          setTyping(true);
          const typingMs = Math.min(Math.max(chunks[i].length * 22, 700), 2200);
          await new Promise(r => setTimeout(r, typingMs));
          setTyping(false);
        } else {
          // primeira mensagem: a API já retornou, esconde o loader
          setTyping(false);
        }
        setMessages(prev => [...prev, { id: `${Date.now()}-${i}`, role: 'tutor', text: chunks[i] }]);
      }
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
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/08 transition-colors group"
          aria-label="Voltar"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-sm">{tutor.name}</p>
              <span
                className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  color: '#fff',
                  boxShadow: `0 0 8px ${VIOLET}50`,
                }}
              >
                Protocolo Neural
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
              className="flex items-center gap-2 px-4 py-3 rounded-2xl"
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
              <span className="text-xs ml-1" style={{ color: `${CYAN}80` }}>
                {tutor.name} está digitando…
              </span>
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeckContent({ color, plan, subjectTitle, deckTitle, deckId }: Props) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [view, setView]                         = useState<'knowledge' | 'chat'>('knowledge');
  const tutor = getTutor(subjectTitle);

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

  return (
    <>
      {showUpgradeModal && <AiProUpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* ── Mentoria com Especialista ── */}
      {tutor && (
        <TutorCard
          tutor={tutor}
          plan={plan}
          subjectTitle={subjectTitle}
          onStartChat={() => setView('chat')}
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}

      {/* ── Gráfico de aproveitamento ── */}
      <PerformanceChart deckId={deckId} color={color} />
    </>
  );
}
