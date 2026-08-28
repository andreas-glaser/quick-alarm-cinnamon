#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=tools/config.sh
source "$(dirname "$0")/config.sh"

"$REPO_ROOT/tools/build.sh"

applets_dir="${CINNAMON_APPLETS_DIR:-$HOME/.local/share/cinnamon/applets}"
if [[ "$applets_dir" != /* ]]; then
  echo "CINNAMON_APPLETS_DIR must be an absolute path. Got: $applets_dir" >&2
  exit 2
fi
applets_dir="$(realpath -m -- "$applets_dir")"
if [[ "$applets_dir" == "/" ]]; then
  echo "Refusing to install directly under the filesystem root." >&2
  exit 2
fi
target="$applets_dir/$UUID"
if [[ "$target" == "/" || "$(basename "$target")" != "$PROJECT_UUID" ]]; then
  echo "Refusing to replace unsafe install path: $target" >&2
  exit 2
fi
mkdir -p "$(dirname "$target")"
rm -rf -- "$target"
cp -a "$APPLET_ROOT" "$target"

if command -v msgfmt >/dev/null 2>&1 && [ -d "$REPO_ROOT/po" ]; then
  for po_file in "$REPO_ROOT"/po/*.po; do
    [ -f "$po_file" ] || continue
    lang="$(basename "$po_file" .po)"
    out_dir="$HOME/.local/share/locale/$lang/LC_MESSAGES"
    mkdir -p "$out_dir"
    msgfmt -o "$out_dir/$UUID.mo" "$po_file"
  done
  echo "Installed translations to: $HOME/.local/share/locale"
else
  echo "Note: msgfmt not found; skipping translation compilation."
fi

echo "Installed to: $target"
echo "Restart Cinnamon (Alt+F2, then 'r') and add the applet from panel settings."
