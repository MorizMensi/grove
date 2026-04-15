import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { sanitizeUserHtml } from './sanitize-user-html';
import { rewriteUserHtml } from './rewrite-user-html';

@Component({
  selector: 'app-html-preview',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './html-preview.component.html',
  styleUrl: './html-preview.component.scss',
})
export class HtmlPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  readonly html = input.required<string>();
  readonly assetBase = input.required<readonly string[]>();

  readonly trustedHtml = computed(() => {
    // Load-bearing invariant: sanitize BEFORE rewrite BEFORE bypass.
    // The explicit sanitizer justifying bypassSecurityTrustHtml is
    // `sanitizeUserHtml` (DOMPurify). Shadow DOM provides only style
    // isolation. Removing this call reopens every XSS path.
    const safe = sanitizeUserHtml(this.html());
    const rewritten = rewriteUserHtml(safe, this.assetBase());
    return this.sanitizer.bypassSecurityTrustHtml(rewritten);
  });

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (/^(https?:|mailto:)/i.test(href)) return;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    this.router.navigateByUrl(href);
  }
}
