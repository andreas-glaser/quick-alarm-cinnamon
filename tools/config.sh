#!/usr/bin/env bash
set -euo pipefail

PROJECT_UUID="quick-alarm@andreas-glaser"
UUID="${UUID:-$PROJECT_UUID}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$UUID" != "$PROJECT_UUID" ]]; then
  echo "Refusing unsafe UUID override: $UUID" >&2
  exit 2
fi

SRC_DIR="$REPO_ROOT/src"
APPLET_ROOT="$REPO_ROOT/applet/$UUID"
DIST_DIR="$REPO_ROOT/dist"

APPLET_VERSION="${APPLET_VERSION:-$(cat "$REPO_ROOT/VERSION" 2>/dev/null || echo 1)}"

if [[ ! "$APPLET_VERSION" =~ ^[1-9][0-9]*$ ]]; then
  echo "APPLET_VERSION must be a positive integer. Got: $APPLET_VERSION" >&2
  exit 2
fi

export UUID REPO_ROOT SRC_DIR APPLET_ROOT DIST_DIR APPLET_VERSION
