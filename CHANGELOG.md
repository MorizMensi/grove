# Changelog

All notable changes to Grove are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); Grove aims for
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **In-browser markdown editor** (see `editor-design.md`), gated
  behind two opt-in CLI flags and surfaced as a pencil toggle on every
  `.md` file.

  *Backend.* `--allow-edits` unlocks a CRUD surface on `/api/documents`
  (`GET /raw` with `mtime`/`ETag`, `PUT` with `If-Unmodified-Since` +
  atomic tmp+rename, `POST` for files and `?kind=dir`, `DELETE` for
  files and empty dirs) behind `requireEdits` + `csrfOrigin`, a 10 MB
  JSON limit, and name validation (`409 parent-missing` on absent
  parents). `server/path-sandbox.ts` consolidates `realpath`-hardened
  containment for every path-consuming handler. `--git-commit`
  produces one `grove: <verb> <rel>` commit per write via
  `execFile('git', […])` with startup validation and "nothing to
  commit" swallowed. Zed integration was removed to free the pencil
  slot.

  *Frontend — editor.* `features/editor/editor.component.ts` hosts a
  CodeMirror 6 `EditorView`; `hybrid-markdown.ts` runs a
  `StateField<DecorationSet>` that hides inline syntax (`**`, `_`,
  `` ` ``, link brackets, heading `#`) outside the caret and reveals
  it when inside — a Typora-style canvas visually identical to view
  mode. `DlBlockWidget` replaces fenced code, tables, images, and
  Mermaid with live `DlNodeComponent` mounts, collapsing to raw source
  when the caret enters the block; math blocks stay raw in v1.
  `SaveService` binds `⌘S`, tracks `mtime`, and on `409` surfaces a
  **Reload / Overwrite / Cancel** banner. A `canDeactivate` guard plus
  `beforeunload` protect dirty buffers.

  *Frontend — shell and a11y.* The pencil toggle is gated on
  `supports.edits`; an `auto-commit` pill appears when
  `supports.gitCommit` is true. The sidebar grows a right-click /
  Shift+F10 context menu (**New file**, **New folder**, **Delete**),
  an inline `+` on directory rows, and a confirm-delete modal with
  focus trap; deleting the open file navigates to the parent and
  announces through a singleton `LiveRegionComponent`. `Alt+N` creates
  a new file (browsers reserve `Cmd+N`); `F2` announces "Rename is not
  available yet". Menu, dialog, and toggle patterns follow WAI-ARIA
  APG, and animations respect `prefers-reduced-motion`.

### Fixed
- HTML preview theme passthrough: the CSP sent with `/_content/*.html`
  and `/_content/*.svg` now includes `sandbox allow-same-origin`.
  Without that token the browser forced the response into an opaque
  origin, which silently blocked the parent page from reading
  `iframe.contentDocument` and injecting theme CSS variables —
  previews rendered with unthemed colors. Scripts remain blocked by
  `script-src 'none'` and by the absence of `allow-scripts` in both
  the iframe `sandbox` attribute and the CSP sandbox directive.
- Editor: clicking a line below a rendered block widget (Mermaid
  diagram, fenced code, table, block image) now places the caret on
  that exact line instead of 5–7 lines further down. Root cause:
  `DlNodeComponent`'s `:host { display: contents }` applied to the
  block widget's host element, giving the host a 0×0 box even while
  its rendered Mermaid SVG occupied ~140 px. CodeMirror's heightmap
  measured 0 and fell back to the widget's `estimatedHeight` (48 px),
  so every line below the widget was located (realHeight −
  estimatedHeight) / line-height ≈ 5–7 lines earlier in the height
  map than in the actual DOM, and `posAtCoords` resolved clicks
  accordingly. Fix scopes a `:host(.cm-dl-widget) { display: block }`
  override in `dl-node.component.scss` so the host becomes a real
  layout box inside the editor. Additional hardening: widget
  `mousedown` branches on top/bottom half (top reveals the source,
  bottom hops past the widget), `ResizeObserver` calls
  `view.requestMeasure()` on host resize, and the widget's vertical
  rhythm uses `padding` rather than `margin`.
- Editor: caret can now be placed inside bold, italic, inline-code,
  and link spans, and Backspace/Delete removes one character instead
  of the entire span. The hybrid-markdown field was contributing its
  whole decoration set to `EditorView.atomicRanges`, so the outer
  `mark` ranges (styling the full `**bold**` / `` `code` `` / etc.)
  were treated as atomic. Only the `hide` (replace) decorations over
  `**`, `_`, `` ` ``, and link brackets are now atomic, so arrow keys
  still skip hidden markers as before.
- Edit pencil now appears on `.md` files again. The
  `DocumentShellComponent.isEditableFile` computed read `mode` as a
  plain field (not a signal), so its memo never invalidated when mode
  transitioned `loading → file` and the pencil stayed hidden if the
  capabilities fetch won the race against the first document load.
- Edit, save, reload-after-conflict, overwrite-after-conflict, and
  delete now pass the actual filename (stem + extension) to the
  server. Previously the shell sent only the URL stem for `.md` files
  (e.g. `path=how-it-works`), so `/api/documents/raw` 404-ed, PUT
  would have silently written to an extensionless sibling, and
  sidebar delete on a listing entry returned 403.
- Mobile document shell (<768px): swapped the two-column grid for a
  single-column flex layout. Sidebar now starts closed and dismisses
  on backdrop/link tap (with proper `aria-label`/`aria-expanded`);
  content fills the viewport; long pages scroll instead of being
  clipped.

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
  provides XSS isolation for user HTML.
- `prepublishOnly` now runs `check:sandbox` before `build:all`.

### Known Issues
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
