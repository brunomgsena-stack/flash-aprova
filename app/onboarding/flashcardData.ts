export type SubjectId = 'biologia' | 'quimica' | 'historia' | 'filosofia' | 'sociologia';

export const SUBJECT_META: Record<SubjectId, {
  name: string; icon: string; color: string; area: string;
}> = {
  biologia:  { name: 'Biologia',          icon: '🧬', color: '#22c55e', area: 'Ciências da Natureza' },
  quimica:   { name: 'Química',           icon: '⚗️', color: '#06b6d4', area: 'Ciências da Natureza' },
  historia:  { name: 'História do Brasil', icon: '🏛️', color: '#eab308', area: 'Ciências Humanas' },
  filosofia: { name: 'Filosofia',         icon: '🤔', color: '#a78bfa', area: 'Ciências Humanas' },
  sociologia:{ name: 'Sociologia',        icon: '👥', color: '#f97316', area: 'Ciências Humanas' },
};

// ─── ENEM area mapping (for Radar) ──────────────────────────────────────────
export const AREA_MAP: Record<SubjectId, 'natureza' | 'humanas'> = {
  biologia:   'natureza',
  quimica:    'natureza',
  historia:   'humanas',
  filosofia:  'humanas',
  sociologia: 'humanas',
};

// ─── Tutorial Deck — 1 card per subject (medium level) ──────────────────────
export interface DiagnosticCard {
  id: string;
  subject: SubjectId;
  q: string;
  a: string;
}

export const DIAGNOSTIC_DECK: DiagnosticCard[] = [
  { id: 'bio1', subject: 'biologia',
    q: 'Qual processo garante a variabilidade genética durante a formação dos gametas?',
    a: 'Crossing-over' },

  { id: 'qui1', subject: 'quimica',
    q: 'Como se chama a reação entre ácido e base que produz sal e água?',
    a: 'Neutralização' },

  { id: 'his1', subject: 'historia',
    q: 'Como ficou conhecido o período de governo autoritário de Getúlio Vargas entre 1937 e 1945?',
    a: 'Estado Novo' },

  { id: 'fil1', subject: 'filosofia',
    q: 'Qual filósofo grego utilizava o método da maiêutica para "parir" ideias nos seus interlocutores?',
    a: 'Sócrates' },

  { id: 'soc1', subject: 'sociologia',
    q: 'Conceito de Durkheim que descreve a falta de normas sociais em períodos de ruptura',
    a: 'Anomia' },
];

// ─── Build 10-card test deck ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildTestDeck(chosenSubject: SubjectId): DiagnosticCard[] {
  const chosen = DIAGNOSTIC_DECK.filter(c => c.subject === chosenSubject);
  const others  = shuffle(DIAGNOSTIC_DECK.filter(c => c.subject !== chosenSubject));
  const needed  = 10 - chosen.length;
  return shuffle([...chosen, ...others.slice(0, needed)]);
}

export const UNIVERSITIES = [
  'USP – Medicina', 'USP – Engenharia', 'USP – Direito',
  'UNICAMP – Medicina', 'UNICAMP – Computação', 'UNICAMP – Engenharia',
  'UFRJ – Medicina', 'UFRJ – Direito', 'UFRJ – Engenharia',
  'UFMG – Medicina', 'UFMG – Direito',
  'UnB – Medicina', 'UnB – Direito',
  'UFPE – Medicina', 'UFPE – Engenharia',
  'UNESP – Medicina', 'UNESP – Odontologia',
  'UFSC – Medicina', 'UFSC – Computação',
  'UFC – Medicina', 'UFC – Engenharia',
  'UFBA – Medicina', 'UFBA – Direito',
  'PUC-SP – Direito', 'PUC-Rio – Engenharia',
  'FGV – Administração', 'FGV – Direito',
  'ITA – Engenharia Aeronáutica',
  'IME – Engenharia Militar',
  'Outro curso / concurso público',
];
