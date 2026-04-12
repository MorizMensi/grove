import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import type { DocumentEntry, DocumentListing } from '../../shared/types/documents.js';

export interface WikiManifest {
  version: 1;
  generatedAt: string;
  root: string;
  directories: Record<string, DocumentListing>;
}

// KEEP IN SYNC with server/documents.ts sort (documents.ts line ~50).
function sortEntries(entries: DocumentEntry[]): DocumentEntry[] {
  return entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function walk(
  absDir: string,
  relDir: string,
  directories: Record<string, DocumentListing>,
): Promise<void> {
  const dirents = await readdir(absDir, { withFileTypes: true });
  const entries: DocumentEntry[] = [];
  for (const d of dirents) {
    if (d.name.startsWith('.')) continue;
    if (d.isDirectory()) {
      entries.push({ name: d.name, type: 'directory' });
      const childRel = relDir ? `${relDir}/${d.name}` : d.name;
      await walk(join(absDir, d.name), childRel, directories);
    } else if (d.isFile()) {
      const ext = extname(d.name).slice(1).toLowerCase();
      const stem = basename(d.name, extname(d.name));
      entries.push({ name: stem, type: 'file', extension: ext || undefined });
    }
  }
  directories[relDir] = { path: relDir, entries: sortEntries(entries) };
}

export async function buildManifest(docsDir: string): Promise<WikiManifest> {
  const directories: Record<string, DocumentListing> = {};
  await walk(docsDir, '', directories);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    root: '',
    directories,
  };
}
