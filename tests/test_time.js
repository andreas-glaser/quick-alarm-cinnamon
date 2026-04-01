imports.searchPath.unshift("src");

const Time = imports.lib.time;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function near(a, b, toleranceMs, msg) {
  assert(Math.abs(a - b) <= toleranceMs, msg || `expected |${a} - ${b}| <= ${toleranceMs}`);
}

function _utcMidnightFromLocalDate(d) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDeltaLocal(a, b) {
  return Math.round((_utcMidnightFromLocalDate(a) - _utcMidnightFromLocalDate(b)) / (24 * 60 * 60 * 1000));
}

function _runOkCase(c) {
  const now = new Date(c.now);
  const r = Time.parseAlarmSpec(c.input, now);
  assert(r.ok, `expected ok for "${c.input}": ${r.error || ""}`);

  if (c.label !== undefined) eq(r.label, c.label, `label mismatch for "${c.input}"`);
  if (c.showSeconds !== undefined)
    eq(r.showSeconds, c.showSeconds, `showSeconds mismatch for "${c.input}"`);

  if (c.dueDayDelta !== undefined)
    eq(dayDeltaLocal(r.due, now), c.dueDayDelta, `day delta mismatch for "${c.input}"`);
  if (c.dueNearMs !== undefined)
    near(r.due.getTime(), now.getTime() + c.dueNearMs, 1500, `due near mismatch for "${c.input}"`);

  if (c.dueHHMM) eq(Time.formatTimeHHMM(r.due), c.dueHHMM, `HH:MM mismatch for "${c.input}"`);
  if (c.dueHHMMSS) eq(Time.formatTimeHHMMSS(r.due), c.dueHHMMSS, `HH:MM:SS mismatch for "${c.input}"`);
}

function _runFailCase(c) {
  const now = new Date(c.now);
  const r = Time.parseAlarmSpec(c.input, now);
  assert(!r.ok, `expected fail for "${c.input}"`);
}

