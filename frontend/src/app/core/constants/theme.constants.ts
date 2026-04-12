export const PALETTES = ['grove', 'classic-blue'] as const;
export type Palette = typeof PALETTES[number];

export const MODE_SELECTIONS = ['light', 'dark', 'system'] as const;
export type ModeSelection = typeof MODE_SELECTIONS[number];

export type ResolvedMode = 'light' | 'dark';

export const STORAGE_KEYS = {
  palette: 'grove-theme',
  mode: 'grove-mode',
} as const;

export const DEFAULT_PALETTE: Palette = 'grove';
export const DEFAULT_MODE_SELECTION: ModeSelection = 'system';

export const PALETTE_LABELS: Record<Palette, string> = {
  grove: 'Grove',
  'classic-blue': 'Classic Blue',
};

export const MODE_LABELS: Record<ModeSelection, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};
