'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import EvolucaoChart, { type ChartPoint } from '@/components/redacao/EvolucaoChart';
import HistoricoList, { type EssayRecord } from '@/components/redacao/HistoricoList';

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = 'aceleracao' | 'panteao_elite';

// Mirrors NormaResult from lib/agents/norma.ts
type CompetenciaResult = {
  nota:     number;
  nivel:    string;
  feedback: string;
};

type NormaResult = {
  nota_total:  number;
  competencias: {
    c1: CompetenciaResult;
    c2: CompetenciaResult;
    c3: CompetenciaResult;
    c4: CompetenciaResult;
    c5: CompetenciaResult;
  };
  veredito:            string;
  pontos_fortes:       string[];
  pontos_melhoria:     string[];
  sugestao_repertorio: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CYAN   = '#06b6d4';
const VIOLET = '#7C3AED';
const PINK   = '#ec4899';

const COMPETENCIAS: { key: 'c1'|'c2'|'c3'|'c4'|'c5'; label: string; desc: string }[] = [
  { key: 'c1', label: 'C1', desc: 'Domínio da norma culta da língua portuguesa' },
  { key: 'c2', label: 'C2', desc: 'Compreensão da proposta e aplicação de conceitos' },
  { key: 'c3', label: 'C3', desc: 'Seleção e organização das informações' },
  { key: 'c4', label: 'C4', desc: 'Coesão e coerência textual' },
  { key: 'c5', label: 'C5', desc: 'Proposta de intervenção social' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function PenIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="rgba(212,175,55,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Competency bar color ────────────────────────────────────────────────────

function competenciaBarColor(nota: number): string {
  if (nota >= 200) return '#00ff80';
  if (nota >= 160) return '#eab308';
  if (nota >= 120) return '#f97316';
  return '#ef4444';
}

// ─── Diagnóstico da Última Redação ───────────────────────────────────────────

function CompetenciasDiagnostico({
  lastResult, lastEssay,
}: {
  lastResult: NormaResult | null;
  lastEssay:  EssayRecord | null;
}) {
  const ML = 'var(--font-jetbrains), "JetBrains Mono", monospace';

  if (!lastResult || !lastEssay) return null;

  const nota       = lastResult.nota_total;
  const totalColor = nota >= 800 ? '#00ff80' : nota >= 600 ? CYAN : nota >= 400 ? '#eab308' : '#ef4444';

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-5"
      style={{ background: 'rgba(3,6,18,0.95)', border: '1px solid rgba(6,182,212,0.16)', boxShadow: '0 0 40px rgba(6,182,212,0.05)' }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)' }} />
      {/* Top neon line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}88, ${VIOLET}55, transparent)` }} />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span style={{ fontFamily: ML, fontSize: '8px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>
            {new Date(lastEssay.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.20), transparent)' }} />
          <span className="font-black text-lg" style={{ color: totalColor, fontFamily: ML, textShadow: `0 0 12px ${totalColor}88` }}>
            {nota}
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}>/1000</span>
          </span>
        </div>

        <p style={{ fontFamily: ML, fontSize: '9px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.08em', marginBottom: '16px' }}>
          TEMA: <span className="text-white">{lastEssay.tema}</span>
        </p>

        {/* 5 Competency bars */}
        <div className="space-y-3.5">
          {COMPETENCIAS.map(({ key, label, desc }) => {
            const comp = lastResult.competencias[key];
            const clr  = competenciaBarColor(comp.nota);
            const pct  = (comp.nota / 200) * 100;
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex items-center justify-center rounded flex-shrink-0"
                    style={{ fontFamily: ML, fontSize: '8px', fontWeight: 700, width: '22px', height: '18px',
                      background: `${clr}18`, border: `1px solid ${clr}44`, color: clr }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: ML, fontSize: '9px', color: 'rgba(255,255,255,0.42)', flex: 1, letterSpacing: '0.02em' }}>
                    {desc}
                  </span>
                  <span style={{ fontFamily: ML, fontSize: '12px', fontWeight: 700, color: clr, textShadow: `0 0 8px ${clr}88`, minWidth: '28px', textAlign: 'right' }}>
                    {comp.nota}
                  </span>
                  <span style={{ fontFamily: ML, fontSize: '8px', color: 'rgba(255,255,255,0.20)' }}>/200</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden ml-8"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${clr}55, ${clr})`,
                      boxShadow: `0 0 10px ${clr}99`, transition: 'width 0.9s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Norma Panel (Avatar + Recommendations + Chat) ───────────────────────────

type ChatMsg = { role: 'user' | 'norma'; text: string };

// ─── Norma Chat Modal ─────────────────────────────────────────────────────────

function NormaChatModal({ onClose }: { onClose: () => void }) {
  const ML = 'var(--font-jetbrains), "JetBrains Mono", monospace';

  const [chatMsgs,    setChatMsgs]    = useState<ChatMsg[]>([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [prevRespId,  setPrevRespId]  = useState<string | undefined>(undefined);
  const chatContainerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMsgs]);

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat/tutor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tutor_id:             'profa-norma',
          message:              userMsg,
          deck_title:           'Redação ENEM',
          subject_title:        'Redação',
          previous_response_id: prevRespId,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setPrevRespId(data.previous_response_id);
        const chunks = (data.text as string)
          .split(/\n\n+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        for (let i = 0; i < chunks.length; i++) {
          if (i > 0) {
            await new Promise<void>(resolve => setTimeout(resolve, 480 + Math.random() * 420));
          }
          setChatMsgs(prev => [...prev, { role: 'norma', text: chunks[i] }]);
        }
      } else {
        setChatMsgs(prev => [...prev, { role: 'norma', text: data.error ?? 'Erro inesperado.' }]);
      }
    } catch {
      setChatMsgs(prev => [...prev, { role: 'norma', text: 'Erro de conexão. Tente novamente.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(3,5,18,0.98)',
          border:     `1px solid ${CYAN}28`,
          boxShadow:  `0 0 60px ${CYAN}15, 0 -4px 40px rgba(0,0,0,0.60)`,
          maxHeight:  '100dvh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${CYAN}60, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(6,182,212,0.10)' }}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden"
                style={{ border: `1px solid ${CYAN}44`, boxShadow: `0 0 16px ${CYAN}22` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/tutor-redacao.avif" alt="Prof.ª Norma"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: '#00ff80', borderColor: '#050814', boxShadow: '0 0 6px #00ff8088' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-white text-sm">Prof.ª Norma</h2>
                <span className="font-bold rounded-full"
                  style={{ background: `linear-gradient(135deg, ${VIOLET}cc, ${CYAN}cc)`, color: '#fff',
                    fontSize: '7px', letterSpacing: '0.10em', padding: '2px 7px' }}>
                  NORMA.AI
                </span>
              </div>
              <p style={{ fontFamily: ML, fontSize: '8px', color: '#00ff80', letterSpacing: '0.08em', marginTop: '2px' }}>
                ● Online · Corretora ENEM ativa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{ minHeight: '200px' }}
        >
          {chatMsgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-slate-500 text-xs">Olá! Sou a Prof.ª Norma.</p>
              <p className="text-slate-600 text-xs mt-1">Pergunte sobre sua redação, competências do ENEM,<br />estratégias de argumentação e muito mais.</p>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'norma' && (
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 mt-0.5"
                  style={{ border: `1px solid ${CYAN}33` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/tutor-redacao.avif" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="rounded-2xl px-3.5 py-2.5 max-w-[80%]"
                style={{
                  background: m.role === 'user'
                    ? `linear-gradient(135deg, ${VIOLET}44, ${CYAN}28)`
                    : 'rgba(255,255,255,0.06)',
                  border: m.role === 'user'
                    ? `1px solid ${CYAN}40`
                    : '1px solid rgba(255,255,255,0.08)',
                }}>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0"
                style={{ border: `1px solid ${CYAN}33` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/tutor-redacao.avif" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="rounded-2xl px-3.5 py-2.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: CYAN, animation: `pulse 1.2s ease-in-out ${j * 0.3}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-3 shrink-0"
          style={{ borderTop: '1px solid rgba(6,182,212,0.08)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Pergunte à Norma sobre sua redação..."
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${chatInput ? `${CYAN}40` : 'rgba(255,255,255,0.09)'}` }}
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              className="px-4 py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`, boxShadow: chatInput ? `0 0 16px ${VIOLET}44` : 'none' }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Essay Modal ──────────────────────────────────────────────────────────────

function EssayModal({
  plan, onClose, onSubmit,
}: {
  plan:     Plan;
  onClose:  () => void;
  onSubmit: (tema: string, texto: string) => void;
}) {
  const [tema, setTema]   = useState('');
  const [texto, setTexto] = useState('');
  const isPro             = plan === 'panteao_elite';

  const wordCount = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const canSubmit = isPro && tema.trim().length > 3 && wordCount >= 50;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(5,8,18,0.99)' }}
    >
      <div
        className="relative w-full h-full overflow-hidden flex flex-col"
        style={{
          background: 'rgba(5,8,18,0.99)',
          border:     `1px solid ${CYAN}15`,
        }}
      >
        {/* Top line */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${CYAN}60, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${CYAN}18`, border: `1px solid ${CYAN}35`, color: CYAN }}>
              <PenIcon size={16} />
            </div>
            <div>
              <p className="text-white font-black text-sm">Banca Protocolo Neural</p>
              <p className="text-xs" style={{ color: CYAN }}>Norma · Correção por IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Upgrade alert for flash users */}
          {!isPro && (
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              <span className="text-lg shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'rgba(212,175,55,0.95)' }}>
                  Recurso exclusivo Protocolo Neural
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  A correção por IA está disponível apenas no plano Protocolo Neural.{' '}
                  <a href="/subscription" className="underline" style={{ color: CYAN }}>Fazer upgrade →</a>
                </p>
              </div>
            </div>
          )}

          {/* Tema */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Tema da Redação
            </label>
            <input
              type="text"
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="Ex: O impacto das redes sociais na saúde mental dos jovens brasileiros"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     `1px solid ${tema.length > 3 ? `${CYAN}40` : 'rgba(255,255,255,0.10)'}`,
              }}
              disabled={!isPro}
            />
          </div>

          {/* Texto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Corpo da Redação
              </label>
              <span className="text-xs" style={{ color: wordCount >= 50 ? CYAN : 'rgba(255,255,255,0.25)' }}>
                {wordCount} palavras {wordCount < 50 && '(mín. 50)'}
              </span>
            </div>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escreva ou cole sua redação aqui. A Norma analisará cada parágrafo com base nas 5 competências do ENEM..."
              rows={20}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-all leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border:     `1px solid ${texto.length > 10 ? `${CYAN}30` : 'rgba(255,255,255,0.08)'}`,
              }}
              disabled={!isPro}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => canSubmit && onSubmit(tema, texto)}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                : 'rgba(255,255,255,0.05)',
              boxShadow:  canSubmit ? `0 0 24px ${VIOLET}50, 0 4px 16px rgba(0,0,0,0.40)` : 'none',
              color:      canSubmit ? '#fff' : 'rgba(255,255,255,0.25)',
              border:     canSubmit ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {isPro ? 'Iniciar Análise da Banca Protocolo Neural' : 'Disponível no Protocolo Neural'}
          </button>
          {canSubmit && (
            <p className="text-center text-xs text-slate-700 mt-2">
              A análise leva cerca de 15–30 segundos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading card ─────────────────────────────────────────────────────────────

function LoadingCard() {
  return (
    <div
      className="relative rounded-2xl p-7 mb-8 overflow-hidden flex flex-col items-center gap-4"
      style={{
        background: `${CYAN}06`,
        border:     `1px solid ${CYAN}25`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}50, transparent)` }} />

      <SpinnerIcon />
      <div className="text-center">
        <p className="text-white font-bold text-sm">Norma está corrigindo sua redação…</p>
        <p className="text-slate-500 text-xs mt-1">Analisando as 5 competências do ENEM</p>
      </div>

      <div className="w-full space-y-2">
        {['Verificando norma culta...', 'Avaliando coerência...', 'Calculando nota...'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: CYAN,
                animation: `pulse 1.5s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
            <span className="text-xs text-slate-600">{s}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}

// ─── Grade Results ────────────────────────────────────────────────────────────

function nivelColor(nota: number): string {
  if (nota >= 160) return '#22c55e';
  if (nota >= 120) return CYAN;
  if (nota >= 80)  return '#f59e0b';
  return '#f87171';
}

function totalGrade(nota: number) {
  if (nota >= 900) return { label: 'Nota 1000 — Nível Olímpico', color: '#22c55e' };
  if (nota >= 800) return { label: 'Excelente — Acima da Média', color: CYAN };
  if (nota >= 600) return { label: 'Bom — Na Média ENEM',        color: '#f59e0b' };
  return                  { label: 'Precisa Melhorar',            color: '#f87171' };
}

function GradeResults({
  result, onReset, resetLabel = 'Nova Correção',
}: {
  result:      NormaResult;
  onReset:     () => void;
  resetLabel?: string;
}) {
  const nota  = result.nota_total;
  const grade = totalGrade(nota);

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{
        background: 'rgba(4,6,16,0.97)',
        border:     `1px solid ${grade.color}28`,
        boxShadow:  `0 0 60px ${grade.color}08`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${grade.color}70, transparent)` }} />

      {/* ── Nota total ── */}
      <div className="px-6 pt-7 pb-6 text-center border-b border-white/5">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">
          Resultado da Banca Protocolo Neural
        </p>
        <div
          className="text-8xl font-black leading-none mb-2"
          style={{
            background: `linear-gradient(135deg, ${grade.color}, ${CYAN})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 24px ${grade.color}50)`,
          }}
        >
          {nota}
        </div>
        <span
          className="inline-block text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: `${grade.color}15`, color: grade.color, border: `1px solid ${grade.color}35` }}
        >
          {grade.label}
        </span>
      </div>

      {/* ── Veredito da Norma ── */}
      <div className="px-6 py-5 border-b border-white/5"
        style={{ background: `${CYAN}05` }}>
        <div className="flex items-center gap-2 mb-3">
          <PenIcon size={14} />
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: CYAN }}>
            Veredito da Norma
          </p>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {result.veredito}
        </p>
      </div>

      {/* ── C1–C5 com feedback expandido ── */}
      <div className="px-6 py-5 border-b border-white/5">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-5">
          Análise por Competência
        </p>
        <div className="space-y-5">
          {COMPETENCIAS.map(({ key, label, desc }) => {
            const comp  = result.competencias[key];
            const color = nivelColor(comp.nota);
            const pct   = (comp.nota / 200) * 100;
            return (
              <div key={key} className="space-y-2">
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-black w-8 h-6 flex items-center justify-center rounded shrink-0"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-white font-semibold flex-1">{desc}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500">{comp.nivel}</span>
                    <span className="text-sm font-black" style={{ color }}>{comp.nota}</span>
                    <span className="text-xs text-slate-600">/200</span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1.5 rounded-full overflow-hidden ml-11"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:      `${pct}%`,
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                      boxShadow:  `0 0 8px ${color}50`,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
                {/* Feedback */}
                <p className="text-xs text-slate-400 leading-relaxed ml-11">
                  {comp.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pontos fortes & melhoria ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-white/5">
        {/* Pontos fortes */}
        {result.pontos_fortes?.length > 0 && (
          <div className="px-6 py-5 border-b sm:border-b-0 sm:border-r border-white/5">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#22c55e' }}>
              ✓ Pontos Fortes
            </p>
            <ul className="space-y-1.5">
              {result.pontos_fortes.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-green-500 shrink-0 mt-0.5">●</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de melhoria */}
        {result.pontos_melhoria?.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#f59e0b' }}>
              ▲ O que Melhorar
            </p>
            <ul className="space-y-1.5">
              {result.pontos_melhoria.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-amber-500 shrink-0 mt-0.5">●</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Sugestões de repertório ── */}
      {result.sugestao_repertorio?.length > 0 && (
        <div className="px-6 py-5 border-b border-white/5">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">
            Sugestões de Repertório
          </p>
          <div className="space-y-2">
            {result.sugestao_repertorio.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-xs shrink-0 mt-0.5 font-bold" style={{ color: CYAN }}>→</span>
                <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-6 py-4">
        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-all hover:text-white"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Accordion (Knowledge Base) ───────────────────────────────────────────────

type AccordionItem = {
  id:         string;
  icon:       string;
  title:      string;
  hasContent: boolean;
  content:    React.ReactNode;
};

function AccordionRow({
  item, color, defaultOpen, locked, onLockedClick,
}: {
  item:          AccordionItem;
  color:         string;
  defaultOpen:   boolean;
  locked:        boolean;
  onLockedClick: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen && !locked);
  const bodyRef         = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: open ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border:     `1px solid ${open && !locked ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
        boxShadow:  open && !locked ? `0 0 20px ${color}10` : 'none',
      }}
    >
      <button
        onClick={() => locked ? onLockedClick() : setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: open && !locked ? `${color}20` : 'rgba(255,255,255,0.06)',
            border:     `1px solid ${open && !locked ? `${color}44` : 'rgba(255,255,255,0.10)'}`,
            opacity:    locked ? 0.5 : 1,
          }}
        >
          {item.icon}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="font-semibold text-sm"
            style={{ color: open && !locked ? '#fff' : 'rgba(255,255,255,0.55)' }}
          >
            {item.title}
          </span>
          {locked && (
            <span className="flex items-center gap-1 shrink-0">
              <LockIcon />
              <span className="text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.85)' }}>
                Protocolo Neural
              </span>
            </span>
          )}
          {!locked && !item.hasContent && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Em breve
            </span>
          )}
        </div>

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

      {!locked && (
        <div
          ref={bodyRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 2000) + 'px' : '0px', opacity: open ? 1 : 0 }}
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

// ─── Upgrade modal ────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(45deg, #B8B8B8 0%, #D4AF37 30%, #F9D423 55%, #E8E8E8 80%, #C8C8C8 100%)',
          border:     '1px solid rgba(255,255,255,0.35)',
          boxShadow:  '0 8px 48px rgba(212,175,55,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.07) 100%)' }} />
        <div className="relative p-7 flex flex-col items-center text-center gap-4">
          <div className="text-4xl">✒️</div>
          <div>
            <p className="font-black text-lg leading-tight mb-1" style={{ color: '#0f172a' }}>
              Recurso Protocolo Neural 🤖
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,23,42,0.65)' }}>
              A Base de Conhecimento completa — Resumos, Tabelas e Correção IA — é exclusiva do Protocolo Neural.
            </p>
          </div>
          <a
            href="/subscription"
            className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:-translate-y-0.5"
            style={{ background: '#0f0a1e', color: '#e8e8e8', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 14px rgba(0,0,0,0.45)' }}
          >
            Fazer Upgrade para Protocolo Neural →
          </a>
          <button onClick={onClose} className="text-xs font-medium" style={{ color: 'rgba(15,23,42,0.45)' }}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Static accordion content ─────────────────────────────────────────────────

function SummaryContent({ color }: { color: string }) {
  const competencias = [
    { num: 'C1', title: 'Domínio da norma culta', tip: 'Evite erros de ortografia, concordância e regência. Cada desvio custa até 40 pontos.' },
    { num: 'C2', title: 'Compreensão da proposta', tip: 'Leia o tema com atenção. Fuga ao tema = nota 0 em C2. Tangenciar = máx. 80 pontos.' },
    { num: 'C3', title: 'Seleção de argumentos', tip: 'Apresente dados, fatos históricos ou filosóficos. Argumentos vagos não convencem a banca.' },
    { num: 'C4', title: 'Coesão e coerência', tip: 'Use conectivos variados. Parágrafos devem fluir logicamente uns aos outros.' },
    { num: 'C5', title: 'Proposta de intervenção', tip: 'A PI deve ter: Agente + Ação + Modo/Meio + Finalidade + Detalhamento.' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 leading-relaxed">
        A redação do ENEM é do tipo <strong className="text-white">dissertativo-argumentativa</strong>.
        Você defende um ponto de vista sobre um problema social, usando argumentos lógicos e encerrando com uma proposta de intervenção.
      </p>
      <div className="space-y-3">
        {competencias.map(({ num, title, tip }) => (
          <div key={num} className="flex items-start gap-3">
            <span
              className="text-xs font-black w-8 h-6 flex items-center justify-center rounded shrink-0 mt-0.5"
              style={{ background: `${color}18`, color }}
            >
              {num}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableContent({ color }: { color: string }) {
  const conectivos = [
    { funcao: 'Adição',         exemplos: 'além disso, ademais, outrossim, também, ainda' },
    { funcao: 'Oposição',       exemplos: 'entretanto, todavia, porém, contudo, no entanto' },
    { funcao: 'Conclusão',      exemplos: 'portanto, logo, assim, dessa forma, por conseguinte' },
    { funcao: 'Causa',          exemplos: 'porque, pois, visto que, já que, uma vez que' },
    { funcao: 'Consequência',   exemplos: 'de modo que, de maneira que, tanto que, ao ponto de' },
    { funcao: 'Exemplificação', exemplos: 'por exemplo, a exemplo de, como é o caso de, tal como' },
    { funcao: 'Concessão',      exemplos: 'embora, ainda que, mesmo que, apesar de, conquanto' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {['Função', 'Conectivos'].map((h, i) => (
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
          {conectivos.map(({ funcao, exemplos }, ri) => (
            <tr key={funcao} style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td className="py-2.5 px-3 text-slate-300 font-semibold text-sm align-top whitespace-nowrap"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                {funcao}
              </td>
              <td className="py-2.5 px-3 text-slate-400 text-sm align-top"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                {exemplos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type ActiveTab = 'correcao' | 'evolucao';

export default function RedacaoClient({ plan }: { plan: Plan }) {
  const [modalOpen,     setModalOpen]     = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [result,             setResult]             = useState<NormaResult | null>(null);
  const [viewingSubmission, setViewingSubmission]  = useState<EssayRecord | null>(null);
  const [error,              setError]             = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('correcao');
  const [historico,   setHistorico]   = useState<EssayRecord[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const isPro = plan === 'panteao_elite';
  const color = CYAN;

  const lastEssay  = historico.length > 0 ? historico[historico.length - 1] : null;
  const lastResult = lastEssay?.analise_completa ? (lastEssay.analise_completa as NormaResult) : null;

  // ── Fetch histórico do Supabase ───────────────────────────────────────────
  useEffect(() => {
    if (!isPro) return;
    setLoadingHist(true);
    supabase
      .from('essay_submissions')
      .select('id, tema, texto, nota_total, analise_completa, created_at')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        setHistorico((data as EssayRecord[]) ?? []);
        setLoadingHist(false);
      });
  }, [isPro]);

  // ── Chart data derivado do histórico ──────────────────────────────────────
  const chartData: ChartPoint[] = historico.map(r => ({
    id:   r.id,
    data: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    nota: r.nota_total,
    tema: r.tema,
  }));

  // ── Selecionar redação do histórico → modo revisão ────────────────────────
  function handleSelectHistorico(record: EssayRecord) {
    setViewingSubmission(record);
    setResult(record.analise_completa as NormaResult);
    setError(null);
    setActiveTab('correcao');
  }

  function exitReviewMode() {
    setViewingSubmission(null);
    setResult(null);
  }

  async function handleSubmit(tema: string, texto: string) {
    setModalOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/chat/redacao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tema, texto }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Erro ${res.status}`);
      }
      const data: NormaResult = await res.json();
      setResult(data);
      setViewingSubmission(null); // nova correção, não é revisão de histórico
      // Refresh histórico para incluir a nova entrada
      supabase
        .from('essay_submissions')
        .select('id, tema, texto, nota_total, analise_completa, created_at')
        .order('created_at', { ascending: true })
        .limit(50)
        .then(({ data: rows }) => setHistorico((rows as EssayRecord[]) ?? []));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const accordionItems: AccordionItem[] = [
    {
      id:         'summary',
      icon:       '📖',
      title:      'A Engenharia da Nota 1000',
      hasContent: true,
      content:    <SummaryContent color={color} />,
    },
    {
      id:         'table',
      icon:       '📊',
      title:      'Arsenal de Conectivos e Coesão',
      hasContent: true,
      content:    <TableContent color={color} />,
    },
    {
      id:         'audio',
      icon:       '🎧',
      title:      'Dicas de Ouro da Norma',
      hasContent: false,
      content:    null,
    },
  ];

  return (
    <>
      {modalOpen     && <EssayModal      plan={plan} onClose={() => setModalOpen(false)}     onSubmit={handleSubmit} />}
      {chatModalOpen && <NormaChatModal               onClose={() => setChatModalOpen(false)} />}
      {showUpgrade   && <UpgradeModal                 onClose={() => setShowUpgrade(false)} />}

      {/* ── Diagnóstico ───────────────────────────────────────────────────── */}
      <CompetenciasDiagnostico lastResult={lastResult} lastEssay={lastEssay} />

      {/* ── Dois blocos de ação ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">

        {/* Bloco 1: Chat com a Tutora IA */}
        <div
          className="relative rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'rgba(3,5,18,0.97)', border: `1px solid ${CYAN}22`, boxShadow: `0 0 30px ${CYAN}06` }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${CYAN}50, transparent)` }} />
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${CYAN}44`, boxShadow: `0 0 20px ${CYAN}22` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/tutor-redacao.avif" alt="Prof.ª Norma"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: '#00ff80', borderColor: '#050814', boxShadow: '0 0 6px #00ff8088' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-white text-sm">Prof.ª Norma</h3>
                  <span className="font-bold rounded-full"
                    style={{ background: `linear-gradient(135deg, ${VIOLET}cc, ${CYAN}cc)`, color: '#fff',
                      fontSize: '7px', letterSpacing: '0.10em', padding: '2px 7px' }}>
                    NORMA.AI
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">Corretora ENEM · Especialista em redação</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Tire dúvidas sobre competências do ENEM, peça dicas de argumentação, estrutura de texto e repertório sociocultural.
            </p>

            {/* Insights based on essays */}
            {lastResult && (() => {
              const comps = COMPETENCIAS.map(c => ({ ...c, nota: lastResult.competencias[c.key].nota }));
              const weakest = comps.reduce((a, b) => a.nota < b.nota ? a : b);
              const tip = lastResult.pontos_melhoria?.[0];
              return (
                <div
                  className="rounded-xl px-3.5 py-3 mb-4 space-y-2"
                  style={{ background: `${CYAN}07`, border: `1px solid ${CYAN}18` }}
                >
                  <p style={{ fontSize: '9px', letterSpacing: '0.12em', color: CYAN, fontWeight: 700, marginBottom: '6px' }}>
                    INSIGHTS DAS SUAS REDAÇÕES
                  </p>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#f97316', fontSize: '10px', marginTop: '1px', flexShrink: 0 }}>▼</span>
                    <p className="text-xs text-slate-300 leading-snug">
                      Competência mais fraca: <span className="font-bold" style={{ color: '#f97316' }}>{weakest.label} — {weakest.desc.split(' ').slice(0, 3).join(' ')}</span> ({weakest.nota}/200)
                    </p>
                  </div>
                  {tip && (
                    <div className="flex items-start gap-2">
                      <span style={{ color: CYAN, fontSize: '10px', marginTop: '1px', flexShrink: 0 }}>→</span>
                      <p className="text-xs text-slate-400 leading-snug">{tip}</p>
                    </div>
                  )}
                  {lastResult.veredito && (
                    <div className="flex items-start gap-2">
                      <span style={{ color: '#a78bfa', fontSize: '10px', marginTop: '1px', flexShrink: 0 }}>✦</span>
                      <p className="text-xs text-slate-400 leading-snug line-clamp-2">{lastResult.veredito}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => isPro ? setChatModalOpen(true) : setShowUpgrade(true)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
              style={{
                background: isPro
                  ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                  : 'rgba(255,255,255,0.06)',
                border: isPro ? 'none' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: isPro ? `0 0 20px ${VIOLET}33` : 'none',
              }}
            >
              {isPro ? '💬 Conversar com a Norma' : '🔒 Disponível no Protocolo Neural'}
            </button>
          </div>
        </div>

        {/* Bloco 2: Enviar Redação */}
        <div
          className="relative rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'rgba(3,5,18,0.97)', border: `1px solid ${VIOLET}22`, boxShadow: `0 0 30px ${VIOLET}06` }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}50, transparent)` }} />
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${VIOLET}22, ${PINK}18)`,
                  border: `1px solid ${VIOLET}44`, boxShadow: `0 0 20px ${VIOLET}22`, fontSize: '28px' }}>
                ✒️
              </div>
              <div>
                <h3 className="font-black text-white text-sm">Banca Protocolo Neural</h3>
                <p className="text-slate-500 text-xs mt-0.5">Correção por IA · Análise ENEM C1–C5</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
              Envie sua redação e receba correção detalhada por competência, nota estimada, pontos fortes e sugestões de melhoria.
            </p>
            <button
              type="button"
              onClick={() => isPro ? setModalOpen(true) : setShowUpgrade(true)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
              style={{
                background: isPro
                  ? `linear-gradient(135deg, ${VIOLET}, ${PINK})`
                  : 'rgba(255,255,255,0.06)',
                border: isPro ? 'none' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: isPro ? `0 0 20px ${VIOLET}33` : 'none',
              }}
            >
              {isPro ? '✒️ Enviar Redação' : '🔒 Disponível no Protocolo Neural'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-7"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {([
          { id: 'correcao', label: 'Correção',  icon: '✒️' },
          { id: 'evolucao', label: 'Evolução',  icon: '📈', pro: true },
        ] as { id: ActiveTab; label: string; icon: string; pro?: boolean }[]).map(tab => {
          const isActive  = activeTab === tab.id;
          const isLocked  = tab.pro && !isPro;
          return (
            <button
              key={tab.id}
              onClick={() => isLocked ? setShowUpgrade(true) : setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${VIOLET}40, ${CYAN}25)`
                  : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.40)',
                border: isActive ? `1px solid ${CYAN}30` : '1px solid transparent',
                boxShadow: isActive ? `0 0 16px ${CYAN}15` : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isLocked && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(212,175,55,0.15)', color: 'rgba(212,175,55,0.9)' }}>
                  PRO
                </span>
              )}
              {tab.id === 'evolucao' && isPro && historico.length > 0 && (
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: `${CYAN}20`, color: CYAN }}
                >
                  {historico.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ABA: CORREÇÃO
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'correcao' && (
        <>
          {/* ── MODO REVISÃO: redação do histórico ─────────────────────── */}
          {viewingSubmission ? (
            <div>
              {/* Botão Voltar */}
              <button
                onClick={exitReviewMode}
                className="flex items-center gap-2 mb-6 text-sm font-semibold transition-all duration-200 hover:-translate-x-0.5 group"
                style={{ color: CYAN }}
              >
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className="group-hover:-translate-x-0.5 transition-transform"
                  style={{ filter: `drop-shadow(0 0 4px ${CYAN}80)` }}
                >
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voltar para Nova Correção
              </button>

              {/* Card de revisão: tema + texto */}
              <div
                className="relative rounded-2xl overflow-hidden mb-6"
                style={{
                  background: 'rgba(6,182,212,0.04)',
                  border:     `1px solid ${CYAN}22`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${CYAN}50, transparent)` }} />

                {/* Tema */}
                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">
                    Tema
                  </p>
                  <p className="text-xl font-bold text-white leading-snug">
                    {viewingSubmission.tema}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    {new Date(viewingSubmission.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Texto original */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">
                    Texto Enviado
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewingSubmission.texto}
                  </p>
                </div>
              </div>

              {/* Análise completa da Norma */}
              {result && (
                <GradeResults
                  result={result}
                  onReset={exitReviewMode}
                  resetLabel="← Fechar Revisão"
                />
              )}
            </div>

          ) : (
            /* ── MODO NORMAL: nova correção ──────────────────────────────── */
            <>
              {/* Loading */}
              {loading && <LoadingCard />}

              {/* Error */}
              {error && (
                <div
                  className="rounded-2xl px-5 py-4 mb-8 flex items-start gap-3"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <span className="text-red-400 text-lg shrink-0">⚠</span>
                  <div>
                    <p className="text-sm font-semibold text-red-400">Erro na análise</p>
                    <p className="text-xs text-slate-500 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Grade result */}
              {result && (
                <GradeResults
                  result={result}
                  onReset={() => setResult(null)}
                />
              )}

              {/* Knowledge base — oculta durante revisão e loading */}
              {!loading && (
                <>
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
                    Base de Conhecimento
                  </p>
                  <div className="flex flex-col gap-3">
                    {accordionItems.map((item, idx) => (
                      <AccordionRow
                        key={item.id}
                        item={item}
                        color={color}
                        defaultOpen={idx === 0 && isPro}
                        locked={!isPro}
                        onLockedClick={() => setShowUpgrade(true)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ABA: EVOLUÇÃO
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'evolucao' && isPro && (
        <div className="space-y-6">

          {/* Gráfico de evolução */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border:     '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${CYAN}40, transparent)` }} />

            <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-5">
              Curva de Evolução
            </p>

            {loadingHist ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-600 text-sm">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                  <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Carregando histórico…
              </div>
            ) : (
              <EvolucaoChart data={chartData} />
            )}
          </div>

          {/* Lista de histórico */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border:     '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}40, transparent)` }} />

            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">
                Histórico de Redações
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Clique em qualquer redação para revisar a correção completa
              </p>
            </div>

            <div className="px-4 pb-4 pt-2">
              {loadingHist ? (
                <div className="flex items-center justify-center py-10 gap-3 text-slate-600 text-sm">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                    <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Carregando…
                </div>
              ) : (
                <HistoricoList
                  records={historico}
                  activeId={viewingSubmission?.id}
                  onSelect={handleSelectHistorico}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
