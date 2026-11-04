/**
 * Chalk-friendly font catalogue shared by the API, the public site and the admin dashboard.
 * This file must stay dependency-free: it is imported at runtime by the frontends.
 */
export interface FontOption {
  id: string;
  label: string;
  /** CSS font-family stack */
  stack: string;
  /** Google Fonts family query (omit for system fonts) */
  google?: string;
  note: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: 'cabin-sketch',
    label: 'Cabin Sketch',
    stack: "'Cabin Sketch', 'Kalam', cursive",
    google: 'Cabin+Sketch:wght@400;700',
    note: 'Huruf sketsa berkapur — paling mirip tulisan kapur tebal (rekomendasi judul)'
  },
  {
    id: 'fredericka',
    label: 'Fredericka the Great',
    stack: "'Fredericka the Great', 'Cabin Sketch', serif",
    google: 'Fredericka+the+Great',
    note: 'Serif bergaya goresan kapur, klasik ala papan tulis sekolah'
  },
  {
    id: 'kalam',
    label: 'Kalam',
    stack: "'Kalam', 'Patrick Hand', cursive",
    google: 'Kalam:wght@300;400;700',
    note: 'Tulisan tangan rapi & sangat mudah dibaca (rekomendasi teks isi)'
  },
  {
    id: 'caveat',
    label: 'Caveat',
    stack: "'Caveat', 'Kalam', cursive",
    google: 'Caveat:wght@400;600;700',
    note: 'Tulisan tangan natural dan cepat'
  },
  {
    id: 'schoolbell',
    label: 'Schoolbell',
    stack: "'Schoolbell', 'Kalam', cursive",
    google: 'Schoolbell',
    note: 'Tulisan guru di papan tulis, ramah dan ringan'
  },
  {
    id: 'gochi-hand',
    label: 'Gochi Hand',
    stack: "'Gochi Hand', 'Kalam', cursive",
    google: 'Gochi+Hand',
    note: 'Tulisan tangan tebal dengan karakter kuat'
  },
  {
    id: 'rock-salt',
    label: 'Rock Salt',
    stack: "'Rock Salt', 'Caveat', cursive",
    google: 'Rock+Salt',
    note: 'Goresan kasar ekspresif — cocok untuk aksen, bukan paragraf'
  },
  {
    id: 'architects-daughter',
    label: 'Architects Daughter',
    stack: "'Architects Daughter', 'Kalam', cursive",
    google: 'Architects+Daughter',
    note: 'Tulisan arsitek/teknik, cocok untuk nuansa rumus matematika'
  },
  {
    id: 'georgia',
    label: 'Georgia Bold (asli PSD)',
    stack: "Georgia, 'Times New Roman', serif",
    note: 'Font asli di desain Photoshop'
  }
] as const;

export const DEFAULT_FONT_ID = 'cabin-sketch';

export function fontStack(id: string | undefined): string {
  return (FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0]).stack;
}

/** Single Google Fonts stylesheet URL for every catalogue font (browsers only download used faces). */
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  FONT_OPTIONS.filter((f) => f.google)
    .map((f) => `family=${f.google}`)
    .join('&') +
  '&display=swap';

