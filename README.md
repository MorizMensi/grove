# Grove

**A local markdown wiki for any folder.**

Point Grove at a directory full of notes, docs, or assets and it turns
the folder into a browseable Angular SPA with live markdown rendering,
syntax highlighting, math, diagrams, and media previews — all static,
no database, no external services, no cloud. Every note is a stone;
your folder is the cairn.

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
- [How it works](https://morizmensi.github.io/grove/how-it-works)
- [Contributing](https://morizmensi.github.io/grove/contributing)
- [Use Grove for your own wiki](https://morizmensi.github.io/grove/wiki-for-other-repos)
- [Architecture reference](https://morizmensi.github.io/grove/ARCHITECTURE)

## Features today

- **Markdown + GFM** — tables, task lists, strikethrough, footnotes
- **Syntax highlighting** — 190+ languages via highlight.js
- **Math** — LaTeX rendering via KaTeX (`$inline$` and `$$block$$`)
- **Diagrams** — Mermaid flowcharts, sequence, class, state, ER, C4 …
- **Media previews** — images, video, audio, pdf, svg
- **Anchor navigation** — GFM-style heading IDs with fragment scrolling
- **Internal links** — relative markdown links route via the Angular
  router (no full page reload)
- **External tool integration** — one click to open the current folder
  in Terminal, Zed, or a Claude Code session (macOS; see Configuration
  below)

## Roadmap

Grove starts as a viewer. The plan is to grow it into a lightweight
local-first editor in the Obsidian family, one feature at a time:

- [ ] In-browser markdown editor (CodeMirror 6) with live preview
- [ ] Save-on-blur / keybinding writes back to the filesystem
- [ ] `[[wikilinks]]` resolver and back-references pane
- [ ] Simple graph view of the vault
- [ ] Daily notes / template snippets
- [ ] In-app command palette / quick switcher

If any of this sounds interesting, open an issue — it's the fastest
way to nudge the order.

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
grove <folder> [options]

Options
  --port <number>   Port to serve on (default: 3000)
  --no-open         Do not auto-open the browser
  -h, --help        Show this help
```

Examples:

```bash
grove ~/docs
grove ~/docs --port 8080
grove . --no-open
```

## Configuration

Grove is configured entirely through its arguments and a single
environment variable:

- **`ZED_BIN`** — path to the Zed binary for the "Open in Zed" action.
  Defaults to `zed` on `PATH`. Set it if your Zed install is at a
  non-standard location.

Action support by platform:

| Action   | darwin | linux    | win32    |
| -------- | ------ | -------- | -------- |
| terminal | yes    | HTTP 501 | HTTP 501 |
| zed      | yes    | yes      | yes      |
| claude   | yes    | HTTP 501 | HTTP 501 |

`terminal` and `claude` currently rely on macOS primitives
(`open -a Terminal`, `osascript` driving Terminal.app). On other
platforms the corresponding buttons are hidden by the frontend and the
API returns 501 if called directly.

## Build from source

```bash
git clone https://github.com/MorizMensi/grove.git
cd grove
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

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (or the
[hosted version](https://morizmensi.github.io/grove/ARCHITECTURE)) for the
full project layout.

## Local deploy example (macOS)

A launchctl-based deploy example lives under
[`scripts/local-deploy/`](scripts/local-deploy/README.md). It is opt-in
and not required for normal use.

## License

[MIT](LICENSE)
