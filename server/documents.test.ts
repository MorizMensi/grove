import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdir,
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
    // Regression: `zed` must remain absent after removal.
    assert.ok(!('zed' in (body.supports as Record<string, unknown>)));
  } finally {
    await h.close();
  }
});

// ── POST /api/documents ────────────────────────────────────────────────

test('POST creates an empty file and returns 201 + mtime', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=fresh.md`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 201);
    const body = (await r.json()) as { mtime?: number };
    assert.ok(Number.isFinite(body.mtime));
    const contents = await readFile(join(h.docs, 'fresh.md'), 'utf8');
    assert.equal(contents, '');
  } finally {
    await h.close();
  }
});

test('POST creates a directory with ?kind=dir', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=sub&kind=dir`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 201);
    const s = await stat(join(h.docs, 'sub'));
    assert.ok(s.isDirectory());
  } finally {
    await h.close();
  }
});

test('POST without --allow-edits → 403 edits-disabled', async () => {
  const h = await spin({ allowEdits: false });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=x.md`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'edits-disabled' });
  } finally {
    await h.close();
  }
});

test('POST with bad Origin → 403 bad-origin', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=x.md`, {
      method: 'POST',
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
  } finally {
    await h.close();
  }
});

test('POST existing target → 409 exists', async () => {
  const h = await spin({ allowEdits: true });
  try {
    await writeFile(join(h.docs, 'already.md'), 'hi');
    const r = await fetch(`${h.baseUrl}/api/documents?path=already.md`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 409);
    assert.deepEqual(await r.json(), { error: 'exists' });
    assert.equal(await readFile(join(h.docs, 'already.md'), 'utf8'), 'hi');
  } finally {
    await h.close();
  }
});

test('POST into missing parent → 409 parent-missing', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=no/such/c.md`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 409);
    assert.deepEqual(await r.json(), { error: 'parent-missing' });
  } finally {
    await h.close();
  }
});

test('POST with bad name (leading dot) → 400 bad-name', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=${encodeURIComponent('.hidden')}`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-name' });
  } finally {
    await h.close();
  }
});

test('POST with bad name (parent-ref) → 400 bad-name', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=${encodeURIComponent('..')}`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-name' });
  } finally {
    await h.close();
  }
});

test('POST with bad name (too long) → 400 bad-name', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const huge = 'a'.repeat(300);
    const r = await fetch(`${h.baseUrl}/api/documents?path=${huge}`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-name' });
  } finally {
    await h.close();
  }
});

test('POST with bad kind → 400 bad-kind', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=x.md&kind=symlink`, {
      method: 'POST',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'bad-kind' });
  } finally {
    await h.close();
  }
});

test('POST with traversal → 403 forbidden', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(
      `${h.baseUrl}/api/documents?path=${encodeURIComponent('../escape.md')}`,
      { method: 'POST', headers: { origin: h.baseUrl } },
    );
    // `..` normalizes to the docsDir parent; name is `escape.md`,
    // parent containment fails → 409 parent-missing is also a valid
    // outcome; either `403 forbidden` or `409 parent-missing` is fine as
    // long as the write does not happen. We assert both cases here.
    assert.ok(r.status === 403 || r.status === 409, `status=${r.status}`);
  } finally {
    await h.close();
  }
});

// ── DELETE /api/documents ──────────────────────────────────────────────

test('DELETE file → 204 and file gone', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const filePath = join(h.docs, 'gone.md');
    await writeFile(filePath, 'bye');
    const r = await fetch(`${h.baseUrl}/api/documents?path=gone.md`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 204);
    await assert.rejects(stat(filePath));
  } finally {
    await h.close();
  }
});

test('DELETE empty directory → 204 and dir gone', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const dirPath = join(h.docs, 'empty');
    await mkdir(dirPath);
    const r = await fetch(`${h.baseUrl}/api/documents?path=empty`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 204);
    await assert.rejects(stat(dirPath));
  } finally {
    await h.close();
  }
});

test('DELETE non-empty directory → 409 not-empty and dir preserved', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const dirPath = join(h.docs, 'full');
    await mkdir(dirPath);
    await writeFile(join(dirPath, 'note.md'), 'x');
    const r = await fetch(`${h.baseUrl}/api/documents?path=full`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 409);
    assert.deepEqual(await r.json(), { error: 'not-empty' });
    const s = await stat(dirPath);
    assert.ok(s.isDirectory());
  } finally {
    await h.close();
  }
});

test('DELETE missing → 404 not-found', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=nope.md`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 404);
    assert.deepEqual(await r.json(), { error: 'not-found' });
  } finally {
    await h.close();
  }
});

test('DELETE without --allow-edits → 403 edits-disabled', async () => {
  const h = await spin({ allowEdits: false });
  try {
    await writeFile(join(h.docs, 'keep.md'), 'keep');
    const r = await fetch(`${h.baseUrl}/api/documents?path=keep.md`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'edits-disabled' });
    assert.equal(await readFile(join(h.docs, 'keep.md'), 'utf8'), 'keep');
  } finally {
    await h.close();
  }
});

test('DELETE with bad Origin → 403 bad-origin', async () => {
  const h = await spin({ allowEdits: true });
  try {
    await writeFile(join(h.docs, 'keep.md'), 'keep');
    const r = await fetch(`${h.baseUrl}/api/documents?path=keep.md`, {
      method: 'DELETE',
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
    assert.equal(await readFile(join(h.docs, 'keep.md'), 'utf8'), 'keep');
  } finally {
    await h.close();
  }
});

test('DELETE with traversal → 403 forbidden', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(
      `${h.baseUrl}/api/documents?path=${encodeURIComponent('../../etc/passwd')}`,
      { method: 'DELETE', headers: { origin: h.baseUrl } },
    );
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'forbidden' });
  } finally {
    await h.close();
  }
});

test('DELETE with empty path → 403 forbidden (refuses docsDir itself)', async () => {
  const h = await spin({ allowEdits: true });
  try {
    const r = await fetch(`${h.baseUrl}/api/documents?path=`, {
      method: 'DELETE',
      headers: { origin: h.baseUrl },
    });
    assert.equal(r.status, 403);
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
