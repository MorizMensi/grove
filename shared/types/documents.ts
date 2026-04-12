export interface DocumentEntry {
  name: string;
  type: 'file' | 'directory';
  extension?: string;
}

export interface DocumentListing {
  path: string;
  entries: DocumentEntry[];
}
