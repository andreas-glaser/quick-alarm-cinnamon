#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

"$REPO_ROOT/tools/build.sh"

target="${CINNAMON_APPLETS_DIR:-$HOME/.local/share/cinnamon/applets}/$UUID"
mkdir -p "$(dirname "$target")"
rm -rf "$target"
cp -a "$APPLET_ROOT" "$target"

echo "Installed to: $target"
echo "Restart Cinnamon (Alt+F2, then 'r') and add the applet from panel settings."

