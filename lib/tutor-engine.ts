// ─── AiPro+ Tutor Squad ───────────────────────────────────────────────────────
// Each specialist maps to one or more subject patterns (regex on subject.title).
// avatar_url uses DiceBear as placeholder — replace with final AI-generated images.

export interface Tutor {
  id:        string;
  name:      string;
  specialty: string;
  avatar_url: string;
  /** Short tagline shown in the deck card */
  tagline:   string;
}

// ─── Roster ──────────────────────────────────────────────────────────────────

const BASE = 'https://api.dicebear.com/9.x/lorelei/svg';
const bg   = 'backgroundColor=0d0a1e';

const TUTORS: Tutor[] = [
  {
    id:        'dr-bio',
    name:      'Dr. Bio',
    specialty: 'Biologia',
    tagline:   'Mentor clínico · Especialista em Ciências da Vida',
    avatar_url: `${BASE}?seed=DrBio&${bg}&hair=variant01&earrings=variant01`,
  },
  {
    id:        'prof-carbono',
    name:      'Prof. Carbono',
    specialty: 'Química',
    tagline:   'Especialista em Química Orgânica e Inorgânica',
    avatar_url: `${BASE}?seed=ProfCarbono&${bg}&glasses=variant01`,
  },
  {
    id:        'mestre-newton',
    name:      'Mestre Newton',
    specialty: 'Física',
    tagline:   'Físico teórico · Expert em Mecânica e Ondas',
    avatar_url: `${BASE}?seed=MestreNewton&${bg}`,
  },
  {
    id:        'prof-logica',
    name:      'Prof. Lógica',
    specialty: 'Matemática',
    tagline:   'Especialista em Raciocínio e Cálculo para o ENEM',
    avatar_url: `${BASE}?seed=ProfLogica&${bg}&beard=variant01`,
  },
  {
    id:        'dra-clio',
    name:      'Dra. Clio',
    specialty: 'História',
    tagline:   'Historiadora · Especialista em Brasil e Mundo Contemporâneo',
    avatar_url: `${BASE}?seed=DraClio&${bg}&hair=variant04`,
  },
  {
    id:        'mestre-atlas',
    name:      'Mestre Atlas',
    specialty: 'Geografia',
    tagline:   'Geógrafo · Expert em Geopolítica e Meio Ambiente',
    avatar_url: `${BASE}?seed=MestreAtlas&${bg}&hair=variant02`,
  },
  {
    id:        'mentora-agora',
    name:      'Mentora Ágora',
    specialty: 'Linguagens & Redação',
    tagline:   'Especialista em Redação ENEM e Interpretação de Texto',
    avatar_url: `${BASE}?seed=MentoraAgora&${bg}&hair=variant03&earrings=variant02`,
  },
];

// ─── Subject → Tutor matcher ─────────────────────────────────────────────────

const SUBJECT_PATTERNS: [RegExp, string][] = [
  [/biol/i,              'dr-bio'],
  [/qu[ií]m/i,           'prof-carbono'],
  [/f[ií]sic/i,          'mestre-newton'],
  [/matem/i,             'prof-logica'],
  [/hist/i,              'dra-clio'],
  [/geo/i,               'mestre-atlas'],
  [/linguag|redaç|portugu|liter/i, 'mentora-agora'],
];

export function getTutor(subjectTitle: string | null): Tutor | null {
  if (!subjectTitle) return null;
  for (const [pattern, id] of SUBJECT_PATTERNS) {
    if (pattern.test(subjectTitle)) {
      return TUTORS.find(t => t.id === id) ?? null;
    }
  }
  return null;
}

export function getAllTutors(): Tutor[] {
  return TUTORS;
}
