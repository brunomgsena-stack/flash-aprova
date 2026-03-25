'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (err) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${VIOLET}08 0%, transparent 60%)` }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="text-xs font-semibold tracking-widest uppercase mb-2 block transition-colors"
            style={{ color: NEON }}>
            FlashAprova
          </Link>
          <h1 className="text-3xl font-bold text-white">Recuperar senha</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enviaremos um link para você criar uma nova senha.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.04)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               `1px solid ${VIOLET}30`,
            boxShadow:            `0 0 60px ${VIOLET}06`,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}50, transparent)` }} />

          {sent ? (
            /* ── Estado de sucesso ─────────────────────────────────────────── */
            <div className="text-center flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: `${NEON}14`, border: `1px solid ${NEON}35` }}
              >
                ✉️
              </div>
              <h2 className="text-white font-bold text-lg">E-mail enviado!</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Se <strong className="text-white">{email}</strong> estiver cadastrado,
                você receberá um link em instantes. Verifique também a pasta de spam.
              </p>
              <p className="text-slate-600 text-xs">O link expira em 24 horas.</p>
              <Link
                href="/login"
                className="text-sm font-semibold transition-colors duration-200 mt-2"
                style={{ color: NEON }}
              >
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            /* ── Formulário ────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-widest uppercase text-slate-400">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full px-4 py-3 rounded-xl bg-transparent text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border:     `1px solid ${focused ? `${NEON}70` : 'rgba(255,255,255,0.1)'}`,
                    boxShadow:  focused ? `0 0 0 1px ${NEON}25, 0 0 20px ${NEON}0d` : 'none',
                  }}
                />
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm text-red-300"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-1"
                style={{
                  background: NEON,
                  boxShadow:  `0 0 24px ${NEON}30, 0 4px 12px rgba(0,0,0,0.4)`,
                }}
              >
                {loading ? 'Enviando…' : 'Enviar link de recuperação'}
              </button>

              <div className="text-center mt-2">
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
                >
                  ← Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
