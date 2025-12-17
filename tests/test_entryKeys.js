imports.searchPath.unshift("src");

const EntryKeys = imports.lib.entryKeys;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testNonEnterPropagates() {
  const r = EntryKeys.getEntrySubmitIntent({
    keySymbol: 999,
    modifierState: 0,
    keyReturn: 10,
    keyKPEnter: 11,
    controlMask: 1 << 2,
  });
  eq(r, null);
}

function testEnterClosesByDefault() {
  const r = EntryKeys.getEntrySubmitIntent({
    keySymbol: 10,
    modifierState: 0,
    keyReturn: 10,
    keyKPEnter: 11,
    controlMask: 1 << 2,
  });
  assert(!!r, "expected intent");
  eq(r.closeMenu, true);
}

function testCtrlEnterKeepsOpen() {
  const r = EntryKeys.getEntrySubmitIntent({
    keySymbol: 10,
    modifierState: 1 << 2,
    keyReturn: 10,
    keyKPEnter: 11,
    controlMask: 1 << 2,
  });
  assert(!!r, "expected intent");
  eq(r.closeMenu, false);
}

function testCtrlKPEnterKeepsOpen() {
  const r = EntryKeys.getEntrySubmitIntent({
    keySymbol: 11,
    modifierState: 1 << 2,
    keyReturn: 10,
    keyKPEnter: 11,
    controlMask: 1 << 2,
  });
  assert(!!r, "expected intent");
  eq(r.closeMenu, false);
}

function main() {
  const tests = [testNonEnterPropagates, testEnterClosesByDefault, testCtrlEnterKeepsOpen, testCtrlKPEnterKeepsOpen];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();

