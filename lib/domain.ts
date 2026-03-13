// ── Domain level per subject ──────────────────────────────────────────────────
// Score = avg_interval_days × sqrt(coverage)
// coverage = studied_cards / total_cards

export type DomainLevel = {
  level:    number;   // 0–5
  label:    string;
  color:    string;
  coverage: number;   // 0–1
  avgInterval: number;
};

const LEVELS: Omit<DomainLevel, 'coverage' | 'avgInterval'>[] = [
  { level: 0, label: 'Não iniciado',  color: '#334155' },
  { level: 1, label: 'Iniciante',     color: '#64748b' },
  { level: 2, label: 'Aprendendo',    color: '#3b82f6' },
  { level: 3, label: 'Consolidando',  color: '#f97316' },
  { level: 4, label: 'Dominando',     color: '#00e5ff' },
  { level: 5, label: 'Mestre',        color: '#00ff80' },
];

export function calcDomain(avgInterval: number, coverage: number): DomainLevel {
  const base = { coverage, avgInterval };

  if (coverage === 0) return { ...LEVELS[0], ...base };

  // Penalise low coverage so mastery requires broad study
  const score = avgInterval * Math.sqrt(coverage);

  if (score < 1.5)  return { ...LEVELS[1], ...base };
  if (score < 5)    return { ...LEVELS[2], ...base };
  if (score < 12)   return { ...LEVELS[3], ...base };
  if (score < 25)   return { ...LEVELS[4], ...base };
  return              { ...LEVELS[5], ...base };
}

// ── Build a subjectId → DomainLevel map from raw Supabase data ────────────────

type CardRow     = { id: string; decks: { subject_id: string } | null };
type ProgressRow = { card_id: string; interval_days: number };

export function buildDomainMap(
  allCards: CardRow[],
  progress: ProgressRow[],
): Map<string, DomainLevel> {
  // card_id → subject_id
  const cardSubject = new Map<string, string>();
  for (const c of allCards) {
    if (c.decks?.subject_id) cardSubject.set(c.id, c.decks.subject_id);
  }

  // subject_id → { total, studied, sumInterval }
  const stats = new Map<string, { total: number; studied: number; sumInterval: number }>();

  for (const [, subjectId] of cardSubject) {
    if (!stats.has(subjectId)) stats.set(subjectId, { total: 0, studied: 0, sumInterval: 0 });
    stats.get(subjectId)!.total++;
  }

  const progressMap = new Map<string, number>();
  for (const p of progress) progressMap.set(p.card_id, p.interval_days);

  for (const [cardId, subjectId] of cardSubject) {
    const interval = progressMap.get(cardId);
    if (interval !== undefined) {
      const s = stats.get(subjectId)!;
      s.studied++;
      s.sumInterval += interval;
    }
  }

  const result = new Map<string, DomainLevel>();
  for (const [subjectId, s] of stats) {
    const coverage    = s.total > 0 ? s.studied / s.total : 0;
    const avgInterval = s.studied > 0 ? s.sumInterval / s.studied : 0;
    result.set(subjectId, calcDomain(avgInterval, coverage));
  }
  return result;
}
