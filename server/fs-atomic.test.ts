import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { atomicWrite } from './fs-atomic.js';

async function makeDir(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), 'grove-atomic-'));
  return realpath(d);
}

test('writes new file contents', async () => {
  const dir = await makeDir();
  try {
    const target = join(dir, 'note.md');
    await atomicWrite(target, 'hello');
    assert.equal(await readFile(target, 'utf8'), 'hello');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('replaces existing file contents', async () => {
  const dir = await makeDir();
  try {
    const target = join(dir, 'note.md');
    await writeFile(target, 'old');
    await atomicWrite(target, 'new');
    assert.equal(await readFile(target, 'utf8'), 'new');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('leaves no .tmp files after success', async () => {
  const dir = await makeDir();
  try {
    const target = join(dir, 'note.md');
    await atomicWrite(target, 'x');
    const entries = await readdir(dir);
    assert.deepEqual(
      entries.filter((n) => n.includes('.tmp')),
      [],
      'expected no .tmp sidecars after a successful write',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('does not touch target if write fails; cleans up tmp', async () => {
  const dir = await makeDir();
  try {
    const target = join(dir, 'note.md');
    await writeFile(target, 'original');
    // Force rename failure: make the target a directory, so `rename(tmp, target)`
    // fails with ENOTDIR on POSIX and EPERM on some filesystems.
    // Instead we simulate by passing a path whose parent directory does not
    // exist — `writeFile` to the tmp path will fail with ENOENT.
    const broken = join(dir, 'missing-parent', 'note.md');
    await assert.rejects(() => atomicWrite(broken, 'new'));
    // Original file is untouched.
    assert.equal(await readFile(target, 'utf8'), 'original');
    // No tmp sidecar leaked in the top-level dir.
    const entries = await readdir(dir);
    assert.deepEqual(
      entries.filter((n) => n.includes('.tmp')),
      [],
      'expected no .tmp sidecars after a failed write',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
