'use client';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#10B981';

// ─── Course → area weights ────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Record<string, number> = {
  Natureza: 25, Humanas: 25, Linguagens: 25, Matemática: 25,
};

function getCourseWeights(course: string | null): Record<string, number> {
  if (!course) return DEFAULT_WEIGHTS;
  const c = course.toLowerCase();
  if (/medic|odonto|farmác|enferma|fisio|nutri|biomed/.test(c))
    return { Natureza: 40, Humanas: 15, Linguagens: 20, Matemática: 25 };
  if (/direito|jornali|relaç|psicolog|pedago|histór|geograf|filosof/.test(c))
    return { Natureza: 10, Humanas: 45, Linguagens: 35, Matemática: 10 };
  if (/engenhar|comput|sist.*inform|arquitet|matem|física|quím/.test(c))
    return { Natureza: 35, Humanas: 10, Linguagens: 15, Matemática: 40 };
  if (/econom|administ|contab|adm/.test(c))
    return { Natureza: 15, Humanas: 25, Linguagens: 25, Matemática: 35 };
  return DEFAULT_WEIGHTS;
}

// ─── Area metadata ────────────────────────────────────────────────────────────

const AREA_META: Record<string, { icon: string; color: string }> = {
  Natureza:   { icon: '🔬', color: '#22d3ee' },
  Humanas:    { icon: '🏛️', color: '#f97316' },
  Linguagens: { icon: '📚', color: '#a855f7' },
  Matemática: { icon: '📐', color: NEON },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  course:       string | null;
  university:   string | null;
  difficulties: string[];
  areaScores:   Record<string, number>;
  onClose:      () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudyPlanModal({ course, university, difficulties, areaScores, onClose }: Props) {
  const weights = getCourseWeights(course);
  const areas   = Object.keys(AREA_META);

  // Sort: difficulty first → lowest weighted score first
  const sorted = [...areas].sort((a, b) => {
    const aDiff  = difficulties.includes(a) ? 1 : 0;
    const bDiff  = difficulties.includes(b) ? 1 : 0;
    if (aDiff !== bDiff) return bDiff - aDiff;
    const aScore = (areaScores[a] ?? 0) / (weights[a] / 25);
    const bScore = (areaScores[b] ?? 0) / (weights[b] / 25);
    return aScore - bScore;
  });

  // Weighted overall progress toward the course
  const overallPct = Math.round(
    areas.reduce((sum, area) => sum + (areaScores[area] ?? 0) * (weights[area] / 100), 0),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background:   '#07040f',
          border:       `1px solid ${VIOLET}50`,
          boxShadow:    `0 0 80px ${VIOLET}20`,
          maxHeight:    '90vh',
          overflowY:    'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${NEON}60, transparent)` }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: NEON }}>
                Plano de Estudos
              </p>
              <h2 className="text-lg font-black text-white leading-tight">
                Rota para {course ?? 'sua vaga'} 🎯
              </h2>
              {university && <p className="text-xs text-slate-500 mt-0.5">{university}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg font-bold"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              ✕
            </button>
          </div>

          {/* Distância da vaga */}
          <div
            className="rounded-2xl px-4 py-4 mb-5"
            style={{ background: `${NEON}08`, border: `1px solid ${NEON}25` }}
          >
            <p className="text-xs font-semibold text-slate-400 mb-2">Distância da Vaga</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-black" style={{ color: NEON }}>{overallPct}%</span>
              <span className="text-xs text-slate-500 pb-1">
                do necessário para {course ?? 'seu curso'} dominado
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.max(overallPct, overallPct > 0 ? 3 : 0)}%`,
                  background: `linear-gradient(90deg, ${VIOLET}, ${NEON})`,
                  boxShadow:  `0 0 8px ${NEON}60`,
                }}
              />
            </div>
          </div>

          {/* Ordem de prioridade */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Ordem de Prioridade
          </p>

          <div className="flex flex-col gap-3 mb-5">
            {sorted.map((area, i) => {
              const meta          = AREA_META[area];
              const score         = areaScores[area] ?? 0;
              const weight        = weights[area];
              const isDiff        = difficulties.includes(area);
              const priorityLabel = i === 0 ? 'ATACAR AGORA' : i === 1 ? 'ALTA' : i === 2 ? 'MÉDIA' : 'MANTER';
              const priorityColor = i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? VIOLET : NEON;

              return (
                <div
                  key={area}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: i === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border:     `1px solid ${i === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white">{area}</span>
                      {isDiff && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                          dificuldade
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold ml-auto"
                        style={{ background: `${priorityColor}18`, color: priorityColor, border: `1px solid ${priorityColor}35` }}
                      >
                        {priorityLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, background: meta.color }}
                        />
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        {score}% · peso {weight}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FlashTutor tip */}
          <div
            className="rounded-xl px-4 py-3 text-xs leading-snug"
            style={{ background: `${VIOLET}10`, border: `1px solid ${VIOLET}25`, color: 'rgba(255,255,255,0.60)' }}
          >
            <span className="font-bold mr-1" style={{ color: VIOLET }}>FlashTutor:</span>
            {sorted[0]
              ? `Comece por ${sorted[0]} hoje. É onde cada ponto vale mais para ${course ?? 'seu curso'}.`
              : 'Continue revisando suas matérias com constância. A aprovação vem do hábito.'}
          </div>
        </div>
      </div>
    </div>
  );
}
