# Vision: Quick Alarm (Cinnamon Applet)

## Problem
I often learn that something “resets at 11:00” (or similar) and want to set an alarm immediately, without opening a full calendar/clock app or clicking through multiple dialogs.

## Goal
Create a Cinnamon panel applet that makes it *ridiculously fast* to queue one or more alarms.

## Core Principles
- **Least clicks**: one action to open, one action to confirm.
- **Queue-first**: multiple upcoming alarms are normal; managing a list is first-class.
- **Fast and small**: brief code, low overhead, quick interactions.
- **Simple, great UX**: obvious defaults, minimal configuration, no clutter.

## MVP (What “Done” Looks Like)
- **Quick add**: a single input that accepts times like `in 10m tea`, `5 seconds`, `11:59am claude`, `tomorrow 11:30 - reset`.
- **Queued alarms**: show a small list of upcoming alarms (time + label) in the applet menu.
- **Edit / cancel**: remove an alarm in one click; optionally adjust label/time.
- **Alarm firing**: when due, show a desktop notification and play an audio alert.
  - Clicking the notification silences the alarm.
  - Ring mode stops audio when the duration ends.
  - If the computer was asleep past the due time, treat it as a missed alarm (keep it simple and avoid stale queued items).

## UX Notes
- Favor keyboard flow: open menu, type, press Enter.
- Provide sensible defaults: if only a time is entered, auto-label (e.g. “Alarm 11:00”).
- Keep the menu compact; the applet should feel “always ready”.
- Work in both light/dark themes with good contrast.

## Non-Goals (For Now)
- Recurring alarms, calendars, complex scheduling rules.
- Heavy settings panels or theme-heavy UI.
