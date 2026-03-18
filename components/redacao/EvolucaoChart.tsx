'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartPoint = {
  id:    string;
  data:  string;   // label formatado: "18 Mar"
  nota:  number;
  tema:  string;
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: {
  active?:  boolean;
  payload?: { payload: ChartPoint; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const nota  = payload[0].value;
  const color =
    nota >= 800 ? '#22c55e' :
    nota >= 600 ? '#06b6d4' :
    nota >= 400 ? '#f59e0b' : '#f87171';

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{
        background:   'rgba(5,8,20,0.97)',
        border:       `1px solid ${color}40`,
        boxShadow:    `0 0 24px ${color}20`,
        backdropFilter: 'blur(12px)',
        maxWidth:     220,
      }}
    >
      <p className="font-black text-2xl mb-0.5" style={{ color }}>{nota}</p>
      <p className="text-slate-400 text-xs mb-1">{point.data}</p>
      <p className="text-slate-500 leading-relaxed line-clamp-2">{point.tema}</p>
    </div>
  );
}

// ─── Custom dot ───────────────────────────────────────────────────────────────

function CustomDot(props: {
  cx?: number; cy?: number;
  payload?: ChartPoint;
  index?: number;
  dataLength?: number;
}) {
  const { cx = 0, cy = 0, payload } = props;
  const nota  = payload?.nota ?? 0;
  const color =
    nota >= 800 ? '#22c55e' :
    nota >= 600 ? '#06b6d4' :
    nota >= 400 ? '#f59e0b' : '#f87171';

  return (
    <g>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={7} fill={`${color}20`} />
      {/* Inner dot */}
      <circle
        cx={cx} cy={cy} r={4}
        fill={color}
        stroke="rgba(5,8,20,0.9)"
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </g>
  );
}

// ─── EvolucaoChart ────────────────────────────────────────────────────────────

export default function EvolucaoChart({ data }: { data: ChartPoint[] }) {
  const CYAN   = '#06b6d4';
  const VIOLET = '#7C3AED';

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-3xl">📈</span>
        <p className="text-slate-500 text-sm">
          Nenhuma correção ainda. Envie sua primeira redação para começar a evolução.
        </p>
      </div>
    );
  }

  // Linha de referência: média das notas
  const avg = Math.round(data.reduce((s, d) => s + d.nota, 0) / data.length);

  return (
    <div>
      {/* Header stats */}
      <div className="flex items-center gap-6 mb-5 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Redações</p>
          <p className="text-xl font-black text-white">{data.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Média</p>
          <p className="text-xl font-black" style={{ color: CYAN }}>{avg}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Melhor</p>
          <p className="text-xl font-black" style={{ color: '#22c55e' }}>
            {Math.max(...data.map(d => d.nota))}
          </p>
        </div>
        {data.length >= 2 && (() => {
          const delta = data[data.length - 1].nota - data[data.length - 2].nota;
          return (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Última evolução</p>
              <p
                className="text-xl font-black"
                style={{ color: delta >= 0 ? '#22c55e' : '#f87171' }}
              >
                {delta >= 0 ? '+' : ''}{delta}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
          <defs>
            {/* Cyan gradient fill */}
            <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={CYAN}   stopOpacity={0.25} />
              <stop offset="60%"  stopColor={CYAN}   stopOpacity={0.06} />
              <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
            </linearGradient>
            {/* Line glow filter */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="data"
            tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[0, 1000]}
            ticks={[0, 200, 400, 600, 800, 1000]}
            tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Média reference line */}
          <ReferenceLine
            y={avg}
            stroke={`${VIOLET}60`}
            strokeDasharray="4 4"
            label={{ value: `Média ${avg}`, fill: `${VIOLET}99`, fontSize: 10, position: 'insideTopRight' }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="nota"
            stroke={CYAN}
            strokeWidth={2.5}
            fill="url(#cyanFill)"
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: CYAN, stroke: 'rgba(5,8,20,0.9)', strokeWidth: 2, filter: `drop-shadow(0 0 8px ${CYAN})` }}
            style={{ filter: 'url(#lineGlow)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
