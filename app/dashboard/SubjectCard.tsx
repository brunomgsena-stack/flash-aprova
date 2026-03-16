'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DomainLevel } from '@/lib/domain';

type Props = {
  id:      string;
  title:   string;
  icon:    string;
  color:   string;
  domain?: DomainLevel;
};

export default function SubjectCard({ id, title, icon, color, domain }: Props) {
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

      {/* Domain level badge */}
      {domain && domain.level > 0 ? (
        <div className="flex items-center justify-between mt-3 relative z-10">
          <div className="flex items-center gap-1.5">
            {/* Level dots */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background:  n <= domain.level ? domain.color : 'rgba(255,255,255,0.1)',
                    boxShadow:   n <= domain.level ? `0 0 4px ${domain.color}` : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: domain.color }}>
              {domain.label}
            </span>
          </div>
          <span className="text-xs text-slate-600">
            {Math.round(domain.coverage * 100)}%
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mt-3 relative z-10">Nenhum card estudado</p>
      )}

      {/* CTA */}
      <p
        className="text-sm font-medium relative z-10 mt-2"
        style={{ color }}
      >
        Ver decks →
      </p>
    </Link>
  );
}
