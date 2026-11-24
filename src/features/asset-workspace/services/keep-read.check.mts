/** Run: node src/features/asset-workspace/services/keep-read.check.mts */
import assert from "node:assert/strict";
import { keepRead } from "./keep-read.ts";

let reads = 0;
const kept = keepRead(async () => { reads += 1; return reads; });
assert.deepEqual(await Promise.all([kept.load(), kept.load()]), [1, 1], "a running read is shared");
assert.equal(await kept.load(), 1, "the answer is kept");
assert.equal(reads, 1);
kept.clear();
assert.equal(kept.get(), undefined);
assert.equal(await kept.load(), 2, "a cleared answer is read again");

const changed = keepRead(async () => 1);
const older = changed.load();
changed.set(5);
await older;
assert.equal(changed.get(), 5, "an older answer does not replace a newer value");

let failures = 0;
const failing = keepRead(async () => { failures += 1; if (failures === 1) throw new Error("Unavailable"); return "ok"; });
await assert.rejects(() => failing.load());
assert.equal(await failing.load(), "ok", "a failed read is not kept");

let empty = 0;
const nothing = keepRead(async () => { empty += 1; return null; });
await nothing.load();
assert.equal(await nothing.load(), null, "a null answer is kept too");
assert.equal(empty, 1);
console.log("Kept read checks passed.");
