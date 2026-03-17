export type SubjectId = 'historia' | 'biologia' | 'quimica' | 'geografia';

export const SUBJECT_META: Record<SubjectId, {
  name: string; icon: string; color: string; area: string;
}> = {
  historia:  { name: 'História',  icon: '⏳', color: '#eab308', area: 'Ciências Humanas' },
  biologia:  { name: 'Biologia',  icon: '🧬', color: '#22c55e', area: 'Ciências da Natureza' },
  quimica:   { name: 'Química',   icon: '⚗️', color: '#06b6d4', area: 'Ciências da Natureza' },
  geografia: { name: 'Geografia', icon: '🌐', color: '#10b981', area: 'Ciências Humanas' },
};

// ─── ENEM area mapping (for Radar) ──────────────────────────────────────────
export const AREA_MAP: Record<SubjectId, 'natureza' | 'humanas'> = {
  biologia:  'natureza',
  quimica:   'natureza',
  historia:  'humanas',
  geografia: 'humanas',
};

// ─── Diagnostic Deck — 15 Elite Cards ───────────────────────────────────────
export interface DiagnosticCard {
  id: string;
  subject: SubjectId;
  q: string;
  a: string;
}

export const DIAGNOSTIC_DECK: DiagnosticCard[] = [
  // ── Biologia (4) ──
  { id: 'bio1', subject: 'biologia',
    q: 'Fase da respiração celular que produz a maior parte do ATP',
    a: 'Cadeia Respiratória' },
  { id: 'bio2', subject: 'biologia',
    q: 'Organela responsável pela digestão intracelular',
    a: 'Lisossomos' },
  { id: 'bio3', subject: 'biologia',
    q: 'Processo de divisão celular que resulta em 4 células filhas haploides',
    a: 'Meiose' },
  { id: 'bio4', subject: 'biologia',
    q: 'Nome do transporte de membrana que gasta energia (ATP)',
    a: 'Transporte Ativo' },

  // ── Química (4) ──
  { id: 'qui1', subject: 'quimica',
    q: 'Ligação química caracterizada pela transferência de elétrons',
    a: 'Ligação Iônica' },
  { id: 'qui2', subject: 'quimica',
    q: 'Propriedade periódica que mede a atração por elétrons em uma ligação',
    a: 'Eletronegatividade' },
  { id: 'qui3', subject: 'quimica',
    q: 'Função orgânica com uma carbonila (C=O) em carbono secundário',
    a: 'Cetona' },
  { id: 'qui4', subject: 'quimica',
    q: 'Substância que libera íons H⁺ em solução aquosa (Arrhenius)',
    a: 'Ácido' },

  // ── História (4) ──
  { id: 'his1', subject: 'historia',
    q: 'Sistema econômico baseado no acúmulo de metais (Brasil Colônia)',
    a: 'Mercantilismo' },
  { id: 'his2', subject: 'historia',
    q: 'Nome da primeira constituição do Brasil (1824)',
    a: 'Outorgada' },
  { id: 'his3', subject: 'historia',
    q: 'Fenômeno de dispersão dos judeus após a conquista romana',
    a: 'Diáspora' },
  { id: 'his4', subject: 'historia',
    q: 'Principal conflito que marcou o início da Idade Contemporânea',
    a: 'Revolução Francesa' },

  // ── Geografia (3) ──
  { id: 'geo1', subject: 'geografia',
    q: "Bioma brasileiro conhecido como a 'Savana mais biodiversa do mundo'",
    a: 'Cerrado' },
  { id: 'geo2', subject: 'geografia',
    q: 'Fenômeno climático de aquecimento anormal das águas do Pacífico',
    a: 'El Niño' },
  { id: 'geo3', subject: 'geografia',
    q: 'Projeção cartográfica eurocêntrica que preserva as formas',
    a: 'Mercator' },
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
