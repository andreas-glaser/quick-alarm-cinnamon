#!/usr/bin/env bash
set -euo pipefail

if ! command -v gjs >/dev/null 2>&1; then
  echo "gjs not found. Install it (e.g. 'sudo apt install gjs') and rerun."
  exit 2
fi

gjs tests/test_time.js
gjs tests/test_alarmReconcile.js
gjs tests/test_alarmService.js
