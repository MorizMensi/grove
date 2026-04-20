import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MdNodeComponent } from '../doclang/md-node.component';
import { PreviewKind } from '../../core/constants/file-types';
import { ThemeService } from '../../core/services/theme.service';
import { injectThemeIntoIframe } from './html-theme-injection';

export type ViewerMode = 'preview' | 'source';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [MdNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss',
})
export class FilePreviewComponent {
  private readonly themeService = inject(ThemeService);

  readonly kind = input.required<PreviewKind | null>();
  readonly mode = input.required<ViewerMode>();
  readonly sourceText = input<string | null>(null);
  readonly markdown = input<string | null>(null);
  readonly mediaUrl = input<string | null>(null);
  readonly safeMediaUrl = input<SafeResourceUrl | null>(null);
  readonly title = input<string>('');
  readonly extension = input<string>('');
  readonly assetBase = input<readonly string[]>([]);

  readonly fencedSource = computed<string>(() => {
    const text = this.sourceText();
    if (text === null) return '';
    const ext = this.extension();
    return '```' + ext + '\n' + text + '\n```';
  });

  private readonly htmlFrame = viewChild<ElementRef<HTMLIFrameElement>>('htmlFrame');

  constructor() {
    effect(() => {
      // Subscribe to theme signals so this effect re-runs on palette/mode change.
      this.themeService.palette();
      const mode = this.themeService.resolvedMode();
      const frame = this.htmlFrame()?.nativeElement;
      if (!frame) return;
      injectThemeIntoIframe(frame, document.documentElement, mode);
    });
  }

  onHtmlFrameLoad(event: Event): void {
    const frame = event.target as HTMLIFrameElement;
    injectThemeIntoIframe(frame, document.documentElement, this.themeService.resolvedMode());
  }
}
