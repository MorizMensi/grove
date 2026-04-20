# Changelog

All notable changes to Grove are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); Grove aims for
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Mobile sidebar behavior in the document shell: sidebar now starts
  closed on viewports below 768px, closes on backdrop tap and on
  sidebar link tap, and the toggle button is fixed, visible, and
  accessible (`aria-label`/`aria-expanded` reflect state).
- Mobile content width: the file view switches from a two-column grid
  to a single-column flex column on mobile so the content fills the
  full viewport instead of collapsing into a narrow column. Doubled
  padding on `.document-shell` was removed.
- Mobile scrolling on file pages: the content area now scrolls on
  viewports below 768px. The prior mobile layout used `display: block`,
  which left `.wiki-content` without a height context so `overflow-y: auto`
  never activated and long documents were silently clipped by the shell.
  The mobile layout is now a flex column with `.wiki-content` taking the
  remaining height.

## [0.2.0] — 2026-04-20

### Added
- HTML and SVG file previews with a source/preview toggle. HTML renders
  inside a sandboxed iframe that inherits the active Grove theme via
  CSS-custom-property injection; SVG previews as an image with source-view
  fenced-code fallback.

### Security
- `/_content/` HTML and SVG responses now ship with
  `Content-Security-Policy: sandbox; script-src 'none'; object-src 'none'; base-uri 'none'`
  and `X-Content-Type-Options: nosniff`.
- `/_content/` static mount now refuses dotfiles (403 on `.env`,
  `.git/config`, etc. under the consumer's docs root). Trade-off:
  `.well-known/` and similar under docsDir are no longer served.
- Path-containment checks in the documents and open routers now require
  an explicit path-separator boundary, closing a sibling-directory
  prefix-bypass (e.g. `/foo` vs `/foobar`).
- The iframe sandbox invariant (`allow-same-origin`, never
  `allow-scripts`) is now enforced at prepublish by
  `scripts/check-sandbox-invariant.mjs`, replacing an orphan Jasmine spec
  that was never wired to a test runner.

### Changed
- Removed the DOMPurify runtime dependency. Iframe sandboxing now
  provides XSS isolation for user HTML; `sanitize-user-html.ts`,
  `rewrite-user-html.ts`, and `HtmlPreviewComponent` have been removed.
- `prepublishOnly` now runs `check:sandbox` before `build:all`.

### Known Issues
- Mermaid bundles DOMPurify 3.3.3 transitively
  ([GHSA-39q2-94rc-95cp](https://github.com/advisories/GHSA-39q2-94rc-95cp),
  moderate). Grove does not invoke the affected API; resolution requires
  an upstream Mermaid update.
- `@angular/core` at the `^19.2.0` range carries
  [GHSA-g93w-mfhg-p222](https://github.com/advisories/GHSA-g93w-mfhg-p222)
  (XSS via i18n attribute bindings). Grove does not use Angular i18n
  attribute bindings on user-controlled data. Patch requires an Angular
  19.3+ bump deferred to a future release.

## [0.1.0] — Initial release
- Local Markdown wiki for any folder; renders GFM, math (KaTeX), Mermaid
  diagrams, syntax highlighting, and media (image/video/audio/PDF).
- `grove build-wiki` subcommand builds a static GitHub-Pages-ready wiki.
- Capability-gated Terminal/Zed/Claude-Code integration buttons.
