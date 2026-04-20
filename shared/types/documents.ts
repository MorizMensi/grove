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
