'use client';

import { useState } from 'react';
import type { DomainLevel } from '@/lib/domain';
import SubjectCard from './SubjectCard';

const MONO         = 'var(--font-jetbrains), "JetBrains Mono", monospace';
const NEON_PURPLE  = '#a855f7';
const DIM_PURPLE   = '#7C3AED';


type Subject = {
  id:       string;
  title:    string;
  icon:     string;
  color:    string;
  category: string | null;
};

type Props = {
  subjects:         Subject[];
  domainMap:        Map<string, DomainLevel>;
  onLockedClickFor?: (id: string) => (() => void) | undefined;
};

export default function WritingAuditModule({ subjects, domainMap, onLockedClickFor }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <section
      className="relative w-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background:   'rgba(6,4,20,0.88)',
        border:       `1px solid ${hovered ? NEON_PURPLE + 'aa' : DIM_PURPLE + '44'}`,
        boxShadow:    hovered
          ? `0 0 40px 6px ${NEON_PURPLE}1a, inset 0 0 60px rgba(168,85,247,0.04)`
          : `0 0 0 1px rgba(168,85,247,0.05)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.20) 3px, rgba(0,0,0,0.20) 4px)',
          opacity: 0.55,
        }}
      />

      {/* Top neon edge */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
        style={{ background: `linear-gradient(90deg, transparent, ${NEON_PURPLE}cc, transparent)` }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(ellipse at top left, ${NEON_PURPLE}12 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0.4,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h2
            style={{
              fontFamily:  MONO,
              fontSize:    '13px',
              fontWeight:  700,
              color:       NEON_PURPLE,
              letterSpacing: '0.12em',
              textShadow:  `0 0 14px ${NEON_PURPLE}88`,
            }}
          >
            [ LABORATÓRIO DE REDAÇÃO: NORMA IA ]
          </h2>

          <span
            style={{
              fontFamily:    MONO,
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '0.14em',
              padding:       '2px 8px',
              borderRadius:  '4px',
              background:    `${NEON_PURPLE}22`,
              color:         NEON_PURPLE,
              border:        `1px solid ${NEON_PURPLE}66`,
              boxShadow:     `0 0 8px ${NEON_PURPLE}44`,
            }}
          >
            [ ALTA PRIORIDADE ]
          </span>

          <div
            className="flex-1 h-px"
            style={{ background: `linear-gradient(90deg, ${NEON_PURPLE}33, transparent)` }}
          />
        </div>

        {/* ── Insight de Auditoria ── */}
        <div
          className="rounded-xl p-4 flex flex-col mb-6"
          style={{
            background: 'rgba(0,0,0,0.40)',
            border:     '1px solid rgba(168,85,247,0.12)',
            fontFamily: MONO,
          }}
        >
          <p style={{ fontSize: '9px', color: 'rgba(168,85,247,0.55)', letterSpacing: '0.12em', marginBottom: '14px' }}>
            ── INSIGHT DE AUDITORIA ──
          </p>

          <div
            className="flex-1 rounded-lg p-3"
            style={{
              background: 'rgba(6,4,20,0.65)',
              border:     '1px solid rgba(168,85,247,0.20)',
            }}
          >
            <p style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.7 }}>
              <span style={{ color: 'rgba(168,85,247,0.65)' }}>NORMA_IA_LOG:</span>{' '}
              <span style={{ color: '#f1f5f9' }}>"Reforce a proposta de intervenção no D3."</span>
            </p>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', marginTop: '10px', lineHeight: 1.5 }}>
              › C5 abaixo do limiar crítico (38%)<br />
              › Treino focado recomendado: Agentes Intervenção
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: NEON_PURPLE, boxShadow: `0 0 6px ${NEON_PURPLE}` }}
            />
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>
              NORMA_IA v2.4 · OPERANDO
            </span>
          </div>
        </div>

        {/* ── Subject cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map(s => (
            <SubjectCard
              key={s.id}
              id={s.id}
              title={s.title}
              icon={s.icon}
              color={s.color}
              domain={domainMap.get(s.id)}
              onLockedClick={onLockedClickFor?.(s.id)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
