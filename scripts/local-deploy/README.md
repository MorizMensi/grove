# Local deploy (macOS / launchctl example)

The `file-viewer` binary is a plain Node CLI — you can run it any way you
like (`npx file-serve ~/Docs`, a shell alias, a systemd unit, a PM2 entry,
etc.). This folder contains an **example** of how the original author runs
it as a persistent background service on macOS using `launchctl`. It is
deliberately not part of the published package or the top-level npm
scripts, so nothing here runs unless you opt in.

## Contents

- `com.file-viewer.plist.example` — template launchctl agent plist
- `restart.sh` — unload + load the agent (reads `PLIST_PATH` env var)
- `deploy.sh` — `npm run build` then `restart.sh`

## Install the launch agent

1. Copy the example and edit the paths:

   ```bash
   cp scripts/local-deploy/com.file-viewer.plist.example \
      ~/Library/LaunchAgents/com.file-viewer.plist
   $EDITOR ~/Library/LaunchAgents/com.file-viewer.plist
   ```

2. Replace the two `/ABSOLUTE/PATH/TO/...` strings with:
   - the path to `dist/server/bin/file-viewer.js` in your local clone,
   - the path to the folder you want to serve.

3. Optionally set `ZED_BIN` inside the `EnvironmentVariables` dict if you
   want the "open in Zed" action to use a non-default path.

4. Load it:

   ```bash
   launchctl load ~/Library/LaunchAgents/com.file-viewer.plist
   ```

5. Visit `http://localhost:3000` (or whichever port you chose).

## Day-to-day

After pulling new code you can rebuild and reload in one shot:

```bash
bash scripts/local-deploy/deploy.sh
```

Override the plist location with `PLIST_PATH=/some/other/path bash
scripts/local-deploy/restart.sh` if you installed it somewhere else.

## Not on macOS?

- **Linux / systemd**: write a user-level unit that runs
  `node /path/to/dist/server/bin/file-viewer.js /path/to/docs --port 3000
  --no-open`.
- **Windows**: use Task Scheduler, NSSM, or run it under `pm2`.
- **Docker**: `npm run build`, copy `dist/` into an image based on
  `node:20-alpine`, set `CMD` to the same invocation.

The CLI itself has no macOS-specific dependencies.
