# Git Workflow

Keep history simple and keep the applet shippable at all times.

## Branches
- `main`: default branch.
- Optional: short-lived `feature/*` branches for anything non-trivial.

## Daily Flow
```bash
git checkout main
git pull --rebase
git checkout -b feature/short-desc
```

When done:
```bash
tools/build.sh
tests/run.sh || true
git push -u origin feature/short-desc
```

## Releases
This repo produces a Cinnamon-Spices-style folder under `applet/<UUID>/`. To package it:
```bash
tools/release.sh
```

Optional tags (SemVer-ish):
```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```
