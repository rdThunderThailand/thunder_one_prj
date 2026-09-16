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

// writes Output Kind / Multi-screen filter to `type` (ADR 0074 §2 replaces Category here)
const typeState = { ...DEFAULT_STATE, filters: { ...DEFAULT_STATE.filters, type: "multi" as const } };
assert.strictEqual(writeListState(typeState), "type=multi");
assert.strictEqual(roundtrip("type=multi"), "type=multi");

// writes Player-health filter to `status`
const statusState = { ...DEFAULT_STATE, filters: { ...DEFAULT_STATE.filters, status: "no_player" as const } };
assert.strictEqual(writeListState(statusState), "status=no_player");
assert.strictEqual(roundtrip("status=no_player"), "status=no_player");

// bogus sort key drops both sort and dir
assert.strictEqual(roundtrip("sort=bogus&dir=desc"), "");

// non-default sort keeps both key and dir
assert.strictEqual(roundtrip("sort=location&dir=desc"), "sort=location&dir=desc");

// stray dir is dropped without sort
assert.strictEqual(roundtrip("dir=desc"), "");

// bogus per falls back to 10 and is omitted if default
assert.strictEqual(roundtrip("per=99"), "");
assert.strictEqual(roundtrip("per=abc"), "");
assert.strictEqual(roundtrip("per=25"), "per=25");

// page=0 or bogus falls back to 1
assert.strictEqual(roundtrip("page=0"), "");
assert.strictEqual(roundtrip("page=abc"), "");

// An unrecognised query key (e.g. an old bookmark, or the wrong param name) is ignored, not
// misread — the Player-health filter's key is `status`, not `health`.
assert.deepEqual(readListState(new URLSearchParams("health=degraded")).filters, DEFAULT_STATE.filters);
assert.equal(writeListState({ ...DEFAULT_STATE, filters: { ...DEFAULT_STATE.filters, lifecycle: "draft" } }), "lifecycle=draft");

console.log("src/features/channels/list-url-state.check.mts — all assertions passed");
