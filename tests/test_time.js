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

function main() {
  const tests = [testParsingMatrix];

  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
