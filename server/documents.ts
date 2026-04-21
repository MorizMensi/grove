import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import {
  mkdir,
  readFile,
  readdir,
  rmdir,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import type {
  CreateEntryResponse,
  DocumentEntry,
  DocumentListing,
  RawDocumentResponse,
  SaveDocumentRequest,
  SaveDocumentResponse,
} from '../shared/types/documents.js';
import { ensureInside, PathError } from './path-sandbox.js';
import { atomicWrite } from './fs-atomic.js';
import { csrfOrigin, requireEdits } from './edits-middleware.js';
import { commitChange, type CommitVerb } from './git.js';
import type { DisabledSecuritySet } from './security-options.js';

export interface DocumentsOptions {
  allowEdits?: boolean;
  /** Enables one commit per successful write. */
  gitCommit?: boolean;
  disabledSecurity?: DisabledSecuritySet;
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
  const gitCommit = options.gitCommit === true;
  const allowSymlinks = options.disabledSecurity?.has('allow-symlinks') === true;

  /**
   * Post-write commit hook. Returns `null` on success (committed or
   * nothing-to-commit), or an error code the caller should surface as
   * `500 { error: 'git-failed' }`. Never throws — the disk write has
   * already succeeded by the time we get here.
   */
  async function maybeCommit(
    absPath: string,
    verb: CommitVerb,
  ): Promise<string | null> {
    if (!gitCommit) { return null; }
    const outcome = await commitChange(docsDir, absPath, verb);
    if (outcome.status === 'failed') { return outcome.reason; }
    return null;
  }

  // GET /api/documents?path=... → { path, entries }
  router.get('/', async (req, res) => {
    const relPath = (req.query['path'] as string) || '';

    let absPath: string;
    try {
      absPath = await ensureInside(docsDir, relPath, { allowSymlinks });
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
      absPath = await ensureInside(docsDir, relPath, { allowMissing: true, allowSymlinks });
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
        absPath = await ensureInside(docsDir, relPath, { allowSymlinks });
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
      const gitErr = await maybeCommit(absPath, 'edit');
      if (gitErr) {
        res.status(500).json({ error: 'git-failed', mtime: after.mtimeMs });
        return;
      }
      res.json(reply);
    },
  );

  // POST /api/documents?path=...&kind=file|dir → 201
  //
  // No body parser: create is path-only. `kind` defaults to `file`.
  router.post(
    '/',
    requireEdits(allowEdits),
    csrfOrigin,
    async (req: Request, res: Response) => {
      const relPath = (req.query['path'] as string) || '';
      const rawKind = (req.query['kind'] as string | undefined) ?? 'file';
      if (rawKind !== 'file' && rawKind !== 'dir') {
        res.status(400).json({ error: 'bad-kind' });
        return;
      }

      const name = basename(relPath);
      if (!isValidName(name)) {
        res.status(400).json({ error: 'bad-name' });
        return;
      }

      // Resolve the parent first so an existent-but-not-leaf path passes
      // containment, and so a missing parent surfaces as `parent-missing`
      // rather than the generic `forbidden` that `ensureInside` returns
      // when both the leaf and its parent are absent.
      const parentRel = dirname(relPath);
      const parentPath = parentRel === '.' || parentRel === '' ? '' : parentRel;
      let parentAbs: string;
      try {
        parentAbs = await ensureInside(docsDir, parentPath, { allowSymlinks });
      } catch (err) {
        if (err instanceof PathError) {
          res.status(409).json({ error: 'parent-missing' });
          return;
        }
        throw err;
      }
      let parentStat;
      try {
        parentStat = await stat(parentAbs);
      } catch {
        res.status(409).json({ error: 'parent-missing' });
        return;
      }
      if (!parentStat.isDirectory()) {
        res.status(409).json({ error: 'parent-missing' });
        return;
      }
      const absPath = join(parentAbs, name);

      try {
        if (rawKind === 'dir') {
          await mkdir(absPath);
          // Empty directories aren't tracked by git; there's nothing
          // to commit until the user adds a file. Skip the commit hook
          // for mkdir to avoid a misleading `grove: mkdir` that does
          // nothing.
          res.status(201).json({} satisfies CreateEntryResponse);
          return;
        }
        // `flag: 'wx'` makes writeFile fail if the target already exists,
        // giving us atomic create-or-conflict without a separate stat.
        await writeFile(absPath, '', { encoding: 'utf8', flag: 'wx' });
        const s = await stat(absPath);
        const body: CreateEntryResponse = { mtime: s.mtimeMs };
        const gitErr = await maybeCommit(absPath, 'create');
        if (gitErr) {
          res.status(500).json({ error: 'git-failed', mtime: s.mtimeMs });
          return;
        }
        res.status(201).json(body);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EEXIST') {
          res.status(409).json({ error: 'exists' });
          return;
        }
        if (code === 'ENOENT') {
          res.status(409).json({ error: 'parent-missing' });
          return;
        }
        throw err;
      }
    },
  );

  // DELETE /api/documents?path=... → 204
  router.delete(
    '/',
    requireEdits(allowEdits),
    csrfOrigin,
    async (req: Request, res: Response) => {
      const relPath = (req.query['path'] as string) || '';

      let absPath: string;
      try {
        absPath = await ensureInside(docsDir, relPath, { allowMissing: true, allowSymlinks });
      } catch (err) {
        if (err instanceof PathError) {
          res.status(403).json({ error: 'forbidden' });
          return;
        }
        throw err;
      }
      // Refuse to let DELETE unlink docsDir itself.
      if (absPath === docsDir) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      let s;
      try {
        s = await stat(absPath);
      } catch {
        res.status(404).json({ error: 'not-found' });
        return;
      }

      try {
        const wasDirectory = s.isDirectory();
        if (wasDirectory) {
          await rmdir(absPath);
        } else {
          await unlink(absPath);
        }
        // Same rationale as mkdir: empty directories aren't tracked by
        // git, so `rmdir` has nothing to commit.
        if (!wasDirectory) {
          const gitErr = await maybeCommit(absPath, 'delete');
          if (gitErr) {
            res.status(500).json({ error: 'git-failed' });
            return;
          }
        }
        res.status(204).end();
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOTEMPTY' || code === 'EEXIST') {
          res.status(409).json({ error: 'not-empty' });
          return;
        }
        if (code === 'ENOENT') {
          res.status(404).json({ error: 'not-found' });
          return;
        }
        throw err;
      }
    },
  );

  return router;
}

/**
 * Name validation for create. Rejects empty, path separators, NUL,
 * leading `.` (dotfiles are hidden by listing), and names over 255
 * bytes. Windows reserved names are intentionally out of scope — Grove
 * targets macOS and Linux.
 */
function isValidName(name: string): boolean {
  if (!name) { return false; }
  if (name === '.' || name === '..') { return false; }
  if (name.startsWith('.')) { return false; }
  if (name.includes('/') || name.includes('\\') || name.includes('\0')) {
    return false;
  }
  if (Buffer.byteLength(name, 'utf8') > 255) { return false; }
  return true;
}
