# Process

This repo is intentionally small. Prefer a tight loop: edit → build → install → try → repeat.

## Dev Loop
- Build packaged applet: `tools/build.sh`
- Install locally on Mint/Cinnamon: `tools/install.sh` then restart Cinnamon (Alt+F2 → `r`)
- Run tests (pure logic): `tests/run.sh` (requires `gjs`)

## Workflow
- [Commit Guide](commit-guide.md)
- [Git Workflow](git-workflow.md)
- [Standards](standards/index-standards.md)

## Product Docs
- `docs/project/vision.md`
- `docs/dev/development.md`
- `docs/dev/release.md`
