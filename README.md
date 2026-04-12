# file-viewer

A standalone Node CLI that serves any folder as a web-based document
viewer. Point it at a directory full of notes, docs, or assets, and
get an Angular SPA with live markdown rendering, syntax highlighting,
math, diagrams, and media previews — all static, no database, no
external services.

```bash
npx file-serve ~/Documents/notes
# → http://localhost:3000
```

## Features

- **Markdown + GFM** — tables, task lists, strikethrough, footnotes
- **Syntax highlighting** — 190+ languages via highlight.js
- **Math** — LaTeX rendering via KaTeX (`$inline$` and `$$block$$`)
- **Diagrams** — Mermaid flowcharts, sequence, class, state, ER, C4 …
- **Media previews** — images, video, audio, pdf, svg
- **Anchor navigation** — GFM-style heading IDs with fragment scrolling
- **Internal links** — relative markdown links route via the Angular
  router (no full page reload)
- **External tool integration** — one click to open the current
  folder in Terminal, Zed, or a Claude Code session (macOS; see
  Configuration below)

## Install

```bash
# one-off
npx file-serve <folder>

# globally
npm install -g file-viewer
file-serve <folder>
```

Requires Node 20 or newer.

## Usage

```
file-serve <folder> [options]

Options
  --port <number>   Port to serve on (default: 3000)
  --no-open         Do not auto-open the browser
  -h, --help        Show this help
```

Examples:

```bash
file-serve ~/docs
file-serve ~/docs --port 8080
file-serve . --no-open
```

## Configuration

The CLI is configured entirely through its arguments and a single
environment variable:

- **`ZED_BIN`** — path to the Zed binary for the "Open in Zed" action.
  Defaults to `zed` on `PATH`. Set it if your Zed install is at a
  non-standard location.

Action support by platform:

| Action   | darwin | linux       | win32       |
| -------- | ------ | ----------- | ----------- |
| terminal | yes    | HTTP 501    | HTTP 501    |
| zed      | yes    | yes         | yes         |
| claude   | yes    | HTTP 501    | HTTP 501    |

`terminal` and `claude` currently rely on macOS primitives
(`open -a Terminal`, `osascript` driving Terminal.app). On other
platforms the corresponding buttons are hidden by the frontend and
the API returns 501 if called directly.

## Build from source

```bash
git clone https://github.com/OWNER/file-viewer.git
cd file-viewer
npm ci
(cd frontend && npm ci)
npm run build
node dist/server/bin/file-viewer.js <folder>
```

The build produces a single `dist/` tree with the Express server, the
Angular SPA, and shared types:

```
dist/
├── server/          # Express app + CLI entry
│   ├── bin/file-viewer.js
│   ├── index.js
│   ├── documents.js
│   ├── open.js
│   └── capabilities.js
├── shared/types/    # request/response schemas (zod) shared with frontend
└── frontend/browser # Angular SPA
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full project
layout.

## Local deploy example (macOS)

A launchctl-based deploy example lives under
[`scripts/local-deploy/`](scripts/local-deploy/README.md). It is opt-in
and not required for normal use.

## License

[MIT](LICENSE)
