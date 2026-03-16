'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export type RadarPoint = {
  area:    string;   // short label
  mastery: number;   // 0–100
  fullMark: 100;
};

const CYAN  = '#00e5ff';
const GREEN = '#00ff80';

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: RadarPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: 'rgba(5,11,20,0.95)',
        border:     '1px solid rgba(0,229,255,0.25)',
        boxShadow:  '0 0 20px rgba(0,229,255,0.1)',
      }}
    >
      <p className="text-white font-semibold">{d.area}</p>
      <p style={{ color: CYAN }}>{d.mastery}% domínio</p>
    </div>
  );
}

export default function MasteryRadarChart({ data }: { data: RadarPoint[] }) {
  const hasData = data.some(d => d.mastery > 0);

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: CYAN }}>
        Radar ENEM
      </p>
      <p className="text-slate-400 text-xs mb-3">Equilíbrio de domínio por área</p>

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
              <PolarGrid
                stroke="rgba(255,255,255,0.07)"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="area"
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter, system-ui' }}
              />
              <Radar
                name="Domínio"
                dataKey="mastery"
                stroke={CYAN}
                fill={GREEN}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ fill: CYAN, r: 3, strokeWidth: 0 }}
                style={{ filter: `drop-shadow(0 0 6px ${CYAN}88)` }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
