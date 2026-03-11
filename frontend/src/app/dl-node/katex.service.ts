import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

@Injectable({ providedIn: 'root' })
export class KatexService {
  private readonly sanitizer = inject(DomSanitizer);

  render(latex: string, displayMode: boolean): SafeHtml {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
