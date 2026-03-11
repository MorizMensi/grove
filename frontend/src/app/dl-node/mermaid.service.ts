import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import mermaid from 'mermaid';

@Injectable({ providedIn: 'root' })
export class MermaidService {
  private readonly sanitizer = inject(DomSanitizer);
  private initialized = false;
  private counter = 0;

  async render(code: string): Promise<SafeHtml | null> {
    if (!this.initialized) {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      this.initialized = true;
    }
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    try {
      const { svg } = await mermaid.render('mermaid-' + this.counter++, code, container);
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    } catch {
      return null;
    } finally {
      container.remove();
    }
  }
}