function testParsingMatrix() {
  const okCases = [
    // Absolute (12h + 24h)
    { now: "2025-01-01T10:30:00", input: "11am tea", label: "tea", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:30:00", input: "11 am tea", label: "tea", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:30:00", input: "11:30pm", label: "", showSeconds: false, dueHHMM: "23:30" },
    { now: "2025-01-01T10:30:00", input: "11:30 pm", label: "", showSeconds: false, dueHHMM: "23:30" },
    { now: "2025-01-01T10:30:00", input: "11.30 standup", label: "standup", showSeconds: false, dueHHMM: "11:30" },
    { now: "2025-01-01T10:30:00", input: "13:45 lunch", label: "lunch", showSeconds: false, dueHHMM: "13:45" },
    { now: "2025-01-01T11:30:00", input: "11:00", label: "", showSeconds: false, dueHHMM: "11:00" }, // rolls to next day
    { now: "2025-01-01T10:30:00", input: "12am", label: "", showSeconds: false, dueHHMM: "00:00" },
    { now: "2025-01-01T10:30:00", input: "12pm", label: "", showSeconds: false, dueHHMM: "12:00" },

    // Absolute with label separator
    { now: "2025-01-01T10:30:00", input: "11am - standup", label: "standup", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:30:00", input: "11am — standup", label: "standup", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:30:00", input: "claude 11:59am", label: "claude", showSeconds: false, dueHHMM: "11:59" },
    { now: "2025-01-01T10:30:00", input: "claude at 11:59am", label: "claude", showSeconds: false, dueHHMM: "11:59" },

    // "today"/"tomorrow" helpers
    { now: "2025-01-01T10:00:00", input: "tomorrow 11am tea", label: "tea", showSeconds: false, dueDayDelta: 1, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:00", input: "tmr 11am tea", label: "tea", showSeconds: false, dueDayDelta: 1, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:00", input: "tomorrow at 11am tea", label: "tea", showSeconds: false, dueDayDelta: 1, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:00", input: "today 11am tea", label: "tea", showSeconds: false, dueDayDelta: 0, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:00", input: "today at 11am tea", label: "tea", showSeconds: false, dueDayDelta: 0, dueHHMM: "11:00" },

    // Relative basics (always show seconds)
    { now: "2025-01-01T10:00:05", input: "in 20m tea", label: "tea", showSeconds: true, dueNearMs: 20 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "after 5m - stretch", label: "stretch", showSeconds: true, dueNearMs: 5 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "10 seconds", label: "", showSeconds: true, dueNearMs: 10 * 1000 },
    { now: "2025-01-01T10:00:05", input: "5s", label: "", showSeconds: true, dueNearMs: 5 * 1000 },
    { now: "2025-01-01T10:00:05", input: "1h15m", label: "", showSeconds: true, dueNearMs: (60 + 15) * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "1h 15m tea", label: "tea", showSeconds: true, dueNearMs: (60 + 15) * 60 * 1000 },

    // Natural language prefixes
    { now: "2025-01-01T10:00:05", input: "alarm in 1 minute", label: "", showSeconds: true, dueNearMs: 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "set alarm in 1 minute", label: "", showSeconds: true, dueNearMs: 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "add reminder 11am - reset", label: "reset", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:05", input: ", 11am", label: "", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:05", input: "at 11am tea", label: "tea", showSeconds: false, dueHHMM: "11:00" },
    { now: "2025-01-01T10:00:05", input: "for 10 seconds tea", label: "tea", showSeconds: true, dueNearMs: 10 * 1000 },

    // Case preservation in labels
    { now: "2025-01-01T10:00:05", input: "in 10m Tea", label: "Tea", showSeconds: true, dueNearMs: 10 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "after 5m - Stretch Break", label: "Stretch Break", showSeconds: true, dueNearMs: 5 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "5m IMPORTANT Meeting", label: "IMPORTANT Meeting", showSeconds: true, dueNearMs: 5 * 60 * 1000 },

    // Label-first relative input
    { now: "2025-01-01T10:00:05", input: "TEA 10 seconds", label: "TEA", showSeconds: true, dueNearMs: 10 * 1000 },
    { now: "2025-01-01T10:00:05", input: "Meeting in 5m", label: "Meeting", showSeconds: true, dueNearMs: 5 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "TEA PARTY in 5m", label: "TEA PARTY", showSeconds: true, dueNearMs: 5 * 60 * 1000 },
    { now: "2025-01-01T10:00:05", input: "Stretch 1h 15m", label: "Stretch", showSeconds: true, dueNearMs: (60 + 15) * 60 * 1000 },
  ];

  const failCases = [
    { now: "2025-01-01T10:00:00", input: "" },
    { now: "2025-01-01T10:00:00", input: "tomorrowish" },
    { now: "2025-01-01T10:00:00", input: "25:00" },
    { now: "2025-01-01T10:00:00", input: "13:60" },
    { now: "2025-01-01T10:00:00", input: "today 9am" }, // already passed
    { now: "2025-01-01T10:00:00", input: "in 0s" },
    { now: "2025-01-01T10:00:00", input: "in -5m" },
    { now: "2025-01-01T10:00:00", input: "in 5x" },
  ];

  for (const c of okCases) _runOkCase(c);
  for (const c of failCases) _runFailCase(c);
}

function testFormatCountdown() {
  const nowMs = 1000000000000;
  const make = (sec) => new Date(nowMs + sec * 1000);

  const cases = [
    // Past / zero → empty
    { sec: -1,  expected: "" },
    { sec: 0,   expected: "" },
    // Seconds only (< 60s)
    { sec: 1,   expected: "1s" },
    { sec: 30,  expected: "30s" },
    { sec: 59,  expected: "59s" },
    // 1 minute boundary (shows Xm Ys while < 2m)
    { sec: 60,  expected: "1m" },
    { sec: 90,  expected: "1m 30s" },
    { sec: 119, expected: "1m 59s" },
    // 2+ minutes → just minutes
    { sec: 120, expected: "2m" },
    { sec: 300, expected: "5m" },
    { sec: 3599, expected: "59m" },
    // Hours
    { sec: 3600, expected: "1h" },
    { sec: 3660, expected: "1h 1m" },
    { sec: 7200, expected: "2h" },
    { sec: 7500, expected: "2h 5m" },
  ];

  for (const c of cases) {
    const result = Time.formatCountdown(make(c.sec), nowMs);
    eq(result, c.expected, `sec=${c.sec}`);
  }
}

function main() {
  const tests = [testParsingMatrix, testFormatCountdown];

  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
