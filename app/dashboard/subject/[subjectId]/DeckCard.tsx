'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  id: string;
  title: string;
  color: string;
};

export default function DeckCard({ id, title, color }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/study/${id}`}
      className="group relative block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? `${color}cc` : `${color}44`}`,
        boxShadow: hovered
          ? `0 0 20px 2px ${color}44, 0 0 40px 4px ${color}18`
          : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Radial glow de fundo */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}14 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Ícone de baralho */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}44`,
        }}
      >
        🃏
      </div>

      {/* Título */}
      <h2 className="text-lg font-bold text-white mb-3 relative z-10 leading-snug">
        {title}
      </h2>

      {/* CTA */}
      <div className="flex items-center justify-between relative z-10">
        <span
          className="text-sm font-semibold"
          style={{ color }}
        >
          Estudar agora →
        </span>

        {/* Badge animado */}
        <div
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: color,
            boxShadow: hovered ? `0 0 8px 2px ${color}` : 'none',
          }}
        />
      </div>
    </Link>
  );
}
