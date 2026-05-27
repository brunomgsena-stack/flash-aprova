export type SubjectId = 'biologia' | 'quimica' | 'historia' | 'geografia';

export const SUBJECT_META: Record<SubjectId, {
  name: string; icon: string; color: string; area: string;
}> = {
  biologia:  { name: 'Biologia',  icon: '🧬', color: '#22c55e', area: 'Ciências da Natureza' },
  quimica:   { name: 'Química',   icon: '⚗️', color: '#06b6d4', area: 'Ciências da Natureza' },
  historia:  { name: 'História',  icon: '🏛️', color: '#eab308', area: 'Ciências Humanas' },
  geografia: { name: 'Geografia', icon: '🌍', color: '#f97316', area: 'Ciências Humanas' },
};

// ─── ENEM area mapping (for Radar) ──────────────────────────────────────────
export const AREA_MAP: Record<SubjectId, 'natureza' | 'humanas'> = {
  biologia:  'natureza',
  quimica:   'natureza',
  historia:  'humanas',
  geografia: 'humanas',
};

// ─── Tutorial Deck — 1 card per subject (medium level) ──────────────────────
export interface DiagnosticCard {
  id: string;
  subject: SubjectId;
  q: string;
  a: string;
}

export const DIAGNOSTIC_DECK: DiagnosticCard[] = [
  // ── Biologia ×3 ──
  { id: 'bio1', subject: 'biologia',
    q: 'Qual processo garante a variabilidade genética durante a formação dos gametas?',
    a: 'Crossing-over (permutação)' },
  { id: 'bio2', subject: 'biologia',
    q: 'Qual organela é responsável pela respiração celular e pela produção de ATP?',
    a: 'Mitocôndria' },
  { id: 'bio3', subject: 'biologia',
    q: 'Na fotossíntese, qual gás a planta absorve e qual ela libera?',
    a: 'Absorve CO₂ e libera O₂' },

  // ── Química ×2 ──
  { id: 'qui1', subject: 'quimica',
    q: 'Como se chama a reação entre um ácido e uma base que produz sal e água?',
    a: 'Neutralização' },
  { id: 'qui2', subject: 'quimica',
    q: 'Que tipo de ligação ocorre pela transferência de elétrons entre um metal e um ametal?',
    a: 'Ligação iônica' },

  // ── História ×3 ──
  { id: 'his1', subject: 'historia',
    q: 'Como ficou conhecido o período autoritário de Getúlio Vargas entre 1937 e 1945?',
    a: 'Estado Novo' },
  { id: 'his2', subject: 'historia',
    q: 'Em que ano foi assinada a Lei Áurea, que aboliu a escravidão no Brasil?',
    a: '1888' },
  { id: 'his3', subject: 'historia',
    q: 'Qual movimento levou Getúlio Vargas ao poder em 1930, encerrando a República Velha?',
    a: 'Revolução de 1930' },

  // ── Geografia ×2 ──
  { id: 'geo1', subject: 'geografia',
    q: 'Qual fenômeno é intensificado pelo acúmulo de gases como o CO₂ na atmosfera, elevando a temperatura do planeta?',
    a: 'Efeito estufa' },
  { id: 'geo2', subject: 'geografia',
    q: 'Qual é o tipo de clima predominante na maior parte do território brasileiro?',
    a: 'Tropical' },
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
  const others = shuffle(DIAGNOSTIC_DECK.filter(c => c.subject !== chosenSubject));
  return [...chosen, ...others];
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
