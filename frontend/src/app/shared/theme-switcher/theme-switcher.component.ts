import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import {
  MODE_LABELS,
  MODE_SELECTIONS,
  PALETTE_LABELS,
  PALETTES,
  type ModeSelection,
  type Palette,
} from '../../core/constants/theme.constants';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
})
export class ThemeSwitcherComponent {
  private readonly themeService = inject(ThemeService);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly palettes = PALETTES;
  readonly modes = MODE_SELECTIONS;
  readonly paletteLabels = PALETTE_LABELS;
  readonly modeLabels = MODE_LABELS;

  readonly palette = this.themeService.palette;
  readonly modeSelection = this.themeService.modeSelection;

  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  selectPalette(palette: Palette): void {
    this.themeService.setPalette(palette);
  }

  selectMode(mode: ModeSelection): void {
    this.themeService.setModeSelection(mode);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
