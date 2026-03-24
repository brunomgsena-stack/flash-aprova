'use client';

// ─── Design tokens ────────────────────────────────────────────────────────────
const CYAN   = '#06b6d4';
const VIOLET = '#7C3AED';

// ─── AnkiComparison ───────────────────────────────────────────────────────────

export default function AnkiComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* ── Anki card (muted, painful) ── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'rgba(10,5,20,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.18)',
          boxShadow: '0 0 40px rgba(124,58,237,0.06)',
        }}
      >
        {/* Muted violet ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.07) 0%, transparent 65%)' }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.30), transparent)' }}
        />

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
          >
            🃏
          </div>
          <div>
            <p className="text-white font-bold text-sm">Anki</p>
            <p className="text-xs" style={{ color: 'rgba(124,58,237,0.60)' }}>Método tradicional</p>
          </div>
          {/* "Lento" badge */}
          <span
            className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
          >
            MANUAL &amp; GENÉRICO
          </span>
        </div>

        {/* Pain points */}
        <div className="relative flex flex-col gap-3">
          {[
            { icon: '⏳', text: 'Horas configurando decks e intervalos manualmente' },
            { icon: '😵', text: 'Nenhuma análise de lacunas — você não sabe o que está esquecendo' },
            { icon: '📭', text: 'Sem conteúdo ENEM-específico. Você cria tudo do zero' },
            { icon: '🔇', text: 'Sem tutor. Quando trava numa questão, fica sozinho' },
            { icon: '📉', text: 'Taxa de abandono >60% após 2 semanas' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5 opacity-50">{icon}</span>
              <p className="text-slate-600 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Score */}
        <div
          className="relative mt-6 pt-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-slate-700 uppercase tracking-wider mb-1">Retenção média</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black" style={{ color: 'rgba(239,68,68,0.70)' }}>~40%</p>
            <p className="text-slate-700 text-xs mb-1">após 1 semana sem revisão forçada</p>
          </div>
        </div>
      </div>

      {/* ── FlashAprova card (vibrant, winning) ── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'rgba(5,8,20,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${CYAN}35`,
          boxShadow: `0 0 60px ${CYAN}12, 0 0 120px ${CYAN}06`,
        }}
      >
        {/* Vibrant cyan ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${CYAN}14 0%, transparent 65%)` }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${CYAN}70, ${VIOLET}40, transparent)` }}
        />

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${CYAN}18`, border: `1px solid ${CYAN}35`, boxShadow: `0 0 12px ${CYAN}20` }}
          >
            ⚡
          </div>
          <div>
            <p className="text-white font-bold text-sm">FlashAprova</p>
            <p className="text-xs" style={{ color: `${CYAN}90` }}>IA + SRS integrado</p>
          </div>
          {/* "Pro" badge */}
          <span
            className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${VIOLET}30, ${CYAN}25)`,
              color: CYAN,
              border: `1px solid ${CYAN}35`,
              boxShadow: `0 0 8px ${CYAN}15`,
            }}
          >
            IA ESPECIALISTA
          </span>
        </div>

        {/* Wins */}
        <div className="relative flex flex-col gap-3">
          {[
            { icon: '🧠', text: 'Algoritmo SRS automático — zero configuração, máxima retenção' },
            { icon: '🎯', text: 'Radar de lacunas por IA: sabe exatamente o que revisar hoje' },
            { icon: '📚', text: `+5.700 flashcards ENEM-específicos prontos para usar` },
            { icon: '🤖', text: '7 tutores IA especialistas por disciplina — suporte 24h' },
            { icon: '📈', text: 'Heatmap de evolução: visualize seu progresso semana a semana' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <p className="text-slate-300 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Score */}
        <div
          className="relative mt-6 pt-4 border-t"
          style={{ borderColor: `${CYAN}15` }}
        >
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: `${CYAN}60` }}>Retenção média</p>
          <div className="flex items-end gap-2">
            <p
              className="text-3xl font-black"
              style={{ color: CYAN, textShadow: `0 0 20px ${CYAN}70` }}
            >
              97%
            </p>
            <p className="text-slate-500 text-xs mb-1">com revisões espaçadas por IA</p>
          </div>
        </div>

        {/* Neon bottom border glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${CYAN}40, transparent)` }}
        />
      </div>
    </div>
  );
}
