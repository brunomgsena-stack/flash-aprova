'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type PlanInfo } from '@/lib/plan';

// ─── AiPro+ upgrade banner ────────────────────────────────────────────────────

function UpgradeBanner() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:   'linear-gradient(45deg, #B8B8B8 0%, #D4AF37 30%, #F9D423 55%, #E8E8E8 80%, #C8C8C8 100%)',
        border:       '1px solid rgba(255,255,255,0.30)',
        boxShadow:    '0 4px 32px rgba(212,175,55,0.25), 0 1px 0 rgba(255,255,255,0.4) inset',
      }}
    >
      {/* Brushed-metal sheen overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)',
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-center gap-5 p-5">

        {/* Robot icon */}
        <div
          className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.12)',
            border:     '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.70)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {/* Bot / robot head */}
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <rect x="9" y="7" width="6" height="4" rx="1" />
            <line x1="12" y1="7" x2="12" y2="4" />
            <circle cx="12" cy="3" r="1" />
            <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.4" />
            <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.4" />
            <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.4" />
            <line x1="3" y1="15" x2="1" y2="15" />
            <line x1="21" y1="15" x2="23" y2="15" />
          </svg>
        </div>

        {/* Copy */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <p
            className="font-black text-base leading-tight mb-1"
            style={{ color: '#0f172a' }}
          >
            Evolua para o Próximo Nível: AiPro+ 🤖
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'rgba(15,23,42,0.65)' }}
          >
            Desbloqueie +70 Tutores IA Especialistas, crie Flashcards e Resumos
            instantâneos via Foto/PDF e tenha suporte total para sua aprovação.
          </p>
        </div>

        {/* CTA button — dark on gold */}
        <Link
          href="/subscription"
          className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03]"
          style={{
            background: '#0f0a1e',
            color:      '#e8e8e8',
            border:     '1px solid rgba(255,255,255,0.15)',
            boxShadow:  '0 2px 12px rgba(0,0,0,0.40)',
            letterSpacing: '0.01em',
          }}
        >
          Fazer Upgrade →
        </Link>
      </div>
    </div>
  );
}

// ─── AiPro+ active status strip ───────────────────────────────────────────────

function ActivePlanStrip({ info }: { info: PlanInfo }) {
  const renewalText = info.expiresAt
    ? info.daysLeft === 0
      ? 'Expira hoje'
      : `${info.daysLeft} dia${info.daysLeft !== 1 ? 's' : ''} restante${info.daysLeft !== 1 ? 's' : ''}`
    : 'Plano ativo';

  return (
    <div
      className="relative rounded-2xl px-5 py-3.5 overflow-hidden flex items-center justify-between gap-4"
      style={{
        background:   'rgba(6,182,212,0.06)',
        border:       '1px solid rgba(6,182,212,0.22)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.50), transparent)' }} />

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}
        >
          ⚡
        </div>
        <div>
          <span className="text-white font-bold text-sm">Plano AiPro+</span>
          <span
            className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#06b6d4)', color: '#fff' }}
          >
            Ativo
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs font-semibold" style={{ color: '#06b6d4' }}>{renewalText}</p>
        {info.expiresAt && (
          <p className="text-slate-600 text-xs mt-0.5">
            {info.expiresAt.toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AccountStatusCard() {
  const [info, setInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setInfo(await fetchUserPlan(user.id));
    }
    load();
  }, []);

  if (!info) return null;

  return info.plan === 'aceleracao'
    ? <UpgradeBanner />
    : <ActivePlanStrip info={info} />;
}
