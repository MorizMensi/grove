import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureInside, PathError } from './path-sandbox.js';

async function makeDocsDir(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'grove-sandbox-'));
  // realpath the fixture root up front so comparisons on macOS (where
  // /tmp is a symlink to /private/tmp) match what `ensureInside` returns.
  return realpath(root);
}

test('returns realpath for happy-path entry inside docsDir', async () => {
  const docs = await makeDocsDir();
  try {
    const file = join(docs, 'note.md');
    await writeFile(file, '# hi');
    const real = await ensureInside(docs, 'note.md');
    assert.equal(real, file);
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('empty userPath resolves to docsDir itself', async () => {
  const docs = await makeDocsDir();
  try {
    const real = await ensureInside(docs, '');
    assert.equal(real, docs);
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('rejects parent-traversal with ..', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, '../../etc/passwd'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('rejects absolute path outside docsDir', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, '/etc/passwd'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('rejects symlink escaping docsDir', async () => {
  const docs = await makeDocsDir();
  try {
    // Point a symlink inside docs at a file outside docs.
    const outside = join(docs, '..');
    const outsideReal = await realpath(outside);
    await writeFile(join(outsideReal, 'secret.txt'), 'secret');
    await symlink(join(outsideReal, 'secret.txt'), join(docs, 'leak'));
    await assert.rejects(
      () => ensureInside(docs, 'leak'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('rejects sibling-prefix bypass', async () => {
  // A sibling directory whose realpath shares the docsDir prefix but
  // is not inside it (e.g. docsDir=/tmp/foo, candidate=/tmp/foobar)
  // must be rejected by the `sep` guard.
  const parent = await mkdtemp(join(tmpdir(), 'grove-sib-'));
  const parentReal = await realpath(parent);
  try {
    const docs = join(parentReal, 'foo');
    const sibling = join(parentReal, 'foobar');
    await mkdir(docs);
    await mkdir(sibling);
    await writeFile(join(sibling, 'evil.md'), 'x');
    await assert.rejects(
      () => ensureInside(docs, '../foobar/evil.md'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('rejects NUL byte in userPath', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, 'note\0.md'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('allowMissing: accepts new leaf in existing parent inside docsDir', async () => {
  const docs = await makeDocsDir();
  try {
    const real = await ensureInside(docs, 'new.md', { allowMissing: true });
    assert.equal(real, join(docs, 'new.md'));
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('allowMissing: rejects when parent directory is missing', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, 'missing-dir/new.md', { allowMissing: true }),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('allowSymlinks: resolves symlink whose target lives outside docsDir', async () => {
  const docs = await makeDocsDir();
  try {
    const outside = join(docs, '..');
    const outsideReal = await realpath(outside);
    const target = join(outsideReal, 'secret.txt');
    await writeFile(target, 'secret');
    await symlink(target, join(docs, 'leak'));
    const real = await ensureInside(docs, 'leak', { allowSymlinks: true });
    assert.equal(real, target);
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('allowSymlinks: still rejects lexical `..` traversal', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, '../../etc/passwd', { allowSymlinks: true }),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('allowSymlinks: still rejects sibling-prefix bypass', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'grove-sib-sym-'));
  const parentReal = await realpath(parent);
  try {
    const docs = join(parentReal, 'foo');
    const sibling = join(parentReal, 'foobar');
    await mkdir(docs);
    await mkdir(sibling);
    await writeFile(join(sibling, 'evil.md'), 'x');
    await assert.rejects(
      () => ensureInside(docs, '../foobar/evil.md', { allowSymlinks: true }),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('allowSymlinks: still rejects NUL byte', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, 'note\0.md', { allowSymlinks: true }),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});

test('without allowMissing: rejects nonexistent target', async () => {
  const docs = await makeDocsDir();
  try {
    await assert.rejects(
      () => ensureInside(docs, 'ghost.md'),
      (err: unknown) => err instanceof PathError && err.code === 'forbidden',
    );
  } finally {
    await rm(docs, { recursive: true, force: true });
  }
});
