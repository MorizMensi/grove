import { resolveRelative } from '../../core/utils/resolve-content-url';
import { CONTENT_URL_PREFIX } from '@shared/content-url';

const ASSET_ATTRS: ReadonlyArray<readonly [string, string]> = [
  ['img', 'src'],
  ['img', 'srcset'],
  ['source', 'src'],
  ['source', 'srcset'],
  ['video', 'src'],
  ['video', 'poster'],
  ['audio', 'src'],
  ['track', 'src'],
];

const HAS_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_ABSOLUTE_SCHEME_RE = /^(https?:|mailto:|#|\/)/i;

function isAbsolute(url: string): boolean {
  return HAS_SCHEME_RE.test(url) || url.startsWith('/') || url.startsWith('#');
}

function rewriteAsset(
  raw: string,
  base: readonly string[],
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isAbsolute(trimmed)) {
    return SAFE_ABSOLUTE_SCHEME_RE.test(trimmed) ? trimmed : null;
  }
  const resolved = resolveRelative(base, trimmed);
  if (resolved === null) return null;
  return `/${CONTENT_URL_PREFIX}/${resolved}`;
}

function rewriteLink(
  raw: string,
  base: readonly string[],
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isAbsolute(trimmed)) {
    return SAFE_ABSOLUTE_SCHEME_RE.test(trimmed) ? trimmed : null;
  }
  const resolved = resolveRelative(base, trimmed);
  if (resolved === null) return null;
  return `/${resolved}`;
}

/**
 * Rewrite relative URLs in already-sanitized HTML so they resolve against
 * the current document's directory.
 *
 * - Asset attrs (img/video/audio/source/track) get a `/_content/` prefix.
 * - `a[href]` gets a plain `/` prefix so Angular routing picks it up.
 * - Absolute URLs (scheme:, /, #) pass through unchanged.
 * - Relative URLs that traverse above the docs root have the attribute
 *   dropped entirely (fail-closed).
 *
 * Returns the concatenation of `<head>` `<style>` nodes and `<body>`
 * innerHTML so both full-document and fragment authoring work.
 */
export function rewriteUserHtml(
  safeHtml: string,
  base: readonly string[],
): string {
  const doc = new DOMParser().parseFromString(safeHtml, 'text/html');

  for (const [tag, attr] of ASSET_ATTRS) {
    const elements = doc.querySelectorAll<HTMLElement>(tag);
    elements.forEach(el => {
      const raw = el.getAttribute(attr);
      if (raw === null) return;
      const rewritten = rewriteAsset(raw, base);
      if (rewritten === null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, rewritten);
      }
    });
  }

  const anchors = doc.querySelectorAll<HTMLAnchorElement>('a');
  anchors.forEach(el => {
    const raw = el.getAttribute('href');
    if (raw === null) return;
    const rewritten = rewriteLink(raw, base);
    if (rewritten === null) {
      el.removeAttribute('href');
    } else {
      el.setAttribute('href', rewritten);
    }
  });

  const styleHtml = Array.from(doc.head.querySelectorAll('style'))
    .map(node => node.outerHTML)
    .join('');

  return styleHtml + doc.body.innerHTML;
}
