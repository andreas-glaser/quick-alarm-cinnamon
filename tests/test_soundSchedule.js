imports.searchPath.unshift("src");

const SoundSchedule = imports.lib.soundSchedule;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testRetryDelay() {
  eq(SoundSchedule.getRingRetryDelay(1000, 1000, 500), 500);
  eq(SoundSchedule.getRingRetryDelay(1000, 1200, 500), 300);
  eq(SoundSchedule.getRingRetryDelay(1000, 1600, 500), 1);
  eq(SoundSchedule.getRingRetryDelay(1000, 900, 500), 500);
  eq(SoundSchedule.getRingRetryDelay(NaN, 1000, 500), 500);
}

testRetryDelay();
print("ok (1 test)");
