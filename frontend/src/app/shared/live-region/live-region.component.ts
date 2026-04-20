import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LiveRegionService } from './live-region.service';

@Component({
  selector: 'app-live-region',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="visually-hidden"
         role="status"
         aria-live="polite"
         aria-atomic="true"
    >{{ message() }}</div>
  `,
  styles: [
    `
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class LiveRegionComponent {
  readonly message = inject(LiveRegionService).message;
}
