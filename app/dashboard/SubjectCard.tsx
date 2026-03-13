'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

export default function SubjectCard({ id, title, icon, color }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/dashboard/subject/${id}`}
      className="group relative block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? `${color}cc` : `${color}55`}`,
        boxShadow: hovered
          ? `0 0 20px 2px ${color}55, 0 0 40px 4px ${color}22`
          : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}18 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Ícone */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{
          background: `${color}22`,
          border: `1px solid ${color}55`,
        }}
      >
        {icon}
      </div>

      {/* Título */}
      <h2 className="text-xl font-bold text-white mb-1 relative z-10">
        {title}
      </h2>

      {/* CTA */}
      <p
        className="text-sm font-medium relative z-10"
        style={{ color }}
      >
        Ver decks →
      </p>
    </Link>
  );
}
