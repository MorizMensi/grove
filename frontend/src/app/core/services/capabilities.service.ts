import { inject, Injectable, signal, type Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Capabilities {
  platform: string;
  supports: {
    terminal: boolean;
    claude: boolean;
    /** Reflects `--allow-edits` on the server. */
    edits: boolean;
    /** Reflects `--git-commit` on the server. */
    gitCommit: boolean;
  };
}

/**
 * Default before the HTTP call completes. Hides everything that is
 * platform-gated so the UI does not flash a disabled button, and keeps
 * edit affordances hidden until the server confirms the flag is on.
 */
const OPTIMISTIC_DEFAULT: Capabilities = {
  platform: 'unknown',
  supports: {
    terminal: false,
    claude: false,
    edits: false,
    gitCommit: false,
  },
};

/**
 * Static wiki deployments never gain external-tool or edit
 * capabilities — there is no server to run `open`/`terminal` or
 * accept writes against. Seeded up front so the UI never flashes
 * tool buttons before the (nonexistent) HTTP call.
 */
const WIKI_CAPABILITIES: Capabilities = {
  platform: 'web',
  supports: {
    terminal: false,
    claude: false,
    edits: false,
    gitCommit: false,
  },
};

@Injectable({ providedIn: 'root' })
export class CapabilitiesService {
  private readonly http = inject(HttpClient);
  private readonly capabilitiesSignal = signal<Capabilities>(
    environment.mode === 'wiki' ? WIKI_CAPABILITIES : OPTIMISTIC_DEFAULT,
  );

  constructor() {
    if (environment.mode === 'wiki') return;
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
