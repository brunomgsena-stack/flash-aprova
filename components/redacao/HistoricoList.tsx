'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EssayRecord = {
  id:               string;
  tema:             string;
  texto:            string;
  nota_total:       number;
  analise_completa: unknown;  // NormaResult — tipado no consumer
  created_at:       string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notaColor(nota: number): string {
  if (nota >= 800) return '#22c55e';
  if (nota >= 600) return '#06b6d4';
  if (nota >= 400) return '#f59e0b';
  return '#f87171';
}

function notaLabel(nota: number): string {
  if (nota >= 900) return 'Excelente';
  if (nota >= 700) return 'Bom';
  if (nota >= 500) return 'Regular';
  return 'Insuficiente';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

// ─── HistoricoList ────────────────────────────────────────────────────────────

export default function HistoricoList({
  records,
  activeId,
  onSelect,
}: {
  records:  EssayRecord[];
  activeId?: string;
  onSelect: (record: EssayRecord) => void;
}) {
  const CYAN   = '#06b6d4';
  const VIOLET = '#7C3AED';

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <span className="text-3xl">📝</span>
        <p className="text-slate-500 text-sm">Nenhuma redação corrigida ainda.</p>
      </div>
    );
  }

  // Most recent first
  const sorted = [...records].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((record, idx) => {
        const color    = notaColor(record.nota_total);
        const isActive = record.id === activeId;
        const isLatest = idx === 0;

        return (
          <button
            key={record.id}
            onClick={() => onSelect(record)}
            className="w-full text-left rounded-2xl px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 group"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${VIOLET}18, ${CYAN}10)`
                : 'rgba(255,255,255,0.03)',
              border: isActive
                ? `1px solid ${CYAN}40`
                : '1px solid rgba(255,255,255,0.07)',
              boxShadow: isActive ? `0 0 20px ${CYAN}10` : 'none',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Nota badge */}
              <div
                className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                style={{
                  background: `${color}12`,
                  border:     `1px solid ${color}30`,
                  boxShadow:  isActive ? `0 0 16px ${color}25` : 'none',
                }}
              >
                <span className="text-base font-black leading-none" style={{ color }}>
                  {record.nota_total}
                </span>
                <span className="text-[10px] font-semibold mt-0.5" style={{ color: `${color}99` }}>
                  /1000
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isLatest && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                        color: '#fff',
                      }}
                    >
                      Mais recente
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${color}12`, color }}
                  >
                    {notaLabel(record.nota_total)}
                  </span>
                </div>

                <p
                  className="text-sm font-semibold leading-snug mb-1 line-clamp-2"
                  style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.75)' }}
                >
                  {record.tema}
                </p>

                <p className="text-xs text-slate-600">
                  {formatDate(record.created_at)}
                </p>
              </div>

              {/* Chevron */}
              <svg
                className="shrink-0 mt-4 transition-all duration-200 group-hover:translate-x-0.5"
                style={{ color: isActive ? CYAN : 'rgba(255,255,255,0.15)' }}
                width="14" height="14" viewBox="0 0 16 16" fill="none"
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
