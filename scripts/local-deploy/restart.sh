#!/usr/bin/env bash
# Restart the launchctl-managed Grove service on macOS.
#
# Adjust PLIST_PATH to match where you installed the plist example.
set -euo pipefail

PLIST_PATH="${PLIST_PATH:-$HOME/Library/LaunchAgents/com.grove.plist}"

if [[ ! -f "$PLIST_PATH" ]]; then
  echo "Error: plist not found at $PLIST_PATH" >&2
  echo "Install it from scripts/local-deploy/com.grove.plist.example first." >&2
  exit 1
fi

launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "grove service reloaded from $PLIST_PATH"
