'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

export type RetentionPoint = {
  label:    string;  // "Hoje", "Amanhã", "Seg 17"
  due:      number;  // cards due that day
  isToday:  boolean;
};

const GREEN = '#00ff80';
const CYAN  = '#00e5ff';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: 'rgba(5,11,20,0.95)',
        border:     '1px solid rgba(0,255,128,0.25)',
        boxShadow:  '0 0 20px rgba(0,255,128,0.1)',
      }}
    >
      <p className="text-white font-semibold">{label}</p>
      <p style={{ color: GREEN }}>{payload[0].value} cards</p>
    </div>
  );
}

export default function RetentionAreaChart({ data }: { data: RetentionPoint[] }) {
  const maxVal = Math.max(...data.map(d => d.due), 1);

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: GREEN }}>
        Previsão de Revisão
      </p>
      <p className="text-slate-400 text-xs mb-3">Cards agendados — próximos 7 dias</p>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={GREEN} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter, system-ui' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, maxVal + 2]}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter, system-ui' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <ReferenceLine
              x={data.find(d => d.isToday)?.label}
              stroke={CYAN}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="due"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#retGrad)"
              dot={{ fill: GREEN, r: 3, strokeWidth: 0 }}
              activeDot={{ fill: GREEN, r: 5, stroke: '#00ff8044', strokeWidth: 4 }}
              style={{ filter: `drop-shadow(0 0 4px ${GREEN}66)` }}
            />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
