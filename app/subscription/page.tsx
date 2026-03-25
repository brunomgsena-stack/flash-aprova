'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan, type PlanInfo } from '@/lib/plan';

// ─── Icons ────────────────────────────────────────────────────────────────────

function LightningIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function RobotIcon({ size = 32, stroke = 'currentColor' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <rect x="9" y="7" width="6" height="4" rx="1" />
      <line x1="12" y1="7" x2="12" y2="4" />
      <circle cx="12" cy="3" r="1" />
      <line x1="8"  y1="16" x2="8"  y2="16" strokeWidth="2.5" />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5" />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5" />
      <line x1="3"  y1="15" x2="1"  y2="15" />
      <line x1="21" y1="15" x2="23" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 6.5 11.5 13 5" />
    </svg>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function Feature({ text, color, dim = false }: { text: string; color: string; dim?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-1.5 ${dim ? 'opacity-40' : ''}`}>
      <span
        className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: `${color}22`, color }}
      >
        <CheckIcon />
      </span>
      <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
    </div>
  );
}

// ─── Active plan banner ────────────────────────────────────────────────────────

function ActiveBanner({ info, plan }: { info: PlanInfo; plan: Plan }) {
  const color  = plan === 'proai_plus' ? '#06b6d4' : '#7C3AED';
  const label  = plan === 'proai_plus' ? 'AiPro+' : 'Flash';
  const days   = info.expiresAt
    ? `${info.daysLeft} dia${info.daysLeft !== 1 ? 's' : ''} restante${info.daysLeft !== 1 ? 's' : ''}`
    : 'Plano ativo';

  return (
    <div
      className="relative rounded-2xl px-5 py-4 mb-10 overflow-hidden flex items-center justify-between gap-4 flex-wrap"
      style={{ background: `${color}0d`, border: `1px solid ${color}33` }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}33`, color }}>
          {plan === 'proai_plus' ? <RobotIcon size={18} stroke="currentColor" /> : <LightningIcon />}
        </div>
        <div>
          <span className="text-white font-bold text-sm">Você está no Plano {label}</span>
          {info.expiresAt && (
            <p className="text-xs mt-0.5" style={{ color }}>
              {days} · renova em {info.expiresAt.toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>
      <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
        style={{ background: `linear-gradient(135deg, #7C3AED, ${color})` }}>
        ✓ Ativo
      </span>
    </div>
  );
}

// ─── Subscriber management panel ──────────────────────────────────────────────

function SubscriberPanel({ info }: { info: PlanInfo }) {
  const renewText = info.expiresAt
    ? `Renova em ${info.expiresAt.toLocaleDateString('pt-BR')}`
    : 'Assinatura ativa';

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors mb-6">
          ← Voltar ao Dashboard
        </Link>

        <p className="text-xs font-semibold tracking-widest uppercase mb-2 text-slate-500">
          Configurações da Conta
        </p>
        <h1 className="text-3xl font-black text-white leading-tight mb-1">
          Sua Assinatura
        </h1>
        <p className="text-slate-500 text-sm">Gerencie seus benefícios premium.</p>
      </div>

      {/* Plan status card */}
      <div
        className="relative rounded-2xl p-6 mb-6 overflow-hidden"
        style={{
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.20)',
        }}
      >
        {/* Top line */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #06b6d4 50%, transparent)' }} />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
              <RobotIcon size={20} stroke="currentColor" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Plano Atual</p>
              <span
                className="text-sm font-black tracking-wide"
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(6,182,212,0.4)',
                }}
              >
                AiPro+
              </span>
            </div>
          </div>

          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: 'rgba(6,182,212,0.12)',
              border: '1px solid rgba(6,182,212,0.30)',
              color: '#67e8f9',
            }}
          >
            Ativo
          </span>
        </div>

        {info.expiresAt && (
          <p className="text-xs text-slate-500 mb-5">{renewText}</p>
        )}

        {/* Benefits list */}
        <div className="space-y-1.5">
          {[
            'Flashcards ilimitados com algoritmo SRS avançado',
            'Dashboard de performance e heatmap de consistência',
            'Resumos Storytelling por deck',
            'Tabelas Comparativas, Macetes & Mnemonics',
            'Áudio-Resumos narrados por IA',
            'Tutor IA Especialista em tempo real',
            'Geração de Flashcards via Foto ou PDF',
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-cyan-400 text-xs">✓</span>
              <span className="text-sm text-slate-400">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan management actions */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Gestão de Plano
        </p>

        <div className="space-y-3">
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-200 hover:text-white hover:border-slate-500"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Alterar para Plano Flash
          </button>

          <button
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
            style={{ color: '#f87171', background: 'transparent' }}
          >
            Cancelar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sales page (non-subscribers) ─────────────────────────────────────────────

function SalesPage({ userPlan, currentPlan }: { userPlan: PlanInfo | null; currentPlan: Plan }) {
  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors mb-6">
          ← Voltar ao Dashboard
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}>
          Planos & Preços
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3">
          Invista na sua{' '}
          <span style={{
            background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Aprovação
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Tecnologia de revisão usada pelos melhores aprovados — agora ao alcance de todos.
        </p>
      </div>

      {/* ── Active plan banner ─────────────────────────────────────────── */}
      {userPlan && <ActiveBanner info={userPlan} plan={currentPlan} />}

      {/* ── Plan cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-start">

        {/* ── Flash card ──────────────────────────────────────────────── */}
        <div
          className="relative rounded-3xl p-7 overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.04)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               '1px solid rgba(255,255,255,0.09)',
            boxShadow:            '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.40), transparent)' }} />

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}>
            <LightningIcon />
          </div>

          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#a78bfa' }}>
            Plano Flash
          </p>

          <div className="mb-1">
            <span className="text-slate-500 text-xs">12x de</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-5xl font-black text-white">R$&nbsp;21</span>
              <span className="text-3xl font-black text-white">,90</span>
            </div>
            <p className="text-slate-600 text-xs mt-1">R$ 262,80 / ano · sem juros</p>
          </div>

          <div className="h-px my-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

          <div className="space-y-0.5 mb-7">
            <Feature color="#a78bfa" text="Flashcards ilimitados" />
            <Feature color="#a78bfa" text="Algoritmo de Repetição Espaçada (SRS)" />
            <Feature color="#a78bfa" text="Dashboard com métricas de performance" />
            <Feature color="#a78bfa" text="Heatmap de consistência de estudos" />
          </div>

          {currentPlan === 'flash' ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-semibold"
              style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)' }}
            >
              ✓ Seu plano atual
            </div>
          ) : (
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-80"
              style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.40)' }}
            >
              Selecionar Flash
            </button>
          )}
        </div>

        {/* ── AiPro+ card (hero) ───────────────────────────────────────── */}
        <div
          className="relative rounded-3xl p-7 overflow-hidden"
          style={{
            background:   'rgba(15,10,30,0.85)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:       '1px solid transparent',
            backgroundClip: 'padding-box',
            boxShadow:    '0 0 0 1px rgba(124,58,237,0.55), 0 0 60px rgba(124,58,237,0.18), 0 0 120px rgba(6,182,212,0.10)',
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              padding: '1px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 50%, #ec4899 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />

          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)' }} />

          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(6,182,212,0.10) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at bottom left, rgba(236,72,153,0.07) 0%, transparent 60%)' }} />

          <div className="absolute top-5 right-5">
            <span
              className="text-xs font-black px-3 py-1.5 rounded-full text-white"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 60%, #ec4899 100%)',
                boxShadow:  '0 0 16px rgba(124,58,237,0.50)',
                letterSpacing: '0.02em',
              }}
            >
              ⭐ Mais Escolhido
            </span>
          </div>

          <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.30), rgba(6,182,212,0.20))',
              border:     '1px solid rgba(6,182,212,0.35)',
              boxShadow:  '0 0 20px rgba(6,182,212,0.25)',
              color:      '#67e8f9',
            }}>
            <RobotIcon size={24} stroke="currentColor" />
          </div>

          <p className="text-xs font-semibold tracking-widest uppercase mb-1"
            style={{
              background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            Plano AiPro+
          </p>

          <div className="mb-1">
            <span className="text-slate-500 text-xs">12x de</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-5xl font-black text-white">R$&nbsp;29</span>
              <span className="text-3xl font-black text-white">,90</span>
            </div>
            <p className="text-slate-600 text-xs mt-1">R$ 358,80 / ano · sem juros</p>
          </div>

          <div className="h-px my-5"
            style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.40), rgba(6,182,212,0.40), rgba(236,72,153,0.20))' }} />

          <div className="space-y-0.5 mb-7">
            <Feature color="#67e8f9" text="Tudo do Plano Flash" />
            <Feature color="#67e8f9" text="Resumos Storytelling por deck" />
            <Feature color="#67e8f9" text="Tabelas Comparativas + Macetes & Mnemonics" />
            <Feature color="#67e8f9" text="Áudio-Resumos narrados por IA" />
            <Feature color="#ec4899" text="Tutor IA Especialista em tempo real" />
            <Feature color="#ec4899" text="Geração de Flashcards via Foto ou PDF" />
          </div>

          <button
            className="relative w-full py-4 rounded-xl font-black text-white text-base transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 60%, #ec4899 100%)',
              boxShadow:  '0 0 32px rgba(124,58,237,0.55), 0 4px 20px rgba(0,0,0,0.45)',
              letterSpacing: '-0.01em',
            }}
          >
            <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <span className="absolute inset-0"
                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }} />
            </span>
            Garantir minha Aprovação (12x sem juros)
          </button>
        </div>
      </div>

      {/* ── Feature comparison ─────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-10"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>

        <div className="grid grid-cols-3 px-6 py-4 border-b border-white/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recurso</span>
          <span className="text-xs font-semibold text-center uppercase tracking-wider" style={{ color: '#a78bfa' }}>Flash</span>
          <span className="text-xs font-semibold text-center uppercase tracking-widest"
            style={{
              background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            AiPro+
          </span>
        </div>

        {[
          { feature: 'Flashcards ilimitados',          flash: true,  pro: true  },
          { feature: 'Algoritmo SRS avançado',         flash: true,  pro: true  },
          { feature: 'Dashboard & heatmap',            flash: true,  pro: true  },
          { feature: 'Resumos Storytelling',           flash: false, pro: true  },
          { feature: 'Tabelas Comparativas',           flash: false, pro: true  },
          { feature: 'Macetes & Mnemonics',            flash: false, pro: true  },
          { feature: 'Áudio-Resumo narrado por IA',   flash: false, pro: true  },
          { feature: 'Tutor IA Especialista',          flash: false, pro: true  },
          { feature: 'Flashcards por Foto/PDF',        flash: false, pro: true  },
        ].map(({ feature, flash, pro }, i) => (
          <div
            key={feature}
            className="grid grid-cols-3 px-6 py-3.5 text-sm"
            style={{
              borderTop:  i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            }}
          >
            <span className="text-slate-400">{feature}</span>
            <span className="text-center font-semibold" style={{ color: flash ? '#a78bfa' : '#334155' }}>
              {flash ? '✓' : '—'}
            </span>
            <span className="text-center font-semibold" style={{ color: pro ? '#67e8f9' : '#334155' }}>
              {pro ? '✓' : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* ── Trust signals ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 text-xs pb-4">
        {['🔒 Pagamento 100% seguro', '📅 Cancele quando quiser', '⚡ Acesso imediato após confirmação', '💳 Parcelado sem juros'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [userPlan, setUserPlan] = useState<PlanInfo | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserPlan(await fetchUserPlan(user.id));
    }
    load();
  }, []);

  const currentPlan = userPlan?.plan ?? 'flash';
  const isSubscriber = currentPlan === 'proai_plus';

  return (
    <main
      className="min-h-screen px-4 py-12 sm:px-8"
      style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(124,58,237,0.12) 0%, transparent 60%)' }}
    >
      {isSubscriber && userPlan ? (
        <SubscriberPanel info={userPlan} />
      ) : (
        <SalesPage userPlan={userPlan} currentPlan={currentPlan} />
      )}
    </main>
  );
}
