'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DomainLevel } from '@/lib/domain';

const MONO = 'var(--font-jetbrains), "JetBrains Mono", monospace';

type Props = {
  id:             string;
  title:          string;
  icon:           string;
  color:          string;
  domain?:        DomainLevel;
  onLockedClick?: () => void;
};

function integrityColor(pct: number): string {
  if (pct > 60) return '#00ff80';
  if (pct > 30) return '#f97316';
  return '#ef4444';
}

export default function SubjectCard({ id, title, icon, color, domain, onLockedClick }: Props) {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    background: 'rgba(6,6,18,0.72)',
    backdropFilter: 'blur(36px) saturate(180%)',
    WebkitBackdropFilter: 'blur(36px) saturate(180%)',
    border: `1px solid ${hovered ? `${color}cc` : `${color}44`}`,
    boxShadow: hovered
      ? `0 0 28px 4px ${color}44, 0 0 72px 8px ${color}18, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 24px rgba(255,255,255,0.02)`
      : `0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
  };

  const cardClasses = 'group relative block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]';

  const inner = (
    <>
      {/* Ambient radial */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}22 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0.4,
        }}
      />
      {/* Top neon edge */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${hovered ? 'cc' : '55'}, transparent)`,
          transition: 'all 0.3s',
        }}
      />

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}55`,
          boxShadow: hovered ? `0 0 16px ${color}44` : 'none',
          transition: 'box-shadow 0.3s',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h2
        className="text-xl font-bold mb-1 relative z-10"
        style={id === 'redacao-flash' ? {
          background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 50%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : { color: 'white' }}
      >
        {title}
      </h2>

      {/* ── Integridade de Memória ── */}
      <div className="mt-3 relative z-10">
        {domain && domain.level > 0 ? (() => {
          const intPct  = Math.round(domain.coverage * 100);
          const barClr  = integrityColor(intPct);
          return (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.10em' }}>
                  INTEGRIDADE DE MEMÓRIA
                </span>
                <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: barClr }}>
                  {intPct}%
                </span>
              </div>
              {/* Bar track */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:     `${intPct}%`,
                    background: `linear-gradient(90deg, ${barClr}77, ${barClr})`,
                    boxShadow:  `0 0 8px ${barClr}99`,
                  }}
                />
              </div>
              {/* Domain label */}
              <span style={{ fontFamily: MONO, fontSize: '8px', color: domain.color, letterSpacing: '0.06em', marginTop: 4, display: 'block' }}>
                [{domain.label.toUpperCase()}]
              </span>
            </>
          );
        })() : (
          <p style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
            SEM DADOS · INICIAR PROTOCOLO
          </p>
        )}
      </div>

      {/* CTA */}
      {id !== 'redacao-flash' && (
        <p className="text-sm font-medium relative z-10 mt-3" style={{ color, fontFamily: MONO, fontSize: '11px', letterSpacing: '0.04em' }}>
          {onLockedClick ? '> DESBLOQUEAR' : '> VER DECKS'}
        </p>
      )}
    </>
  );

  if (onLockedClick) {
    return (
      <button
        type="button"
        className={`${cardClasses} w-full text-left cursor-pointer`}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onLockedClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={`/dashboard/subject/${id}`}
      className={cardClasses}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </Link>
  );
}
