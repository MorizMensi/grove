import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { DocumentEntry, DocumentListing } from '@shared/types/documents';
import type { OpenAction } from '@shared/types/open';
import { CONTENT_URL_PREFIX } from '@shared/content-url';

// Re-export the shared types so existing consumers can keep importing them
// from this service module without needing to know about the alias.
export type { DocumentEntry, DocumentListing, OpenAction };

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);

  listDirectory(path: string): Observable<DocumentListing> {
    const params: Record<string, string> = {};
    if (path) params['path'] = path;
    return this.http.get<DocumentListing>('/api/documents', { params });
  }

  getFileContent(path: string, extension: string): Observable<string> {
    return this.http.get(`${CONTENT_URL_PREFIX}/${path}.${extension}`, { responseType: 'text' });
  }

  openExternal(action: OpenAction, path: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/open', { action, path });
  }
}
