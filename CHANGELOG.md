# Changelog

All notable changes to Grove are documented here. This file is a
compact index; full per-release narratives live in
[`docs/changes/`](./docs/changes/overview.md).

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Grove aims for [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `GET /api/documents/raw` now sends `Cache-Control: no-store` so
  browsers don't serve stale document bodies to the editor via
  heuristic freshness.

## [0.3.0] — 2026-04-21

In-browser markdown editor (opt-in via `--allow-edits` and
`--git-commit`), `--disable-security` escape hatches starting with
`allow-symlinks`, HTML preview theme passthrough restored, and
several editor UX fixes (click below block widgets, caret in inline
spans, pencil gating, filename extensions, mobile shell).

→ Full notes: [`docs/changes/0.3.0.md`](./docs/changes/0.3.0.md)

## [0.2.0] — 2026-04-20

Sandboxed HTML and SVG previews with a source toggle. DOMPurify
runtime dependency removed in favor of iframe sandboxing.
Tightened `/_content/` CSP (`script-src 'none'`, `object-src 'none'`,
`base-uri 'none'`), dotfile deny, and path-separator-boundary
containment. Iframe sandbox invariant enforced at prepublish.

→ Full notes: [`docs/changes/0.2.0.md`](./docs/changes/0.2.0.md)

## [0.1.0]

Initial release: local markdown wiki over any folder, GFM + KaTeX +
Mermaid + highlight.js + media previews, `grove build-wiki` static
bundle, capability-gated Terminal/Zed/Claude-Code integration.

→ Full notes: [`docs/changes/0.1.0.md`](./docs/changes/0.1.0.md)

## Adding an entry

1. While in flight, add bullets under `## [Unreleased]` above in
   Keep-a-Changelog categories (`Added`, `Changed`, `Fixed`,
   `Removed`, `Security`, `Deprecated`). Keep them short.
2. On release, move that block into a new
   `docs/changes/<version>.md` with expanded narrative, replace
   the `[Unreleased]` body with `_No unreleased changes._`, and
   add a one-paragraph summary + link under `## [<version>]` here.
