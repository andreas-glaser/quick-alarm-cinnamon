# Development

## Layout
- `src/` is the source of truth.
- `applet/quick-alarm@andreas-glaser/` is the packaged applet folder (what you upload to Cinnamon Spices).

## Build
Run `tools/build.sh` to sync `src/` into `applet/quick-alarm@andreas-glaser/`.

## Install locally (Linux Mint / Cinnamon)
Run `tools/install.sh`, then restart Cinnamon (Alt+F2, then `r`) and add the applet via panel settings.

## Tests
Run `tests/run.sh` (requires `gjs`).
