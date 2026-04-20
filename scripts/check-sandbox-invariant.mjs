#!/usr/bin/env node
// Prepublish invariant checks. Any failure exits non-zero and prints a
// single FAIL line so the message is greppable in CI logs.
//
// 1. The HTML-preview iframe MUST carry exactly sandbox="allow-same-origin"
//    and MUST NOT carry allow-scripts. Combining allow-same-origin with
//    allow-scripts disables the sandbox entirely (the iframe can reach
//    window.parent) — that would turn every rendered user HTML file into an
//    XSS vector.
// 2. Server write routes MUST chain `requireEdits` and `csrfOrigin`. The
//    flag is the real gate; dropping the middleware is a silent regression.
// 3. Every path-consuming server handler MUST call `ensureInside` on the
//    user-supplied path before touching the filesystem. The realpath-based
//    containment is the only thing preventing symlink escape.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`[check:sandbox] FAIL: ${message}`);
  process.exit(1);
}

// --- 1. iframe sandbox attribute ---------------------------------------

const iframeTarget = join(
  ROOT,
  'frontend/src/app/shared/file-preview/file-preview.component.html',
);
const iframeSource = readFileSync(iframeTarget, 'utf8');
const iframeMatch = iframeSource.match(/<iframe\b[^>]*\bsandbox="([^"]*)"/);

if (!iframeMatch) {
  fail(`no <iframe ... sandbox="..."> attribute found in ${iframeTarget}`);
}

const sandboxValue = iframeMatch[1];
if (sandboxValue !== 'allow-same-origin') {
  fail(
    `sandbox attribute must be exactly "allow-same-origin", got "${sandboxValue}"`,
  );
}
if (/\ballow-scripts\b/.test(sandboxValue)) {
  fail(
    'sandbox attribute contains allow-scripts, which disables the sandbox when combined with allow-same-origin',
  );
}

// --- Route-block extraction --------------------------------------------
//
// Scan for each `router.METHOD(` call and return the full
// parenthesised argument list. Naive regexes cut the block short at
// the first `);` inside a handler callback; a proper scanner is needed
// because route handlers contain nested function calls and template
// literals.
function* routeBlocks(source) {
  const re = /\brouter\.(get|put|post|delete)\s*\(/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const verb = match[1];
    const openIdx = match.index + match[0].length - 1;
    const closeIdx = matchParen(source, openIdx);
    if (closeIdx === -1) continue;
    yield {
      verb,
      block: source.slice(match.index, closeIdx + 1),
    };
  }
}

function matchParen(source, openIdx) {
  if (source[openIdx] !== '(') return -1;
  let depth = 1;
  let i = openIdx + 1;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(source, i, c);
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
}

function skipString(source, start, quote) {
  let i = start + 1;
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === quote) return i + 1;
    if (quote === '`' && c === '$' && source[i + 1] === '{') {
      // Skip balanced ${...} inside a template literal.
      let depth = 1;
      i += 2;
      while (i < source.length && depth > 0) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}

// --- 2. write-route middleware chain -----------------------------------

const documentsSource = readFileSync(
  join(ROOT, 'server/documents.ts'),
  'utf8',
);

let writeRouteFound = false;
for (const { verb, block } of routeBlocks(documentsSource)) {
  if (verb === 'get') continue;
  writeRouteFound = true;
  if (!block.includes('requireEdits(')) {
    fail(
      `${verb.toUpperCase()} route in server/documents.ts is missing requireEdits(...) middleware`,
    );
  }
  if (!/\bcsrfOrigin\b/.test(block)) {
    fail(
      `${verb.toUpperCase()} route in server/documents.ts is missing csrfOrigin middleware`,
    );
  }
}

if (!writeRouteFound) {
  console.warn(
    '[check:sandbox] NOTE: no write routes detected in server/documents.ts (pre-Phase 1?). Skipping middleware chain assertion.',
  );
}

// --- 3. ensureInside on every path-consuming handler -------------------

for (const rel of ['server/documents.ts', 'server/open.ts']) {
  const source = readFileSync(join(ROOT, rel), 'utf8');
  for (const { verb, block } of routeBlocks(source)) {
    if (!block.includes('ensureInside(')) {
      fail(
        `${verb.toUpperCase()} route in ${rel} does not call ensureInside(...) before filesystem access`,
      );
    }
  }
}

console.log('[check:sandbox] OK: iframe sandbox, write-route middleware, and path containment invariants hold.');
