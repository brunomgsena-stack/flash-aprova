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
  {
    id: 'bio1', subject: 'biologia',
    q: 'Na cadeia respiratória, qual é o aceptor final de elétrons e onde ocorre a maior produção de ATP?',
    a: 'O O₂ é o aceptor final. A maior produção de ATP (~32 ATPs) ocorre na fosforilação oxidativa — na cadeia transportadora de elétrons da membrana interna mitocondrial.',
  },
  {
    id: 'bio2', subject: 'biologia',
    q: 'Qual é a função dos lisossomos e por que são chamados de "estômagos da célula"?',
    a: 'Lisossomos contêm enzimas digestivas (hidrolases ácidas) que degradam resíduos celulares, organelas danificadas e agentes externos. Funcionam em pH ~5, agindo como o sistema digestório intracelular.',
  },
  {
    id: 'bio3', subject: 'biologia',
    q: 'Diferencie mitose e meiose quanto ao objetivo e ao número de células-filhas produzidas.',
    a: 'Mitose: 1 divisão → 2 células 2n idênticas (crescimento/regeneração). Meiose: 2 divisões → 4 células n (haploides) com variabilidade genética — base da reprodução sexual.',
  },
  {
    id: 'bio4', subject: 'biologia',
    q: 'O que ocorre na fase clara e na fase escura da fotossíntese?',
    a: 'Fase clara (tilacóide): captação de luz, fotólise da água, geração de ATP e NADPH. Fase escura/Ciclo de Calvin (estroma): fixação do CO₂ usando ATP e NADPH para sintetizar glicose.',
  },

  // ── Química (4) ──
  {
    id: 'qui1', subject: 'quimica',
    q: 'O que é ligação iônica e em que tipo de substâncias ela ocorre predominantemente?',
    a: 'Transferência de elétrons de um metal para um não-metal, formando íons de cargas opostas que se atraem eletrostaticamente. Ocorre em sais e bases iônicas — ex: NaCl, KOH.',
  },
  {
    id: 'qui2', subject: 'quimica',
    q: 'O que é eletronegatividade e qual elemento apresenta o maior valor na tabela periódica?',
    a: 'Tendência de um átomo de atrair elétrons de uma ligação. Aumenta da esquerda→direita e de baixo→cima na tabela. O Flúor (F) é o mais eletronegativo (4,0 na escala de Pauling).',
  },
  {
    id: 'qui3', subject: 'quimica',
    q: 'Qual a diferença entre isomeria plana e isomeria espacial (estereoisomeria)?',
    a: 'Isomeria plana: mesma fórmula molecular, diferente estrutura de cadeia, função ou posição. Estereoisomeria: mesma sequência de ligações, diferente arranjo espacial (cis-trans ou óptica/quiral).',
  },
  {
    id: 'qui4', subject: 'quimica',
    q: 'Como se calcula o pH de uma solução? O que significa pH=7, pH<7 e pH>7?',
    a: 'pH = -log[H⁺]. pH 7 = neutro; pH < 7 = ácido (excesso de H⁺); pH > 7 = básico/alcalino (excesso de OH⁻). Escala de 0 (superácido) a 14 (superbase).',
  },

  // ── História (4) ──
  {
    id: 'his1', subject: 'historia',
    q: 'Quais são as características essenciais do Mercantilismo e seu papel na formação do capitalismo?',
    a: 'Política econômica estatal (séc. XV–XVIII): acúmulo de metais preciosos (metalismo), superávit comercial (protecionismo), exploração colonial. Base do capital mercantil que financiou a Revolução Industrial.',
  },
  {
    id: 'his2', subject: 'historia',
    q: 'O que foi a Diáspora Africana e quais foram seus impactos culturais no Brasil?',
    a: 'Dispersão forçada de africanos pelo tráfico negreiro (séc. XVI–XIX). No Brasil, gerou sincretismo religioso (candomblé, umbanda), contribuições linguísticas, culinárias e musicais centrais à identidade nacional.',
  },
  {
    id: 'his3', subject: 'historia',
    q: 'Quais foram as principais causas e consequências sociais da 1ª Revolução Industrial?',
    a: 'Causas: carvão/ferro britânicos, capital mercantil, revolução agrícola, liberalismo. Consequências: urbanização acelerada, surgimento do proletariado, condições insalubres, desigualdade e o início do movimento operário.',
  },
  {
    id: 'his4', subject: 'historia',
    q: 'O que foi a Guerra Fria? Quais blocos se opunham e qual foi seu desfecho?',
    a: 'Conflito geopolítico (1947–1991) entre EUA (capitalismo/OTAN) × URSS (socialismo/Pacto de Varsóvia) sem confronto direto. Marcado por corrida armamentista, espacial e ideológica. Terminou com a dissolução da URSS em 1991.',
  },

  // ── Geografia (3) ──
  {
    id: 'geo1', subject: 'geografia',
    q: 'Quais são as características do Cerrado e por que é considerado um hotspot ameaçado?',
    a: 'Savana tropical com raízes profundas, vegetação adaptada ao fogo e estação seca marcada. 2º maior bioma do Brasil, com enorme biodiversidade endêmica. Já perdeu ~50% da área original por causa do agronegócio.',
  },
  {
    id: 'geo2', subject: 'geografia',
    q: 'O que é a Projeção de Mercator e qual é sua principal distorção crítica?',
    a: 'Projeção cilíndrica conforme (séc. XVI) que preserva ângulos para navegação. Distorção: exagera o tamanho das regiões polares — a Groenlândia parece maior que a África, quando é ~14× menor.',
  },
  {
    id: 'geo3', subject: 'geografia',
    q: 'Diferencie urbanização de metropolização e cite problemas da urbanização acelerada no Brasil.',
    a: 'Urbanização: crescimento da população urbana. Metropolização: concentração em mega-cidades com área de influência regional. Problemas no Brasil (~87% urbano): favelização, déficit habitacional, violência, saneamento precário.',
  },
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
