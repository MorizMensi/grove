import { Router } from 'express';
import { readdir, stat } from 'node:fs/promises';
import { resolve, extname, basename, sep } from 'node:path';
import type { DocumentEntry, DocumentListing } from '../shared/types/documents.js';

export function documentsRouter(docsDir: string): Router {
  const router = Router();

  // GET /api/documents?path=... → { path, entries }
  router.get('/', async (req, res) => {
    const relPath = (req.query['path'] as string) || '';

    // Reject path traversal
    if (relPath.includes('..') || relPath.startsWith('/')) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    const absPath = relPath ? resolve(docsDir, relPath) : docsDir;

    // Ensure resolved path is within docsDir. The `sep` guard prevents a
    // sibling-directory bypass where docsDir="/foo" would wrongly accept
    // "/foobar": the separator check requires an actual path boundary.
    if (absPath !== docsDir && !absPath.startsWith(docsDir + sep)) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    try {
      const s = await stat(absPath);
      if (!s.isDirectory()) {
        res.status(404).json({ error: 'Not a directory' });
        return;
      }

      const entries = await readdir(absPath, { withFileTypes: true });
      const result: DocumentEntry[] = entries
        .filter(e => !e.name.startsWith('.'))
        .filter(e => e.isDirectory() || e.isFile())
        .map((e): DocumentEntry => {
          if (e.isDirectory()) {
            return { name: e.name, type: 'directory' };
          }
          const ext = extname(e.name);
          const stem = basename(e.name, ext);
          return {
            name: stem,
            type: 'file',
            extension: ext.replace(/^\./, '') || undefined,
          };
        })
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      const listing: DocumentListing = { path: relPath, entries: result };
      res.json(listing);
    } catch {
      res.status(404).json({ error: 'Directory not found' });
    }
  });

  return router;
}
