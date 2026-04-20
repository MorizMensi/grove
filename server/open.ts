import express, { Router } from 'express';
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import {
  OpenRequestSchema,
  type OpenAction,
} from '../shared/types/open.js';
import { ensureInside, PathError } from './path-sandbox.js';

type ExecFileArgs = readonly [file: string, args: readonly string[]];

/**
 * Build the actual child-process invocation for an action/dir pair.
 *
 * Returns `null` when the current platform does not support the action;
 * the router uses that to return HTTP 501. The capability endpoint
 * (see capabilities.ts) reports the same matrix so the frontend can
 * hide buttons that would not work.
 */
async function buildExec(
  action: OpenAction,
  absDir: string,
): Promise<ExecFileArgs | null> {
  const platform = process.platform;

  switch (action) {
    case 'terminal':
      if (platform === 'darwin') {
        return ['open', ['-a', 'Terminal', absDir]];
      }
      return null;

    case 'claude':
      if (platform === 'darwin') {
        // osascript is the only portable way to tell Terminal.app to
        // run a command in a fresh window on macOS. The AppleScript
        // string literal requires escaping both backslash and quote.
        const escapedForAppleScript = absDir
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"');
        return [
          'osascript',
          [
            '-e',
            `tell application "Terminal" to do script "cd \\"${escapedForAppleScript}\\" && claude"`,
          ],
        ];
      }
      return null;
  }
}

export function openRouter(docsDir: string): Router {
  const router = Router();

  // `/api/open` accepts a small JSON body. The app-level parser is
  // gone (see `createApp`) so we attach one per route.
  router.post('/', express.json(), async (req, res) => {
    // 1. Validate request with zod (action enum + path string rules).
    const parsed = OpenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.format() });
      return;
    }
    const { action, path: relPath } = parsed.data;

    // 2. Resolve + realpath containment. Symlinks escaping docsDir are
    //    rejected here before any child process is spawned.
    let absDir: string;
    try {
      absDir = await ensureInside(docsDir, relPath);
    } catch (err) {
      if (err instanceof PathError) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      throw err;
    }

    // 3. Both supported actions operate on a directory.
    try {
      const s = await stat(absDir);
      if (!s.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' });
        return;
      }
    } catch {
      res.status(404).json({ error: 'Path not found' });
      return;
    }

    // 4. Platform dispatch. Unsupported combos return 501.
    const exec = await buildExec(action, absDir);
    if (!exec) {
      res.status(501).json({
        error: `Action "${action}" is not supported on platform "${process.platform}".`,
      });
      return;
    }

    const [file, args] = exec;
    execFile(file, [...args], (err) => {
      if (err) {
        res.status(500).json({ error: `Failed to open: ${err.message}` });
        return;
      }
      res.json({ ok: true });
    });
  });

  return router;
}
