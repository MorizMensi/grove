import DOMPurify from 'dompurify';

/**
 * Single sanitization boundary for user-authored HTML rendered inside
 * `HtmlPreviewComponent`. DOMPurify is the XSS barrier; Shadow DOM is only
 * for style isolation. These layers must never be conflated.
 *
 * Config rationale:
 * - FORBID_TAGS drops dangerous elements. template/noembed/noscript close
 *   the mXSS seam from the DOMParser re-parse in rewriteUserHtml;
 *   math/foreignObject close namespace-switching vectors. `<style>` is
 *   allowed so authors can hand-style pages inside the shadow root.
 * - Default FORBID_ATTR strips every `on*` handler.
 * - Default ALLOWED_URI_REGEXP rejects `javascript:`, `vbscript:`, and
 *   unsafe `data:` schemes.
 */
export function sanitizeUserHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'template', 'noembed', 'noscript', 'math', 'foreignObject'],
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}
