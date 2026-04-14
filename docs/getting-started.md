# Getting started

Grove is a single CLI (`grove`) that boots an Express server on
your local machine and serves an Angular SPA rendered from a
folder of markdown (and friends).

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

## First run

```bash
grove ~/notes
```

This:

1. Boots an Express server on `http://localhost:3000`
2. Opens your default browser at the listing for `~/notes`
3. Serves markdown, media, and the SPA from the same port

If no folder is given, Grove defaults to the current directory —
so `cd ~/notes && grove` is the same as `grove ~/notes`.

## CLI options

```
grove [folder] [options]

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

## External tool integration

Grove has three optional action buttons in the header that open the
current folder (or file) in an external tool:

| Action     | darwin | linux    | win32    |
| ---------- | ------ | -------- | -------- |
| `terminal` | yes    | HTTP 501 | HTTP 501 |
| `zed`      | yes    | yes      | yes      |
| `claude`   | yes    | HTTP 501 | HTTP 501 |

On non-darwin platforms the `terminal` and `claude` buttons are
hidden in the UI and the API returns 501 if called directly.

The `zed` action uses `zed` on `$PATH` by default. Set the
`ZED_BIN` environment variable if your Zed binary lives elsewhere:

```bash
ZED_BIN=/opt/zed/zed grove ~/notes
```

## Troubleshooting

- **Port already in use** — pass `--port 8080` (or any other
  free port).
- **Browser doesn't open** — pass `--no-open` and open the URL
  printed in the terminal.
- **Buttons missing** — they're gated by `GET /api/capabilities`,
  which reports what Grove can actually drive on your platform.
  Missing buttons on linux/win32 are expected.
- **"docs" button mounted at /_content 404** — that's the raw-file
  mount. If you moved files around while the server was running,
  refresh the page.

## Next steps

- Read the [usage guide](./usage.md) for a tour of what Grove
  renders.
- Read [how it works](./how-it-works.md) if you're curious about
  the architecture.
- If you want to host Grove on GitHub Pages for your own repo,
  see [Use Grove for your own wiki](./wiki-for-other-repos.md).
- Hit a problem? → [troubleshooting guide](./guides/troubleshooting.md).

## Reference

- [CLI reference](./reference/cli.md) — every flag
- [HTTP API reference](./reference/http-api.md) — every endpoint
- [Environment variables](./reference/environment.md) — `ZED_BIN`
- [File types](./reference/file-types.md) — preview + syntax
  highlighting matrix

## See also

- [Architecture overview](./architecture/overview.md)
- [Self-hosting](./guides/self-hosting.md)
- [Back to docs home](./overview.md)
