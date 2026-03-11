import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentEntry {
  name: string;
  type: 'file' | 'directory';
  extension?: string;
}

export interface DocumentListing {
  path: string;
  entries: DocumentEntry[];
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);

  listDirectory(path: string): Observable<DocumentListing> {
    const params: Record<string, string> = {};
    if (path) params['path'] = path;
    return this.http.get<DocumentListing>('/api/documents', { params });
  }

  getFileContent(path: string, extension: string): Observable<string> {
    return this.http.get(`/documents/${path}.${extension}`, { responseType: 'text' });
  }
}
