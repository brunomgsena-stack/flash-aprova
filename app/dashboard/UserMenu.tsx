'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserPlan, type Plan } from '@/lib/plan';

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === 'proai_plus') {
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{
          background:  'linear-gradient(135deg, #7C3AED, #06b6d4)',
          color:       '#fff',
          boxShadow:   '0 0 10px rgba(124,58,237,0.5)',
          letterSpacing: '0.02em',
        }}
      >
        ProAI+
      </span>
    );
  }
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: 'rgba(124,58,237,0.18)',
        color:      '#a78bfa',
        border:     '1px solid rgba(124,58,237,0.40)',
      }}
    >
      Flash
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserMenu() {
  const router     = useRouter();
  const menuRef    = useRef<HTMLDivElement>(null);
  const [open, setOpen]   = useState(false);
  const [email, setEmail] = useState('');
  const [plan,  setPlan]  = useState<Plan>('flash');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const info = await fetchUserPlan(user.id);
      setPlan(info.plan);
    }
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <div className="relative" ref={menuRef}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-200"
        style={{
          background: open ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
          border:     `1px solid ${open ? 'rgba(124,58,237,0.40)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5b21b6)' }}
        >
          {initial}
        </div>
        <PlanBadge plan={plan} />
        {/* Chevron */}
        <svg
          className="transition-transform duration-200 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.3)' }}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background:           'rgba(10,10,20,0.95)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:               '1px solid rgba(124,58,237,0.25)',
            boxShadow:            '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Top shimmer */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)' }} />

          {/* User info */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5b21b6)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{email}</p>
              <div className="mt-0.5">
                <PlanBadge plan={plan} />
              </div>
            </div>
          </div>

          <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Menu items */}
          <div className="py-2">
            <Link
              href="/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-base">💎</span>
              <span>Minha Assinatura</span>
              {plan === 'flash' && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.35)' }}
                >
                  Upgrade
                </span>
              )}
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-base">🏠</span>
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <div className="py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
            >
              <span className="text-base">🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
