#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

rm -rf "$APPLET_ROOT"
mkdir -p "$APPLET_FILES"

# Copy applet source files into files/<UUID>/
cp -a "$SRC_DIR/." "$APPLET_FILES/"
find "$APPLET_FILES" -name '.gitkeep' -delete >/dev/null 2>&1 || true

# Copy translations
if [ -d "$REPO_ROOT/po" ]; then
  mkdir -p "$APPLET_FILES/po"
  cp -f "$REPO_ROOT"/po/*.po "$APPLET_FILES/po/" 2>/dev/null || true
fi

# Generate metadata.json
cat >"$APPLET_FILES/metadata.json" <<EOF
{
  "uuid": "$UUID",
  "name": "Quick Alarm",
  "description": "Queue alarms quickly.",
  "icon": "icon.png",
  "version": $APPLET_VERSION,
  "max-instances": 1
}
EOF

# Create info.json for Spices
cat >"$APPLET_ROOT/info.json" <<EOF
{
  "author": "andreas-glaser",
  "license": "GPL-3.0"
}
EOF

# Create README.md for Spices
cat >"$APPLET_ROOT/README.md" <<'EOF'
# Quick Alarm

Queue alarms fast from your Cinnamon panel. Click the applet icon, type a time, press Enter.

## Usage

1. Click the applet (alarm icon) in your panel.
2. Type an alarm time (optionally with a label).
3. Press Enter (or Ctrl+Enter to add another without closing).

### Examples

- `in 10m tea`
- `after 5m - stretch`
- `5 seconds`
- `11:59am meeting`
- `tomorrow 11:30 standup`

### What happens when it fires

- A fullscreen overlay appears showing the time, label, and how long ago it fired.
- Plays an alarm sound.
- Click anywhere, press Escape/Enter/Space, or click Dismiss to close.

## Settings

- **Fullscreen notification**: show fullscreen overlay when alarm fires (default: on)
- **Alarm sound mode**: chime once, or ring for a duration
- **Ring duration**: how long "ring" mode plays sounds
- **Open shortcut**: global hotkey to open the applet menu (default: Super+Alt+A)
EOF

# Copy screenshot if available
if [ -f "$REPO_ROOT/docs/assets/screenshot.png" ]; then
  cp "$REPO_ROOT/docs/assets/screenshot.png" "$APPLET_ROOT/screenshot.png"
fi

echo "Built applet into: $APPLET_ROOT"
