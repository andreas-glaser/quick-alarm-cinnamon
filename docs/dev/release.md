# Release

1. Run `tools/build.sh`
2. Run `tools/release.sh` to create a zip under `dist/`
3. Upload the zip contents (the `quick-alarm@andreas-glaser/` folder) to Cinnamon Spices.

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

## Versioning

Before publishing:
- Bump the integer applet version in `VERSION` (this becomes `metadata.json` `"version"`).
- Update `CHANGELOG.md` and (optionally) tag a release in this repo.

Details: `docs/dev/versioning.md`.
