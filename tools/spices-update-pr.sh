#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/config.sh"

usage() {
  cat <<'EOF'
Update the Cinnamon Spices PR branch with the latest built applet payload.

Defaults assume you have a local clone at:
  /tmp/cinnamon-spices/cinnamon-spices-applets

Usage:
  tools/spices-update-pr.sh [options]

Options:
  -d, --spices-dir PATH      Path to cinnamon-spices-applets clone
  -b, --branch NAME          Branch to update (default: add-quick-alarm-applet)
  -r, --remote NAME          Remote to push to (default: fork)
  -m, --message TEXT         Commit message
      --no-screenshot        Don't copy docs/assets/screenshot.png
      --no-commit            Stage only (no commit)
      --no-push              Don't push
      --dry-run              Show what would change
  -h, --help                 Show this help

Environment:
  SPICES_REPO_DIR, SPICES_BRANCH, SPICES_REMOTE
EOF
}

spices_repo_dir="${SPICES_REPO_DIR:-/tmp/cinnamon-spices/cinnamon-spices-applets}"
spices_branch="${SPICES_BRANCH:-add-quick-alarm-applet}"
spices_remote="${SPICES_REMOTE:-fork}"
commit_message=""
copy_screenshot="1"
do_commit="1"
do_push="1"
dry_run="0"

while (($#)); do
  case "$1" in
    -d|--spices-dir) spices_repo_dir="${2:-}"; shift 2 ;;
    -b|--branch) spices_branch="${2:-}"; shift 2 ;;
    -r|--remote) spices_remote="${2:-}"; shift 2 ;;
    -m|--message) commit_message="${2:-}"; shift 2 ;;
    --no-screenshot) copy_screenshot="0"; shift 1 ;;
    --no-commit) do_commit="0"; shift 1 ;;
    --no-push) do_push="0"; shift 1 ;;
    --dry-run) dry_run="1"; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${spices_repo_dir:-}" ]]; then
  echo "Missing --spices-dir / SPICES_REPO_DIR" >&2
  exit 2
fi

"$REPO_ROOT/tools/build.sh"

if ! git -C "$spices_repo_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repo: $spices_repo_dir" >&2
  exit 2
fi

git -C "$spices_repo_dir" checkout "$spices_branch" >/dev/null

src_dir="$APPLET_ROOT"
dst_dir="$spices_repo_dir/$UUID/files/$UUID"

rm -rf "$dst_dir"
mkdir -p "$(dirname "$dst_dir")"
cp -a "$src_dir" "$dst_dir"
find "$dst_dir" -type f -name '*.mo' -delete || true

if [[ "$copy_screenshot" == "1" ]]; then
  screenshot_src="$REPO_ROOT/docs/assets/screenshot.png"
  screenshot_dst="$spices_repo_dir/$UUID/screenshot.png"
  if [[ -f "$screenshot_src" ]]; then
    cp -f "$screenshot_src" "$screenshot_dst"
  else
    echo "Note: screenshot not found at $screenshot_src; skipping." >&2
  fi
fi

if [[ "$dry_run" == "1" ]]; then
  git -C "$spices_repo_dir" status --porcelain=v1 "$UUID"
  exit 0
fi

if [[ -z "$commit_message" ]]; then
  commit_message="Update ${UUID} applet files"
fi

if [[ "$do_commit" == "1" ]]; then
  git -C "$spices_repo_dir" add -A "$UUID"
  if git -C "$spices_repo_dir" diff --cached --quiet; then
    echo "No changes to commit."
  else
    git -C "$spices_repo_dir" commit -m "$commit_message"
  fi
else
  git -C "$spices_repo_dir" add -A "$UUID"
  echo "Staged changes; skipping commit (--no-commit)."
fi

if [[ "$do_push" == "1" ]]; then
  git -C "$spices_repo_dir" push "$spices_remote" "$spices_branch"
else
  echo "Skipping push (--no-push)."
fi

