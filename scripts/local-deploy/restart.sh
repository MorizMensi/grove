#!/usr/bin/env bash
# Restart the launchctl-managed file-viewer service on macOS.
#
# Adjust PLIST_PATH to match where you installed the plist example.
set -euo pipefail

PLIST_PATH="${PLIST_PATH:-$HOME/Library/LaunchAgents/com.file-viewer.plist}"

if [[ ! -f "$PLIST_PATH" ]]; then
  echo "Error: plist not found at $PLIST_PATH" >&2
  echo "Install it from scripts/local-deploy/com.file-viewer.plist.example first." >&2
  exit 1
fi

launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "file-viewer service reloaded from $PLIST_PATH"
