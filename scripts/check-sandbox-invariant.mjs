#!/usr/bin/env node
// Prepublish check: the HTML-preview iframe MUST carry exactly
// sandbox="allow-same-origin" and MUST NOT carry allow-scripts.
// Combining allow-same-origin with allow-scripts disables the sandbox
// entirely (the iframe can reach window.parent) — that would turn every
// rendered user HTML file into an XSS vector.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(
  ROOT,
  'frontend/src/app/shared/file-preview/file-preview.component.html',
);

const source = readFileSync(TARGET, 'utf8');
const match = source.match(/<iframe\b[^>]*\bsandbox="([^"]*)"/);

if (!match) {
  console.error(
    `[check:sandbox] FAIL: no <iframe ... sandbox="..."> attribute found in ${TARGET}`,
  );
  process.exit(1);
}

const value = match[1];
if (value !== 'allow-same-origin') {
  console.error(
    `[check:sandbox] FAIL: sandbox attribute must be exactly "allow-same-origin", got "${value}"`,
  );
  process.exit(1);
}
if (/\ballow-scripts\b/.test(value)) {
  console.error(
    `[check:sandbox] FAIL: sandbox attribute contains allow-scripts, which disables the sandbox when combined with allow-same-origin`,
  );
  process.exit(1);
}

console.log('[check:sandbox] OK: iframe sandbox invariant holds.');
