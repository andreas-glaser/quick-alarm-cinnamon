#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

rm -rf "$APPLET_ROOT"
mkdir -p "$APPLET_ROOT"

cp -a "$SRC_DIR/." "$APPLET_ROOT/"
find "$APPLET_ROOT" -name '.gitkeep' -delete >/dev/null 2>&1 || true

if [ -d "$REPO_ROOT/po" ]; then
  mkdir -p "$APPLET_ROOT/po"
  cp -f "$REPO_ROOT"/po/*.po "$APPLET_ROOT/po/" 2>/dev/null || true
fi

cat >"$APPLET_ROOT/metadata.json" <<EOF
{
  "uuid": "$UUID",
  "name": "Quick Alarm",
  "description": "Queue alarms quickly.",
  "icon": "alarm-symbolic",
  "version": $APPLET_VERSION,
  "max-instances": 1
}
EOF

echo "Built applet into: $APPLET_ROOT"
