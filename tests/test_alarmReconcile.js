imports.searchPath.unshift("src");

const Reconcile = imports.lib.alarmReconcile;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testClassifyAlarmDueState() {
  eq(
    Reconcile.classifyAlarmDueState({ dueMs: 1000, nowMs: 500, graceMs: 0 }),
    "future",
    "future alarm",
  );
  eq(
    Reconcile.classifyAlarmDueState({ dueMs: 1000, nowMs: 1000, graceMs: 0 }),
    "due",
    "exactly due",
  );
  eq(
    Reconcile.classifyAlarmDueState({ dueMs: 1000, nowMs: 1099, graceMs: 200 }),
    "due",
    "within grace",
  );
  eq(
    Reconcile.classifyAlarmDueState({ dueMs: 1000, nowMs: 1300, graceMs: 200 }),
    "missed",
    "past grace",
  );
}

function testShouldRescheduleAfterTick() {
  const intervalMs = 10000;
  eq(
    Reconcile.shouldRescheduleAfterTick({ lastTickMs: 0, nowMs: 10000, intervalMs }),
    false,
    "no last tick",
  );
  eq(
    Reconcile.shouldRescheduleAfterTick({ lastTickMs: 100000, nowMs: 109000, intervalMs }),
    false,
    "normal jitter",
  );
  eq(
    Reconcile.shouldRescheduleAfterTick({ lastTickMs: 100000, nowMs: 120000, intervalMs }),
    true,
    "large lag",
  );
  eq(
    Reconcile.shouldRescheduleAfterTick({ lastTickMs: 100000, nowMs: 99000, intervalMs }),
    true,
    "clock moved backwards",
  );
}

function main() {
  const tests = [testClassifyAlarmDueState, testShouldRescheduleAfterTick];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
