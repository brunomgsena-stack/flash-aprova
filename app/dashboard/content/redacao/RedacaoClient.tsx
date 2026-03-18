'use client';

import { useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = 'flash' | 'proai_plus';

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

// ─── Norma Hero Card ─────────────────────────────────────────────────────────

function NormaHeroCard({ plan, onOpenModal }: { plan: Plan; onOpenModal: () => void }) {
  const isPro = plan === 'proai_plus';

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{
        background:   'rgba(6,182,212,0.05)',
        border:       `1px solid ${isPro ? 'rgba(6,182,212,0.35)' : 'rgba(6,182,212,0.18)'}`,
        boxShadow:    isPro ? '0 0 60px rgba(6,182,212,0.12), 0 0 120px rgba(124,58,237,0.06)' : 'none',
      }}
    >
      {/* Gradient border (top) */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${CYAN}60, ${PINK}40, transparent)` }} />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, rgba(6,182,212,0.08) 0%, transparent 60%)` }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at bottom left, rgba(124,58,237,0.06) 0%, transparent 60%)` }} />

      <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-7">

        {/* Avatar */}
        <div className="shrink-0 relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, rgba(6,182,212,0.20), rgba(124,58,237,0.15))`,
              border:     `1px solid ${CYAN}50`,
              boxShadow:  `0 0 32px ${CYAN}30`,
              color:      CYAN,
            }}
          >
            <PenIcon size={36} />
          </div>
          {isPro && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#030712]"
              style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e80' }} />
          )}
        </div>

        {/* Copy */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap justify-center sm:justify-start">
            <p className="text-white font-black text-lg leading-tight">
              Fale com a Norma: Sua Corretora IA 1000
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
              style={{
                background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                boxShadow:  `0 0 8px ${VIOLET}50`,
              }}
            >
              AiPro+
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: CYAN }}>
            {isPro ? '● Online agora · Pronta para corrigir' : 'Disponível no plano AiPro+'}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Envie seu texto e receba uma correção detalhada baseada nas{' '}
            <span className="text-white font-semibold">5 competências oficiais do ENEM</span>.
            Feedback personalizado + sugestões de repertório.
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] whitespace-nowrap"
            style={{
              background: isPro
                ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                : 'rgba(255,255,255,0.07)',
              border:     isPro ? 'none' : '1px solid rgba(255,255,255,0.12)',
              boxShadow:  isPro ? `0 0 24px ${VIOLET}55, 0 4px 16px rgba(0,0,0,0.35)` : 'none',
            }}
          >
            <PenIcon size={15} />
            Corrigir minha Redação
          </button>
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
  const isPro             = plan === 'proai_plus';

  const wordCount = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const canSubmit = isPro && tema.trim().length > 3 && wordCount >= 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background:   'rgba(5,8,18,0.97)',
          border:       `1px solid ${CYAN}30`,
          boxShadow:    `0 0 60px ${CYAN}15, 0 -4px 40px rgba(0,0,0,0.60)`,
          maxHeight:    '92dvh',
        }}
        onClick={e => e.stopPropagation()}
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
              <p className="text-white font-black text-sm">Banca AiPro+</p>
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
                  Recurso exclusivo AiPro+
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  A correção por IA está disponível apenas no plano AiPro+.{' '}
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
              rows={12}
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
            {isPro ? 'Iniciar Análise da Banca AiPro+' : 'Disponível no AiPro+'}
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

function GradeResults({ result, onReset }: { result: NormaResult; onReset: () => void }) {
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
          Resultado da Banca AiPro+
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
          Nova Correção
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
                AiPro+
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
              Recurso AiPro+ 🤖
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,23,42,0.65)' }}>
              A Base de Conhecimento completa — Resumos, Tabelas e Correção IA — é exclusiva do AiPro+.
            </p>
          </div>
          <a
            href="/subscription"
            className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:-translate-y-0.5"
            style={{ background: '#0f0a1e', color: '#e8e8e8', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 14px rgba(0,0,0,0.45)' }}
          >
            Fazer Upgrade para AiPro+ →
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

export default function RedacaoClient({ plan }: { plan: Plan }) {
  const [modalOpen,   setModalOpen]   = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<NormaResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const isPro  = plan === 'proai_plus';
  const color  = CYAN;

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
      {modalOpen   && <EssayModal   plan={plan} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Hero card */}
      <NormaHeroCard plan={plan} onOpenModal={() => setModalOpen(true)} />

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
      {result && <GradeResults result={result} onReset={() => setResult(null)} />}

      {/* Knowledge base */}
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
  );
}
