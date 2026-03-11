import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgStyle, NgClass, NgTemplateOutlet } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { DlNode } from './dl-node.model';
import { DlExtendedValue, normalize } from './dl-normalize';
import { HighlightService } from './highlight.service';
import { KatexService } from './katex.service';
import { MermaidService } from './mermaid.service';

const ALLOWED_SCHEME_RE = /^(https?:\/\/|mailto:)/i;
const HAS_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || CONTROL_CHAR_RE.test(trimmed)) return false;
  if (HAS_SCHEME_RE.test(trimmed)) return ALLOWED_SCHEME_RE.test(trimmed);
  return true;
}

const SAFE_ICON_RE = /^[a-z0-9-]+$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const FONT_FAMILY_MAP: Record<string, string> = {
  sans: 'sans-serif',
  serif: 'serif',
  mono: 'monospace',
};

@Component({
  selector: 'dl-node',
  standalone: true,
  imports: [NgStyle, NgClass, NgTemplateOutlet],
  templateUrl: './dl-node.component.html',
  styleUrl: './dl-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlNodeComponent implements OnChanges {
  private readonly hlService = inject(HighlightService);
  private readonly katexService = inject(KatexService);
  private readonly mermaidService = inject(MermaidService);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly LANG_DISPLAY: Record<string, string> = {
    ts: 'TypeScript', typescript: 'TypeScript',
    js: 'JavaScript', javascript: 'JavaScript',
    html: 'HTML', xml: 'XML',
    css: 'CSS', scss: 'SCSS',
    json: 'JSON', yaml: 'YAML', yml: 'YAML',
    bash: 'Bash', sh: 'Shell', shell: 'Shell',
    python: 'Python', py: 'Python',
    java: 'Java', sql: 'SQL',
  };

  copied = false;
  mermaidSvg: SafeHtml | null = null;

  /** Accepts canonical DlNode or any extended form (string, array, shorthand children). */
  @Input() node!: DlNode | DlExtendedValue;

  /** The canonical node used for rendering, produced by normalize(). */
  canonical!: DlNode;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node']) {
      this.canonical = normalize(this.node as DlExtendedValue);
      if (this.isMermaid) {
        this.mermaidSvg = null;
        this.mermaidService.render(this.codeText).then(svg => {
          this.mermaidSvg = svg;
          this.cdr.markForCheck();
        });
      } else {
        this.mermaidSvg = null;
      }
    }
  }

  get isMermaid(): boolean {
    return this.canonical.type === 'pre' && this.canonical.language === 'mermaid';
  }

  get safeLink(): string | null {
    return this.canonical.link && isSafeUrl(this.canonical.link)
      ? this.canonical.link.trim()
      : null;
  }

  get safeSrc(): string | null {
    return this.canonical.src && isSafeUrl(this.canonical.src)
      ? this.canonical.src.trim()
      : null;
  }

  get safeIcon(): string | null {
    return this.canonical.icon && SAFE_ICON_RE.test(this.canonical.icon)
      ? this.canonical.icon
      : null;
  }

  get inlineStyles(): Record<string, string> {
    const s: Record<string, string> = {};
    if (this.canonical.color && HEX_COLOR_RE.test(this.canonical.color)) {
      s['color'] = this.canonical.color;
    }
    if (this.canonical.background && HEX_COLOR_RE.test(this.canonical.background)) {
      s['background-color'] = this.canonical.background;
    }
    if (this.canonical.fontFamily && FONT_FAMILY_MAP[this.canonical.fontFamily]) {
      s['font-family'] = FONT_FAMILY_MAP[this.canonical.fontFamily];
    }
    if (this.canonical.align) {
      s['text-align'] = this.canonical.align;
    }
    return s;
  }

  get cssClasses(): string[] {
    const c: string[] = [];
    if (this.canonical.bold) c.push('dl-bold');
    if (this.canonical.italic) c.push('dl-italic');
    if (this.canonical.underline) c.push('dl-underline');
    if (this.canonical.strikethrough) c.push('dl-strikethrough');
    if (this.canonical.code && this.canonical.type !== 'pre') c.push('dl-code');
    if (this.canonical.fontSize) c.push(`dl-fs-${this.canonical.fontSize}`);
    return c;
  }

  get colorSwatch(): string | null {
    if (this.canonical.code && this.canonical.type !== 'pre' && this.canonical.text) {
      const match = HEX_COLOR_RE.exec(this.canonical.text);
      return match ? this.canonical.text : null;
    }
    return null;
  }

  get langClass(): string {
    return this.canonical.language ? `language-${this.canonical.language}` : '';
  }

  get elementId(): string | null {
    return this.canonical.id ?? null;
  }

  get headingLevel(): number {
    const lvl = this.canonical.level ?? 1;
    return Math.max(1, Math.min(6, lvl));
  }

  get displayLanguage(): string | null {
    const lang = this.canonical.language;
    if (!lang) return null;
    return DlNodeComponent.LANG_DISPLAY[lang] ?? lang;
  }

  get codeText(): string {
    if (this.canonical.type !== 'pre') return '';
    return (this.canonical.text ?? '') +
      (this.canonical.children?.map(c => c.text ?? '').join('') ?? '');
  }

  get lineNumbers(): string | null {
    if (this.canonical.type !== 'pre' || !this.canonical.language) return null;
    const code = this.codeText;
    if (!code) return null;
    const count = code.split('\n').length;
    return Array.from({ length: count }, (_, i) => i + 1).join('\n');
  }

  get highlightedHtml(): string | null {
    if (this.canonical.type !== 'pre' || !this.canonical.language) return null;
    if (this.canonical.children?.some(c => c.color)) return null;
    const code = this.codeText;
    if (!code) return null;
    return this.hlService.highlight(code, this.canonical.language);
  }

  get mathHtml(): SafeHtml | null {
    if (this.canonical.type !== 'math' || !this.canonical.text) return null;
    return this.katexService.render(this.canonical.text, this.canonical.displayMode ?? false);
  }

  async copyCode(): Promise<void> {
    const text = this.codeText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 2000);
    } catch { /* clipboard API may be blocked */ }
  }

}
