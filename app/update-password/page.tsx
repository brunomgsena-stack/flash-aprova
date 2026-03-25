'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

function PasswordInput({
  label, value, onChange, placeholder,
}: {
  label: string;
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
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
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
  );
}

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.');
      return;
    }

    setSuccess(true);
    // Redireciona para o dashboard após 2 s para o usuário ver a confirmação
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${NEON}05 0%, transparent 60%)` }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NEON }}>
            FlashAprova
          </p>
          <h1 className="text-3xl font-bold text-white">Nova senha</h1>
          <p className="text-slate-400 text-sm mt-1">
            Escolha uma senha forte para proteger sua conta.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:           'rgba(255,255,255,0.04)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               `1px solid ${NEON}25`,
            boxShadow:            `0 0 60px ${NEON}06`,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${NEON}50, transparent)` }} />

          {success ? (
            /* ── Sucesso ───────────────────────────────────────────────────── */
            <div className="text-center flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: `${NEON}14`, border: `1px solid ${NEON}35` }}
              >
                ✅
              </div>
              <h2 className="text-white font-bold text-lg">Senha atualizada!</h2>
              <p className="text-slate-400 text-sm">
                Redirecionando para o painel…
              </p>
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${NEON}40`, borderTopColor: NEON }}
              />
            </div>
          ) : (
            /* ── Formulário ────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <PasswordInput
                label="Nova senha"
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 6 caracteres"
              />
              <PasswordInput
                label="Confirmar senha"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repita a nova senha"
              />

              {/* Indicador de força */}
              {password.length > 0 && (
                <div className="flex gap-1.5 items-center">
                  {[1, 2, 3].map((level) => {
                    const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1;
                    const colors   = ['#ef4444', '#f59e0b', NEON];
                    return (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: level <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    );
                  })}
                  <span className="text-xs text-slate-500 ml-1 w-14">
                    {password.length >= 12 ? 'Forte' : password.length >= 8 ? 'Média' : 'Fraca'}
                  </span>
                </div>
              )}

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
                {loading ? 'Salvando…' : 'Definir nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
