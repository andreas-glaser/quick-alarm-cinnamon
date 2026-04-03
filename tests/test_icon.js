imports.searchPath.unshift("src");

const Icon = imports.lib.icon;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}

function makeEnv(overrides) {
  return Object.assign({
    isAbsolutePath: () => false,
    themeLookupIcon: () => null,
  }, overrides || {});
}

function testDefaultWhenToggleOff() {
  const r = Icon.resolveIcon(false, "anything", makeEnv());
  eq(r.method, "symbolic_name");
  eq(r.value, "alarm-symbolic");
}

function testDefaultWhenValueEmpty() {
  const r = Icon.resolveIcon(true, "", makeEnv());
  eq(r.method, "symbolic_name");
  eq(r.value, "alarm-symbolic");
}

function testDefaultWhenValueNull() {
  const r = Icon.resolveIcon(true, null, makeEnv());
  eq(r.method, "symbolic_name");
  eq(r.value, "alarm-symbolic");
}

function testAbsolutePathFullcolor() {
  const r = Icon.resolveIcon(true, "/usr/share/icons/my-icon.png", makeEnv({
    isAbsolutePath: () => true,
  }));
  eq(r.method, "path");
  eq(r.value, "/usr/share/icons/my-icon.png");
}

function testAbsolutePathSymbolic() {
  const r = Icon.resolveIcon(true, "/usr/share/icons/alarm-symbolic.svg", makeEnv({
    isAbsolutePath: () => true,
  }));
  eq(r.method, "symbolic_path");
  eq(r.value, "/usr/share/icons/alarm-symbolic.svg");
}

function testAbsolutePathDoesNotPrecheckFile() {
  const r = Icon.resolveIcon(true, "/no/such/file.png", makeEnv({
    isAbsolutePath: () => true,
  }));
  eq(r.method, "path");
  eq(r.value, "/no/such/file.png");
}

function testThemeIconFullcolor() {
  const r = Icon.resolveIcon(true, "bell", makeEnv({
    themeLookupIcon: () => ({}),
  }));
  eq(r.method, "name");
  eq(r.value, "bell");
}

function testThemeIconSymbolic() {
  const r = Icon.resolveIcon(true, "bell-symbolic", makeEnv({
    themeLookupIcon: () => ({}),
  }));
  eq(r.method, "symbolic_name");
  eq(r.value, "bell-symbolic");
}

function testThemeIconNotFound() {
  const r = Icon.resolveIcon(true, "nonexistent-icon", makeEnv({
    themeLookupIcon: () => null,
  }));
  eq(r.method, "symbolic_name");
  eq(r.value, "alarm-symbolic");
}

function main() {
  const tests = [
    testDefaultWhenToggleOff,
    testDefaultWhenValueEmpty,
    testDefaultWhenValueNull,
    testAbsolutePathFullcolor,
    testAbsolutePathSymbolic,
    testAbsolutePathDoesNotPrecheckFile,
    testThemeIconFullcolor,
    testThemeIconSymbolic,
    testThemeIconNotFound,
  ];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();
