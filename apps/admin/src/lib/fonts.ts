import type { FontOption } from './types';

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: 'cabin-sketch',
    label: 'Cabin Sketch',
    stack: "'Cabin Sketch', cursive",
    google: 'Cabin+Sketch:wght@400;700',
    note: 'Huruf sketsa berkapur — sangat mirip tulisan kapur tebal di blackboard'
  },
  {
    id: 'fredericka',
    label: 'Fredericka the Great',
    stack: "'Fredericka the Great', serif",
    google: 'Fredericka+the+Great',
    note: 'Serif bergaya sketsa kapur artistik'
  },
  {
    id: 'kalam',
    label: 'Kalam',
    stack: "'Kalam', cursive",
    google: 'Kalam:wght@300;400;700',
    note: 'Tulisan tangan natural dan rapi (sangat terbaca)'
  },
  {
    id: 'caveat',
    label: 'Caveat',
    stack: "'Caveat', cursive",
    google: 'Caveat:wght@400;600;700',
    note: 'Tulisan kapur kasual dan dinamis'
  },
  {
    id: 'schoolbell',
    label: 'Schoolbell',
    stack: "'Schoolbell', cursive",
    google: 'Schoolbell',
    note: 'Gaya tulisan guru di papan tulis'
  },
  {
    id: 'gochi-hand',
    label: 'Gochi Hand',
    stack: "'Gochi Hand', cursive",
    google: 'Gochi+Hand',
    note: 'Goresan tangan tebal dan ramah'
  },
  {
    id: 'rock-salt',
    label: 'Rock Salt',
    stack: "'Rock Salt', cursive",
    google: 'Rock+Salt',
    note: 'Goresan kapur kasar dan bertekstur'
  },
  {
    id: 'architects-daughter',
    label: 'Architects Daughter',
    stack: "'Architects Daughter', cursive",
    google: 'Architects+Daughter',
    note: 'Gaya tulisan arsitektur dan diagram'
  },
  {
    id: 'georgia',
    label: 'Georgia Bold (Asli PSD)',
    stack: "Georgia, 'Times New Roman', serif",
    note: 'Font serif bawaan sesuai mockup PSD'
  }
] as const;

export function getFontStack(id: string | undefined): string {
  const found = FONT_OPTIONS.find((f) => f.id === id);
  return found ? found.stack : "'Cabin Sketch', Georgia, serif";
}

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  FONT_OPTIONS.filter((f) => f.google)
    .map((f) => `family=${f.google}`)
    .join('&') +
  '&display=swap';
