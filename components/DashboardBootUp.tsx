'use client';

import { useEffect, useState } from 'react';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const EMERALD = '#10B981';
const MONO    = '"JetBrains Mono", monospace';
const BG      = '#050b14';

// ─── Keyframes ──────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes bootup-scan {
  0%   { transform: translateY(-100vh); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
@keyframes bootup-grid-in {
  from { opacity: 0; }
  to   { opacity: 0.06; }
}
@keyframes bootup-text-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bootup-bar {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes bootup-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
`;

// ─── HUD text lines (phase 2) ──────────────────────────────────────────────
const HUD_LINES = [
  '[SISTEMA ONLINE]',
  'Neural Core ativo',
  'SRS calibrado',
  'Painel de guerra pronto',
];

type Props = { onComplete: () => void };

export default function DashboardBootUp({ onComplete }: Props) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // Phase 1 → Phase 2 at 800ms
    const t1 = setTimeout(() => setPhase(2), 800);
    // Phase 2 → Phase 3 at 2200ms
    const t2 = setTimeout(() => setPhase(3), 2200);
    // Complete at 3500ms (after 800ms fade-out in phase 3 + buffer)
    const t3 = setTimeout(() => onComplete(), 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
        style={{
          background: BG,
          animation: phase === 3 ? 'bootup-fade-out 800ms ease-out forwards' : undefined,
          pointerEvents: 'all',
        }}
      >
        {/* ── Grid background ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              `linear-gradient(${EMERALD}12 1px, transparent 1px), linear-gradient(90deg, ${EMERALD}12 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            animation: 'bootup-grid-in 600ms ease-out forwards',
          }}
        />

        {/* ── Scan lines (phase 1) ── */}
        {phase === 1 && (
          <>
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${EMERALD}88, ${EMERALD}, ${EMERALD}88, transparent)`,
                boxShadow: `0 0 20px ${EMERALD}66, 0 0 60px ${EMERALD}33`,
                animation: 'bootup-scan 800ms linear forwards',
              }}
            />
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${EMERALD}44, transparent)`,
                boxShadow: `0 0 12px ${EMERALD}44`,
                animation: 'bootup-scan 800ms linear 200ms forwards',
                opacity: 0,
              }}
            />
          </>
        )}

        {/* ── HUD content (phases 2 & 3) ── */}
        {phase >= 2 && (
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 max-w-xs w-full">
            {HUD_LINES.map((line, i) => (
              <p
                key={i}
                className="text-center tracking-widest uppercase"
                style={{
                  fontFamily: MONO,
                  fontSize: i === 0 ? 14 : 11,
                  fontWeight: i === 0 ? 900 : 500,
                  color: i === 0 ? EMERALD : `${EMERALD}aa`,
                  textShadow: i === 0 ? `0 0 12px ${EMERALD}66` : `0 0 8px ${EMERALD}33`,
                  animation: `bootup-text-in 400ms ease-out ${i * 300}ms both`,
                }}
              >
                {line}
              </p>
            ))}

            {/* Progress bar */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{
                height: 4,
                background: `${EMERALD}18`,
                animation: 'bootup-text-in 400ms ease-out 300ms both',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${EMERALD}, #059669)`,
                  boxShadow: `0 0 10px ${EMERALD}88`,
                  animation: 'bootup-bar 1200ms ease-in-out forwards',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Radial vignette ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, ${BG} 70%)`,
          }}
        />
      </div>
    </>
  );
}
