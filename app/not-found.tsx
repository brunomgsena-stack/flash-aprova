import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada — FlashAprova',
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      <div className="text-center max-w-md">
        <div
          className="text-8xl font-black mb-4 leading-none"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          404
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Página não encontrada</h1>
        <p className="text-slate-400 text-sm mb-8">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
