import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp, type CreateAppOptions } from './index.js';

interface Harness {
  baseUrl: string;
  docs: string;
  close: () => Promise<void>;
}

async function spin(options: CreateAppOptions = {}): Promise<Harness> {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-docs-')));
  const app = createApp(docs, options);
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

test('/_content HTML response CSP keeps same-origin so theme passthrough works', async () => {
  const h = await spin();
  try {
    await writeFile(join(h.docs, 'page.html'), '<p>hi</p>');
    const r = await fetch(`${h.baseUrl}/_content/page.html`);
    assert.equal(r.status, 200);
    const csp = r.headers.get('Content-Security-Policy') ?? '';
    // allow-same-origin is load-bearing: without it the response is forced
    // into an opaque origin and parent→iframe DOM access (theme injection)
    // breaks silently. See server/index.ts and html-theme-injection.ts.
    assert.match(csp, /sandbox[^;]*\ballow-same-origin\b/);
    // Scripts must still be blocked — belt-and-suspenders via script-src and
    // the absence of allow-scripts in the sandbox directive.
    assert.match(csp, /script-src\s+'none'/);
    assert.doesNotMatch(csp, /\ballow-scripts\b/);
    assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
  } finally {
    await h.close();
  }
});

test('/_content SVG response carries the same CSP', async () => {
  const h = await spin();
  try {
    await writeFile(
      join(h.docs, 'icon.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
    );
    const r = await fetch(`${h.baseUrl}/_content/icon.svg`);
    assert.equal(r.status, 200);
    const csp = r.headers.get('Content-Security-Policy') ?? '';
    assert.match(csp, /sandbox[^;]*\ballow-same-origin\b/);
    assert.match(csp, /script-src\s+'none'/);
  } finally {
    await h.close();
  }
});

test('/_content non-HTML/SVG responses get no CSP', async () => {
  const h = await spin();
  try {
    await writeFile(join(h.docs, 'note.md'), '# hello');
    const r = await fetch(`${h.baseUrl}/_content/note.md`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('Content-Security-Policy'), null);
  } finally {
    await h.close();
  }
});

test('GET /api/documents/raw rejects an escaping symlink by default', async () => {
  const h = await spin();
  try {
    const outsideDir = await realpath(await mkdtemp(join(tmpdir(), 'grove-outside-')));
    try {
      const target = join(outsideDir, 'secret.md');
      await writeFile(target, '# secret');
      await symlink(target, join(h.docs, 'leak.md'));
      const r = await fetch(`${h.baseUrl}/api/documents/raw?path=leak.md`);
      assert.equal(r.status, 403);
      const body = await r.json();
      assert.equal(body.error, 'forbidden');
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  } finally {
    await h.close();
  }
});

test('GET /api/documents/raw follows an escaping symlink when allow-symlinks is disabled', async () => {
  const h = await spin({ disabledSecurity: new Set(['allow-symlinks']) });
  try {
    const outsideDir = await realpath(await mkdtemp(join(tmpdir(), 'grove-outside-')));
    try {
      const target = join(outsideDir, 'secret.md');
      await writeFile(target, '# secret');
      await symlink(target, join(h.docs, 'leak.md'));
      const r = await fetch(`${h.baseUrl}/api/documents/raw?path=leak.md`);
      assert.equal(r.status, 200);
      const body = await r.json();
      assert.equal(body.content, '# secret');
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  } finally {
    await h.close();
  }
});

test('allow-symlinks does NOT permit `..` traversal', async () => {
  const h = await spin({ disabledSecurity: new Set(['allow-symlinks']) });
  try {
    const r = await fetch(
      `${h.baseUrl}/api/documents/raw?path=${encodeURIComponent('../../etc/passwd')}`,
    );
    assert.equal(r.status, 403);
  } finally {
    await h.close();
  }
});
