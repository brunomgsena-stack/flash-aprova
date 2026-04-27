'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      <div className="text-center max-w-md">
        <div className="mb-6 text-6xl font-black" style={{ color: '#ef4444' }}>!</div>
        <h1 className="text-2xl font-black text-white mb-3">Algo deu errado</h1>
        <p className="text-slate-400 text-sm mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Voltar ao início
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-slate-700 font-mono">ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
