/**
 * SECURITY: These helpers run against an iframe declared with
 * `sandbox="allow-same-origin"` (no allow-scripts). Never combine with
 * `allow-scripts` — the pair disables the sandbox entirely and lets the
 * iframe reach `window.parent`.
 */

export const THEME_TOKEN_NAMES: readonly string[] = [
  // Backgrounds
  '--color-bg-page',
  '--color-bg-surface',
  '--color-bg-inset',
  '--color-bg-elevated',
  '--color-bg-emphasis',
  '--color-bg-code-block',
  '--color-bg-code-inline',
  '--color-bg-table-header',
  '--color-bg-table-stripe',
  '--color-bg-blockquote',
  '--color-bg-hover',
  '--color-bg-sidebar',
  '--color-bg-active-item',
  '--color-bg-backdrop',
  // Text
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-text-heading',
  '--color-text-on-emphasis',
  '--color-text-link',
  '--color-text-link-hover',
  '--color-text-code',
  '--color-text-code-inline',
  // Borders
  '--color-border-default',
  '--color-border-strong',
  '--color-border-muted',
  '--color-border-focus',
  '--color-border-code-inline',
  // Status
  '--color-success-bg', '--color-success-border', '--color-success-text', '--color-success-icon',
  '--color-warning-bg', '--color-warning-border', '--color-warning-text', '--color-warning-icon',
  '--color-error-bg', '--color-error-border', '--color-error-text', '--color-error-icon',
  '--color-info-bg', '--color-info-border', '--color-info-text', '--color-info-icon',
  // Accent overlays
  '--color-focus-ring',
  '--color-link-underline',
];

/**
 * Defence-in-depth CSP for iframe content. With allow-same-origin the iframe
 * could otherwise load same-origin sub-resources with credentials and exfil
 * data via CSS `url()`. This CSP blocks scripts, forms, outbound fetches, and
 * base-uri tampering.
 *
 * LIMITATION: Injected post-load via a meta tag, so it will not apply to
 * resources already fetched during the iframe's initial parse. For stricter
 * enforcement, serve the HTML with a real Content-Security-Policy response
 * header from the backend. The current trust model (local-only wiki, no
 * auth) treats this as belt-and-suspenders.
 */
export const IFRAME_CSP =
  "default-src 'self' data: blob:; " +
  "img-src 'self' data: blob: https:; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; " +
  "script-src 'none'; " +
  "object-src 'none'; " +
  "base-uri 'none'; " +
  "form-action 'none'; " +
  "connect-src 'none'; " +
  "frame-src 'none'; " +
  "frame-ancestors 'self'";

const STYLE_ELEMENT_ID = '__grove-theme__';
const CSP_META_ID = '__grove-csp__';

/** Reject CSS values that could break out of a declaration. */
const VALUE_BLOCKLIST = /[{};<>]/;

function readThemeValues(root: HTMLElement): Array<[string, string]> {
  const computed = getComputedStyle(root);
  const out: Array<[string, string]> = [];
  for (const name of THEME_TOKEN_NAMES) {
    const value = computed.getPropertyValue(name).trim();
    if (!value || VALUE_BLOCKLIST.test(value)) continue;
    out.push([name, value]);
  }
  return out;
}

/**
 * Idempotently ensure the iframe document carries (a) a CSP meta tag and
 * (b) a `<style id="__grove-theme__">` block reflecting the parent theme.
 * Call after the iframe's `load` event AND whenever the parent theme changes.
 */
export function injectThemeIntoIframe(
  iframe: HTMLIFrameElement,
  parentRoot: HTMLElement,
  mode: 'light' | 'dark',
): void {
  const doc = iframe.contentDocument;
  if (!doc || !doc.head) return;

  let csp = doc.getElementById(CSP_META_ID) as HTMLMetaElement | null;
  if (!csp) {
    csp = doc.createElement('meta');
    csp.id = CSP_META_ID;
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = IFRAME_CSP;
    doc.head.insertBefore(csp, doc.head.firstChild);
  }

  let style = doc.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    doc.head.appendChild(style);
  }

  const decls = readThemeValues(parentRoot)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  style.textContent = `:root {\n  color-scheme: ${mode};\n${decls}\n}\n`;
}
