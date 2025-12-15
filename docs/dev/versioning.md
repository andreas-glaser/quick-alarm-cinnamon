# Versioning

This project uses two layers of versioning:

## 1) Cinnamon applet version (integer)

- Stored in `VERSION` (single integer).
- Written into `metadata.json` as `"version": <n>` by `tools/build.sh`.
- Bump this number for every Cinnamon Spices submission (PR) so updates are discoverable.

## 2) GitHub release tags (SemVer)

- Use Git tags like `v0.1.0`, `v0.1.1`, … in this repo.
- Keep `CHANGELOG.md` in sync with tags.

