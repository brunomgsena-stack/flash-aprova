'use client';

import { useEffect, useState } from 'react';

// ENEM 2026 — 1º de novembro de 2026, início da prova (manhã)
const ENEM_DATE = new Date('2026-11-01T09:00:00-03:00');

function calcRemaining() {
  const diff = ENEM_DATE.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60_000);
  const minutes      = totalMinutes % 60;
  const totalHours   = Math.floor(totalMinutes / 60);
  const hours        = totalHours % 24;
  const days         = Math.floor(totalHours / 24);

  return { days, hours, minutes };
}

export default function EnemCountdown() {
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!remaining) return null;

  const { days, hours, minutes } = remaining;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      title={`ENEM 2026 — 01/11/2026`}
      style={{
        background: 'rgba(234,179,8,0.08)',
        border:     '1px solid rgba(234,179,8,0.25)',
      }}
    >
      <span className="text-base leading-none">⏳</span>

      {/* Desktop: dias + horas + minutos */}
      <span className="text-sm font-bold tabular-nums hidden sm:inline" style={{ color: '#facc15' }}>
        {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m
      </span>

      {/* Mobile: só dias */}
      <span className="text-sm font-bold tabular-nums sm:hidden" style={{ color: '#facc15' }}>
        {days}d
      </span>

      <span className="text-xs text-slate-500 hidden md:inline">
        ENEM 2026
      </span>
    </div>
  );
}
