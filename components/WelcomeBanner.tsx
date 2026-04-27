'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabaseClient';

const STORAGE_KEY = 'fa_welcome_banner_dismissed';

const EMERALD = '#10B981';
const VIOLET  = '#8B5CF6';
const CYAN    = '#06b6d4';

export default function WelcomeBanner() {
  const router = useRouter();
  const [visible,   setVisible]   = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Already dismissed?
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') return;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('first_session_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.first_session_completed === true) {
        // Already done — don't show banner
        return;
      }

      setVisible(true);
      setHasSession(data?.first_session_completed === true);
    }
    check();
  }, []);

  function dismiss() {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="mb-8 rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${EMERALD}10, ${VIOLET}08)`,
        border:     `1px solid ${EMERALD}30`,
        boxShadow:  `0 0 24px ${EMERALD}10`,
      }}
    >
      {/* Shimmer */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${EMERALD}60, transparent)` }}
      />

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:brightness-125"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)' }}
        aria-label="Fechar"
      >
        ×
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pr-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${EMERALD}20`, border: `1px solid ${EMERALD}40` }}
        >
          👋
        </div>
        <div>
          <p className="text-sm font-bold text-white">Bem-vindo ao FlashAprova!</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Complete sua primeira sessão para ativar o SRS e começar a progredir.
          </p>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Primary CTA */}
        <button
          onClick={() => router.push('/welcome/first-session')}
          className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: `${EMERALD}15`,
            border:     `1px solid ${EMERALD}35`,
          }}
        >
          <span className="text-xl">⚡</span>
          <div>
            <p className="text-xs font-bold text-white">Primeira Sessão</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>5 cards · ~3 min</p>
          </div>
          <span className="ml-auto text-xs" style={{ color: EMERALD }}>→</span>
        </button>

        {/* Tutors */}
        <button
          onClick={() => {
            dismiss();
            router.push('/dashboard');
          }}
          className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: `${VIOLET}10`,
            border:     `1px solid ${VIOLET}25`,
          }}
        >
          <span className="text-xl">🧠</span>
          <div>
            <p className="text-xs font-bold text-white">Tutores IA</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>Chat & redação</p>
          </div>
          <span className="ml-auto text-xs" style={{ color: VIOLET }}>→</span>
        </button>

        {/* Study plan */}
        <button
          onClick={() => {
            dismiss();
            router.push('/welcome');
          }}
          className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: `${CYAN}08`,
            border:     `1px solid ${CYAN}20`,
          }}
        >
          <span className="text-xl">📅</span>
          <div>
            <p className="text-xs font-bold text-white">Plano de Estudos</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>Ver seu plano IA</p>
          </div>
          <span className="ml-auto text-xs" style={{ color: CYAN }}>→</span>
        </button>
      </div>
    </div>
  );
}
