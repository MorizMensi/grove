# Troubleshooting

Common problems and how to resolve them. For a broader feature
overview see [usage](../usage.md); for mechanical detail see
[reference/http-api](../reference/http-api.md) and
[reference/cli](../reference/cli.md).

## Install / boot

### "Port already in use"

```
Error: listen EADDRINUSE: address already in use :::3000
```

Another process is bound to the port. Either stop it, or pass
`--port`:

```bash
grove ~/notes --port 8080
```

See [CLI reference](../reference/cli.md#grove-folder-options).

### "<path> does not exist" / "<path> is not a directory"

The CLI refuses to boot if the folder doesn't exist or isn't a
directory. Double-check the argument; `grove` with no argument
defaults to `.` (the current working directory).

### Browser does not open

Pass `--no-open` and open the URL manually. Grove prints the URL
on boot:

```
Grove serving "/Users/you/notes"
Open http://localhost:3000
```

The auto-open step uses `open` (macOS), `start` (Windows), or
`xdg-open` (everything else). On headless Linux you typically
want `--no-open`.

## Action buttons

### Terminal / Claude buttons missing

They are **hidden on non-darwin platforms**. The capability
endpoint reports `supports.terminal: false` and
`supports.claude: false` on linux/win32. Nothing is broken —
Grove's macOS-only shell integration is not ported yet.

See [architecture/security#external-tools](../architecture/security.md#external-tools).

### Zed button missing

`GET /api/capabilities` returned `supports.zed: false`. That
means the Zed resolver couldn't verify an install at any of the
candidate locations:

1. `ZED_BIN` env var
2. `/Applications/Zed.app` or `~/Applications/Zed.app` (darwin)
3. `/usr/local/bin/zed`
4. `/opt/homebrew/bin/zed`
5. `~/.local/bin/zed`

Fix: install Zed, or set `ZED_BIN` to the exact binary path.
See [reference/environment#zed_bin](../reference/environment.md#zed_bin).

### Zed button present but 500

```json
{ "error": "Failed to open: spawn zed ENOENT — Zed not found. Install Zed or set the ZED_BIN env var." }
```

The **bare fallback** was hit because nothing else verified.
The button appears only when a verified path exists, so this
usually means a Zed install was removed between capability
probe and click. Refresh the page.

### Claude button 501

```json
{ "error": "Action \"claude\" is not supported on platform \"linux\"." }
```

The capability endpoint should have hidden the button. If it
didn't, your browser is showing a stale page — refresh.

## Content display

### Internal links 404

Symptoms: clicking `[other](./other.md)` either reloads the page
or lands on a "Document not found" screen.

Causes to check:

1. **The link target doesn't exist.** Relative links resolve
   against the folder containing the current file, not against
   the file itself. A link from `docs/index.md` to `./usage.md`
   resolves to `docs/usage.md`, not `docs/index.md/usage.md`.
2. **The extension isn't `.md`.** Grove strips `.md` before
   routing but keeps other extensions via `?extension=<ext>`.
   A link to `./diagram.svg` becomes `/diagram?extension=svg`.
3. **The path uses an unsafe URL.** `javascript:`, `data:`,
   `file:`, and `vbscript:` are rejected by the URL filter and
   emitted as plain text instead of a link. See
   [architecture/security](../architecture/security.md#the-url-filter).

### Mermaid diagrams show empty boxes

The `MermaidService` initializes with
`securityLevel: 'strict'`. That blocks:

- `click` event handlers inside diagrams
- HTML-string labels (you can use plain text or escaped HTML
  entities instead)

If the diagram rendered to `null` (the SVG container is empty),
the mermaid parser threw. Check the fence content with the
`mermaid` CLI offline or paste it into the mermaid live editor.

### Code blocks aren't highlighted

Grove only ships grammars for:

```
json, typescript (ts), javascript (js), xml (html), css,
bash (sh/shell), python (py), java, yaml (yml), sql
```

Everything else renders as plain monospace code, which is
intentional — it keeps the bundle small. See
[reference/file-types#syntax-highlighting-grammars](../reference/file-types.md#syntax-highlighting-grammars)
for how to add one.

### Math doesn't render

You're probably using LaTeX syntax that KaTeX doesn't support.
KaTeX covers the majority of LaTeX math but not all of it —
check the
[KaTeX supported functions list](https://katex.org/docs/supported).

Math rendering is wrapped in `throwOnError: false`, so failures
fall back to the raw source string. If you see literal `$…$`
in your output, the parser decided the input wasn't math; check
the spacing around the `$` markers.

### Heading anchors don't scroll

The document shell retries `getElementById(fragment)` for up to
2 seconds after navigation, because markdown is parsed
asynchronously. If the fragment still doesn't scroll:

- The heading slug rules are GitHub-compatible: lowercase,
  spaces to hyphens, strip non-alphanumerics. `## My Section!`
  → `my-section`. Case mismatch in the link will fail.
- Duplicate headings get `-1`, `-2`, … suffixes in document
  order.

See [architecture/frontend#anchor-navigation](../architecture/frontend.md#anchor-navigation).

## Wiki deployment

### Pages deploy fails with "Pages not enabled"

Enable Pages in your repo: Settings → Pages → Source:
GitHub Actions. Re-run the workflow.

### Pages deploy fails with "not supported"

Your repo is private on a free GitHub plan, which doesn't
include Pages. Either make the repo public or upgrade.

### Wiki renders but links are broken

`base-href` doesn't match the Pages URL. Default is
`/<repo-name>/`; override with the `base-href` input:

```yaml
with:
  docs: docs
  base-href: /custom-path/
```

See [wiki-for-other-repos](../wiki-for-other-repos.md) and
[architecture/wiki-mode](../architecture/wiki-mode.md).

### "Failed to fetch manifest"

Your `docs/` folder was empty or missing at build time. Check
the workflow log for the `grove build-wiki` error.

## Development

### `npm run build` fails with TypeScript errors

Both the server and frontend builds run with `strict: true`.
Type errors block CI; they block merges too. Fix them rather
than suppressing them.

Common traps:

- `shared/types/` is imported into both roots via different
  resolution mechanisms (relative on server, alias on frontend).
  Adding a new shared type requires nothing extra — the aliases
  are already configured — but adding a runtime value there
  will only work on the server.

### `dist/frontend/wiki/index.html` missing

You ran `grove build-wiki` without running `npm run build:all`
first. The wiki subcommand reads the pre-built wiki bundle from
`dist/frontend/wiki/` and fails loudly if it's missing.

### The launchctl agent won't start

Check `launchctl list | grep grove` and
`Console.app` → `log show` for the error. Common causes:

- Wrong path in `ProgramArguments` — must be an absolute path
  to `dist/server/bin/file-viewer.js`.
- Permissions on the docs folder.
- Port already in use.

See [self-hosting](./self-hosting.md).

## Related

- [Getting started](../getting-started.md)
- [Usage](../usage.md)
- [HTTP API reference](../reference/http-api.md)
- [Environment variables](../reference/environment.md)
- [Security model](../architecture/security.md)
- [Back to guides index](./index.md)
