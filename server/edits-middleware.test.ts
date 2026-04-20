import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { csrfOrigin, requireEdits } from './edits-middleware.js';

interface Harness {
  url: string;
  close: () => Promise<void>;
}

async function spin(
  mount: (app: express.Application) => void,
): Promise<Harness> {
  const app = express();
  mount(app);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

test('requireEdits off → 403 edits-disabled', async () => {
  const h = await spin((app) => {
    app.put('/x', requireEdits(false), (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    const r = await fetch(`${h.url}/x`, { method: 'PUT' });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'edits-disabled' });
  } finally {
    await h.close();
  }
});

test('requireEdits on → passes through', async () => {
  const h = await spin((app) => {
    app.put('/x', requireEdits(true), (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    const r = await fetch(`${h.url}/x`, {
      method: 'PUT',
      headers: { origin: h.url },
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  } finally {
    await h.close();
  }
});

test('csrfOrigin matching Origin → passes', async () => {
  const h = await spin((app) => {
    app.put('/x', csrfOrigin, (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    const r = await fetch(`${h.url}/x`, {
      method: 'PUT',
      headers: { origin: h.url },
    });
    assert.equal(r.status, 200);
  } finally {
    await h.close();
  }
});

test('csrfOrigin mismatching Origin → 403 bad-origin', async () => {
  const h = await spin((app) => {
    app.put('/x', csrfOrigin, (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    const r = await fetch(`${h.url}/x`, {
      method: 'PUT',
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
  } finally {
    await h.close();
  }
});

test('csrfOrigin missing Origin → 403 bad-origin', async () => {
  const h = await spin((app) => {
    app.put('/x', csrfOrigin, (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    // fetch() from Node doesn't set an Origin on server-to-server PUTs, so
    // this exercises the "no Origin" rejection path directly.
    const r = await fetch(`${h.url}/x`, { method: 'PUT' });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
  } finally {
    await h.close();
  }
});

test('csrfOrigin unparseable Origin → 403 bad-origin', async () => {
  const h = await spin((app) => {
    app.put('/x', csrfOrigin, (_req, res) => {
      res.json({ ok: true });
    });
  });
  try {
    const r = await fetch(`${h.url}/x`, {
      method: 'PUT',
      headers: { origin: 'not a url' },
    });
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), { error: 'bad-origin' });
  } finally {
    await h.close();
  }
});
