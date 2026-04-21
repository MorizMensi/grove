import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDisabledSecurity,
  DisabledSecurityParseError,
} from './security-options.js';

test('parses a single known value', () => {
  const set = parseDisabledSecurity('allow-symlinks');
  assert.equal(set.size, 1);
  assert.ok(set.has('allow-symlinks'));
});

test('trims whitespace around tokens', () => {
  const set = parseDisabledSecurity('  allow-symlinks  ');
  assert.ok(set.has('allow-symlinks'));
});

test('deduplicates repeated tokens', () => {
  const set = parseDisabledSecurity('allow-symlinks,allow-symlinks');
  assert.equal(set.size, 1);
});

test('merges with an existing set for repeated --disable-security', () => {
  const first = parseDisabledSecurity('allow-symlinks');
  const second = parseDisabledSecurity('allow-symlinks', first);
  assert.equal(second.size, 1);
  assert.ok(second.has('allow-symlinks'));
});

test('rejects empty input', () => {
  assert.throws(
    () => parseDisabledSecurity(''),
    (err: unknown) => err instanceof DisabledSecurityParseError,
  );
});

test('rejects input with only commas/whitespace', () => {
  assert.throws(
    () => parseDisabledSecurity(' , , '),
    (err: unknown) => err instanceof DisabledSecurityParseError,
  );
});

test('rejects unknown values', () => {
  assert.throws(
    () => parseDisabledSecurity('allow-everything'),
    (err: unknown) =>
      err instanceof DisabledSecurityParseError &&
      /allow-everything/.test(err.message),
  );
});

test('rejects when any token is unknown even if others are valid', () => {
  assert.throws(
    () => parseDisabledSecurity('allow-symlinks,bogus'),
    (err: unknown) => err instanceof DisabledSecurityParseError,
  );
});
