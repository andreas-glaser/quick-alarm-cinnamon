# Quick Alarm (Cinnamon Applet)

Queue alarms fast from your Cinnamon panel.

![Screenshot](docs/assets/screenshot.png)

Examples:
- `in 10m tea`
- `11:59am claude`
- `tomorrow 11:30 - reset`

## Local Install (Linux Mint / Cinnamon)
```bash
tools/install.sh
```

Restart Cinnamon (Alt+F2 → `r`), then add the applet from panel settings.

## Dev
- Build output: `tools/build.sh` → `applet/quick-alarm@andreas-glaser/`
- Tests: `tests/run.sh` (requires `gjs`)
- Release zip: `tools/release.sh`

## Cinnamon Spices
Publishing notes: `docs/dev/release.md`
