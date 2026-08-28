#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=tools/config.sh
source "$(dirname "$0")/config.sh"

expected_applet_root="$REPO_ROOT/applet/$PROJECT_UUID"
if [[ "$APPLET_ROOT" != "$expected_applet_root" || "$APPLET_ROOT" == "/" ]]; then
  echo "Refusing to replace unsafe applet path: $APPLET_ROOT" >&2
  exit 2
fi

rm -rf -- "$APPLET_ROOT"
mkdir -p "$APPLET_ROOT"

cp -a "$SRC_DIR/." "$APPLET_ROOT/"
find "$APPLET_ROOT" -name '.gitkeep' -delete >/dev/null 2>&1 || true

if [ -d "$REPO_ROOT/po" ]; then
  mkdir -p "$APPLET_ROOT/po"
  cp -f "$REPO_ROOT"/po/*.po "$APPLET_ROOT/po/" 2>/dev/null || true
  cp -f "$REPO_ROOT"/po/*.pot "$APPLET_ROOT/po/" 2>/dev/null || true
fi

cat >"$APPLET_ROOT/metadata.json" <<EOF
{
  "uuid": "$UUID",
  "name": "Quick Alarm",
  "description": "Queue alarms quickly.",
  "version": $APPLET_VERSION,
  "max-instances": 1
}
EOF

echo "Built applet into: $APPLET_ROOT"
