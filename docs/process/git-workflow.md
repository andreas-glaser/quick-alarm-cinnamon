# Git Workflow

Keep history simple and keep the applet shippable at all times.

## Branches
- `main`: stable, release-ready.
- `dev`: integration branch for ongoing work.
- Optional: short-lived `feature/*` branches for anything non-trivial (branch off `dev`).

## Daily Flow
```bash
git checkout dev
git pull --rebase
git checkout -b feature/short-desc   # optional
```

When done:
```bash
tools/build.sh
tests/run.sh || true
git push -u origin feature/short-desc  # or push dev directly for tiny changes
```

## Releases
This repo produces a Cinnamon-Spices-style folder under `applet/<UUID>/`. To package it:
```bash
tools/release.sh
```

Release process (simple):
- Merge `dev` → `main`
- Bump `VERSION` (applet version integer for Spices)
- Update `CHANGELOG.md`

Optional tags (SemVer-ish):
```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```
