import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { relative } from 'node:path';

const execFileAsync = promisify(execFile);

export type CommitVerb = 'edit' | 'create' | 'delete' | 'mkdir' | 'rmdir';

export interface GitValidationError {
  code:
    | 'git-missing'
    | 'not-a-repo'
    | 'no-user-name'
    | 'no-user-email';
  message: string;
}

/**
 * Run `git` with argv; never shell. `cwd` is always the docs dir.
 * Returns stdout/stderr; throws the raw child_process error on non-zero
 * exit so callers can inspect `stderr`.
 */
async function runGit(
  cwd: string,
  args: readonly string[],
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
  });
  return { stdout, stderr };
}

/**
 * Validate docsDir is a git worktree with user.name/user.email
 * configured. Call at startup when `--git-commit` is set so users never
 * hit a silent no-op at save time.
 */
export async function validateGitRepo(docsDir: string): Promise<void> {
  try {
    await runGit(docsDir, ['--version']);
  } catch {
    throw new Error(
      '--git-commit: `git` binary not found on PATH. Install git or remove the flag.',
    );
  }

  try {
    await runGit(docsDir, ['-C', docsDir, 'rev-parse', '--is-inside-work-tree']);
  } catch {
    throw new Error(
      `--git-commit: "${docsDir}" is not inside a git worktree. Run \`git init\` there or remove the flag.`,
    );
  }

  const name = await readConfig(docsDir, 'user.name');
  if (!name) {
    throw new Error(
      '--git-commit: git user.name is not configured. Run `git config --global user.name "Your Name"`.',
    );
  }
  const email = await readConfig(docsDir, 'user.email');
  if (!email) {
    throw new Error(
      '--git-commit: git user.email is not configured. Run `git config --global user.email "you@example.com"`.',
    );
  }
}

async function readConfig(cwd: string, key: string): Promise<string | null> {
  try {
    const { stdout } = await runGit(cwd, ['-C', cwd, 'config', '--get', key]);
    const v = stdout.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export type CommitOutcome =
  | { status: 'committed' }
  | { status: 'nothing-to-commit' }
  | { status: 'failed'; reason: string };

/**
 * Stage `absPath` and commit with `grove: <verb> <rel>`. Relative path
 * is computed from `docsDir` so the commit message shows the user's
 * document path, not an absolute filesystem location.
 *
 * Re-saving identical content, or deleting a path already gone in the
 * index, causes `git commit` to exit non-zero with a "nothing to
 * commit" diagnostic. That specific case is swallowed — the disk op
 * already succeeded and there's nothing meaningful to version.
 */
export async function commitChange(
  docsDir: string,
  absPath: string,
  verb: CommitVerb,
): Promise<CommitOutcome> {
  const rel = relative(docsDir, absPath) || '.';

  try {
    // `git add --` stages additions and modifications.
    // For deletions, `git add -A --` would pick them up, but the
    // narrower `git add -- <rel>` also handles deletes since git 2.0.
    // Using `--` + pathspec keeps commits scoped and keyed to the
    // changed file, avoiding accidental staging of unrelated edits.
    await runGit(docsDir, ['-C', docsDir, 'add', '--', rel]);
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    return {
      status: 'failed',
      reason: `git add failed: ${stderr.trim() || (err as Error).message}`,
    };
  }

  const message = `grove: ${verb} ${rel}`;
  try {
    await runGit(docsDir, [
      '-C',
      docsDir,
      'commit',
      '-m',
      message,
      '--only',
      '--',
      rel,
    ]);
    return { status: 'committed' };
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    const stdout = (err as { stdout?: string }).stdout ?? '';
    const combined = `${stderr}\n${stdout}`.toLowerCase();
    if (
      combined.includes('nothing to commit') ||
      combined.includes('no changes added to commit') ||
      combined.includes('nothing added to commit')
    ) {
      return { status: 'nothing-to-commit' };
    }
    return {
      status: 'failed',
      reason: `git commit failed: ${stderr.trim() || (err as Error).message}`,
    };
  }
}
