'use client';

import { useState } from 'react';
import type { DomainLevel } from '@/lib/domain';
import SubjectCard from './SubjectCard';

const MONO        = 'var(--font-jetbrains), "JetBrains Mono", monospace';
const MATH_COLOR  = '#6366f1';   // indigo — sóbrio
const NEON_PURPLE = '#a855f7';

type Subject = {
  id:       string;
  title:    string;
  icon:     string;
  color:    string;
  category: string | null;
};

type Props = {
  subjects:  Subject[];
  domainMap: Map<string, DomainLevel>;
};

export default function MathPrecisionModule({ subjects, domainMap }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <section
      className="relative w-full rounded-2xl p-6 transition-all duration-300"
      style={{
        background:      'rgba(6,6,18,0.72)',
        backdropFilter:  'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        border:          `1px solid ${hovered ? MATH_COLOR + '66' : MATH_COLOR + '28'}`,
        boxShadow:       hovered
          ? `0 0 32px 4px ${MATH_COLOR}1a, inset 0 1px 0 rgba(255,255,255,0.05)`
          : `0 0 0 1px rgba(255,255,255,0.02)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top neon edge */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
        style={{
          background:  `linear-gradient(90deg, transparent, ${MATH_COLOR}${hovered ? '66' : '33'}, transparent)`,
          transition:  'all 0.3s',
        }}
      />

      {/* Ambient radial */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top left, ${MATH_COLOR}14 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0.5,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: `${MATH_COLOR}14`, border: `1px solid ${MATH_COLOR}33` }}
        >
          📐
        </div>

        <h2
          style={{
            fontFamily:    MONO,
            fontSize:      '12px',
            fontWeight:    700,
            color:         'var(--fa-text)',
            letterSpacing: '0.10em',
          }}
        >
          MATEMÁTICA
        </h2>

        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(90deg, ${NEON_PURPLE}22, transparent)` }}
        />

        <span style={{ fontFamily: MONO, fontSize: '8px', color: `${NEON_PURPLE}66`, letterSpacing: '0.10em' }}>
          · MÓDULO DE PRECISÃO ·
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {subjects.map(s => (
          <SubjectCard
            key={s.id}
            id={s.id}
            title={s.title}
            icon={s.icon}
            color={s.color}
            domain={domainMap.get(s.id)}
          />
        ))}
      </div>
    </section>
  );
}
