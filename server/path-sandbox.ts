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

  const docsReal = await realpath(docsDir);
  if (real !== docsReal && !real.startsWith(docsReal + sep)) {
    throw new PathError('forbidden');
  }
  return real;
}
