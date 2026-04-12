/**
 * URL safety primitives used both when converting markdown to DocLang and
 * when rendering DocLang nodes. The rule is: allow unscheme-prefixed URLs
 * (relative links) and URLs with an http(s) or mailto: scheme; reject
 * anything else (including javascript:, data:, vbscript:, file:, control
 * characters, etc.).
 */

export const ALLOWED_SCHEME_RE = /^(https?:\/\/|mailto:)/i;
export const HAS_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
export const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/;

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || CONTROL_CHAR_RE.test(trimmed)) return false;
  if (HAS_SCHEME_RE.test(trimmed)) return ALLOWED_SCHEME_RE.test(trimmed);
  return true;
}
