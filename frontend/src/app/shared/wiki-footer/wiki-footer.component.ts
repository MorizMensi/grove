import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GroveMarkComponent } from '../grove-mark/grove-mark.component';

@Component({
  selector: 'wiki-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroveMarkComponent],
  template: `
    <footer class="wiki-attribution">
      <span>wiki built with</span>
      <a
        href="https://github.com/MorizMensi/grove"
        target="_blank"
        rel="noopener noreferrer"
      >
        <grove-mark />
        <span>Grove</span>
      </a>
    </footer>
  `,
  styleUrl: './wiki-footer.component.scss',
})
export class WikiFooterComponent {}
