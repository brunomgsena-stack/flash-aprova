// Regex-based ENEM category resolver
// Works regardless of exact spelling, accents, or casing in the DB

export type CategoryInfo = {
  displayName: string;
  short:       string;
  color:       string;
  icon:        string;
};

const BRAND = '#7C3AED';

const CATEGORY_MAP: [RegExp, CategoryInfo][] = [
  [/natureza/i,         { displayName: 'Ciências da Natureza e suas Tecnologias', short: 'Natureza',   color: BRAND,      icon: '🔬' }],
  [/humana/i,           { displayName: 'Ciências Humanas e Sociais Aplicadas',    short: 'Humanas',    color: BRAND,      icon: '🌍' }],
  [/matem/i,            { displayName: 'Matemática e suas Tecnologias',           short: 'Matemática', color: BRAND,      icon: '📐' }],
  [/reda[cç]/i,         { displayName: 'Redação Flash+',                          short: 'Redação',    color: '#06b6d4',  icon: '✒️' }],
  [/linguagem|codigo/i, { displayName: 'Linguagens, Códigos e suas Tecnologias', short: 'Linguagens', color: BRAND,      icon: '✍️' }],
];

// Ordered: Natureza → Humanas → Matemática → Redação → Linguagens
export const ENEM_ORDER_PATTERNS: RegExp[] = [/natureza/i, /humana/i, /matem/i, /reda[cç]/i, /linguagem|codigo/i];

export function getCategoryInfo(category: string | null): CategoryInfo {
  if (category) {
    for (const [re, info] of CATEGORY_MAP) {
      if (re.test(category)) return info;
    }
  }
  return {
    displayName: category ?? 'Outras',
    short:       category ?? 'Outras',
    color:       '#7C3AED',
    icon:        '📚',
  };
}

/** Returns the canonical ENEM area short name for a raw DB category string. */
export function getCategoryShort(category: string | null): string {
  return getCategoryInfo(category).short;
}

/** The 4 canonical ENEM areas in display order. */
export const ENEM_AREAS: CategoryInfo[] = CATEGORY_MAP.map(([, info]) => info);
