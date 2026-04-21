# Environment variables

Grove reads **no environment variables at runtime**. Every runtime
setting is a CLI flag.

One script in the repo references one variable.

<!-- AUTO-GENERATED -->

| Variable | Scope | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `PLIST_PATH` | script (local deploy) | no | Override the launchctl plist path used by `scripts/local-deploy/restart.sh`. Defaults to `~/Library/LaunchAgents/com.grove.plist`. | `~/custom/com.grove.plist` |

<!-- /AUTO-GENERATED -->

## Why so few?

Grove is a single-user localhost tool. Every knob that affects
behaviour on a given run is a CLI flag so the invocation is
self-documenting:

```bash
grove ~/vault --allow-edits --git-commit --port 7777
```

You can read what a Grove process is doing from `ps` or your shell
history without reaching into the environment. The
[CLI reference](./cli.md) is the exhaustive list of runtime knobs.

## Removed variables

### `ZED_BIN`

Previously used to override the Zed binary location for the
"Open in Zed" action. **Removed** when Zed integration was retired
in favour of the in-browser editor. The Zed slot in the toolbar is
now the edit-mode pencil toggle.

If you had `ZED_BIN` set in a launchd plist or shell profile, it is
harmlessly ignored — the value is no longer read.

## `PLIST_PATH`

Only read by `scripts/local-deploy/restart.sh`. Not used by the
Grove runtime itself.

```bash
PLIST_PATH=~/custom/com.grove.plist bash scripts/local-deploy/restart.sh
```

See [guides/self-hosting](../guides/self-hosting.md) for the full
launchctl deploy example.

## Build-time environment

None. The Angular build does **not** read env vars; it uses
`fileReplacements` in `angular.json` to swap
`environment.ts` for `environment.wiki.ts` when the `wiki`
configuration is selected. See
[architecture/wiki-mode](../architecture/wiki-mode.md#environment-switch).

The server `tsc` build reads nothing other than `tsconfig.json` and
its inputs.

## `git` subprocess environment

When `--git-commit` is on, Grove spawns `git` with
`execFile('git', […], { cwd: docsDir, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })`.

`GIT_TERMINAL_PROMPT=0` is set unconditionally on every git
invocation so a misconfigured credential helper cannot wedge the
server process by popping an interactive prompt. Grove only runs
local operations (`add`, `commit`, `rev-parse`, `config --get`) so
no credential flow should ever be triggered — the env var is a
defence-in-depth belt.

## See also

- [CLI reference](./cli.md) — every runtime knob
- [Guides: self-hosting](../guides/self-hosting.md) — launchctl plist
- [Back to reference index](./overview.md)
