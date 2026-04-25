'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export type RadarPoint = {
  area:     string;
  mastery:  number;
  fullMark: 100;
};

const NEON = '#00FF73';

const AREA_COLORS: Record<string, string> = {
  Natureza:   '#22d3ee',
  Humanas:    '#f97316',
  Linguagens: '#a855f7',
  Matemática: '#10b981',
  Redação:    '#eab308',
};

const RADAR_STYLES = `
  @keyframes radarPulse {
    0%, 100% { fill-opacity: 0.10; }
    50%       { fill-opacity: 0.26; }
  }
  @keyframes radarStroke {
    0%, 100% { stroke-opacity: 0.7; }
    50%       { stroke-opacity: 1; }
  }
  @keyframes gridGlow {
    0%, 100% { stroke-opacity: 0.07; }
    50%       { stroke-opacity: 0.14; }
  }
  .radar-polygon {
    animation: radarPulse 3s ease-in-out infinite, radarStroke 3s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(0,255,115,0.45));
  }
  .radar-grid line,
  .radar-grid polygon {
    animation: gridGlow 4s ease-in-out infinite;
  }
`;

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: RadarPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d     = payload[0].payload;
  const color = AREA_COLORS[d.area] ?? NEON;
  const label = d.mastery >= 40
    ? `${d.mastery}% — dominando! ⭐`
    : `${d.mastery}% — oportunidade de crescimento 📈`;

  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: 'rgba(5,11,20,0.96)',
        border:     `1px solid ${color}45`,
        boxShadow:  `0 0 20px ${color}25`,
      }}
    >
      <p className="font-semibold mb-0.5 text-white">{d.area}</p>
      <p style={{ color }}>{label}</p>
    </div>
  );
}

function CustomDot(props: {
  cx?: number; cy?: number;
  payload?: RadarPoint;
  [key: string]: unknown;
}) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const color    = AREA_COLORS[payload.area] ?? NEON;
  const isStrong = payload.mastery >= 40;
  const r        = isStrong ? 4 : 3;
  const dur      = `${1.8 + Math.random() * 0.8}s`;

  return (
    <g>
      {/* Expanding ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.2">
        <animate attributeName="r"       values={`${r};${r + 7};${r}`} dur={dur} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7"             dur={dur} repeatCount="indefinite" />
      </circle>
      {/* Core dot */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        style={{ filter: `drop-shadow(0 0 ${isStrong ? 7 : 4}px ${color})` }}
      />
    </g>
  );
}

function ColoredTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  if (!payload) return null;
  const color = AREA_COLORS[payload.value] ?? 'rgba(255,255,255,0.40)';

  function handleClick() {
    const id = `area-${payload!.value.toLowerCase()}`;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        cursor:     'pointer',
        fontSize:   11,
        fontFamily: 'Inter, system-ui',
        fontWeight: 700,
        fill:       color,
        filter:     `drop-shadow(0 0 4px ${color}88)`,
      }}
      onClick={handleClick}
    >
      {payload.value}
    </text>
  );
}

export default function MasteryRadarChart({ data }: { data: RadarPoint[] }) {
  const hasData = data.some(d => d.mastery > 0);

  return (
    <div className="w-full h-full flex flex-col">
      <style>{RADAR_STYLES}</style>

      <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: NEON, textShadow: `0 0 8px ${NEON}80` }}>
        Radar ENEM
      </p>
      <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
        Clique numa área para ver as matérias
      </p>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600 text-sm text-center">
            Estude cards para<br />ver seu radar de domínio
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
              <defs>
                <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor={NEON}    stopOpacity="0.35" />
                  <stop offset="50%"  stopColor="#00ccff" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              <PolarGrid
                stroke="rgba(0,255,115,0.10)"
                gridType="polygon"
                className="radar-grid"
              />
              <PolarAngleAxis dataKey="area" tick={<ColoredTick />} />
              <Radar
                name="Domínio"
                dataKey="mastery"
                stroke={NEON}
                fill="url(#radarFillGrad)"
                fillOpacity={1}
                strokeWidth={2}
                dot={<CustomDot />}
                className="radar-polygon"
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
