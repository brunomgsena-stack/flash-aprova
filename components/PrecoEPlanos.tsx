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
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      {/* Cabeçalho da seção */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
          Planos e Preços
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
          R$ 0,90 por dia.{' '}
          <span style={{ color: NEON }}>Risco zero por 7 dias.</span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Escolha o plano que cabe no seu ano de estudo. Cancele a qualquer momento dentro de 7 dias e receba 100% de volta.
        </p>
      </div>

      {/* Grade de cards: mobile → coluna (Neural primeiro), desktop → 3 colunas */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 items-start mb-8">

        {/* ── PROTOCOLO NEURAL — DESTAQUE (primeiro no mobile) ─────────────────── */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden order-1 lg:order-2"
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
            className="text-xs font-black mb-2 leading-tight tracking-tight"
            style={{
              background: `linear-gradient(90deg, ${NEON}, ${CYAN})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            [ PROTOCOLO NEURAL ]
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
          <div className="flex flex-col gap-2.5 mb-6 text-sm">
            {(
              [
                { text: 'SRS adaptativo de retenção espaçada', color: NEON },
                { text: '15 Especialistas IA por matéria', color: NEON },
                { text: 'Tutor IA 24/7', color: NEON },
                { text: 'Norma IA — Correção de Redação ilimitada', color: NEON },
                { text: 'Radar de Lacunas', color: NEON },
                { text: 'Simulados e treinos TRI', color: CYAN },
                { text: 'Dashboard + heatmap de progresso', color: CYAN },
                { text: '2 anos de acesso incluídos', color: NEON },
                { text: 'Garantia incondicional de 7 dias', color: NEON },
              ] as Feature[]
            ).map(({ text, color }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: color ?? NEON }}>✓</span>
                <span className="text-slate-200 leading-snug">{text}</span>
              </div>
            ))}
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
            GARANTIR MINHA VAGA
          </Link>

          <p
            className="text-center text-sm font-black mt-4"
            style={{ color: NEON, textShadow: `0 0 12px ${NEON}60` }}
          >
            🛡️ Garantia incondicional de 7 dias. Sem risco.
          </p>
        </div>

        {/* ── ESSENCIAL ─────────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-7 overflow-hidden order-2 lg:order-1"
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
            Para quem quer apenas revisar com flashcards.
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
            className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
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

        {/* ── PROTOCOLO BLACK ───────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-7 overflow-hidden order-3 lg:order-3"
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
              'Mentoria de estudos mensal 1x1 com especialista',
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
            className="text-xs text-slate-600 italic mb-5 leading-relaxed border-l-2 pl-3"
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
