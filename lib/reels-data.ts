// ─── Shared reel/testimonial data ────────────────────────────────────────────
// Imported by both ReelsTestimonials (landing page) and EvidenceCarousel
// (checkout page). Edit here → both components update automatically.

export interface Reel {
  img:        string;
  tag:        string;
  tagColor:   string;
  score:      string;
  course:     string;
  handle:     string;
  bullets:    [string, string, string];
  gradA:      string;
  gradB:      string;
  floatY:     number;
  floatRot:   number;
  floatDur:   number;
  floatDelay: number;
  stories:    [number, number, number, number];
  noPlay?:    boolean;
}

const NEON    = '#00FF73';
const EMERALD = '#10b981';
const VIOLET  = '#7C3AED';
const CYAN    = '#06b6d4';

export const REELS: Reel[] = [
  {
    img:       '/images/ana.med.ufpe.avif',
    tag:       'EM JORNADA',  tagColor: NEON,
    score:     '15 min/dia',  course:   'Meta: Medicina · UFPE',
    handle:    '@ana.m',
    bullets:   ['🧠 Biologia finalmente colando na memória.', '🎯 Larguei o Anki — aqui já vem pronto.', '💊 Em 15 min/dia estou retendo de verdade.'],
    gradA:     '#0d2a14',    gradB:    '#000810',
    floatY:    6,  floatRot:  0.4, floatDur: 5.2, floatDelay: 0.00,
    stories:   [1, 0, 0, 0],
  },
  {
    img:       '/images/carlos.eng.usp.avif',
    tag:       'NO MÉTODO',   tagColor: CYAN,
    score:     '15 min/dia',  course:   'Meta: Eng. Mecatrônica · USP',
    handle:    '@carlos.e',
    bullets:   ['📡 O radar de lacunas vira GPS dos meus erros.', '📐 Mat+Física: consigo revisar sem stress.', '⚡ Estudo menos horas, retenho muito mais.'],
    gradA:     '#0a1830',    gradB:    '#000810',
    floatY:    8,  floatRot: -0.3, floatDur: 5.8, floatDelay: 0.35,
    stories:   [1, 1, 0, 0],
  },
  {
    img:       '/images/beatriz.dir.avif',
    tag:       'NO MÉTODO',   tagColor: VIOLET,
    score:     '15 min/dia',  course:   'Meta: Direito · Unicamp',
    handle:    '@beatriz.d',
    bullets:   ['✍️ Recebi 30 feedbacks da Norma IA na redação.', '📝 Minha escrita melhorou a cada versão.', '⚖️ Finalmente entendo o que o INEP cobra.'],
    gradA:     '#180e38',    gradB:    '#000810',
    floatY:    5,  floatRot:  0.5, floatDur: 6.2, floatDelay: 0.70,
    stories:   [1, 1, 1, 0],
  },
  {
    img:       '/images/rafaela.medvet.avif',
    tag:       'EM JORNADA',  tagColor: EMERALD,
    score:     '15 min/dia',  course:   'Meta: Med. Veterinária · USP',
    handle:    '@rafaela.m',
    bullets:   ['🔬 Bio+Química: primeira vez que não esqueço no dia seguinte.', '🧬 Minha memória de longo prazo melhorou muito.', '🏆 Rotina de estudo finalmente consistente.'],
    gradA:     '#0a2818',    gradB:    '#000810',
    floatY:    7,  floatRot: -0.4, floatDur: 5.5, floatDelay: 1.05,
    stories:   [1, 1, 1, 1],
  },
  {
    img:       '/images/juliomed-ufrj.avif',
    tag:       'NO MÉTODO',   tagColor: '#fbbf24',
    score:     '15 min/dia',  course:   'Meta: Medicina · UFRJ',
    handle:    '@julio.m',
    bullets:   ['💪 Parei de estudar às cegas — o sistema mostra o que importa.', '🔬 Consigo revisar todo o conteúdo sem entrar em pânico.', '🎯 Minha rotina antes era caótica. Agora não.'],
    gradA:     '#2a1a0a',    gradB:    '#000810',
    floatY:    6,  floatRot:  0.3, floatDur: 5.9, floatDelay: 0.20,
    stories:   [1, 1, 1, 0],
    noPlay:    true,
  },
  {
    img:       '/images/lucas.eng.ita.avif',
    tag:       'NO MÉTODO',   tagColor: '#00FF73',
    score:     '15 min/dia',  course:   'Meta: Eng. Aeroespacial · ITA',
    handle:    '@lucas.e',
    bullets:   ['⚛️ Física: o Tutor IA explica até eu entender.', '🚀 O radar de lacunas me mostrou buracos que eu nem sabia que tinha.', '🛸 Em 15 min/dia eu consigo revisar o dia inteiro.'],
    gradA:     '#0a1a10',    gradB:    '#000810',
    floatY:    9,  floatRot: -0.5, floatDur: 6.4, floatDelay: 0.50,
    stories:   [1, 1, 0, 0],
  },
  {
    img:       '/images/sofia-usp.avif',
    tag:       'EM JORNADA',  tagColor: VIOLET,
    score:     '15 min/dia',  course:   'Meta: Direito · USP',
    handle:    '@sofia.d',
    bullets:   ['✍️ Redação: feedback da IA em cada versão que escrevi.', '⚖️ Consegui identificar os padrões que o INEP penaliza.', '📋 Minha nota de simulado melhorou a cada semana.'],
    gradA:     '#180e38',    gradB:    '#000810',
    floatY:    5,  floatRot:  0.4, floatDur: 5.3, floatDelay: 0.85,
    stories:   [1, 1, 1, 1],
  },
  {
    img:       '/images/vitormed.ufba.avif',
    tag:       'NO MÉTODO',   tagColor: '#a78bfa',
    score:     '15 min/dia',  course:   'Meta: Medicina · UFBA',
    handle:    '@vitor.m',
    bullets:   ['✍️ A Norma IA virou meu GPS de redação.', '🧬 Minha redação evoluiu mês a mês — consigo ver a diferença.', '🏥 Finalmente estudar não parece mais impossível.'],
    gradA:     '#16092e',    gradB:    '#000810',
    floatY:    7,  floatRot: -0.3, floatDur: 6.0, floatDelay: 1.20,
    stories:   [1, 1, 1, 0],
  },
];
