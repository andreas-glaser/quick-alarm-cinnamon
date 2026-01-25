imports.searchPath.unshift("src");

const TimeAgo = imports.lib.timeAgo;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected "${a}" === "${b}"`);
}

function testFormatTimeAgo() {
  const cases = [
    // Just now (< 5 seconds)
    { diffSec: 0, expected: "just now" },
    { diffSec: 1, expected: "just now" },
    { diffSec: 4, expected: "just now" },

    // Seconds (5-59)
    { diffSec: 5, expected: "5 seconds ago" },
    { diffSec: 30, expected: "30 seconds ago" },
    { diffSec: 59, expected: "59 seconds ago" },

    // 1 minute
    { diffSec: 60, expected: "1 minute ago" },
    { diffSec: 119, expected: "1 minute ago" },

    // Minutes (2-59)
    { diffSec: 120, expected: "2 minutes ago" },
    { diffSec: 5 * 60, expected: "5 minutes ago" },
    { diffSec: 59 * 60 + 59, expected: "59 minutes ago" },

    // 1 hour
    { diffSec: 60 * 60, expected: "1 hour ago" },
    { diffSec: 119 * 60, expected: "1 hour ago" },

    // Hours (2+)
    { diffSec: 120 * 60, expected: "2 hours ago" },
    { diffSec: 5 * 60 * 60, expected: "5 hours ago" },
    { diffSec: 24 * 60 * 60, expected: "24 hours ago" },
  ];

  for (const c of cases) {
    const nowMs = 1000000000000; // arbitrary reference point
    const dueDate = new Date(nowMs - c.diffSec * 1000);
    const result = TimeAgo.formatTimeAgo(dueDate, nowMs);
    eq(result, c.expected, `diffSec=${c.diffSec}`);
  }
}

function testFormatTimeAgoWithTranslation() {
  const translations = {
    "just now": "gerade eben",
    "%d seconds ago": "vor %d Sekunden",
    "1 minute ago": "vor 1 Minute",
    "%d minutes ago": "vor %d Minuten",
    "1 hour ago": "vor 1 Stunde",
    "%d hours ago": "vor %d Stunden",
  };

  const _ = (s) => translations[s] || s;

  const nowMs = 1000000000000;

  // Test just now
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 2000), nowMs, _), "gerade eben");

  // Test seconds
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 30000), nowMs, _), "vor 30 Sekunden");

  // Test 1 minute
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 60000), nowMs, _), "vor 1 Minute");

  // Test minutes
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 5 * 60000), nowMs, _), "vor 5 Minuten");

  // Test 1 hour
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 60 * 60000), nowMs, _), "vor 1 Stunde");

  // Test hours
  eq(TimeAgo.formatTimeAgo(new Date(nowMs - 3 * 60 * 60000), nowMs, _), "vor 3 Stunden");
}

function main() {
  const tests = [testFormatTimeAgo, testFormatTimeAgoWithTranslation];

  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
