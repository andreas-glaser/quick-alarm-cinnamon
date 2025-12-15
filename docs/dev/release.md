# Release

1. Run `tools/build.sh`
2. Run `tools/release.sh` to create a zip under `dist/`
3. Upload the zip contents (the `quick-alarm@andreas-glaser/` folder) to Cinnamon Spices.

## Automated Spices PRs on tags

When you push a tag like `v1.2.3`, GitHub Actions opens (or updates) a PR against `linuxmint/cinnamon-spices-applets`.

Required GitHub secret in this repo:
- `SPICES_GH_TOKEN`: a GitHub PAT with `repo` access to `andreas-glaser/cinnamon-spices-applets`.

## Publishing to Cinnamon Spices

There are two common paths:

1. **Submit to the Cinnamon Spices repo (recommended)**
   - Spices applets are published via the shared repository:
     `https://github.com/linuxmint/cinnamon-spices-applets`
   - Fork it, add your applet folder under `applets/quick-alarm@andreas-glaser/`, and open a PR.

2. **Manual upload (if available for applets)**
   - Some Spices categories allow direct uploads through the website.
   - If the site offers upload for applets, use the zip produced by `tools/release.sh`.

## Updating an open Spices PR

If you have a fork + PR open against `linuxmint/cinnamon-spices-applets`, you can sync your latest applet build into your PR branch with:

```bash
tools/spices-update-pr.sh
```

This assumes you have a local clone at `/tmp/cinnamon-spices/cinnamon-spices-applets` with a `fork` remote and branch `add-quick-alarm-applet`. Override with:

```bash
SPICES_REPO_DIR=/path/to/cinnamon-spices-applets SPICES_BRANCH=my-branch tools/spices-update-pr.sh
```

## Create a new Spices PR locally (from a tag)

```bash
export GH_TOKEN=...
export SPICES_FORK_REPO=andreas-glaser/cinnamon-spices-applets
tools/spices/publish-tag.sh --tag v1.2.3
```

## Versioning

Before publishing:
- Bump the integer applet version in `VERSION` (this becomes `metadata.json` `"version"`).
- Update `CHANGELOG.md` and (optionally) tag a release in this repo.

Details: `docs/dev/versioning.md`.
