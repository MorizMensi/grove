import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MdNodeComponent } from '../doclang/md-node.component';
import { HtmlPreviewComponent } from './html-preview.component';
import { PreviewKind } from '../../core/constants/file-types';

export type ViewerMode = 'preview' | 'source';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [MdNodeComponent, HtmlPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss',
})
export class FilePreviewComponent {
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
}
