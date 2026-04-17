'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider';

export type RadarPoint = {
  area:     string;
  mastery:  number;
  fullMark: 100;
};

// Paleta Zen Focus — sem vermelho/laranja de crise
const MINT  = '#34D399';   // forças (mastery ≥ 40)
const OCEAN = '#0EA5E9';   // oportunidades (mastery < 40)

function CustomTooltip({ active, payload, isLight }: { active?: boolean; payload?: { payload: RadarPoint }[]; isLight?: boolean }) {
  if (!active || !payload?.length) return null;
  const d       = payload[0].payload;
  const isStrong = d.mastery >= 40;
  const color    = isStrong ? MINT : OCEAN;
  const label    = isStrong
    ? `${d.mastery}% — já está dominando! ⭐`
    : `${d.mastery}% — boa oportunidade de crescimento 📈`;

  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(5,11,20,0.95)',
        border:     `1px solid ${color}30`,
        boxShadow:  isLight ? `0 4px 16px rgba(15,23,42,0.12)` : `0 0 20px ${color}15`,
      }}
    >
      <p className="font-semibold mb-0.5" style={{ color: isLight ? '#0A0A0A' : '#ffffff' }}>{d.area}</p>
      <p style={{ color }}>{label}</p>
    </div>
  );
}

// Dot customizado: verde-menta para forças, azul para crescimento
function CustomDot(props: {
  cx?: number; cy?: number;
  payload?: RadarPoint;
  [key: string]: unknown;
}) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const isStrong = payload.mastery >= 40;
  const color    = isStrong ? MINT : OCEAN;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isStrong ? 4 : 3}
      fill={color}
      stroke="none"
      style={{ filter: `drop-shadow(0 0 ${isStrong ? 5 : 3}px ${color}88)` }}
    />
  );
}

export default function MasteryRadarChart({ data }: { data: RadarPoint[] }) {
  const { theme }  = useTheme();
  const isLight    = theme === 'light';
  const hasData    = data.some(d => d.mastery > 0);
  const strongAreas = data.filter(d => d.mastery >= 40).map(d => d.area);
  const growAreas   = data.filter(d => d.mastery > 0 && d.mastery < 40).map(d => d.area);

  // Light mode: iridescent Apple gradient; dark: mint solid
  const radarStroke = isLight ? '#5AC8FA' : MINT;
  const radarFill   = isLight ? 'url(#radarIris)' : MINT;
  const gridStroke  = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';
  const tickFill    = isLight ? '#86868B' : '#64748b';
  const labelColor  = isLight ? '#86868B' : OCEAN;

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: radarStroke }}>
        Radar ENEM
      </p>
      <p className="text-xs mb-3" style={{ color: labelColor }}>O que você já conquistou e onde crescer mais</p>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600 text-sm text-center">
            Estude cards para<br />ver seu radar de domínio
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                {/* SVG gradient defs for light mode iridescent fill */}
                <defs>
                  <linearGradient id="radarIris" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#5AC8FA" stopOpacity="0.28" />
                    <stop offset="45%"  stopColor="#AF52DE" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#34C759" stopOpacity="0.22" />
                  </linearGradient>
                </defs>
                <PolarGrid stroke={gridStroke} gridType="polygon" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{ fill: tickFill, fontSize: 11, fontFamily: 'Inter, system-ui' }}
                />
                <Radar
                  name="Domínio"
                  dataKey="mastery"
                  stroke={radarStroke}
                  fill={radarFill}
                  fillOpacity={isLight ? 1 : 0.14}
                  strokeWidth={isLight ? 1.5 : 2}
                  dot={<CustomDot />}
                />
                <Tooltip content={<CustomTooltip isLight={isLight} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda de forças vs oportunidades */}
          {(strongAreas.length > 0 || growAreas.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {strongAreas.length > 0 && (
                <p className="text-xs" style={{ color: MINT }}>
                  <span className="font-bold">⭐ Forte:</span>{' '}
                  <span style={{ color: isLight ? '#475569' : 'rgba(255,255,255,0.45)' }}>{strongAreas.join(', ')}</span>
                </p>
              )}
              {growAreas.length > 0 && (
                <p className="text-xs" style={{ color: OCEAN }}>
                  <span className="font-bold">📈 Crescimento:</span>{' '}
                  <span style={{ color: isLight ? '#475569' : 'rgba(255,255,255,0.45)' }}>{growAreas.join(', ')}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
