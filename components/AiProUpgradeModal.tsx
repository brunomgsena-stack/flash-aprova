'use client';

import { useState } from 'react';

type Props = { onClose: () => void };

const BENEFITS = [
  {
    emoji: '✅',
    text: 'Os 12 Especialistas: Consultoria ilimitada com Dr. Chronos, Mestre Newton e todo o Panteão.',
  },
  {
    emoji: '✅',
    text: 'Prof. Norma: Correção de redações ilimitada com feedback técnico padrão ENEM.',
  },
  {
    emoji: '✅',
    text: 'Áudio-Resumos: Estude ouvindo as engrenagens da história no ônibus ou academia.',
  },
  {
    emoji: '✅',
    text: 'Storytelling: Transformamos fatos secos em narrativas que você nunca mais esquece.',
  },
];

export default function AiProUpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro inesperado.');
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar pagamento.');
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0f0a1e 0%, #130d26 60%, #0a0514 100%)',
          border:     '1px solid transparent',
          boxShadow:  '0 0 0 1px rgba(124,58,237,0.60), 0 0 80px rgba(124,58,237,0.22), 0 0 160px rgba(6,182,212,0.10)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient border overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            padding: '1px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 50%, #ec4899 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Top shimmer line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)' }}
        />

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(6,182,212,0.10) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom left, rgba(124,58,237,0.10) 0%, transparent 60%)' }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors z-10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="relative p-8 flex flex-col gap-5">

          {/* Rocket icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(6,182,212,0.18))',
              border:     '1px solid rgba(6,182,212,0.30)',
              boxShadow:  '0 0 24px rgba(6,182,212,0.20)',
            }}
          >
            🚀
          </div>

          {/* Headline */}
          <div>
            <h2
              className="text-2xl font-black leading-tight mb-2"
              style={{
                background: 'linear-gradient(90deg, #a78bfa, #67e8f9, #f0abfc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Suba para o Panteão dos Aprovados 🚀
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Você está a apenas{' '}
              <span className="text-white font-bold">R$&nbsp;21,00/mês</span>{' '}
              de distância da inteligência que vai acelerar sua aprovação.
            </p>
          </div>

          {/* Benefits list */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-start gap-3">
                <span className="text-sm shrink-0 mt-0.5">{b.emoji}</span>
                <p className="text-sm text-slate-300 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="relative w-full py-4 rounded-xl font-black text-white text-base transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 60%, #ec4899 100%)',
              boxShadow:  '0 0 40px rgba(124,58,237,0.55), 0 4px 24px rgba(0,0,0,0.50)',
              letterSpacing: '-0.01em',
            }}
          >
            {/* Shimmer overlay */}
            <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <span
                className="absolute inset-0"
                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }}
              />
            </span>
            {loading ? 'Redirecionando…' : 'Liberar Panteão Agora por R$ 67,90/mês'}
          </button>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors text-center"
          >
            Agora não
          </button>

        </div>
      </div>
    </div>
  );
}
