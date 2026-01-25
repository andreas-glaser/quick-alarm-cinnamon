# Changelog

## Unreleased

### Added
- No changes yet.

## 1.2.0 - 2026-01-26

### Added
- Fullscreen notification overlay when alarm fires (can be disabled in settings). Shows the alarm time, label, and live "time ago" counter. Suggested by [@sphh](https://github.com/sphh) in [#1](https://github.com/andreas-glaser/quick-alarm-cinnamon/issues/1).
- Translations for fullscreen overlay strings (de, es, fr, it, pt_BR).
- Unit tests for time ago formatting logic.

## 1.1.0 - 2025-12-17

### Changed
- Enter now adds an alarm and closes the menu; Ctrl+Enter adds without closing (for rapid multi-add).
- Refreshed the applet icon artwork (PNG/SVG) for Cinnamon Spices and the applet picker.

### Added
- Unit tests for the Enter/Ctrl+Enter submit behavior helper.
- Unit tests for hotkey registration helper logic.
- Configurable global shortcut to open the applet menu (default: Super+Alt+A).
- Bundled applet icon files (`icon.png`, `icon.svg`) for Cinnamon Spices and the applet picker.

## 1.0.2 - 2025-12-15

### Fixed
- Alarms no longer drift across suspend/resume; overdue alarms are handled (fire within a small grace window, otherwise notify as missed) and removed from the queue.

### Added
- Unit tests for alarm reconciliation and scheduling logic.

### Changed
- README now includes end-user usage and behavior notes.

## 1.0.1 - 2025-12-15

### Fixed
- Ring mode no longer overlaps alarm sounds; playback is sequenced to respect the selected duration.

## 1.0.0 - 2025-12-15

### Added
- Cinnamon panel applet to quickly queue alarms (absolute and relative input).
- Queue view with remove action, notification + audio alert, and click-to-silence.
- Basic global settings (chime vs ring duration).
- Local install/build/release scripts and CI workflow.
