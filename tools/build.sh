#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

rm -rf "$APPLET_ROOT"
mkdir -p "$APPLET_ROOT"

cp -a "$SRC_DIR/." "$APPLET_ROOT/"
find "$APPLET_ROOT" -name '.gitkeep' -delete >/dev/null 2>&1 || true

if command -v msgfmt >/dev/null 2>&1 && [ -d "$REPO_ROOT/po" ]; then
  for po_file in "$REPO_ROOT"/po/*.po; do
    [ -f "$po_file" ] || continue
    lang="$(basename "$po_file" .po)"
    out_dir="$APPLET_ROOT/locale/$lang/LC_MESSAGES"
    mkdir -p "$out_dir"
    msgfmt -o "$out_dir/$UUID.mo" "$po_file"
  done
fi

cat >"$APPLET_ROOT/metadata.json" <<EOF
{
  "uuid": "$UUID",
  "name": "Quick Alarm",
  "description": "Queue alarms quickly.",
  "icon": "alarm-symbolic",
  "version": 1,
  "max-instances": 1
}
EOF

echo "Built applet into: $APPLET_ROOT"
