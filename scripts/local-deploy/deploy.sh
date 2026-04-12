#!/usr/bin/env bash
# Build the project and restart the local launchctl service.
# Assumes you have set up the plist (see README.md in this folder).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"

cd "$REPO_ROOT"
npm run build
bash "$HERE/restart.sh"
