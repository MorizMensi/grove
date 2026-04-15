/**
 * Resolve a raw (possibly-relative) path against a base directory given as
 * already-split URL segments. Returns the joined path with `.` and `..`
 * segments normalized, or `null` if the `..` traversal would escape above
 * the base directory (fail-closed).
 */
export function resolveRelative(
  dirSegments: readonly string[],
  rawPath: string,
): string | null {
  const combined = [...dirSegments, ...rawPath.split('/')];
  const normalized: string[] = [];
  for (const seg of combined) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (normalized.length === 0) return null;
      normalized.pop();
      continue;
    }
    normalized.push(seg);
  }
  return normalized.join('/');
}
