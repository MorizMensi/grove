import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

type ExecFileArgs = readonly [file: string, args: readonly string[]];

let cached: { base: ExecFileBase; verified: boolean } | undefined;

type ExecFileBase = readonly [string, readonly string[]];

/**
 * Resolve how to launch Zed on the current machine.
 *
 * Background: spawning bare `zed` relies on the server process's PATH,
 * which is often minimal when grove is launched via npx/launchd/Finder
 * and does not contain `/usr/local/bin` or `/opt/homebrew/bin`. That
 * yields `spawn zed ENOENT` even on machines where `which zed` works
 * in an interactive shell. We try, in order:
 *
 *   1. `ZED_BIN` env override
 *   2. `open -a Zed` on darwin if Zed.app exists (LaunchServices,
 *      PATH-independent)
 *   3. Known absolute install locations
 *   4. Bare `zed` on PATH as a last resort (unverified)
 */
export async function resolveZed(targetPath: string): Promise<ExecFileArgs> {
  const { base } = await resolveCached();
  return [base[0], [...base[1], targetPath]];
}

/**
 * Report whether Zed was found at a verified location. The capability
 * endpoint uses this to hide the button cleanly on machines that don't
 * have Zed installed, instead of showing a button that 500s.
 */
export async function canResolveZed(): Promise<boolean> {
  const { verified } = await resolveCached();
  return verified;
}

async function resolveCached(): Promise<{
  base: ExecFileBase;
  verified: boolean;
}> {
  if (cached) return cached;
  cached = await resolveBase();
  return cached;
}

async function resolveBase(): Promise<{
  base: ExecFileBase;
  verified: boolean;
}> {
  const envBin = process.env['ZED_BIN'];
  if (envBin) {
    return { base: [envBin, []], verified: true };
  }

  if (process.platform === 'darwin') {
    const appCandidates = [
      '/Applications/Zed.app',
      join(homedir(), 'Applications', 'Zed.app'),
    ];
    for (const app of appCandidates) {
      if (await exists(app)) {
        return { base: ['open', ['-a', 'Zed']], verified: true };
      }
    }
  }

  const binCandidates = [
    '/usr/local/bin/zed',
    '/opt/homebrew/bin/zed',
    join(homedir(), '.local', 'bin', 'zed'),
  ];
  for (const c of binCandidates) {
    if (await exists(c)) {
      return { base: [c, []], verified: true };
    }
  }

  // Last resort: bare `zed` from PATH. Unverified — the capability
  // endpoint will hide the button, but if the user still calls the
  // endpoint (e.g. older frontend) we at least try.
  return { base: ['zed', []], verified: false };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
