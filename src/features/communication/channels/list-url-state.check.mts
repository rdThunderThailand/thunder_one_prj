import * as assert from "node:assert";
import { readListState, writeListState, DEFAULT_STATE } from "./list-url-state.ts";

function roundtrip(params: string) {
  const state = readListState(new URLSearchParams(params));
  return writeListState(state);
}

// default state drops all keys
assert.strictEqual(writeListState(DEFAULT_STATE), "");
assert.strictEqual(roundtrip(""), "");

// writes only non-default
const modifiedState = { ...DEFAULT_STATE, page: 2, filters: { ...DEFAULT_STATE.filters, search: "foo" } };
assert.strictEqual(writeListState(modifiedState), "q=foo&page=2");
assert.strictEqual(roundtrip("q=foo&page=2"), "q=foo&page=2");

// writes category to tab
const tabState = { ...DEFAULT_STATE, filters: { ...DEFAULT_STATE.filters, category: "dooh" as const } };
assert.strictEqual(writeListState(tabState), "tab=dooh");
assert.strictEqual(roundtrip("tab=dooh"), "tab=dooh");

// bogus sort key drops both sort and dir
assert.strictEqual(roundtrip("sort=bogus&dir=desc"), "");

// non-default sort keeps both key and dir
assert.strictEqual(roundtrip("sort=devices&dir=desc"), "sort=devices&dir=desc");

// stray dir is dropped without sort
assert.strictEqual(roundtrip("dir=desc"), "");

// bogus per falls back to 10 and is omitted if default
assert.strictEqual(roundtrip("per=99"), "");
assert.strictEqual(roundtrip("per=abc"), "");
assert.strictEqual(roundtrip("per=25"), "per=25");

// page=0 or bogus falls back to 1
assert.strictEqual(roundtrip("page=0"), "");
assert.strictEqual(roundtrip("page=abc"), "");

// ADR 0037 removed the health filter. A bookmarked URL still carrying it must not resurrect it.
assert.deepEqual(readListState(new URLSearchParams("health=degraded")).filters, DEFAULT_STATE.filters);
assert.equal(writeListState({ ...DEFAULT_STATE, filters: { ...DEFAULT_STATE.filters, lifecycle: "draft" } }), "lifecycle=draft");

console.log("src/features/channels/list-url-state.check.mts — all assertions passed");
