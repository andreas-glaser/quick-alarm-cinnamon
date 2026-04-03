imports.searchPath.unshift("src");

const AlarmText = imports.lib.alarmText;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testStoredLabel() {
  eq(AlarmText.getStoredLabel(""), "", "empty labels stay empty");
  eq(AlarmText.getStoredLabel(null), "", "null labels become empty");
  eq(AlarmText.getStoredLabel(" Alarm "), "Alarm", "labels are trimmed");
}

function testNotificationBody() {
  const due = new Date("2025-01-01T10:00:15");

  eq(
    AlarmText.getAlarmNotificationBody({ due, label: "Tea", showSeconds: true }),
    "Tea",
    "custom label wins",
  );
  eq(
    AlarmText.getAlarmNotificationBody({ due, label: "", showSeconds: true }),
    "10:00:15",
    "empty labels fall back to time only",
  );
}

function main() {
  const tests = [testStoredLabel, testNotificationBody];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
