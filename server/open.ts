import { Router } from 'express';
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  OpenRequestSchema,
  type OpenAction,
} from '../shared/types/open.js';
import { resolveZed } from './zed-resolver.js';

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

    case 'zed':
      return resolveZed(absDir);

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

  router.post('/', async (req, res) => {
    // 1. Validate request with zod (action enum + path string rules).
    const parsed = OpenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.format() });
      return;
    }
    const { action, path: relPath } = parsed.data;

    // 2. Resolve and containment-check. Zod's .refine cannot fully
    //    cover symlink / resolved-path edge cases, so still verify
    //    the resolved absolute path is inside the docs root.
    const absDir = relPath ? resolve(docsDir, relPath) : docsDir;
    // `sep` guard: startsWith alone would wrongly accept a sibling
    // directory that shares a prefix with docsDir (e.g. docsDir="/foo"
    // vs absDir="/foobar"). Require a path-boundary separator.
    if (absDir !== docsDir && !absDir.startsWith(docsDir + sep)) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    // 3. Stat — every action except `zed` expects a directory. `zed`
    //    can open files and folders both, so skip the kind check.
    try {
      const s = await stat(absDir);
      if (!s.isDirectory() && action !== 'zed') {
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
        const isMissing =
          (err as NodeJS.ErrnoException).code === 'ENOENT' ||
          /ENOENT/.test(err.message);
        const hint =
          action === 'zed' && isMissing
            ? ' — Zed not found. Install Zed or set the ZED_BIN env var.'
            : '';
        res
          .status(500)
          .json({ error: `Failed to open: ${err.message}${hint}` });
        return;
      }
      res.json({ ok: true });
    });
  });

  return router;
}
