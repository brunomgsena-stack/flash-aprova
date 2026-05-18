'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

type Status = 'loading' | 'joining' | 'success' | 'error';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function join() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem('pendingJoinCode', code);
        router.replace(`/login?next=/join/${code}`);
        return;
      }
      setStatus('joining');
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(j.error ?? 'Convite inválido ou expirado.');
        return;
      }
      setStatus('success');
      setTimeout(() => router.replace('/dashboard'), 2500);
    }

    join();
  }, [code, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0c0c14' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm"
      >
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/60">Verificando convite...</p>
          </>
        )}

        {status === 'joining' && (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/60">Entrando na turma...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}
            >
              ✓
            </div>
            <p className="text-white font-bold text-lg mb-1">Bem-vindo à turma!</p>
            <p className="text-white/40 text-sm">Redirecionando para o dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}
            >
              ✕
            </div>
            <p className="text-white font-bold text-lg mb-1">Convite inválido</p>
            <p className="text-white/40 text-sm">{message}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
