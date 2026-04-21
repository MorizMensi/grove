# Grove

**A local markdown wiki — and now editor — for any folder.**

Point Grove at a directory full of notes, docs, or assets and it turns
the folder into a browseable Angular SPA with live markdown rendering,
syntax highlighting, math, diagrams, and media previews. Pass
`--allow-edits` and the same surface becomes a Typora-style hybrid
editor that writes back to the filesystem. No database, no cloud, no
auth — a single-user localhost tool that keeps every note as a stone in
your cairn.

```bash
npx grovemd ~/Documents/notes
# → http://localhost:3000
```

> Grove is published on npm as [`grovemd`](https://www.npmjs.com/package/grovemd)
> (the unscoped name `grove` is held by a dormant package — we're working
> on it). The installed CLI is named `grove`.

## Documentation

The full Grove wiki is hosted at **<https://morizmensi.github.io/grove/>** —
served by Grove itself, the exact same renderer you get when you
`npx grovemd` your own folder.

- [Getting started](https://morizmensi.github.io/grove/getting-started)
- [Usage](https://morizmensi.github.io/grove/usage)
- [Editing guide](https://morizmensi.github.io/grove/guides/editing)
- [How it works](https://morizmensi.github.io/grove/how-it-works)
- [Contributing](https://morizmensi.github.io/grove/contributing)
- [Use Grove for your own wiki](https://morizmensi.github.io/grove/wiki-for-other-repos)
- [Architecture overview](https://morizmensi.github.io/grove/architecture/overview)

## Features

### Rendering

- **Markdown + GFM** — tables, task lists, strikethrough, footnotes
- **Syntax highlighting** — 190+ languages via highlight.js
- **Math** — LaTeX rendering via KaTeX (`$inline$` and `$$block$$`)
- **Diagrams** — Mermaid flowcharts, sequence, class, state, ER, C4 …
- **Media previews** — images, video, audio, PDF, SVG, and sandboxed
  HTML previews with theme passthrough
- **Anchor navigation** — GFM-style heading IDs with fragment scrolling
- **Internal links** — relative markdown links route via the Angular
  router (no full page reload)

### Editing (opt-in)

- **In-browser Typora-style editor** — a single canvas identical to
  view mode. Inline syntax (`**`, `_`, `` ` ``, `[link](url)`, heading
  `#`) reveals only when the caret enters the span. Block widgets for
  fenced code, tables, Mermaid, and images render live inside the
  buffer and collapse to raw source when the caret enters their range.
- **Explicit save** — `⌘S` / `Ctrl+S` writes atomically to disk. No
  auto-save, no churn. Conflict detection via `If-Unmodified-Since`
  with a **Reload / Overwrite / Cancel** banner on 409.
- **Sidebar CRUD** — right-click (or Shift+F10) a sidebar row for
  **New file**, **New folder**, **Delete**. Inline `+` on directory
  rows for hover and keyboard users. Focus-trapped confirm-delete
  modal.
- **Git auto-commit** — `--git-commit` writes one
  `grove: <verb> <rel>` commit per successful edit. Startup validates
  the worktree and git identity so flags never silently no-op.
- **Accessibility** — toggle button with `aria-pressed`, `role="menu"`
  context menu, `role="dialog"` confirm modal with focus trap, singleton
  polite live region. WAI-ARIA APG patterns throughout.

### Integrations (macOS)

- **Open in Terminal** — spawns `open -a Terminal <dir>` on the
  current folder.
- **Open in Claude Code** — drives Terminal.app via `osascript` to
  `cd <dir> && claude`.

> Zed integration was removed in the editor release. The pencil
> toolbar slot is now the edit-mode toggle.

## Quick start

```bash
# Read-only viewer — safe default
npx grovemd ~/Documents/notes

# Enable in-browser editing
npx grovemd ~/Documents/notes --allow-edits

# Editing plus one commit per save (docs folder must be a git worktree)
cd ~/notes && git init && git add . && git commit -m "initial"
npx grovemd . --allow-edits --git-commit
```

## Install

```bash
# one-off
npx grovemd <folder>

# globally
npm install -g grovemd
grove <folder>
```

Requires Node 20 or newer.

## Usage

```
grove [folder] [options]

Options
  --port <number>           Port to serve on (default: 3000)
  --no-open                 Do not auto-open the browser
  --allow-edits             Enable in-browser editing of .md files
  --git-commit              Commit every successful write (requires
                            --allow-edits and a docs folder inside a
                            git worktree)
  --disable-security <csv>  UNSAFE. Disable named safety checks.
                            Comma-separated; may be repeated.
                            Valid values: allow-symlinks
  -h, --help                Show this help
```

Examples:

```bash
grove ~/docs
grove ~/docs --port 8080
grove . --no-open
grove ~/vault --allow-edits
grove ~/vault --allow-edits --git-commit
grove ~/vault --allow-edits --disable-security allow-symlinks
```

The edit surface is gated by `--allow-edits` at the middleware level.
Without the flag, every `PUT/POST/DELETE` on `/api/documents` returns
`403 edits-disabled` — the UI pencil is cosmetic, not load-bearing.

## Configuration

Grove is configured entirely through its CLI arguments. No
configuration files. Environment variables are used only by opt-in
scripts (see [docs/reference/environment](docs/reference/environment.md)).

### Action support by platform

| Action   | darwin | linux    | win32    |
| -------- | ------ | -------- | -------- |
| terminal | yes    | HTTP 501 | HTTP 501 |
| claude   | yes    | HTTP 501 | HTTP 501 |
| edits    | yes    | yes      | yes      |

`terminal` and `claude` rely on macOS primitives (`open -a Terminal`,
`osascript` driving Terminal.app). On other platforms the buttons are
hidden by the frontend and the API returns 501 if called directly.
Editing works on every platform Node 20 runs on.

## Use Grove as your wiki

Grove can render **any repo's `docs/` folder** as a static wiki on
GitHub Pages. Add this single workflow to your repo:

```yaml
# .github/workflows/docs.yml
name: docs
on:
  push:
    branches: [main]
    paths: [docs/**]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  wiki:
    uses: MorizMensi/grove/.github/workflows/build-wiki.yml@main
    with:
      docs: docs
      site-name: My Cool Library   # optional — defaults to the repo name
```

Then enable GitHub Pages in **Settings → Pages → Source: GitHub Actions**
and push a commit that touches `docs/`. Full walkthrough:
[wiki-for-other-repos](https://morizmensi.github.io/grove/wiki-for-other-repos).

The wiki build always produces a **read-only** bundle — no write routes
ship into the static output, and `/api/capabilities` is replaced with
a compile-time constant returning `supports.edits = false`.

## Security model (short version)

Grove is designed for **localhost, single-user** use. It still enforces
trust boundaries so that a hostile tab cannot exfiltrate or corrupt
files behind your back:

- **Path containment** — every user path flows through `ensureInside()`
  (`server/path-sandbox.ts`), which uses `realpath` to block symlink
  escapes and requires a path-separator boundary so `/foo` doesn't
  match `/foobar`. NUL bytes → 403.
- **Edits gate** — `requireEdits(allowEdits)` middleware short-circuits
  `PUT/POST/DELETE` with `403 edits-disabled` when the flag is absent.
  Browser tabs can't flip it.
- **CSRF** — `csrfOrigin` middleware compares `Origin` host to `Host`
  on every state-changing verb. Mismatch → `403 bad-origin`.
- **Per-route body parser** — no app-level `express.json()`. PUT caps
  at 10 MB JSON; non-JSON bodies are rejected with 415.
- **Dotfile deny on `/_content/`** — `dotfiles: 'deny'` with
  `fallthrough: false` so the 403 isn't masked by the SPA catch-all.
- **Iframe sandbox invariant** — HTML previews use
  `sandbox="allow-same-origin"` and **never** `allow-scripts`. Enforced
  at prepublish by `scripts/check-sandbox-invariant.mjs`.
- **External tools use `execFile`** with an args array. The `claude`
  action on macOS is the one string-building exception (AppleScript
  requires it); the containment check is the load-bearing safety.
- **URL safety** — `isSafeUrl` is called four times per render. Allowed
  schemes: `http(s)://`, `mailto:`. Relative URLs, fragments, and
  scheme-less strings pass.

Full treatment: [docs/architecture/security](docs/architecture/security.md).

## Build from source

```bash
git clone https://github.com/MorizMensi/grove.git
cd grove
npm ci
(cd frontend && npm ci)
npm run build
node dist/server/bin/file-viewer.js <folder>
```

The build produces a single `dist/` tree:

```
dist/
├── server/                 # Express app + CLI entry
│   ├── bin/file-viewer.js  # `grove` binary entry point
│   ├── index.js            # createApp()
│   ├── documents.js        # /api/documents GET/PUT/POST/DELETE
│   ├── open.js             # /api/open
│   ├── capabilities.js     # /api/capabilities
│   ├── path-sandbox.js     # realpath-hardened containment
│   ├── edits-middleware.js # requireEdits + csrfOrigin
│   ├── fs-atomic.js        # tmp+rename writes
│   ├── git.js              # --git-commit auto-commits
│   └── wiki/               # grove build-wiki subcommand
├── shared/                 # request/response schemas shared with frontend
└── frontend/
    ├── browser/            # Angular SPA (server mode)
    └── wiki/               # Angular SPA (wiki-bundle mode)
```

See [docs/architecture/overview.md](docs/architecture/overview.md)
(or the
[hosted version](https://morizmensi.github.io/grove/architecture/overview))
for the full project layout.

## Testing

```bash
npm test              # server + frontend
npm run test:server   # node --test with tsx loader
npm run test:frontend # Karma + Jasmine + ChromeHeadless
npm run check:sandbox # iframe sandbox invariant (prepublish gate)
```

Server tests live beside the module they cover (`*.test.ts`); frontend
specs are co-located with source (`*.spec.ts`). New features are
expected to land with tests — see the
[contributing guide](docs/contributing.md).

## Local deploy example (macOS)

A launchctl-based deploy example lives under
[`scripts/local-deploy/`](scripts/local-deploy/README.md). It is opt-in
and not required for normal use.

## License

[MIT](LICENSE)
