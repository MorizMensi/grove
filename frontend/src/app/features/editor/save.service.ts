import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentService } from '../../core/services/document.service';
import { LiveRegionService } from '../../shared/live-region/live-region.service';

export type SaveOutcome = 'ok' | 'stale' | 'error';

export interface StaleConflict {
  diskMtime: number;
}

@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly documents = inject(DocumentService);
  private readonly live = inject(LiveRegionService);

  private readonly _saving = signal(false);
  private readonly _dirty = signal(false);
  private readonly _lastMtime = signal<number | null>(null);
  private readonly _stale = signal<StaleConflict | null>(null);

  readonly saving = this._saving.asReadonly();
  readonly dirty = this._dirty.asReadonly();
  readonly lastMtime = this._lastMtime.asReadonly();
  readonly staleConflict = this._stale.asReadonly();
  readonly hasBaseline = computed(() => this._lastMtime() != null);

  /** Seed from a just-fetched raw GET. Clears dirty + any prior conflict. */
  reset(mtime: number): void {
    this._lastMtime.set(mtime);
    this._dirty.set(false);
    this._stale.set(null);
  }

  markDirty(isDirty: boolean): void {
    this._dirty.set(isDirty);
  }

  /** After user resolves a conflict (e.g. reload), clear the banner. */
  clearConflict(): void {
    this._stale.set(null);
  }

  async save(path: string, content: string): Promise<SaveOutcome> {
    const mtime = this._lastMtime();
    if (mtime == null) {
      this.live.announce('Save failed');
      return 'error';
    }
    this._saving.set(true);
    this.live.announce('Saving…');
    try {
      const res = await firstValueFrom(this.documents.saveFile(path, content, mtime));
      this._lastMtime.set(res.mtime);
      this._dirty.set(false);
      this._stale.set(null);
      this.live.announce('Saved');
      return 'ok';
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        const diskMtime = typeof err.error?.mtime === 'number' ? err.error.mtime : mtime;
        this._stale.set({ diskMtime });
        this.live.announce('File changed on disk');
        return 'stale';
      }
      this.live.announce('Save failed');
      return 'error';
    } finally {
      this._saving.set(false);
    }
  }
}
