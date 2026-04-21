# Getting started

Grove is a single CLI (`grove`) that boots an Express server on
your local machine and serves an Angular SPA rendered from a
folder of markdown (and friends). With `--allow-edits` the same
SPA becomes a Typora-style editor that writes back to the
filesystem.

Requires **Node 20 or newer**.

## Install

```bash
# One-off, no install
npx grovemd ~/notes

# Globally
npm install -g grovemd
grove ~/notes
```

Once installed, the CLI is available as `grove`. The package name
on npm is [`grovemd`](https://www.npmjs.com/package/grovemd) — the
bare `grove` name is held by a dormant package.

## First run (read-only)

```bash
grove ~/notes
```

This:

1. Boots an Express server on `http://localhost:3000`.
2. Opens your default browser at the listing for `~/notes`.
3. Serves markdown, media, and the SPA from the same port.

If no folder is given, Grove defaults to the current directory —
so `cd ~/notes && grove` is the same as `grove ~/notes`.

Without `--allow-edits`, Grove is a read-only viewer. The pencil
toggle, sidebar context menu, and inline `+` affordances never
render, and the server's write routes return `403 edits-disabled`.

## First run (editing)

```bash
grove ~/vault --allow-edits
```

Adds:

- A **pencil toggle** on every `.md` file view (Edit / Done).
- A **right-click / Shift+F10 context menu** on the sidebar
  (New file, New folder, Delete).
- An **inline `+`** on directory rows for creating files quickly.
- A **confirm-delete modal** with focus trap.
- A **singleton polite live region** for screen-reader
  announcements.

Saves are **explicit** — `⌘S` / `Ctrl+S` (or the toolbar save
button) writes atomically to disk. Grove detects concurrent
modifications via `If-Unmodified-Since` and surfaces a
Reload / Overwrite / Cancel banner on 409.

Full walkthrough: [Editing guide](./guides/editing.md).

## First run (editing + git)

```bash
cd ~/vault
git init
git add .
git commit -m "initial"
grove . --allow-edits --git-commit
```

Adds one commit per successful edit:

```
grove: edit docs/2026-04-21.md
grove: create docs/new.md
grove: delete docs/old.md
```

Grove validates the worktree and git identity at startup. If
`user.name` or `user.email` is missing, or `docsDir` isn't inside
a git worktree, Grove exits 1 with an actionable message.

## CLI options

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

Full reference: [CLI reference](./reference/cli.md).

## External tool integration

Grove has two optional action buttons in the header that open the
current folder in an external tool (macOS only):

| Action     | darwin | linux    | win32    |
| ---------- | ------ | -------- | -------- |
| `terminal` | yes    | HTTP 501 | HTTP 501 |
| `claude`   | yes    | HTTP 501 | HTTP 501 |

On non-darwin platforms these buttons are hidden in the UI and
the API returns 501 if called directly.

> Grove's previous Zed integration was removed when the in-browser
> editor landed. The pencil-toolbar slot is now the edit toggle.

## Troubleshooting

- **Port already in use** — pass `--port 8080` (or any other
  free port).
- **Browser doesn't open** — pass `--no-open` and open the URL
  printed in the terminal.
- **Buttons missing** — they're gated by `GET /api/capabilities`,
  which reports what Grove can actually drive on your platform.
  Missing buttons on linux/win32 are expected.
- **Pencil missing** — restart with `--allow-edits`. The pencil is
  gated on `supports.edits`.
- **`--git-commit` refuses to start** — Grove exits 1 with the
  exact git command you need to run. Fix the reported issue (init
  the repo, configure `user.name` / `user.email`) and retry.
- **"/_content/" 404** — that's the raw-file mount. If you moved
  files around while the server was running, refresh the page.

## Next steps

- Read the [usage guide](./usage.md) for a tour of what Grove
  renders.
- Read the [editing guide](./guides/editing.md) for a tour of the
  Typora-style editor, sidebar CRUD, and conflict handling.
- Read [how it works](./how-it-works.md) if you're curious about
  the architecture.
- If you want to host Grove on GitHub Pages for your own repo,
  see [Use Grove for your own wiki](./wiki-for-other-repos.md).
- Hit a problem? → [troubleshooting guide](./guides/troubleshooting.md).

## Reference

- [CLI reference](./reference/cli.md) — every flag
- [HTTP API reference](./reference/http-api.md) — every endpoint
- [Environment variables](./reference/environment.md)
- [File types](./reference/file-types.md) — preview + syntax
  highlighting matrix

## See also

- [Architecture overview](./architecture/overview.md)
- [Editor architecture](./architecture/editor.md)
- [Security model](./architecture/security.md)
- [Self-hosting](./guides/self-hosting.md)
- [Back to docs home](./overview.md)
