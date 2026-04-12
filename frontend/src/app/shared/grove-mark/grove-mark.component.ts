import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'grove-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="10.5" y="14" width="3" height="7" rx="0.5" />
      <circle cx="7" cy="10" r="5" />
      <circle cx="17" cy="10" r="5" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        line-height: 1;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class GroveMarkComponent {}
