import { rename, unlink, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

/**
 * Write `content` to `absPath` atomically: the target is either the
 * old bytes or the new bytes, never a half-written file. We write to a
 * sibling `.grove-<hex>.tmp` with `flag: 'wx'` (fail if that name
 * already exists) and then `rename` into place — `rename` is atomic on
 * POSIX same-filesystem moves, which is our invariant (sibling of the
 * target inside docsDir).
 *
 * If anything throws before the rename completes, the tmp file is
 * cleaned up. We never touch `absPath` itself on failure.
 */
export async function atomicWrite(
  absPath: string,
  content: string,
): Promise<void> {
  const suffix = randomBytes(6).toString('hex');
  const tmp = `${absPath}.grove-${suffix}.tmp`;
  let renamed = false;
  try {
    await writeFile(tmp, content, { encoding: 'utf8', flag: 'wx' });
    await rename(tmp, absPath);
    renamed = true;
  } finally {
    if (!renamed) {
      await unlink(tmp).catch(() => undefined);
    }
  }
}
