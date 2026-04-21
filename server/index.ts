import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentsRouter } from './documents.js';
import { openRouter } from './open.js';
import { capabilitiesRouter } from './capabilities.js';
import { CONTENT_URL_PREFIX } from '../shared/content-url.js';
import type { DisabledSecuritySet } from './security-options.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export interface CreateAppOptions {
  /** Enables `PUT/POST/DELETE /api/documents` gated by `requireEdits`. */
  allowEdits?: boolean;
  /** Enables one commit per successful write. */
  gitCommit?: boolean;
  /**
   * Named security features to disable. See `security-options.ts` for
   * the list of valid flags. Empty / undefined keeps all checks on.
   */
  disabledSecurity?: DisabledSecuritySet;
}

export function createApp(
  docsDir: string,
  options: CreateAppOptions = {},
): express.Application {
  const app = express();

  // Per-route body parsers — see documents.ts (10mb on PUT) and
  // open.ts (default 100kb on POST). No app-level `express.json()` so
  // each route declares its own limit, and size-cap policy is visible
  // at the route definition rather than buried in app setup.

  // API routes
  app.use(
    '/api/documents',
    documentsRouter(docsDir, {
      allowEdits: options.allowEdits,
      gitCommit: options.gitCommit,
      disabledSecurity: options.disabledSecurity,
    }),
  );
  app.use('/api/open', openRouter(docsDir, { disabledSecurity: options.disabledSecurity }));
  app.use(
    '/api/capabilities',
    capabilitiesRouter({
      allowEdits: options.allowEdits,
      gitCommit: options.gitCommit,
    }),
  );

  // Serve Angular frontend
  // __dirname = dist/server/, frontend build = dist/frontend/browser/
  const frontendDir = join(__dirname, '../frontend/browser');
  app.use(express.static(frontendDir));

  // Serve documents directory for raw file content fetching (internal namespace).
  //
  // SECURITY:
  // - dotfiles: 'deny' — 403 on .env, .git/config, etc. under the docs root.
  // - setHeaders: add a strict CSP and X-Content-Type-Options on HTML/SVG
  //   responses. The iframe preview path carries its own
  //   sandbox="allow-same-origin" attribute; this header hardens direct URL
  //   access so a raw visit to /_content/foo.html cannot execute scripts.
  //   Other file types (images, video, audio, markdown, etc.) get no extra
  //   headers — they already render safely in the browser with the native
  //   Content-Type.
  //
  //   The CSP sandbox directive MUST include `allow-same-origin`. Without
  //   that token the response is forced into an opaque origin, which in
  //   turn blocks the parent document from reading `iframe.contentDocument`
  //   — breaking the theme-variable passthrough in
  //   frontend/.../html-theme-injection.ts. Scripts remain blocked by
  //   `script-src 'none'` and by the absence of `allow-scripts` in both
  //   the iframe attribute and this sandbox directive.
  app.use(`/${CONTENT_URL_PREFIX}`, express.static(docsDir, {
    redirect: false,
    dotfiles: 'deny',
    // fallthrough: false forwards errors (including the 403 from
    // dotfiles:'deny') to the Express error handler instead of calling
    // next() — otherwise the Angular catch-all below would serve
    // index.html for /_content/.env, turning the 403 into a 200.
    fallthrough: false,
    setHeaders: (res, filePath) => {
      if (/\.(html?|svg)$/i.test(filePath)) {
        res.setHeader(
          'Content-Security-Policy',
          "sandbox allow-same-origin; script-src 'none'; object-src 'none'; base-uri 'none'",
        );
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    },
  }));

  // Angular catch-all for client-side routing
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(frontendDir, 'index.html'));
  });

  return app;
}
