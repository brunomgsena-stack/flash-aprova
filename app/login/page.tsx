'use client';

import { useState, Suspense } from 'react';
import { useRouter }          from 'next/navigation';
import { useSearchParams }    from 'next/navigation';
import { supabase }           from '@/lib/supabaseClient';

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered'))    return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be'))         return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email'))   return 'E-mail inválido.';
  if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
  return 'Ocorreu um erro. Tente novamente.';
}

// ─── Neon input ───────────────────────────────────────────────────────────────

const MONO = "'JetBrains Mono', monospace";

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
      <label
        style={{
          fontFamily:    MONO,
          fontSize:      '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color:         focused ? '#00e5ff' : '#64748b',
          transition:    'color 0.2s',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          fontFamily:   MONO,
          fontSize:     '13px',
          width:        '100%',
          padding:      '12px 16px',
          borderRadius: '12px',
          background:   'rgba(255,255,255,0.04)',
          border:       `1px solid ${focused ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow:    focused
            ? '0 0 0 2px rgba(139,92,246,0.2), 0 0 28px rgba(139,92,246,0.25), inset 0 0 12px rgba(139,92,246,0.06)'
            : 'none',
          color:        'white',
          outline:      'none',
          transition:   'all 0.25s ease',
        }}
      />
    </div>
  );
}

// ─── Cybernetic lock icon ─────────────────────────────────────────────────────

function CyberLock() {
  return (
    <svg width="38" height="44" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shackle */}
      <path d="M9 20V13C9 7.477 13.477 3 19 3C24.523 3 29 7.477 29 13V20"
        stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Body */}
      <rect x="3" y="19" width="32" height="22" rx="3"
        fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1" />
      {/* Corner ticks */}
      <line x1="3" y1="22" x2="8" y2="22" stroke="#00e5ff" strokeWidth="0.75" opacity="0.5" />
      <line x1="30" y1="22" x2="35" y2="22" stroke="#00e5ff" strokeWidth="0.75" opacity="0.5" />
      <line x1="3" y1="38" x2="8" y2="38" stroke="#00e5ff" strokeWidth="0.75" opacity="0.5" />
      <line x1="30" y1="38" x2="35" y2="38" stroke="#00e5ff" strokeWidth="0.75" opacity="0.5" />
      {/* Keyhole circle */}
      <circle cx="19" cy="30" r="4" fill="none" stroke="#8b5cf6" strokeWidth="1" />
      {/* Keyhole stem */}
      <line x1="19" y1="34" x2="19" y2="38" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
      {/* Inner dot */}
      <circle cx="19" cy="30" r="1.2" fill="#8b5cf6" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Mode = 'login' | 'signup';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlMessage   = searchParams.get('message') ?? '';

  const [mode,     setMode]     = useState<Mode>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSuccess(''); };

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 60px rgba(0,229,255,0.07), 0 0 0 0.5px rgba(0,229,255,0.3);
            border-color: rgba(0,229,255,0.3);
          }
          50% {
            box-shadow: 0 0 90px rgba(139,92,246,0.15), 0 0 0 0.5px rgba(139,92,246,0.5);
            border-color: rgba(139,92,246,0.45);
          }
        }

        @keyframes shimmer {
          0%   { transform: translateX(-130%) skewX(-20deg); opacity: 0; }
          8%   { opacity: 1; }
          45%  { transform: translateX(220%) skewX(-20deg); opacity: 0; }
          100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
        }

        @keyframes statusBlink {
          0%, 88%, 100% { opacity: 0.45; }
          93%           { opacity: 0.15; }
        }

        .login-card {
          animation: neonPulse 3s ease-in-out infinite;
        }

        .shimmer-sweep {
          animation: shimmer 3s ease-in-out infinite;
        }

        .status-line {
          animation: statusBlink 4s ease-in-out infinite;
        }
      `}</style>

      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ fontFamily: MONO }}
      >
        {/* Ambient glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 38%, rgba(0,229,255,0.07) 0%, rgba(139,92,246,0.05) 35%, transparent 65%)',
          }}
        />

        <div className="w-full max-w-md relative z-10">

          {/* Header — above card */}
          <div className="text-center mb-6">
            {/* Lock */}
            <div className="flex justify-center mb-4">
              <CyberLock />
            </div>

            <p
              className="text-[10px] font-semibold tracking-[0.35em] mb-2"
              style={{ color: '#00e5ff' }}
            >
              FLASHAPROVA // SYS-AUTH
            </p>
            <h1
              className="text-lg font-bold text-white tracking-[0.08em]"
              style={{ fontFamily: MONO }}
            >
              [ AUTENTICAÇÃO DO OPERADOR ]
            </h1>
            <p
              className="text-[11px] mt-2 tracking-[0.2em]"
              style={{ color: '#64748b', fontFamily: MONO }}
            >
              Inicie o protocolo de blindagem.
            </p>
          </div>

          {/* Card */}
          <div
            className="login-card rounded-2xl p-8 relative overflow-hidden"
            style={{
              background:           'rgba(4,8,18,0.75)',
              backdropFilter:       'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border:               '0.5px solid rgba(0,229,255,0.3)',
            }}
          >
            {/* Top neon line */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.6), rgba(139,92,246,0.4), transparent)' }}
            />
            {/* Left neon line */}
            <div
              className="absolute inset-y-0 left-0 w-px pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(0,229,255,0.4), transparent 60%, rgba(139,92,246,0.2))' }}
            />
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top, rgba(0,229,255,0.05) 0%, transparent 60%)' }}
            />

            {/* Metadata — top-left */}
            <div
              className="absolute top-2 left-3 text-[8px] tracking-widest pointer-events-none"
              style={{ color: '#00e5ff', lineHeight: '1.7', opacity: 0.4, fontFamily: MONO }}
            >
              <div>ID: 0x4FA2-C331</div>
              <div>VER: 3.7.1-STABLE</div>
            </div>

            {/* Metadata — top-right */}
            <div
              className="absolute top-2 right-3 text-[8px] tracking-widest text-right pointer-events-none"
              style={{ color: '#8b5cf6', lineHeight: '1.7', opacity: 0.4, fontFamily: MONO }}
            >
              <div>ENC: AES-256-GCM</div>
              <div>SESSION: ACTIVE</div>
            </div>

            {/* Mode tabs */}
            <div
              className="flex rounded-xl p-1 mb-7 relative z-10 mt-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all duration-200 tracking-[0.15em]"
                  style={{
                    fontFamily: MONO,
                    color:      mode === m ? 'white' : '#475569',
                    background: mode === m ? 'rgba(0,229,255,0.1)' : 'transparent',
                    border:     mode === m ? '0.5px solid rgba(0,229,255,0.35)' : '0.5px solid transparent',
                    boxShadow:  mode === m ? '0 0 16px rgba(0,229,255,0.12)' : 'none',
                  }}
                >
                  {m === 'login' ? '// ENTRAR' : '// CADASTRAR'}
                </button>
              ))}
            </div>

            {/* Erro vindo do auth callback (link expirado, etc.) */}
            {urlMessage && (
              <div
                className="px-4 py-3 rounded-xl text-[11px] tracking-wide mb-2 relative z-10"
                style={{
                  fontFamily: MONO,
                  background: 'rgba(239,68,68,0.08)',
                  border:     '0.5px solid rgba(239,68,68,0.3)',
                  color:      '#fca5a5',
                }}
              >
                ⚠ {urlMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
              <NeonInput
                label="// E-MAIL DO OPERADOR"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="operador@arsenal.io"
              />
              <div>
                <NeonInput
                  label="// CHAVE DE ACESSO"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                />
                {mode === 'login' && (
                  <div className="flex justify-end mt-2">
                    <a
                      href="/forgot-password"
                      className="text-[10px] tracking-[0.12em] transition-colors duration-200"
                      style={{ color: '#475569', fontFamily: MONO }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#00e5ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                    >
                      RECUPERAR ACESSO →
                    </a>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-[11px] tracking-wide"
                  style={{
                    fontFamily: MONO,
                    background: 'rgba(239,68,68,0.08)',
                    border:     '0.5px solid rgba(239,68,68,0.3)',
                    color:      '#fca5a5',
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div
                  className="px-4 py-3 rounded-xl text-[11px] tracking-wide"
                  style={{
                    fontFamily: MONO,
                    background: 'rgba(0,255,128,0.06)',
                    border:     '0.5px solid rgba(0,255,128,0.25)',
                    color:      '#6ee7b7',
                  }}
                >
                  ✓ {success}
                </div>
              )}

              {/* Submit — shimmer button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-1 relative overflow-hidden"
                style={{
                  fontFamily:    MONO,
                  fontSize:      '12px',
                  letterSpacing: '0.15em',
                  background:    'linear-gradient(135deg, rgba(0,229,255,0.9), rgba(139,92,246,0.85))',
                  boxShadow:     '0 0 32px rgba(0,229,255,0.2), 0 0 64px rgba(139,92,246,0.12), 0 4px 14px rgba(0,0,0,0.55)',
                }}
              >
                {/* Shimmer sweep */}
                <span
                  className="shimmer-sweep absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)',
                  }}
                />
                <span className="relative z-10">
                  {loading
                    ? '[ AUTENTICANDO... ]'
                    : mode === 'login'
                      ? '[ ACESSAR ARSENAL ]'
                      : '[ CRIAR OPERADOR ]'}
                </span>
              </button>
            </form>

            {/* Footer status */}
            <div
              className="mt-6 pt-4 relative z-10"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              <p
                className="status-line text-center text-[8px] tracking-[0.28em]"
                style={{ color: '#00e5ff', fontFamily: MONO }}
              >
                ● STATUS: SISTEMA PRONTO PARA SINCRONIZAÇÃO
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
