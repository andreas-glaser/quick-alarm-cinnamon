# AI Instructions

- Keep the applet shippable: update `tools/build.sh` outputs when code/assets change.
- Prefer small, obvious code over abstraction; DRY only when it removes real duplication.
- Avoid external runtime dependencies (npm, bundlers). Cinnamon loads plain JS.
- When adding logic, keep it testable (pure helpers in `src/lib/`); add/adjust `tests/` where reasonable.
- Keep the UX keyboard-first and low-click (see `docs/project/vision.md`).
- Keep docs accurate; delete or rewrite stale docs instead of letting them rot.
