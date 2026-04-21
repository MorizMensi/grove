# Changelog

All notable changes to Grove are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); Grove aims for
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Editor Phase 5: create and delete files/folders from the sidebar.
  Right-click (or Shift+F10 on a focused entry) opens a context menu
  with **New file**, **New folder** (on directories and blank space),
  and **Delete** (on entries). An inline `+` affordance appears on
  hover/focus in the sidebar header and on directory rows. Creating a
  file navigates to it and enters edit mode; creating into a missing
  parent surfaces "Create the folder first." Deleting the currently
  open file confirms via modal, then navigates to the parent directory
  and announces "Deleted `<name>`" through the live region. Backed by
  new `POST` and `DELETE` routes on `/api/documents` under the existing
  `--allow-edits` gate with `requireEdits` + `csrfOrigin` middleware,
  name validation (rejects empty, `/`, `\`, NUL, leading `.`, >255
  bytes), and a `409 parent-missing` path so typos can't accidentally
  materialise a deep tree.
- Editor Phase 4: block widgets render fenced code, GFM tables, block
  images, and Mermaid diagrams inline in edit mode. The raw markdown
  source reveals automatically when the caret enters the block's line
  range. Math blocks (`$$…$$`) intentionally stay as raw source per
  editor-design §2.2; revisited for v1.1. Mermaid renders complete
  even if the widget is destroyed mid-render (`MermaidService` has no
  AbortSignal support yet, so a tiny offscreen container can leak on
  rapid destroy — minor, scheduled for the Phase 7 polish pass).

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
