import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LiveRegionService {
  readonly message = signal('');

  announce(msg: string): void {
    this.message.set('');
    queueMicrotask(() => this.message.set(msg));
  }
}
