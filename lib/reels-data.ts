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
    tag:       'MAPEADO',    tagColor: NEON,
    score:     '940/1000',   course:   'MEDICINA · UFPE',
    handle:    '@ana.med.ufpe',
    bullets:   ['🧠 TRI domada. Bio imbatível.', '🎯 4ª tentativa → 1ª aprovação.', '💊 Sistema foi cirúrgico.'],
    gradA:     '#0d2a14',    gradB:    '#000810',
    floatY:    6,  floatRot:  0.4, floatDur: 5.2, floatDelay: 0.00,
    stories:   [1, 0, 0, 0],
  },
  {
    img:       '/images/carlos.eng.usp.avif',
    tag:       'SINCRONIZADO', tagColor: CYAN,
    score:     '920/1000',   course:   'ENG. MECATRÔNICA · USP',
    handle:    '@carlos.eng.usp',
    bullets:   ['📡 Radar ENEM = GPS das falhas.', '📐 Mat+Fís: 40%→89% em 60d.', '⚡ 4h de estudo, não 8.'],
    gradA:     '#0a1830',    gradB:    '#000810',
    floatY:    8,  floatRot: -0.3, floatDur: 5.8, floatDelay: 0.35,
    stories:   [1, 1, 0, 0],
  },
  {
    img:       '/images/beatriz.dir.avif',
    tag:       'BLINDADO',   tagColor: VIOLET,
    score:     '920/1000',   course:   'DIREITO · UNICAMP',
    handle:    '@beatriz.dir',
    bullets:   ['✍️ 30 feedbacks de IA na Red.', '🛡️ Redação blindada com IA.', '⚖️ 1ª tentativa. Unicamp.'],
    gradA:     '#180e38',    gradB:    '#000810',
    floatY:    5,  floatRot:  0.5, floatDur: 6.2, floatDelay: 0.70,
    stories:   [1, 1, 1, 0],
  },
  {
    img:       '/images/rafaela.medvet.avif',
    tag:       'DOMINADO',   tagColor: EMERALD,
    score:     '940/1000',   course:   'MED. VETERINÁRIA · USP',
    handle:    '@rafaela.medvet',
    bullets:   ['🔬 Bio+Quím zeradas na TRI.', '🧬 Memória neural blindada.', '🏆 Top 1% SISU — confirmado.'],
    gradA:     '#0a2818',    gradB:    '#000810',
    floatY:    7,  floatRot: -0.4, floatDur: 5.5, floatDelay: 1.05,
    stories:   [1, 1, 1, 1],
  },
  {
    img:       '/images/juliomed-ufrj.avif',
    tag:       'DOMINADO',   tagColor: '#fbbf24',
    score:     '960/1000',   course:   'MEDICINA · UFRJ',
    handle:    '@juliomed.ufrj',
    bullets:   ['💪 Táticos: covardia com a concorrência.', '🔬 UFRJ Medicina. 960/1000.', '🎯 Sistema que não perdoa lacunas.'],
    gradA:     '#2a1a0a',    gradB:    '#000810',
    floatY:    6,  floatRot:  0.3, floatDur: 5.9, floatDelay: 0.20,
    stories:   [1, 1, 1, 0],
    noPlay:    true,
  },
  {
    img:       '/images/lucas.eng.ita.avif',
    tag:       'SINCRONIZADO', tagColor: '#00FF73',
    score:     '920/1000',   course:   'ENG. AEROESPACIAL · ITA',
    handle:    '@lucas.eng.ita',
    bullets:   ['⚛️ Prof. Vektor: física cirúrgica.', '🚀 Radar de lacunas me salvou.', '🛸 ENG. AEROESPACIAL · ITA.'],
    gradA:     '#0a1a10',    gradB:    '#000810',
    floatY:    9,  floatRot: -0.5, floatDur: 6.4, floatDelay: 0.50,
    stories:   [1, 1, 0, 0],
  },
  {
    img:       '/images/sofia-usp.avif',
    tag:       'BLINDADO',   tagColor: VIOLET,
    score:     '940/1000',   course:   'DIREITO · USP',
    handle:    '@sofia.dir.usp',
    bullets:   ['✍️ Redação: feedback de IA em cada versão.', '⚖️ 1ª tentativa. Direito USP.', '🛡️ Sistema blindou minha nota final.'],
    gradA:     '#180e38',    gradB:    '#000810',
    floatY:    5,  floatRot:  0.4, floatDur: 5.3, floatDelay: 0.85,
    stories:   [1, 1, 1, 1],
  },
  {
    img:       '/images/vitormed.ufba.avif',
    tag:       'BLENDADO',   tagColor: '#a78bfa',
    score:     '940/1000',   course:   'MEDICINA · UFBA',
    handle:    '@vitormed.ufba',
    bullets:   ['✍️ Prof. Norma: GPS da redação.', '🧬 900+ na Redação. Garantido.', '🏥 MEDICINA · UFBA. Alcançado.'],
    gradA:     '#16092e',    gradB:    '#000810',
    floatY:    7,  floatRot: -0.3, floatDur: 6.0, floatDelay: 1.20,
    stories:   [1, 1, 1, 0],
  },
];
