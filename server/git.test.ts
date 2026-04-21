import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from './index.js';
import { validateGitRepo, commitChange } from './git.js';

const execFileAsync = promisify(execFile);

interface Harness {
  baseUrl: string;
  docs: string;
  close: () => Promise<void>;
}

async function initRepo(docs: string): Promise<void> {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Grove Test',
    GIT_AUTHOR_EMAIL: 'test@grove.local',
    GIT_COMMITTER_NAME: 'Grove Test',
    GIT_COMMITTER_EMAIL: 'test@grove.local',
  };
  await execFileAsync('git', ['-C', docs, 'init', '-q', '-b', 'main'], { env });
  await execFileAsync(
    'git',
    ['-C', docs, 'config', 'user.name', 'Grove Test'],
    { env },
  );
  await execFileAsync(
    'git',
    ['-C', docs, 'config', 'user.email', 'test@grove.local'],
    { env },
  );
  // An initial commit makes `git log` queries straightforward.
  await writeFile(join(docs, 'README.md'), '# seed');
  await execFileAsync('git', ['-C', docs, 'add', 'README.md'], { env });
  await execFileAsync('git', ['-C', docs, 'commit', '-q', '-m', 'seed'], { env });
}

async function gitLog(docs: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', docs, 'log', '--format=%s'],
    { cwd: docs },
  );
  return stdout.split('\n').filter((s) => s.length > 0);
}

async function spin(
  options: { allowEdits?: boolean; gitCommit?: boolean; repo?: boolean } = {},
): Promise<Harness> {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-git-')));
  if (options.repo) { await initRepo(docs); }
  const app = createApp(docs, {
    allowEdits: options.allowEdits,
    gitCommit: options.gitCommit,
  });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    docs,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
      await rm(docs, { recursive: true, force: true });
    },
  };
}

test('validateGitRepo accepts a configured git worktree', async () => {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-git-')));
  try {
    await initRepo(docs);
    await validateGitRepo(docs);
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('validateGitRepo rejects a non-repo with an actionable message', async () => {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-git-')));
  try {
    await assert.rejects(
      validateGitRepo(docs),
      (err: Error) => /not inside a git worktree/.test(err.message),
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('commitChange swallows nothing-to-commit on identical content', async () => {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-git-')));
  try {
    await initRepo(docs);
    const p = join(docs, 'note.md');
    await writeFile(p, 'same\n');
    const first = await commitChange(docs, p, 'edit');
    assert.equal(first.status, 'committed');
    // Re-run with no change → nothing-to-commit, swallowed.
    const second = await commitChange(docs, p, 'edit');
    assert.equal(second.status, 'nothing-to-commit');
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('PUT under --git-commit produces one "grove: edit <rel>" commit', async () => {
  const h = await spin({ allowEdits: true, gitCommit: true, repo: true });
  try {
    await writeFile(join(h.docs, 'note.md'), 'initial\n');
    // Commit the new file first so the subsequent PUT is an edit.
    await execFileAsync('git', ['-C', h.docs, 'add', 'note.md']);
    await execFileAsync('git', ['-C', h.docs, 'commit', '-q', '-m', 'seed-note']);

    // Get current mtime for If-Unmodified-Since.
    const raw = await fetch(`${h.baseUrl}/api/documents/raw?path=note.md`);
    const { mtime } = (await raw.json()) as { mtime: number };

    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': h.baseUrl,
        'If-Unmodified-Since': String(mtime),
      },
      body: JSON.stringify({ content: 'edited content\n' }),
    });
    assert.equal(r.status, 200);

    const log = await gitLog(h.docs);
    assert.equal(log[0], 'grove: edit note.md');
  } finally {
    await h.close();
  }
});

test('PUT without --git-commit creates no commit', async () => {
  const h = await spin({ allowEdits: true, gitCommit: false, repo: true });
  try {
    await writeFile(join(h.docs, 'note.md'), 'initial\n');
    await execFileAsync('git', ['-C', h.docs, 'add', 'note.md']);
    await execFileAsync('git', ['-C', h.docs, 'commit', '-q', '-m', 'seed-note']);

    const raw = await fetch(`${h.baseUrl}/api/documents/raw?path=note.md`);
    const { mtime } = (await raw.json()) as { mtime: number };
    const before = await gitLog(h.docs);

    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': h.baseUrl,
        'If-Unmodified-Since': String(mtime),
      },
      body: JSON.stringify({ content: 'edited\n' }),
    });
    assert.equal(r.status, 200);

    const after = await gitLog(h.docs);
    assert.deepEqual(after, before);
  } finally {
    await h.close();
  }
});

test('POST file under --git-commit produces "grove: create <rel>" commit', async () => {
  const h = await spin({ allowEdits: true, gitCommit: true, repo: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=new.md&kind=file`, {
      method: 'POST',
      headers: { 'Origin': h.baseUrl },
    });
    assert.equal(r.status, 201);
    const log = await gitLog(h.docs);
    assert.equal(log[0], 'grove: create new.md');
  } finally {
    await h.close();
  }
});

test('DELETE file under --git-commit produces "grove: delete <rel>" commit', async () => {
  const h = await spin({ allowEdits: true, gitCommit: true, repo: true });
  try {
    await writeFile(join(h.docs, 'old.md'), 'bye\n');
    await execFileAsync('git', ['-C', h.docs, 'add', 'old.md']);
    await execFileAsync('git', ['-C', h.docs, 'commit', '-q', '-m', 'seed-old']);

    const r = await fetch(`${h.baseUrl}/api/documents?path=old.md`, {
      method: 'DELETE',
      headers: { 'Origin': h.baseUrl },
    });
    assert.equal(r.status, 204);
    const log = await gitLog(h.docs);
    assert.equal(log[0], 'grove: delete old.md');
  } finally {
    await h.close();
  }
});

test('POST kind=dir produces no commit (empty dirs are untracked)', async () => {
  const h = await spin({ allowEdits: true, gitCommit: true, repo: true });
  try {
    const before = await gitLog(h.docs);
    const r = await fetch(`${h.baseUrl}/api/documents?path=sub&kind=dir`, {
      method: 'POST',
      headers: { 'Origin': h.baseUrl },
    });
    assert.equal(r.status, 201);
    const after = await gitLog(h.docs);
    assert.deepEqual(after, before);
  } finally {
    await h.close();
  }
});

test('identical-content re-save returns 200 and skips empty commit', async () => {
  const h = await spin({ allowEdits: true, gitCommit: true, repo: true });
  try {
    await writeFile(join(h.docs, 'note.md'), 'same\n');
    await execFileAsync('git', ['-C', h.docs, 'add', 'note.md']);
    await execFileAsync('git', ['-C', h.docs, 'commit', '-q', '-m', 'seed']);

    const raw = await fetch(`${h.baseUrl}/api/documents/raw?path=note.md`);
    const { mtime } = (await raw.json()) as { mtime: number };

    const before = await gitLog(h.docs);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': h.baseUrl,
        'If-Unmodified-Since': String(mtime),
      },
      body: JSON.stringify({ content: 'same\n' }),
    });
    assert.equal(r.status, 200);
    const after = await gitLog(h.docs);
    assert.deepEqual(after, before);
  } finally {
    await h.close();
  }
});
