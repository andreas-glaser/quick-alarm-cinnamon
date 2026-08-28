#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=tools/config.sh
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

if [[ "$tag" != v* ]]; then
  tag="v${tag}"
fi
if [[ ! "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Tag must follow vX.Y.Z format. Got: $tag" >&2
  exit 2
fi

if ! tag_commit="$(git -C "$REPO_ROOT" rev-parse --verify "refs/tags/${tag}^{commit}" 2>/dev/null)"; then
  echo "Tag does not exist locally: $tag" >&2
  exit 2
fi
head_commit="$(git -C "$REPO_ROOT" rev-parse HEAD)"
if [[ "$head_commit" != "$tag_commit" ]]; then
  echo "Refusing to publish $tag from a different commit." >&2
  echo "Check out the tag first: git checkout $tag" >&2
  exit 2
fi
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
  echo "Refusing to publish from a dirty worktree." >&2
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

if [[ ! "$spices_fork_repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Invalid SPICES_FORK_REPO: $spices_fork_repo" >&2
  exit 2
fi
if [[ ! "$spices_upstream_repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Invalid SPICES_UPSTREAM_REPO: $spices_upstream_repo" >&2
  exit 2
fi
if ! git check-ref-format --branch "$spices_base_branch" >/dev/null 2>&1; then
  echo "Invalid SPICES_BASE_BRANCH: $spices_base_branch" >&2
  exit 2
fi
if ! git check-ref-format --branch "${spices_branch_prefix}v0.0.0" >/dev/null 2>&1; then
  echo "Invalid SPICES_BRANCH_PREFIX: $spices_branch_prefix" >&2
  exit 2
fi

for required_command in git gh awk; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Missing required command: $required_command" >&2
    exit 2
  fi
done

export GIT_TERMINAL_PROMPT=0

"$REPO_ROOT/tools/build.sh"
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
  echo "Build output differs from the tagged source. Run tools/build.sh before tagging." >&2
  exit 2
fi

tmp_dir="$(mktemp -d)"
cleanup() { rm -rf -- "$tmp_dir"; }
trap cleanup EXIT

spices_dir="$tmp_dir/cinnamon-spices-applets"
gh repo clone "$spices_fork_repo" "$spices_dir" -- --depth 1 >/dev/null
git -C "$spices_dir" config credential.helper '!gh auth git-credential'

if ! git -C "$spices_dir" remote get-url upstream >/dev/null 2>&1; then
  git -C "$spices_dir" remote add upstream "https://github.com/${spices_upstream_repo}.git"
fi
git -C "$spices_dir" fetch upstream "$spices_base_branch" --depth 1

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
if [[ -z "${changelog_section//[[:space:]]/}" ]]; then
  echo "No changelog entry found for $version_num" >&2
  exit 2
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

if ! git check-ref-format --branch "$branch" >/dev/null 2>&1; then
  echo "Invalid generated branch name: $branch" >&2
  exit 2
fi

remote_branch_oid="$(
  git -C "$spices_dir" ls-remote --heads origin "refs/heads/$branch" \
    | awk 'NR == 1 { print $1 }'
)"

git -C "$spices_dir" checkout -B "$branch" "upstream/${spices_base_branch}"

spices_applet_dir="$spices_dir/$UUID"
dst_dir="$spices_applet_dir/files/$UUID"

case "$spices_applet_dir" in
  "$spices_dir/$PROJECT_UUID") ;;
  *) echo "Refusing to replace unsafe Spices path: $spices_applet_dir" >&2; exit 2 ;;
esac
rm -rf -- "$spices_applet_dir"
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

# Keep the published README in sync while adjusting its screenshot path.
sed 's#](docs/assets/screenshot.png)#](screenshot.png)#' \
  "$REPO_ROOT/README.md" >"$spices_applet_dir/README.md"

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
  git -C "$spices_dir" push -u origin "$branch" \
    "--force-with-lease=${branch}:${remote_branch_oid}"
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
