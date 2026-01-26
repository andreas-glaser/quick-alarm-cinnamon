#!/usr/bin/env bash
set -euo pipefail

UUID="${UUID:-quick-alarm@andreas-glaser}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_DIR="$REPO_ROOT/src"
APPLET_ROOT="$REPO_ROOT/applet/$UUID"
APPLET_FILES="$APPLET_ROOT/files/$UUID"
DIST_DIR="$REPO_ROOT/dist"

APPLET_VERSION="${APPLET_VERSION:-$(cat "$REPO_ROOT/VERSION" 2>/dev/null || echo 1)}"
