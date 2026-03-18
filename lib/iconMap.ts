// Centralized subject icon resolution
// Priority: icon_url key → title keyword → category fallback
import { getCategoryInfo } from '@/lib/categories';

const ICON_KEY: Record<string, string> = {
  zap:        '⚡',
  book:       '📚',
  flask:      '🧪',
  globe:      '🌍',
  calculator: '📐',
  pen:        '✏️',
  atom:       '⚛️',
  dna:        '🧬',
  brain:      '🧠',
  microscope: '🔬',
  history:    '🏛️',
  geo:        '🗺️',
  art:        '🎨',
  music:      '🎵',
};

const TITLE_RULES: [RegExp, string][] = [
  [/física|fisica/i,            '⚛️'],
  [/química|quimica/i,          '🧪'],
  [/biolog/i,                   '🧬'],
  [/matem/i,                    '📐'],
  [/histór.*geral|historia.*geral/i, '🏛️'],
  [/histór.*brasil|historia.*brasil/i, '🇧🇷'],
  [/histor|histór/i,            '🏛️'],
  [/geograf/i,                  '🗺️'],
  [/filosof/i,                  '🎭'],
  [/sociolog/i,                 '👥'],
  [/reda[cç]/i,                 '✒️'],
  [/portugu/i,                  '📖'],
  [/literatur/i,                '📜'],
  [/artes|arte\b/i,             '🎨'],
];

export function getSubjectIcon(
  title:    string,
  iconUrl:  string | null,
  category: string | null,
): string {
  if (iconUrl && ICON_KEY[iconUrl]) return ICON_KEY[iconUrl];
  for (const [re, icon] of TITLE_RULES) {
    if (re.test(title)) return icon;
  }
  return getCategoryInfo(category).icon;
}
