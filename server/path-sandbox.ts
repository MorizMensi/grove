import { realpath } from 'node:fs/promises';
import { dirname, basename, join, resolve, sep } from 'node:path';

export type PathErrorCode = 'forbidden';

export class PathError extends Error {
  readonly code: PathErrorCode;

  constructor(code: PathErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PathError';
  }
}

export interface EnsureInsideOpts {
  /**
   * Set for create flows where the leaf does not exist yet. `realpath`
   * is applied to the parent directory and the basename is re-joined,
   * so a missing parent still fails containment.
   */
  allowMissing?: boolean;
  /**
   * Skip the realpath containment check, so symlinks inside docsDir
   * whose targets live outside docsDir will resolve. The *lexical*
   * containment check (the addressed path must still be inside
   * docsDir) is always enforced, so `..` traversal and sibling-prefix
   * bypass are still rejected. Opt-in via the CLI
   * `--disable-security allow-symlinks` flag.
   */
  allowSymlinks?: boolean;
}

function isENOENT(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

/**
 * Resolve `userPath` under `docsDir` and return the canonical absolute
 * path. Rejects symlinks that escape `docsDir`, sibling-prefix bypass
 * (`docsDir="/foo"` vs `/foobar`), and NUL-laced input. The returned
 * path is the realpath — callers should use it for all subsequent fs
 * calls to avoid TOCTOU reintroducing a symlink.
 */
export async function ensureInside(
  docsDir: string,
  userPath: string,
  opts: EnsureInsideOpts = {},
): Promise<string> {
  if (userPath.includes('\0')) {
    throw new PathError('forbidden');
  }

  const resolved = userPath ? resolve(docsDir, userPath) : docsDir;

  // Lexical containment: the *addressed* path (before any symlink
  // resolution) must live inside docsDir. `resolve()` collapses `..`
  // lexically so this catches traversal and sibling-prefix bypass
  // (`/tmp/foo` vs `/tmp/foobar`) without hitting the filesystem. This
  // check is enforced regardless of `allowSymlinks`.
  if (resolved !== docsDir && !resolved.startsWith(docsDir + sep)) {
    throw new PathError('forbidden');
  }

  let real: string;
  try {
    real = await realpath(resolved);
  } catch (err) {
    if (opts.allowMissing && isENOENT(err)) {
      const parent = await realpath(dirname(resolved)).catch(() => {
        throw new PathError('forbidden');
      });
      real = join(parent, basename(resolved));
    } else {
      throw new PathError('forbidden');
    }
  }

  if (opts.allowSymlinks) {
    // Escape hatch: the addressed path is already known to sit inside
    // docsDir (lexical check above). The realpath may point anywhere —
    // that is the whole point of the flag.
    return real;
  }

  const docsReal = await realpath(docsDir);
  if (real !== docsReal && !real.startsWith(docsReal + sep)) {
    throw new PathError('forbidden');
  }
  return real;
}
