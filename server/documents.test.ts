import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from './index.js';

interface Harness {
  baseUrl: string;
  docs: string;
  close: () => Promise<void>;
}

async function spin(options: { allowEdits?: boolean } = {}): Promise<Harness> {
  const docs = await realpath(await mkdtemp(join(tmpdir(), 'grove-docs-')));
  const app = createApp(docs, options);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    docs,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
      await rm(docs, { recursive: true, force: true });
    },
  };
}

test('GET /api/documents/raw returns content, mtime, ETag, Last-Modified', async () => {
  const h = await spin();
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, '# hello');
    const s = await stat(filePath);

    const r = await fetch(`${h.baseUrl}/api/documents/raw?path=note.md`);
    assert.equal(r.status, 200);
    const body = (await r.json()) as { content: string; mtime: number };
    assert.equal(body.content, '# hello');
    assert.ok(Number.isFinite(body.mtime));
    assert.equal(r.headers.get('ETag'), `W/"${Math.floor(s.mtimeMs)}-${s.size}"`);
    assert.ok(r.headers.get('Last-Modified'));
  } finally {
    await h.close();
  }
});

test('GET /api/documents/raw 404 on missing file', async () => {
  const h = await spin();
  try {
    const r = await fetch(`${h.baseUrl}/api/documents/raw?path=missing.md`);
    assert.equal(r.status, 404);
    assert.deepEqual(await r.json(), { error: 'not-found' });
  } finally {
    await h.close();
  }
});

test('GET /api/documents/raw 403 on traversal', async () => {
  const h = await spin();
  try {
    const r = await fetch(
      `${h.baseUrl}/api/documents/raw?path=${encodeURIComponent('../../etc/passwd')}`,
    );
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'forbidden' });
  } finally {
    await h.close();
  }
});

test('PUT without --allow-edits → 403 edits-disabled', async () => {
  const h = await spin({ allowEdits: false });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: JSON.stringify({ content: 'new' }),
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'edits-disabled' });
    assert.equal(await readFile(filePath, 'utf8'), 'old');
  } finally {
    await h.close();
  }
});

test('PUT with bad Origin → 403 bad-origin', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: 'http://evil.example',
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: JSON.stringify({ content: 'new' }),
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
    assert.equal(await readFile(filePath, 'utf8'), 'old');
  } finally {
    await h.close();
  }
});

test('PUT without JSON content-type → 415', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: { 'content-type': 'text/plain', origin: h.baseUrl },
      body: 'new',
    });
    assert.equal(r.status, 415);
    assert.deepEqual(await r.json(), { error: 'unsupported-media-type' });
  } finally {
    await h.close();
  }
});

test('PUT without If-Unmodified-Since → 400', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: h.baseUrl },
      body: JSON.stringify({ content: 'new' }),
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'missing-if-unmodified-since' });
  } finally {
    await h.close();
  }
});

test('PUT with unparseable If-Unmodified-Since → 400', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': 'not a date',
      },
      body: JSON.stringify({ content: 'new' }),
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-if-unmodified-since' });
  } finally {
    await h.close();
  }
});

test('PUT with stale If-Unmodified-Since → 409', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    // Ask the server to accept the write only if the file is older
    // than "five minutes ago" — the real mtime is now, so it must fail.
    const tooOld = s.mtimeMs - 5 * 60 * 1000;
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(tooOld),
      },
      body: JSON.stringify({ content: 'new' }),
    });
    assert.equal(r.status, 409);
    const body = (await r.json()) as { error: string; mtime: number };
    assert.equal(body.error, 'stale');
    assert.ok(Number.isFinite(body.mtime));
    assert.equal(await readFile(filePath, 'utf8'), 'old');
  } finally {
    await h.close();
  }
});

test('PUT with matching If-Unmodified-Since (ms) → 200 and writes file', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: JSON.stringify({ content: '# new' }),
    });
    assert.equal(r.status, 200);
    const body = (await r.json()) as { mtime: number };
    assert.ok(Number.isFinite(body.mtime));
    assert.equal(await readFile(filePath, 'utf8'), '# new');
  } finally {
    await h.close();
  }
});

test('PUT with matching If-Unmodified-Since (HTTP date) → 200', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    // HTTP dates are second-granularity; use the floor-second UTC date of
    // the current mtime so the comparison succeeds.
    const httpDate = new Date(Math.floor(s.mtimeMs / 1000) * 1000).toUTCString();
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': httpDate,
      },
      body: JSON.stringify({ content: '# http' }),
    });
    assert.equal(r.status, 200);
    assert.equal(await readFile(filePath, 'utf8'), '# http');
  } finally {
    await h.close();
  }
});

test('PUT with traversal path → 403 forbidden', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(
      `${h.baseUrl}/api/documents?path=${encodeURIComponent('../../etc/passwd')}`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: h.baseUrl,
          'if-unmodified-since': String(Date.now()),
        },
        body: JSON.stringify({ content: 'evil' }),
      },
    );
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'forbidden' });
  } finally {
    await h.close();
  }
});

test('PUT with oversized body → 413', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    // 11 MB payload, exceeds the 10 MB limit. Kept as a Buffer of 'a's
    // to avoid per-character JSON escaping surprises.
    const huge = 'a'.repeat(11 * 1024 * 1024);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: JSON.stringify({ content: huge }),
    });
    assert.equal(r.status, 413);
    assert.deepEqual(await r.json(), { error: 'too-large' });
    assert.equal(await readFile(filePath, 'utf8'), 'old');
  } finally {
    await h.close();
  }
});

test('PUT with malformed JSON → 400 bad-json', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: '{ not json',
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-json' });
  } finally {
    await h.close();
  }
});

test('PUT with missing content field → 400 bad-body', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'note.md');
    await writeFile(filePath, 'old');
    const s = await stat(filePath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=note.md`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: h.baseUrl,
        'if-unmodified-since': String(s.mtimeMs),
      },
      body: JSON.stringify({ notContent: 'x' }),
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-body' });
  } finally {
    await h.close();
  }
});

test('GET /api/capabilities reports edits + gitCommit', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/capabilities`);
    assert.equal(r.status, 200);
    const body = (await r.json()) as {
      platform: string;
      supports: { terminal: boolean; claude: boolean; edits: boolean; gitCommit: boolean };
    };
    assert.equal(body.supports.edits, true);
    assert.equal(body.supports.gitCommit, false);
    // Regression: `zed` must remain absent after Phase 0 removal.
    assert.ok(!('zed' in (body.supports as Record<string, unknown>)));
  } finally {
    await h.close();
  }
});

test('GET /api/capabilities defaults edits to false', async () => {
  const h = await spin();
  try {
    const r = await fetch(`${h.baseUrl}/api/capabilities`);
    const body = (await r.json()) as {
      supports: { edits: boolean; gitCommit: boolean };
    };
    assert.equal(body.supports.edits, false);
    assert.equal(body.supports.gitCommit, false);
  } finally {
    await h.close();
  }
});
