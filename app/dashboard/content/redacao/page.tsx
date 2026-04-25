import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { type Plan } from '@/lib/plan';
import RedacaoClient from './RedacaoClient';

const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';
const CYAN   = '#06b6d4';
const VIOLET = '#818cf8';

export default async function RedacaoPage() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  let plan: Plan = 'aceleracao';
  if (user) {
    const [statsResult, profileResult] = await Promise.all([
      serverClient
        .from('user_stats')
        .select('plan, plan_expires_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      serverClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const isAdmin   = profileResult.data?.role === 'admin';
    const rawPlan   = (statsResult.data?.plan as Plan | undefined) ?? 'aceleracao';
    const expiresAt = statsResult.data?.plan_expires_at
      ? new Date(statsResult.data.plan_expires_at)
      : null;
    const expired   = expiresAt ? expiresAt < new Date() : false;

    plan = isAdmin || (rawPlan === 'panteao_elite' && !expired) ? 'panteao_elite' : 'aceleracao';
  }

  return (
    <main
      className="min-h-screen px-4 py-10 sm:px-8 relative overflow-hidden"
      style={{ background: '#050814' }}
    >
      {/* ── Grid background ─────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Scanlines overlay ────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
          opacity: 0.6,
        }}
      />

      {/* ── Corner glow accents ──────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed top-0 left-0 w-96 h-96 z-0"
        style={{ background: `radial-gradient(ellipse at top left, ${CYAN}0d 0%, transparent 70%)` }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-96 h-96 z-0"
        style={{ background: `radial-gradient(ellipse at bottom right, ${VIOLET}0d 0%, transparent 70%)` }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">


        {/* ── Breadcrumbs ───────────────────────────────────────────── */}
        <nav
          className="flex items-center gap-1.5 mb-8 flex-wrap"
          style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}
        >
          <Link href="/dashboard" className="hover:text-white transition-colors">
            DASHBOARD
          </Link>
          <span className="opacity-40">›</span>
          <span style={{ color: CYAN }}>REDAÇÃO</span>
          <span className="opacity-40">›</span>
          <span className="text-white">NORMA.AI</span>
        </nav>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${CYAN}22, ${VIOLET}18)`,
              border:     `1px solid ${CYAN}44`,
              boxShadow:  `0 0 20px ${CYAN}22`,
            }}
          >
            ✒️
          </div>
          <div>
            <p
              style={{
                fontFamily:    MONO,
                fontSize:      '9px',
                letterSpacing: '0.18em',
                color:         'rgba(255,255,255,0.28)',
                marginBottom:  '4px',
              }}
            >
              [ SISTEMA DE DIAGNÓSTICO ]
            </p>
            <h1
              className="font-black leading-tight"
              style={{
                fontSize:   '22px',
                background: `linear-gradient(135deg, ${CYAN} 0%, ${VIOLET} 60%, #c084fc 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Redação | Norma.AI
            </h1>
            <p
              style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.08em', marginTop: '4px' }}
            >
              CORRETORA_IA · ANÁLISE_ENEM · BASE_CONHECIMENTO
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mt-5 mb-8"
          style={{ background: `linear-gradient(90deg, ${CYAN}55, ${VIOLET}33, transparent)` }}
        />

        {/* ── Client component ──────────────────────────────────────── */}
        <RedacaoClient plan={plan} />

      </div>
    </main>
  );
}
