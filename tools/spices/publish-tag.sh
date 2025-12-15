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

src_dir="$APPLET_ROOT"
dst_dir="$spices_dir/$UUID/files/$UUID"

rm -rf "$dst_dir"
mkdir -p "$(dirname "$dst_dir")"
cp -a "$src_dir" "$dst_dir"
find "$dst_dir" -type f -name '*.mo' -delete || true

screenshot_src="$REPO_ROOT/docs/assets/screenshot.png"
screenshot_dst="$spices_dir/$UUID/screenshot.png"
if [[ -f "$screenshot_src" ]]; then
  cp -f "$screenshot_src" "$screenshot_dst"
fi

git -C "$spices_dir" add -A "$UUID"
if git -C "$spices_dir" diff --cached --quiet; then
  echo "No changes to publish for $tag."
else
  git -C "$spices_dir" -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" \
    commit -m "Quick Alarm ${tag}"
  git -C "$spices_dir" push -u origin "$branch" --force-with-lease
fi

if [[ -n "${existing_pr_number:-}" ]]; then
  gh pr edit \
    --repo "$spices_upstream_repo" \
    "$existing_pr_number" \
    --title "Quick Alarm ${tag}" \
    --body "Automated update from tag \`${tag}\` in https://github.com/andreas-glaser/quick-alarm-cinnamon" >/dev/null 2>&1 || true
  echo "Updated existing PR: https://github.com/${spices_upstream_repo}/pull/${existing_pr_number}"
  exit 0
fi

if ! gh pr create \
  --repo "$spices_upstream_repo" \
  --base "$spices_base_branch" \
  --head "${fork_owner}:${branch}" \
  --title "Quick Alarm ${tag}" \
  --body "Automated update from tag \`${tag}\` in https://github.com/andreas-glaser/quick-alarm-cinnamon"; then
  echo "Failed to create PR. If you see \"Resource not accessible by personal access token\", use a classic PAT for SPICES_GH_TOKEN." >&2
  echo "Manual PR link: https://github.com/${spices_upstream_repo}/compare/${spices_base_branch}...${fork_owner}:${branch}?expand=1" >&2
  exit 1
fi
