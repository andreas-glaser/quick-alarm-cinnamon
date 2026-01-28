#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/../config.sh"

usage() {
  cat <<'EOF'
Create (or update) a Cinnamon Spices PR for a release tag.

This script:
  - builds the applet payload (tools/build.sh)
  - clones your cinnamon-spices-applets fork
  - creates a branch from upstream/master
  - copies the applet files + screenshot
  - pushes the branch to your fork
  - opens a PR against linuxmint/cinnamon-spices-applets

Usage:
  tools/spices/publish-tag.sh --tag vX.Y.Z

Required env:
  GH_TOKEN             GitHub token/PAT with access to your fork and PR creation
  SPICES_FORK_REPO     e.g. andreas-glaser/cinnamon-spices-applets

Optional env:
  SPICES_UPSTREAM_REPO e.g. linuxmint/cinnamon-spices-applets (default)
  SPICES_BASE_BRANCH   e.g. master (default)
  SPICES_BRANCH_PREFIX e.g. quick-alarm-release- (default)
EOF
}

tag=""
while (($#)); do
  case "$1" in
    --tag) tag="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${tag:-}" ]]; then
  echo "Missing --tag" >&2
  usage
  exit 2
fi

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "Missing GH_TOKEN (GitHub token/PAT)" >&2
  exit 2
fi

spices_fork_repo="${SPICES_FORK_REPO:-}"
if [[ -z "${spices_fork_repo:-}" ]]; then
  echo "Missing SPICES_FORK_REPO (e.g. andreas-glaser/cinnamon-spices-applets)" >&2
  exit 2
fi

spices_upstream_repo="${SPICES_UPSTREAM_REPO:-linuxmint/cinnamon-spices-applets}"
spices_base_branch="${SPICES_BASE_BRANCH:-master}"
spices_branch_prefix="${SPICES_BRANCH_PREFIX:-quick-alarm-release-}"

export GIT_TERMINAL_PROMPT=0

"$REPO_ROOT/tools/build.sh"

tmp_dir="$(mktemp -d)"
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

spices_dir="$tmp_dir/cinnamon-spices-applets"
git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/${spices_fork_repo}.git" "$spices_dir" >/dev/null

if ! git -C "$spices_dir" remote get-url upstream >/dev/null 2>&1; then
  git -C "$spices_dir" remote add upstream "https://github.com/${spices_upstream_repo}.git"
fi
git -C "$spices_dir" fetch upstream "$spices_base_branch" --depth 1

if [[ "$tag" != v* ]]; then
  tag="v${tag}"
fi

# Extract changelog for this version (same logic as release.yml)
version_num="${tag#v}"
changelog_section="$(
  awk -v version="$version_num" '
    $0 ~ /^## / {
      if (found) exit
      if ($0 ~ "^## " version " ") { found=1; next }
    }
    found { print }
  ' "$REPO_ROOT/CHANGELOG.md"
)"

safe_tag="${tag//\//-}"
fork_owner="${spices_fork_repo%%/*}"

existing_pr_branch="$(
  gh pr list \
    --repo "$spices_upstream_repo" \
    --state open \
    --json number,headRefName,headRepositoryOwner,createdAt \
    --jq '
      map(select(.headRepositoryOwner.login=="'"$fork_owner"'" and (.headRefName|startswith("'"$spices_branch_prefix"'"))))
      | sort_by(.createdAt)
      | .[0].headRefName // empty
    ' || true
)"

existing_pr_number="$(
  gh pr list \
    --repo "$spices_upstream_repo" \
    --state open \
    --json number,headRefName,headRepositoryOwner,createdAt \
    --jq '
      map(select(.headRepositoryOwner.login=="'"$fork_owner"'" and (.headRefName|startswith("'"$spices_branch_prefix"'"))))
      | sort_by(.createdAt)
      | .[0].number // empty
    ' || true
)"

if [[ -n "${existing_pr_branch:-}" ]]; then
  branch="$existing_pr_branch"
else
  branch="${spices_branch_prefix}${safe_tag}"
fi

git -C "$spices_dir" checkout -B "$branch" "upstream/${spices_base_branch}"

spices_applet_dir="$spices_dir/$UUID"
dst_dir="$spices_applet_dir/files/$UUID"

rm -rf "$spices_applet_dir"
mkdir -p "$dst_dir"

# Copy applet files to files/<UUID>/
cp -a "$APPLET_ROOT/." "$dst_dir/"
find "$dst_dir" -type f -name '*.mo' -delete || true

# Create info.json at root
cat >"$spices_applet_dir/info.json" <<EOF
{
  "author": "andreas-glaser",
  "license": "MIT"
}
EOF

# Create README.md at root
cat >"$spices_applet_dir/README.md" <<'READMEEOF'
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
READMEEOF

# Copy screenshot
screenshot_src="$REPO_ROOT/docs/assets/screenshot.png"
if [[ -f "$screenshot_src" ]]; then
  cp -f "$screenshot_src" "$spices_applet_dir/screenshot.png"
fi

git -C "$spices_dir" add -A "$UUID"
if git -C "$spices_dir" diff --cached --quiet; then
  echo "No changes to publish for $tag."
else
  git -C "$spices_dir" -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" \
    commit -m "Quick Alarm ${tag}"
  git -C "$spices_dir" push -u origin "$branch" --force
fi

# Build PR body with changelog
pr_body="## Changes in ${tag}

${changelog_section}

---
Automated update from tag \`${tag}\` in https://github.com/andreas-glaser/quick-alarm-cinnamon"

if [[ -n "${existing_pr_number:-}" ]]; then
  if ! gh pr edit \
    --repo "$spices_upstream_repo" \
    "$existing_pr_number" \
    --title "Quick Alarm ${tag}" \
    --body "$pr_body"; then
    echo "Warning: failed to update PR title/body; branch was pushed successfully." >&2
  fi
  echo "Updated existing PR: https://github.com/${spices_upstream_repo}/pull/${existing_pr_number}"
  exit 0
fi

if ! gh pr create \
  --repo "$spices_upstream_repo" \
  --base "$spices_base_branch" \
  --head "${fork_owner}:${branch}" \
  --title "Quick Alarm ${tag}" \
  --body "$pr_body"; then
  echo "Failed to create PR. If you see \"Resource not accessible by personal access token\", use a classic PAT for SPICES_GH_TOKEN." >&2
  echo "Manual PR link: https://github.com/${spices_upstream_repo}/compare/${spices_base_branch}...${fork_owner}:${branch}?expand=1" >&2
  exit 1
fi
