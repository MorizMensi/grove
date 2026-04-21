export interface DocumentEntry {
  name: string;
  type: 'file' | 'directory';
  extension?: string;
}

export interface DocumentListing {
  path: string;
  entries: DocumentEntry[];
}

/** `GET /api/documents/raw?path=…` — raw file contents + mtime. */
export interface RawDocumentResponse {
  content: string;
  /** File mtime in milliseconds since the Unix epoch. */
  mtime: number;
}

/** Body for `PUT /api/documents?path=…`. */
export interface SaveDocumentRequest {
  content: string;
}

/** Success response for `PUT /api/documents?path=…`. */
export interface SaveDocumentResponse {
  /** New mtime in milliseconds, used as the next `If-Unmodified-Since`. */
  mtime: number;
}

/** Query-string `kind` on `POST /api/documents?path=…&kind=…`. */
export type CreateEntryKind = 'file' | 'dir';

/** Success response for `POST /api/documents?path=…`. `mtime` is
 *  present for files, omitted for directories. */
export interface CreateEntryResponse {
  mtime?: number;
}
