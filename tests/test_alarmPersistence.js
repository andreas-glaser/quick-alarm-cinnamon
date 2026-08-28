imports.searchPath.unshift("src");

const Persistence = imports.lib.alarmPersistence;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testRoundTripUsesOnlyStoredFields() {
  const dueMs = new Date("2026-08-29T12:34:56Z").getTime();
  const stored = Persistence.serializeAlarms([
    { id: 42, due: new Date(dueMs), label: "Tea", showSeconds: true, timerId: 99 },
  ]);

  eq(stored.length, 1);
  eq(stored[0].dueMs, dueMs);
  eq(stored[0].label, "Tea");
  eq(stored[0].showSeconds, true);
  eq(Object.keys(stored[0]).sort().join(","), "dueMs,label,showSeconds");

  const restored = Persistence.deserializeAlarms(stored);
  eq(restored.length, 1);
  eq(restored[0].due.getTime(), dueMs);
  eq(restored[0].label, "Tea");
  eq(restored[0].showSeconds, true);
}

function testMalformedValuesAreRejectedOrSanitized() {
  eq(Persistence.deserializeAlarms(null).length, 0);
  eq(Persistence.deserializeAlarms({}).length, 0);

  const restored = Persistence.deserializeAlarms([
    null,
    {},
    { dueMs: NaN, label: "bad" },
    { dueMs: -1, label: "bad" },
    { dueMs: 1000.5, label: "bad" },
    { dueMs: 1000, label: { unsafe: true }, showSeconds: "yes" },
  ]);

  eq(restored.length, 1);
  eq(restored[0].due.getTime(), 1000);
  eq(restored[0].label, "");
  eq(restored[0].showSeconds, false);
}

function testRestoreIsBounded() {
  const stored = [];
  for (let i = 0; i < 1100; i++) stored.push({ dueMs: 1000 + i, label: "alarm" });
  eq(Persistence.deserializeAlarms(stored).length, 1000);
}

function testLabelsAreBounded() {
  const label = "x".repeat(5000);
  const stored = Persistence.serializeAlarms([{ due: new Date(1000), label, showSeconds: false }]);
  eq(stored[0].label.length, 4096);
  const restored = Persistence.deserializeAlarms([{ dueMs: 1000, label, showSeconds: false }]);
  eq(restored[0].label.length, 4096);
}

function main() {
  const tests = [
    testRoundTripUsesOnlyStoredFields,
    testMalformedValuesAreRejectedOrSanitized,
    testRestoreIsBounded,
    testLabelsAreBounded,
  ];
  for (const test of tests) test();
  print(`ok (${tests.length} tests)`);
}

main();
