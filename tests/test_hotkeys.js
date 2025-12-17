imports.searchPath.unshift("src");

const Hotkeys = imports.lib.hotkeys;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  assert(a === b, msg || `expected ${a} === ${b}`);
}

function testEmptyManagerNoop() {
  const r = Hotkeys.syncHotkey({ keybindingManager: null, name: "x", accel: "<Super>A", onActivate: () => {} });
  eq(r.added, false);
}

function testMissingNameNoop() {
  const manager = {
    removeHotKey: () => {
      throw new Error("should not be called");
    },
    addHotKey: () => {
      throw new Error("should not be called");
    },
  };
  const r = Hotkeys.syncHotkey({ keybindingManager: manager, name: "", accel: "<Super>A", onActivate: () => {} });
  eq(r.added, false);
}

function testBlankAccelRemovesOnly() {
  const calls = [];
  const manager = {
    removeHotKey: (name) => calls.push(["remove", name]),
    addHotKey: () => calls.push(["add"]),
  };
  const r = Hotkeys.syncHotkey({ keybindingManager: manager, name: "hk", accel: "   " });
  eq(r.added, false);
  eq(calls.length, 1);
  eq(calls[0][0], "remove");
  eq(calls[0][1], "hk");
}

function testRegistersAfterRemove() {
  const calls = [];
  const manager = {
    removeHotKey: (name) => calls.push(["remove", name]),
    addHotKey: (name, accel, cb) => {
      calls.push(["add", name, accel, typeof cb]);
    },
  };
  const r = Hotkeys.syncHotkey({
    keybindingManager: manager,
    name: "hk",
    accel: " <Super><Alt>A ",
    onActivate: () => {},
  });
  eq(r.added, true);
  eq(calls.length, 2);
  eq(calls[0][0], "remove");
  eq(calls[1][0], "add");
  eq(calls[1][1], "hk");
  eq(calls[1][2], "<Super><Alt>A");
  eq(calls[1][3], "function");
}

function testRemoveHotKeyFailureIsIgnored() {
  const calls = [];
  const manager = {
    removeHotKey: () => {
      throw new Error("remove failed");
    },
    addHotKey: (name) => calls.push(["add", name]),
  };
  const r = Hotkeys.syncHotkey({
    keybindingManager: manager,
    name: "hk",
    accel: "<Super><Alt>A",
    onActivate: () => {},
  });
  eq(r.added, true);
  eq(calls.length, 1);
  eq(calls[0][0], "add");
}

function testAddHotKeyFailureReported() {
  const manager = {
    removeHotKey: () => {},
    addHotKey: () => {
      throw new Error("add failed");
    },
  };
  let sawError = false;
  const r = Hotkeys.syncHotkey({
    keybindingManager: manager,
    name: "hk",
    accel: "<Super><Alt>A",
    onActivate: () => {},
    onError: () => {
      sawError = true;
    },
  });
  eq(r.added, false);
  eq(sawError, true);
}

function main() {
  const tests = [
    testEmptyManagerNoop,
    testMissingNameNoop,
    testBlankAccelRemovesOnly,
    testRegistersAfterRemove,
    testRemoveHotKeyFailureIsIgnored,
    testAddHotKeyFailureReported,
  ];
  for (const t of tests) t();
  print(`ok (${tests.length} tests)`);
}

main();

