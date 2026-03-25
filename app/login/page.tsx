'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered'))    return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be'))         return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email'))   return 'E-mail inválido.';
  if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
  return msg;
}

// ─── Neon input ───────────────────────────────────────────────────────────────

function NeonInput({
  label, type, value, onChange, placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-widest uppercase text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-xl bg-transparent text-white placeholder-slate-600 outline-none transition-all duration-200"
        style={{
          background:  'rgba(255,255,255,0.04)',
          border:      `1px solid ${focused ? 'rgba(0,229,255,0.7)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow:   focused ? '0 0 0 1px rgba(0,229,255,0.25), 0 0 20px rgba(0,229,255,0.12)' : 'none',
        }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();

  const [mode,    setMode]    = useState<Mode>('login');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      router.push('/dashboard');
      router.refresh();
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(mapError(err.message)); setLoading(false); return; }
      setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      setLoading(false);
    }
  };

  const CYAN = '#00e5ff';

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: CYAN }}>
            FlashAprova
          </p>
          <h1 className="text-3xl font-bold text-white">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login'
              ? 'Entre para continuar seus estudos'
              : 'Comece a estudar com repetição espaçada'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.04)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               '1px solid rgba(0,229,255,0.2)',
            boxShadow:            '0 0 60px rgba(0,229,255,0.06)',
          }}
        >
          {/* Top shimmer */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)' }}
          />
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top, rgba(0,229,255,0.04) 0%, transparent 65%)' }}
          />

          {/* Mode tabs */}
          <div
            className="flex rounded-xl p-1 mb-7 relative z-10"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  color:      mode === m ? 'white' : '#64748b',
                  background: mode === m ? 'rgba(0,229,255,0.15)' : 'transparent',
                  border:     mode === m ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                  boxShadow:  mode === m ? '0 0 16px rgba(0,229,255,0.15)' : 'none',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            <NeonInput
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
            />
            <div>
              <NeonInput
                label="Senha"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              />
              {mode === 'login' && (
                <div className="flex justify-end mt-1.5">
                  <a
                    href="/forgot-password"
                    className="text-xs text-slate-500 hover:text-[#00FF73] transition-colors duration-200"
                  >
                    Esqueci minha senha
                  </a>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="px-4 py-3 rounded-xl text-sm text-emerald-300"
                style={{ background: 'rgba(0,255,128,0.08)', border: '1px solid rgba(0,255,128,0.25)' }}
              >
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-1"
              style={{
                background: `linear-gradient(135deg, rgba(0,229,255,0.85), rgba(0,255,128,0.7))`,
                boxShadow:  '0 0 24px rgba(0,229,255,0.3), 0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {loading
                ? (mode === 'login' ? 'Entrando…' : 'Criando conta…')
                : (mode === 'login' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
