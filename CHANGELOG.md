# Changelog

## Unreleased

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
