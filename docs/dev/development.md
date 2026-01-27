# Development

## Layout
- `src/` is the source of truth.
- `applet/quick-alarm@andreas-glaser/` is the built applet folder (for local install).
- `tools/spices/publish-tag.sh` creates the Spices-compatible structure (info.json, README.md, files/UUID/).

## Build
Run `tools/build.sh` to sync `src/` into `applet/quick-alarm@andreas-glaser/`.

## Install locally (Linux Mint / Cinnamon)
Run `tools/install.sh`, then restart Cinnamon (Alt+F2, then `r`) and add the applet via panel settings.

## Tests
Run `tests/run.sh` (requires `gjs`).
