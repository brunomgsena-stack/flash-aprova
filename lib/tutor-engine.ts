// ─── AiPro+ Tutor Squad ───────────────────────────────────────────────────────
// Each specialist maps to one or more subject patterns (regex on subject.title).
// avatar_url uses DiceBear as placeholder — replace with final AI-generated images.

export interface Tutor {
  id:           string;
  name:         string;
  specialty:    string;
  avatar_url:   string;
  /** Short tagline shown in the deck card */
  tagline:      string;
  /**
   * OpenAI Responses API Workflow ID (wf_xxx).
   * When set, the chat route invokes this pre-configured workflow instead of
   * the generic agent, enabling full tool access and custom instructions
   * defined in the OpenAI platform.
   */
  workflow_id?: string;
}

// ─── Category → Workflow ID map ──────────────────────────────────────────────
// Add entries here as new subject workflow agents are configured in the platform.
// Keys match the subject title patterns used by SUBJECT_PATTERNS below.

export const CATEGORY_WORKFLOW_MAP: Record<string, string> = {
  historia_geral:   'wf_69bc07918c1c8190babac70914475454023cf7b5063ab13c',
  historia_brasil:  'wf_69bc07918c1c8190babac70914475454023cf7b5063ab13c',
};

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
    id:          'dra-clio',
    name:        'Dra. Clio',
    specialty:   'História',
    tagline:     'Historiadora · Especialista em Brasil e Mundo Contemporâneo',
    avatar_url:  `${BASE}?seed=DraClio&${bg}&hair=variant04`,
    workflow_id: 'wf_69bc07918c1c8190babac70914475454023cf7b5063ab13c',
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

// ─── Contextual opening message ──────────────────────────────────────────────

export function getOpeningMessage(tutor: Tutor, deckTitle: string): string {
  const greetings: Record<string, string> = {
    'dr-bio':          `Olá! Sou o Dr. Bio, seu mentor em Ciências da Vida. Você está estudando **"${deckTitle}"** — um tema que aparece bastante nas provas do ENEM. Me diga: qual parte está te gerando mais dúvidas? Pode ser conceito, nomenclatura, qualquer coisa. Estou aqui para desbloquear você.`,
    'prof-carbono':    `E aí! Prof. Carbono aqui. Vejo que você está com **"${deckTitle}"** na frente. Química pode parecer abstrata, mas quando você entende a lógica por trás, tudo se conecta. Qual é a sua maior travada nesse tema?`,
    'mestre-newton':   `Olá! Mestre Newton no comando. **"${deckTitle}"** é um tema rico — e a Física adora aparecer em contextos do cotidiano no ENEM. O que você já entende sobre isso? Me conta, e eu te ajudo a avançar daqui.`,
    'prof-logica':     `Fala aí! Prof. Lógica aqui. Você está em **"${deckTitle}"** — ótimo ponto de partida. Na Matemática, o segredo é identificar o padrão certo. Me conta: está com dificuldade no conceito, nos cálculos, ou na hora de resolver questões?`,
    'dra-clio':        `Olá! Sou a Dra. Clio, sua especialista em História. **"${deckTitle}"** é um capítulo fascinante — e o ENEM adora cobrar interpretação de contexto, não só datas. O que você quer entender melhor sobre esse tema?`,
    'mestre-atlas':    `Olá! Mestre Atlas aqui. **"${deckTitle}"** faz parte de um panorama geográfico muito cobrado no ENEM. Pode ser meio-ambiente, geopolítica, clima... Me diz o que tá travando e a gente desvenda juntos.`,
    'mentora-agora':   `Oi! Mentora Ágora aqui. Você está com **"${deckTitle}"** — seja texto, redação ou gramática, a chave é sempre a interpretação. Me conta: o que está te confundindo? Posso ajudar a clarear os conceitos e montar uma estratégia de resposta.`,
  };
  return greetings[tutor.id] ?? `Olá! Sou ${tutor.name}. Estou aqui para te ajudar com **"${deckTitle}"**. Qual é a sua dúvida?`;
}
