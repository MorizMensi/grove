import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, map, shareReplay } from 'rxjs';
import type { DocumentEntry, DocumentListing } from '@shared/types/documents';
import type { OpenAction } from '@shared/types/open';
import { CONTENT_URL_PREFIX } from '@shared/content-url';
import { environment } from '../../../environments/environment';

// Re-export the shared types so existing consumers can keep importing them
// from this service module without needing to know about the alias.
export type { DocumentEntry, DocumentListing, OpenAction };

const DEFAULT_SITE_NAME = 'Grove';

interface WikiManifest {
  version: number;
  generatedAt: string;
  root: string;
  siteName?: string;
  directories: Record<string, DocumentListing>;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private manifest$?: Observable<WikiManifest>;

  private readonly _siteName = signal(DEFAULT_SITE_NAME);
  readonly siteName = this._siteName.asReadonly();

  constructor() {
    if (environment.mode === 'wiki') {
      this.loadManifest().subscribe({
        next: (m) => {
          if (m.siteName) this._siteName.set(m.siteName);
        },
      });
    }
  }

  listDirectory(path: string): Observable<DocumentListing> {
    if (environment.mode === 'wiki') {
      return this.loadManifest().pipe(
        map((m) => {
          const listing = m.directories[path];
          if (!listing) throw new Error(`unknown path: ${path}`);
          return listing;
        }),
      );
    }
    const params: Record<string, string> = {};
    if (path) params['path'] = path;
    return this.http.get<DocumentListing>('/api/documents', { params });
  }

  getFileContent(path: string, extension: string): Observable<string> {
    return this.http.get(`${CONTENT_URL_PREFIX}/${path}.${extension}`, { responseType: 'text' });
  }

  openExternal(action: OpenAction, path: string): Observable<{ ok: boolean }> {
    if (environment.mode === 'wiki') return EMPTY;
    return this.http.post<{ ok: boolean }>('/api/open', { action, path });
  }

  private loadManifest(): Observable<WikiManifest> {
    if (!this.manifest$) {
      this.manifest$ = this.http
        .get<WikiManifest>(environment.manifestUrl)
        .pipe(shareReplay(1));
    }
    return this.manifest$;
  }
}
