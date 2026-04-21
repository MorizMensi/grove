/**
 * Named security features that `--disable-security` can turn off.
 *
 * Every entry here is an explicit escape hatch. The default is all
 * checks enabled; callers opt out by naming flags, one per CSV token.
 *
 * - `allow-symlinks`: `ensureInside` still requires the *addressed*
 *   (lexical) path to be contained in docsDir, but skips the
 *   `realpath` containment check — so symlinks inside docsDir whose
 *   targets live outside docsDir will resolve.
 */
export const DISABLED_SECURITY_VALUES = ['allow-symlinks'] as const;

export type DisabledSecurity = (typeof DISABLED_SECURITY_VALUES)[number];

export type DisabledSecuritySet = ReadonlySet<DisabledSecurity>;

export class DisabledSecurityParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisabledSecurityParseError';
  }
}

function isKnown(value: string): value is DisabledSecurity {
  return (DISABLED_SECURITY_VALUES as readonly string[]).includes(value);
}

/**
 * Parse one or more comma-separated `--disable-security` values into a
 * set. Empty input and unknown values throw `DisabledSecurityParseError`
 * with a message listing the valid tokens.
 *
 * Accepts repeated invocation by merging into `existing` (defaults to
 * an empty set), so `--disable-security a --disable-security b` works.
 */
export function parseDisabledSecurity(
  csv: string,
  existing: DisabledSecuritySet = new Set(),
): DisabledSecuritySet {
  const tokens = csv
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (tokens.length === 0) {
    throw new DisabledSecurityParseError(
      `--disable-security requires a non-empty comma-separated list. Valid values: ${DISABLED_SECURITY_VALUES.join(', ')}`,
    );
  }

  const merged = new Set<DisabledSecurity>(existing);
  for (const token of tokens) {
    if (!isKnown(token)) {
      throw new DisabledSecurityParseError(
        `Unknown --disable-security value: "${token}". Valid values: ${DISABLED_SECURITY_VALUES.join(', ')}`,
      );
    }
    merged.add(token);
  }
  return merged;
}
