import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, basename } from 'node:path';
import type {
  DocumentEntry,
  DocumentListing,
  RawDocumentResponse,
  SaveDocumentRequest,
  SaveDocumentResponse,
} from '../shared/types/documents.js';
import { ensureInside, PathError } from './path-sandbox.js';
import { atomicWrite } from './fs-atomic.js';
import { csrfOrigin, requireEdits } from './edits-middleware.js';

export interface DocumentsOptions {
  allowEdits?: boolean;
}

/**
 * Parse `If-Unmodified-Since` as either:
 * - a decimal number of milliseconds since the Unix epoch (client-
 *   controlled, ms precision), or
 * - an HTTP-date per RFC 9110 §5.6.7 (second precision).
 *
 * Returns a value in ms, or `null` if the input is not parseable.
 * Callers compare at second precision so HTTP-date submissions don't
 * spuriously trip the stale check.
 */
function parseIfUnmodifiedSince(raw: string): number | null {
  const trimmed = raw.trim();
  // Accept decimal ms (including `mtimeMs` fractional output) first;
  // `Date.parse` interprets bare numbers as years.
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const ms = Number(trimmed);
    return Number.isFinite(ms) ? ms : null;
  }
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Reject requests whose Content-Type is not JSON with 415. Runs
 * before `express.json`, which would otherwise silently leave
 * `req.body` as `{}` for non-JSON bodies.
 */
function jsonOnly(req: Request, res: Response, next: NextFunction): void {
  const ct = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
  if (ct !== 'application/json') {
    res.status(415).json({ error: 'unsupported-media-type' });
    return;
  }
  next();
}

/**
 * Convert `express.json` parse errors into our JSON error vocabulary.
 * Without this middleware Express sends an HTML stack trace for
 * `entity.too.large` / `entity.parse.failed`.
 */
function jsonErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err && typeof err === 'object') {
    const e = err as { type?: string };
    if (e.type === 'entity.too.large') {
      res.status(413).json({ error: 'too-large' });
      return;
    }
    if (e.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'bad-json' });
      return;
    }
  }
  next(err);
}

export function documentsRouter(
  docsDir: string,
  options: DocumentsOptions = {},
): Router {
  const router = Router();
  const allowEdits = options.allowEdits === true;

  // GET /api/documents?path=... → { path, entries }
  router.get('/', async (req, res) => {
    const relPath = (req.query['path'] as string) || '';

    let absPath: string;
    try {
      absPath = await ensureInside(docsDir, relPath);
    } catch (err) {
      if (err instanceof PathError) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      throw err;
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

  // GET /api/documents/raw?path=... → { content, mtime }
  router.get('/raw', async (req, res) => {
    const relPath = (req.query['path'] as string) || '';

    // `allowMissing: true` so a path inside docsDir that happens to
    // point at a non-existent file surfaces as 404 (checked below)
    // instead of the generic 403 forbidden used for traversal.
    let absPath: string;
    try {
      absPath = await ensureInside(docsDir, relPath, { allowMissing: true });
    } catch (err) {
      if (err instanceof PathError) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      throw err;
    }

    let s;
    try {
      s = await stat(absPath);
    } catch {
      res.status(404).json({ error: 'not-found' });
      return;
    }
    if (!s.isFile()) {
      res.status(404).json({ error: 'not-a-file' });
      return;
    }

    const content = await readFile(absPath, 'utf8');
    const mtime = s.mtimeMs;
    res.setHeader('Last-Modified', new Date(mtime).toUTCString());
    res.setHeader('ETag', `W/"${Math.floor(mtime)}-${s.size}"`);
    const body: RawDocumentResponse = { content, mtime };
    res.json(body);
  });

  // PUT /api/documents?path=... → { mtime }
  //
  // Gates (in order): requireEdits → csrfOrigin → Content-Type = JSON →
  // 10mb body parser → structured error mapping → handler.
  router.put(
    '/',
    requireEdits(allowEdits),
    csrfOrigin,
    jsonOnly,
    express.json({ limit: '10mb' }),
    jsonErrorHandler,
    async (req: Request, res: Response) => {
      const relPath = (req.query['path'] as string) || '';

      let absPath: string;
      try {
        absPath = await ensureInside(docsDir, relPath);
      } catch (err) {
        if (err instanceof PathError) {
          res.status(403).json({ error: 'forbidden' });
          return;
        }
        throw err;
      }

      const body = req.body as Partial<SaveDocumentRequest> | undefined;
      if (
        !body ||
        typeof body !== 'object' ||
        typeof body.content !== 'string'
      ) {
        res.status(400).json({ error: 'bad-body' });
        return;
      }

      const header = req.headers['if-unmodified-since'];
      if (typeof header !== 'string' || header.length === 0) {
        res.status(400).json({ error: 'missing-if-unmodified-since' });
        return;
      }
      const expected = parseIfUnmodifiedSince(header);
      if (expected === null) {
        res.status(400).json({ error: 'bad-if-unmodified-since' });
        return;
      }

      let before;
      try {
        before = await stat(absPath);
      } catch {
        res.status(404).json({ error: 'not-found' });
        return;
      }
      if (!before.isFile()) {
        res.status(409).json({ error: 'not-a-file' });
        return;
      }

      // Second-precision comparison: HTTP dates have only second
      // granularity, and comparing ms-precision `mtimeMs` against a
      // second-granularity parsed date would fail within the same
      // second of a save. The tradeoff is a 1 s race window — fine for
      // a single-user local wiki.
      const currentSec = Math.floor(before.mtimeMs / 1000);
      const expectedSec = Math.floor(expected / 1000);
      if (currentSec > expectedSec) {
        res.status(409).json({ error: 'stale', mtime: before.mtimeMs });
        return;
      }

      await atomicWrite(absPath, body.content);
      const after = await stat(absPath);
      const reply: SaveDocumentResponse = { mtime: after.mtimeMs };
      res.json(reply);
    },
  );

  return router;
}
