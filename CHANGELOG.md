# Changelog

All notable changes to Grove are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); Grove aims for
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Editor Phase 7 polish: the save-conflict banner now offers **Reload**,
  **Overwrite**, and **Cancel** (previously Reload/Dismiss). Overwrite
  re-issues the PUT with the disk's current `mtime` as
  `If-Unmodified-Since`, so the user can intentionally replace external
  changes without leaving edit mode. Added **F2** on sidebar rows as a
  discoverable placeholder — rename is still out of scope for v1, so
  F2 announces "Rename is not available yet" through the live region
  rather than being silently ignored. Added **Alt+N** (Option+N on
  macOS) as the global "new file" shortcut, scoped to the current folder
  when browsing and to the parent folder when viewing a file; `Cmd+N` is
  reserved by the browser for "new window" and cannot be reliably
  intercepted, so Alt+N is the documented binding. All animations and
  transitions already respect `prefers-reduced-motion` via
  `styles/_base.scss` (verified during the Phase 7 audit).
- Editor Phase 6: `--git-commit` opt-in auto-commit. When enabled
  alongside `--allow-edits`, every successful write produces one
  commit in the docs folder's worktree: `grove: edit <rel>` for PUT,
  `grove: create <rel>` for POST of a file, `grove: delete <rel>` for
  DELETE of a file. Empty-directory create/delete is intentionally
  skipped because git does not track empty trees. The server fails
  fast at startup if `docsDir` is not inside a git worktree, if `git`
  is missing from `PATH`, or if `user.name` / `user.email` is not
  configured — each with an actionable message so users never hit a
  silent no-op. Re-saving identical content (which makes `git commit`
  error with "nothing to commit") is swallowed so the save still
  returns `200`. Any other git failure surfaces as `500 git-failed`
  **after** the disk write has already succeeded. A small
  `auto-commit` pill appears in the document shell header (gated on
  `/api/capabilities`) so the mode is visible at a glance. The
  subprocess shape matters: `execFile('git', [...])` with an argv
  array, never a shell.
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
