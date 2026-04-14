# Environment variables

Grove reads exactly one environment variable at runtime. Build
scripts and the example launch agent reference one more each.

<!-- AUTO-GENERATED -->

| Variable | Scope | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `ZED_BIN` | runtime (server) | no | Absolute path to the Zed binary. Overrides the resolver so the `zed` action in `/api/open` uses this exact executable. | `/opt/zed/zed` |
| `PLIST_PATH` | script (local deploy) | no | Override the launchctl plist path used by `scripts/local-deploy/restart.sh`. Defaults to `~/Library/LaunchAgents/com.grove.plist`. | `~/custom/com.grove.plist` |

<!-- /AUTO-GENERATED -->

## `ZED_BIN`

Read by
[`server/zed-resolver.ts`](https://github.com/MorizMensi/grove/blob/main/server/zed-resolver.ts)
during the first call to the resolver (result is cached for the
process lifetime).

When set, the resolver short-circuits and uses the value
verbatim. The capability endpoint reports `supports.zed: true`
without further probing.

### When to set it

- Your Zed install lives in a non-standard location not covered
  by the default candidate list:
  - `/Applications/Zed.app`
  - `~/Applications/Zed.app`
  - `/usr/local/bin/zed`
  - `/opt/homebrew/bin/zed`
  - `~/.local/bin/zed`
- You're running Grove via launchd / systemd / Docker where the
  process `PATH` does not include the Zed binary's directory.
- You want to pin a specific Zed preview build while keeping
  stable Zed elsewhere on `PATH`.

### Example

```bash
ZED_BIN=/opt/zed/zed grove ~/notes
```

Inside a launchctl plist:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>ZED_BIN</key>
  <string>/Applications/Zed.app/Contents/MacOS/zed</string>
</dict>
```

See [guides/self-hosting](../guides/self-hosting.md) for the
full launchctl example.

## `PLIST_PATH`

Only read by `scripts/local-deploy/restart.sh`. Not used by
the Grove runtime itself.

```bash
PLIST_PATH=~/custom/com.grove.plist bash scripts/local-deploy/restart.sh
```

## Build-time environment

None. The Angular build does **not** read env vars; it uses
`fileReplacements` in `angular.json` to swap
`environment.ts` for `environment.wiki.ts` when the `wiki`
configuration is selected. See
[architecture/wiki-mode](../architecture/wiki-mode.md#environment-switch).

## See also

- [HTTP API reference](./http-api.md#get-apicapabilities) — where
  `ZED_BIN` surfaces
- [CLI reference](./cli.md)
- [Guides: self-hosting](../guides/self-hosting.md)
- [Back to reference index](./overview.md)
