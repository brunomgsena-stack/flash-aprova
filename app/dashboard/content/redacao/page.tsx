import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchUserPlan } from '@/lib/plan';
import RedacaoClient from './RedacaoClient';

export default async function RedacaoPage() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const planInfo = user ? await fetchUserPlan(user.id) : null;
  const plan = planInfo?.plan ?? 'flash';

  const color = '#06b6d4';

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Breadcrumbs ───────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 flex-wrap">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <span className="opacity-40">›</span>
          <span style={{ color }}>Redação</span>
          <span className="opacity-40">›</span>
          <span className="text-white font-medium">Redação Flash+</span>
        </nav>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{
              background: `${color}22`,
              border:     `1px solid ${color}55`,
              boxShadow:  `0 0 24px ${color}33`,
            }}
          >
            ✒️
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color }}>
              Redação Flash+
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Correção IA & Base de Conhecimento
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Norma · Corretora AiPro+</p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mt-6 mb-8"
          style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }}
        />

        {/* ── Client component ──────────────────────────────────────── */}
        <RedacaoClient plan={plan} />

      </div>
    </main>
  );
}
