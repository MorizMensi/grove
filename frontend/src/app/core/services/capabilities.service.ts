import { inject, Injectable, signal, type Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

export interface Capabilities {
  platform: string;
  supports: {
    terminal: boolean;
    zed: boolean;
    claude: boolean;
  };
}

/**
 * Default before the HTTP call completes. Hides everything that is
 * platform-gated so the UI does not flash a disabled button. `zed` is
 * optimistic because it is the only cross-platform action.
 */
const OPTIMISTIC_DEFAULT: Capabilities = {
  platform: 'unknown',
  supports: {
    terminal: false,
    zed: true,
    claude: false,
  },
};

@Injectable({ providedIn: 'root' })
export class CapabilitiesService {
  private readonly http = inject(HttpClient);
  private readonly capabilitiesSignal = signal<Capabilities>(OPTIMISTIC_DEFAULT);

  constructor() {
    this.http
      .get<Capabilities>('/api/capabilities')
      .pipe(take(1))
      .subscribe({
        next: (caps) => this.capabilitiesSignal.set(caps),
        // On error keep the optimistic default. The individual /api/open
        // call will return 501 if a button shouldn't have been shown.
        error: () => undefined,
      });
  }

  get capabilities(): Signal<Capabilities> {
    return this.capabilitiesSignal.asReadonly();
  }
}
