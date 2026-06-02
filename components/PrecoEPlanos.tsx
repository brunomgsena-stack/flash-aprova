'use client';

import Link from 'next/link';
import TrustBadges from './TrustBadges';

// ─── Design tokens (espelho da landing) ───────────────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const GOLD   = '#fbbf24';
const AMBER  = '#d97706';

const CARD_BG = 'rgba(255,255,255,0.04)';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Feature {
  text: string;
  color?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PrecoEPlanos() {
  // ENEM 2026: first weekend of November (8/Nov/2026)
  const enemDate = new Date('2026-11-08T00:00:00');
  const today    = new Date();
  const daysLeft = Math.max(0, Math.ceil((enemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <section id="preco-e-planos" className="max-w-6xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      {/* Countdown ENEM 2026 */}
      <div
        className="max-w-md mx-auto mb-8 px-5 py-3 rounded-xl flex items-center justify-center gap-3 text-center"
        style={{
          background: 'rgba(217,119,6,0.08)',
          border: '1px solid rgba(217,119,6,0.25)',
        }}
      >
        <span className="text-xl leading-none" aria-hidden>⏳</span>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#fbbf24' }}>
            Faltam
          </span>
          <span className="text-2xl font-black leading-tight" style={{ color: '#fef3c7' }}>
            {daysLeft} dias
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            para o ENEM 2026
          </span>
        </div>
      </div>

      {/* Cabeçalho da seção */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
          Planos e Preços
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
          R$ 0,90 por dia. <span style={{ color: NEON }}>Risco</span><br />
          <span style={{ color: NEON }}>zero por 7 dias.</span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Escolha o plano que cabe no seu ano de estudo. Cancele a qualquer momento dentro de 7 dias e receba 100% de volta.
        </p>
      </div>

      {/* Grade de cards: mobile → coluna, desktop → 3 colunas com altura igual */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 items-stretch mb-8">

        {/* ── ESSENCIAL ─────────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden flex flex-col h-full order-1 lg:order-1"
          style={{ background: CARD_BG, border: '1px solid rgba(124,58,237,0.18)' }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, rgba(124,58,237,0.30), transparent)` }}
          />

          {/* Badge */}
          <div className="mb-4">
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
              style={{
                background: 'rgba(124,58,237,0.10)',
                border: '1px solid rgba(124,58,237,0.25)',
                color: '#8b5cf6',
              }}
            >
              ESSENCIAL
            </span>
          </div>

          {/* Nome */}
          <p className="text-base font-black text-white mb-4 leading-tight">
            FlashAprova <span style={{ color: '#8b5cf6' }}>Essencial</span>
          </p>

          {/* Preço */}
          <div className="mb-1">
            <span className="text-xs text-slate-500 font-semibold">12x de </span>
            <span className="text-3xl font-black text-white">R$&nbsp;21,41</span>
          </div>
          <p className="text-slate-500 text-xs mb-1">ou R$ 257 à vista</p>
          <p className="text-slate-500 text-xs italic mb-6">
            Sem Radar de Lacunas, sem Tutores IA, sem Norma. Começo de jornada.
          </p>

          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Features */}
          <div className="flex flex-col gap-2.5 mb-6 text-sm">
            {[
              'Flashcards SRS ilimitados',
              'Revisão por matéria',
              'Dashboard básico',
              'Acesso ENEM 2026',
              'Progresso salvo automaticamente',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: '#8b5cf6' }}>✓</span>
                <span className="text-slate-300">{f}</span>
              </div>
            ))}
          </div>

          <p
            className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3 mt-auto"
            style={{ borderColor: 'rgba(124,58,237,0.25)' }}
          >
            Ideal para quem já tem estratégia própria.
          </p>

          {/* CTA */}
          <Link
            href="/checkout?from=landing-pricing&plan=essencial"
            className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:opacity-80"
            style={{
              background: 'rgba(124,58,237,0.14)',
              border: '1px solid rgba(124,58,237,0.30)',
              color: '#a78bfa',
            }}
          >
            QUERO SÓ OS FLASHCARDS
          </Link>
        </div>

        {/* ── PROTOCOLO NEURAL — DESTAQUE ───────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden flex flex-col h-full order-2 lg:order-2"
          style={{ background: 'rgba(4,10,8,0.97)' }}
        >
          {/* Gradient border */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              padding: '1.5px',
              background: `linear-gradient(135deg, ${NEON}, ${CYAN}, #a78bfa, ${NEON})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          {/* Glow ambiente */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top right, ${NEON}18 0%, transparent 55%)` }}
          />
          {/* Linha topo */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, ${NEON}, ${CYAN}, #a78bfa)` }}
          />

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span
              className="text-xs font-black px-3 py-1.5 rounded-full text-white inline-flex items-center gap-1"
              style={{
                background: `linear-gradient(135deg, ${NEON}, ${CYAN})`,
                boxShadow: `0 0 20px ${NEON}55`,
              }}
            >
              🏅 MAIS ESCOLHIDO
            </span>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
              style={{ background: `${NEON}15`, border: `1px solid ${NEON}40`, color: NEON }}
            >
              MELHOR CUSTO-BENEFÍCIO
            </span>
          </div>

          {/* Nome do plano */}
          <p
            className="text-xs font-black mb-1 leading-tight tracking-tight"
            style={{
              background: `linear-gradient(90deg, ${NEON}, ${CYAN})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            [ PROTOCOLO NEURAL ]
          </p>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(0,255,115,0.65)' }}>
            Método completo · 4 fases
          </p>

          {/* Headline */}
          <p className="text-white text-sm font-semibold leading-snug mb-4">
            O sistema completo para não esquecer o que estudou até o ENEM.
          </p>

          {/* Preço */}
          <div className="mb-1">
            <span className="text-xs text-slate-400 font-semibold">12x de </span>
            <span className="text-4xl font-black text-white">R$&nbsp;27,25</span>
          </div>
          <p className="text-slate-500 text-xs mb-1">ou R$ 327 à vista</p>
          <p className="text-sm font-semibold italic mb-4" style={{ color: NEON }}>
            menos de R$ 0,90 por dia
          </p>

          <div
            className="h-px mb-4"
            style={{ background: `linear-gradient(90deg, ${NEON}55, ${CYAN}55)` }}
          />

          {/* Features */}
          <div className="flex flex-col gap-2.5 mb-6 text-sm mt-auto">
            {(
              [
                { text: 'SRS adaptativo de retenção espaçada', color: NEON },
                { text: '15 Especialistas IA por matéria', color: NEON },
                { text: 'Tutor IA 24/7', color: NEON },
                { text: 'Norma IA — Correção de Redação ilimitada', color: NEON },
                { text: 'Radar de Lacunas', color: NEON },
                { text: 'Simulados e treinos TRI', color: CYAN },
                { text: 'Dashboard + heatmap de progresso', color: CYAN },
                { text: 'Acesso até jul/2027 · ENEM 2026 + FUVEST, UNICAMP e USP', color: NEON },
                { text: 'Garantia incondicional de 7 dias', color: NEON },
              ] as Feature[]
            ).map(({ text, color }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: color ?? NEON }}>✓</span>
                <span className="text-slate-200 leading-snug">{text}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-4 mb-5 text-xs leading-relaxed"
            style={{
              background: 'rgba(0,0,0,0.30)',
              border: `1px solid ${NEON}25`,
            }}
          >
            <p className="font-bold mb-2" style={{ color: NEON }}>
              Se você contratasse tudo separado:
            </p>
            <div className="flex flex-col gap-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <div className="flex justify-between"><span>Aula particular (1x/sem · R$ 80/h)</span><span>R$ 320/mês</span></div>
              <div className="flex justify-between"><span>Correção de redação (4x · R$ 50)</span><span>R$ 200/mês</span></div>
              <div className="flex justify-between"><span>Material SRS premium</span><span>R$ 50/mês</span></div>
              <div className="flex justify-between font-bold pt-1.5 mt-1.5" style={{ borderTop: '1px dashed rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)' }}>
                <span>Total mensal</span><span>R$ 570/mês</span>
              </div>
              <div className="flex justify-between font-black pt-1.5" style={{ color: NEON }}>
                <span>Protocolo Neural</span><span>R$ 27,25/mês</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/checkout?from=landing-pricing&plan=neural"
            className="relative block w-full py-4 rounded-xl text-center font-black text-white text-sm tracking-wider transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${NEON} 0%, ${CYAN} 60%, #a78bfa 100%)`,
              boxShadow: `0 0 40px ${NEON}55, 0 4px 20px rgba(0,0,0,0.50)`,
            }}
          >
            COMEÇAR 7 DIAS GRÁTIS
          </Link>

          <p
            className="text-center text-sm font-black mt-4"
            style={{ color: NEON, textShadow: `0 0 12px ${NEON}60` }}
          >
            🛡️ Garantia incondicional de 7 dias. Sem risco.
          </p>
        </div>

        {/* ── PROTOCOLO BLACK ───────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden flex flex-col h-full order-3 lg:order-3"
          style={{ background: 'rgba(18,14,6,0.96)', border: `1px solid rgba(217,119,6,0.22)` }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.50), transparent)' }}
          />

          {/* Badge */}
          <div className="mb-4">
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase"
              style={{
                background: 'rgba(217,119,6,0.10)',
                border: '1px solid rgba(217,119,6,0.30)',
                color: AMBER,
              }}
            >
              PREMIUM
            </span>
          </div>

          {/* Nome */}
          <p className="text-base font-black mb-4 leading-tight" style={{ color: GOLD }}>
            Protocolo <span style={{ color: AMBER }}>Black</span>
          </p>

          {/* Preço */}
          <div className="mb-1">
            <span className="text-xs font-semibold" style={{ color: '#78716c' }}>12x de </span>
            <span className="text-3xl font-black" style={{ color: '#fef3c7' }}>R$&nbsp;99,70</span>
          </div>
          <p className="text-slate-500 text-xs mb-1">ou R$ 997 à vista</p>
          <p className="text-slate-500 text-xs italic mb-6">
            Para quem quer acompanhamento estratégico máximo.
          </p>

          <div className="h-px mb-4" style={{ background: 'rgba(217,119,6,0.15)' }} />

          {/* Features */}
          <div className="flex flex-col gap-2.5 mb-6 text-sm">
            {[
              'Tudo do Protocolo Neural',
              'Mentoria mensal 1x1 com especialista pedagógico',
              'Plano intensivo reta final',
              'Suporte prioritário',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: AMBER }}>✓</span>
                <span className="text-slate-300 leading-snug">{f}</span>
              </div>
            ))}
          </div>

          <p
            className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3 mt-auto"
            style={{ borderColor: 'rgba(217,119,6,0.25)' }}
          >
            Indicado para quem quer máxima personalização.
          </p>

          {/* CTA */}
          <Link
            href="/checkout?from=landing-pricing&plan=black"
            className="block w-full py-3 rounded-xl text-center text-sm font-black tracking-wider transition-all hover:bg-amber-900/10"
            style={{
              background: 'transparent',
              border: '1px solid rgba(217,119,6,0.40)',
              color: AMBER,
            }}
          >
            APLICAR PARA O BLACK
          </Link>
        </div>

      </div>

      {/* Trust Badges — métodos de pagamento e segurança */}
      <TrustBadges />

      {/* Selo de garantia */}
      <div className="flex justify-center">
        <div
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-center"
          style={{
            background: `${NEON}0d`,
            border: `1px solid ${NEON}30`,
            color: NEON,
          }}
        >
          🛡️ Garantia incondicional de 7 dias · 100% de reembolso · Sem perguntas · Sem burocracia.
        </div>
      </div>
    </section>
  );
}
