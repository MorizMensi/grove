import { effect, Injectable, signal, computed, type Signal } from '@angular/core';
import {
  DEFAULT_MODE_SELECTION,
  DEFAULT_PALETTE,
  MODE_SELECTIONS,
  PALETTES,
  STORAGE_KEYS,
  type ModeSelection,
  type Palette,
  type ResolvedMode,
} from '../constants/theme.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly paletteSignal = signal<Palette>(this.readPalette());
  private readonly modeSelectionSignal = signal<ModeSelection>(this.readModeSelection());
  private readonly systemDarkSignal = signal<boolean>(this.readSystemDark());

  readonly palette: Signal<Palette> = this.paletteSignal.asReadonly();
  readonly modeSelection: Signal<ModeSelection> = this.modeSelectionSignal.asReadonly();
  readonly resolvedMode: Signal<ResolvedMode> = computed(() => {
    const selection = this.modeSelectionSignal();
    if (selection === 'system') {
      return this.systemDarkSignal() ? 'dark' : 'light';
    }
    return selection;
  });

  constructor() {
    this.attachSystemListener();

    effect(() => {
      const palette = this.paletteSignal();
      const mode = this.resolvedMode();
      this.applyToDom(palette, mode);
    });
  }

  setPalette(palette: Palette): void {
    this.paletteSignal.set(palette);
    this.writeStorage(STORAGE_KEYS.palette, palette);
  }

  setModeSelection(mode: ModeSelection): void {
    this.modeSelectionSignal.set(mode);
    this.writeStorage(STORAGE_KEYS.mode, mode);
  }

  private applyToDom(palette: Palette, mode: ResolvedMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', palette);
    root.setAttribute('data-mode', mode);
  }

  private attachSystemListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', (event) => {
      this.systemDarkSignal.set(event.matches);
    });
  }

  private readPalette(): Palette {
    const raw = this.readStorage(STORAGE_KEYS.palette);
    return (PALETTES as readonly string[]).includes(raw ?? '')
      ? (raw as Palette)
      : DEFAULT_PALETTE;
  }

  private readModeSelection(): ModeSelection {
    const raw = this.readStorage(STORAGE_KEYS.mode);
    return (MODE_SELECTIONS as readonly string[]).includes(raw ?? '')
      ? (raw as ModeSelection)
      : DEFAULT_MODE_SELECTION;
  }

  private readSystemDark(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private readStorage(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      /* quota / private mode — ignore */
    }
  }
}
