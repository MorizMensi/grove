# Changes

Per-release notes for Grove. Each entry is a narrative — what
changed, why, and what to watch out for — rather than a diff list.
The top-level [`CHANGELOG.md`](https://github.com/MorizMensi/grove/blob/main/CHANGELOG.md)
is a compact index that links here.

Grove aims for [SemVer](https://semver.org/spec/v2.0.0.html); format
loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Releases

- **[0.3.0](./0.3.0.md)** — in-browser markdown editor,
  `--disable-security` escape hatches, HTML preview theme
  passthrough, and editor UX fixes.
- **[0.2.0](./0.2.0.md)** — 2026-04-20 — sandboxed HTML and SVG
  previews, DOMPurify removed, tightened `/_content/` CSP and
  path containment.
- **[0.1.0](./0.1.0.md)** — initial release: local markdown wiki,
  `build-wiki` subcommand, capability-gated editor integrations.

## Conventions

- **Categories** follow Keep a Changelog: `Added`, `Changed`,
  `Fixed`, `Removed`, `Security`, `Deprecated`.
- **Audience is humans** — user-visible effect, not diff.
- **Commits** include changelog updates alongside the code change.
- **Workflow.** In-flight changes are staged in the top-level
  `CHANGELOG.md` under `## [Unreleased]`. On release, that block
  is moved into a new file here and `CHANGELOG.md` keeps only a
  one-line pointer.
