imports.searchPath.unshift("src");

const AlarmService = imports.services.alarmService.AlarmService;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function createFakeGLib() {
  let nextId = 1;
  const sources = new Map(); // id -> { cb, seconds }
  const removed = [];
  const added = [];

  return {
    PRIORITY_DEFAULT: 0,
    SOURCE_REMOVE: false,
    SOURCE_CONTINUE: true,
    timeout_add(_priority, delayMs, cb) {
      const id = nextId++;
      sources.set(id, { cb, delayMs, kind: "ms" });
      added.push({ id, delayMs, kind: "ms" });
      return id;
    },
    timeout_add_seconds(_priority, seconds, cb) {
      const id = nextId++;
      sources.set(id, { cb, seconds, kind: "s" });
      added.push({ id, seconds, kind: "s" });
      return id;
    },
    source_remove(id) {
      removed.push(id);
      return sources.delete(id);
    },
    _run(id) {
      const src = sources.get(id);
      if (!src) return false;
      return !!src.cb();
    },
    _getAdded() {
      return added.slice();
    },
    _getRemoved() {
      return removed.slice();
    },
  };
}

function testReconcileFiresWithinGrace() {
  const glib = createFakeGLib();
  let nowMs = 100000;

  const fired = [];
  const missed = [];
  const changed = [];

  const s = new AlarmService(
    () => changed.push("changed"),
    (a) => fired.push(a),
    {
      glib,
      nowMsFn: () => nowMs,
      autoStart: false,
      missedGraceMs: 2 * 60 * 1000,
      onMissed: (a) => missed.push(a),
    },
  );

  const id = s.add(new Date(nowMs - 30 * 1000), "tea", false);
  eq(typeof id, "number", "id is number");
  eq(s.list().length, 1, "queued");

  s.reconcileNow();
  eq(s.list().length, 0, "removed after fire");
  eq(fired.length, 1, "fired once");
  eq(missed.length, 0, "not missed");
  eq(fired[0].label, "tea", "label preserved");
  eq(changed.length >= 2, true, "changed on add and reconcile");
}

function testReconcileMissesAfterGrace() {
  const glib = createFakeGLib();
  let nowMs = 100000;

  const fired = [];
  const missed = [];

  const s = new AlarmService(
    () => {},
    (a) => fired.push(a),
    {
      glib,
      nowMsFn: () => nowMs,
      autoStart: false,
      missedGraceMs: 2 * 60 * 1000,
      onMissed: (a) => missed.push(a),
    },
  );

  s.add(new Date(nowMs - 10 * 60 * 1000), "stretch", true);
  s.reconcileNow();
  eq(s.list().length, 0, "removed after miss");
  eq(fired.length, 0, "not fired");
  eq(missed.length, 1, "missed once");
  eq(missed[0].label, "stretch", "label preserved");
  eq(missed[0].showSeconds, true, "showSeconds preserved");
}

function testReschedulesAfterLargeClockJump() {
  const glib = createFakeGLib();
  let nowMs = 100000;

  const s = new AlarmService(
    () => {},
    () => {},
    {
      glib,
      nowMsFn: () => nowMs,
      autoStart: false,
      reconcileTickSeconds: 10,
    },
  );

  s.add(new Date(nowMs + 60 * 60 * 1000), "future", false);
  const before = s.list()[0];
  const beforeTimerId = glib._getAdded().find((x) => x.kind === "ms").id;
  eq(before.id > 0, true, "has id");
  eq(beforeTimerId > 0, true, "scheduled");

  // Prime last tick.
  s.reconcileNow();

  // Jump forward well beyond interval (+tolerance) but still before due.
  nowMs += 5 * 60 * 1000;
  s.reconcileNow();

  const removed = glib._getRemoved();
  eq(removed.includes(beforeTimerId), true, "old timer removed");

  const added = glib._getAdded().filter((x) => x.kind === "ms");
  eq(added.length >= 2, true, "scheduled at least twice");
}

function main() {
  const tests = [testReconcileFiresWithinGrace, testReconcileMissesAfterGrace, testReschedulesAfterLargeClockJump];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();

