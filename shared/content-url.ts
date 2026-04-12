/**
 * URL path prefix used to serve the raw docs directory from Grove's HTTP
 * surface. Deliberately underscore-prefixed so it never collides with
 * user-chosen route names.
 *
 * Used by:
 *   - server/index.ts       (Express static mount)
 *   - server/wiki/build.ts  (CLI output directory structure)
 *   - frontend/src/app/core/services/document.service.ts (raw file fetch)
 *   - frontend/src/app/features/document-shell/document-shell.component.ts (media URLs)
 */
export const CONTENT_URL_PREFIX = '_content';
