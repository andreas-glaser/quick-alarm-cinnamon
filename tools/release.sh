#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

"$REPO_ROOT/tools/build.sh"
mkdir -p "$DIST_DIR"

archive="$DIST_DIR/${UUID}.zip"
rm -f "$archive"

(cd "$REPO_ROOT/applet" && zip -r "$archive" "$UUID" >/dev/null)
echo "Release archive: $archive"

